// src/hooks/usePiano.ts
/**
 * HOOK MAESTRO DEL PIANO - Coordinación completa del sistema
 * Combina audio + keyboard + stores + lógica de sustain + coordinación mouse/teclado
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAudio } from './useAudio';
import { useKeyboard } from './useKeyboard';
import { usePianoStore } from '../store/pianoStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface PianoState {
  isReady: boolean;
  isInitialized: boolean;
  sustainActive: boolean;
  currentOctave: number;
  masterVolume: number;
  totalActiveNotes: number;
  lastInteractionSource: 'mouse' | 'keyboard' | 'midi' | null;
  error: string | null;
}

interface PianoControls {
  // Control de notas
  playNote: (note: NoteName, velocity?: number, source?: 'mouse' | 'keyboard' | 'midi') => Promise<void>;
  stopNote: (note: NoteName, source?: 'mouse' | 'keyboard' | 'midi') => void;
  stopAllNotes: () => void;
  
  // Control de sustain
  setSustain: (active: boolean) => void;
  toggleSustain: () => void;
  
  // Control de volumen y octava
  setMasterVolume: (volume: number) => void;
  setOctave: (octave: number) => void;
  
  // Control del sistema
  panic: () => void;
  initialize: () => Promise<boolean>;
  enable: () => void;
  disable: () => void;
  cleanup: () => void;
}

interface PianoEvents {
  onNoteOn?: (note: NoteName, velocity: number, source: string) => void;
  onNoteOff?: (note: NoteName, source: string) => void;
  onSustainChange?: (active: boolean) => void;
  onVolumeChange?: (volume: number) => void;
  onOctaveChange?: (octave: number) => void;
}

// ========================================================================================
// HOOK PRINCIPAL usePiano
// ========================================================================================

export const usePiano = (events?: PianoEvents): PianoState & PianoControls => {
  
  // ========== ESTADO LOCAL ==========
  const [pianoState, setPianoState] = useState<PianoState>({
    isReady: false,
    isInitialized: false,
    sustainActive: false,
    currentOctave: 4,
    masterVolume: 0.8,
    totalActiveNotes: 0,
    lastInteractionSource: null,
    error: null
  });

  // ========== REFS PARA COORDINACIÓN ==========
  const sustainedNotesRef = useRef<Set<NoteName>>(new Set());
  const activeNotesRef = useRef<Set<NoteName>>(new Set());
  const lastNoteTimingsRef = useRef<Map<NoteName, number>>(new Map());
  const pendingReleaseRef = useRef<Set<NoteName>>(new Set());

  // ========== HOOKS DE AUDIO Y TECLADO ==========
  const audio = useAudio();
  const keyboard = useKeyboard(
    // Handler de notas del teclado
    useCallback((note: NoteName, velocity: number, pressed: boolean) => {
      if (pressed) {
        playNote(note, velocity, 'keyboard');
      } else {
        stopNote(note, 'keyboard');
      }
    }, []),
    
    // Handler de sustain del teclado
    useCallback((active: boolean) => {
      setSustain(active);
    }, []),
    
    // Handler de cambio de octava del teclado
    useCallback((octave: number) => {
      setOctave(octave);
    }, [])
  );

  // ========== ZUSTAND STORES ==========
  const pianoStore = usePianoStore();

  // ========================================================================================
  // LÓGICA DE SUSTAIN INTELIGENTE
  // ========================================================================================

  const updateSustainLogic = useCallback((noteToRelease?: NoteName, force?: boolean) => {
    if (!pianoState.sustainActive && !force) return;

    // Si el sustain está activo, las notas liberadas se mantienen sonando
    if (pianoState.sustainActive) {
      if (noteToRelease) {
        sustainedNotesRef.current.add(noteToRelease);
        console.log(`🎼 Note ${noteToRelease} sustained`);
      }
    } else {
      // Si se desactiva el sustain, liberar todas las notas sustain
      const sustainedNotes = Array.from(sustainedNotesRef.current);
      sustainedNotesRef.current.clear();
      
      sustainedNotes.forEach(note => {
        if (!pianoStore.isKeyPressed(note)) {
          audio.stopNote(note);
          activeNotesRef.current.delete(note);
          console.log(`🎼 Released sustained note: ${note}`);
        }
      });
    }
  }, [pianoState.sustainActive, pianoStore, audio]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DE NOTAS
  // ========================================================================================

  const playNote = useCallback(async (
    note: NoteName, 
    velocity: number = 0.8, 
    source: 'mouse' | 'keyboard' | 'midi' = 'mouse'
  ): Promise<void> => {
    try {
      // Verificar que el sistema esté listo
      if (!audio.isInitialized) {
        console.warn(`⚠️ Audio not ready, queueing note: ${note}`);
        return;
      }

      // Prevenir ataques múltiples muy rápidos de la misma nota
      const lastTiming = lastNoteTimingsRef.current.get(note);
      const now = Date.now();
      if (lastTiming && (now - lastTiming) < 50) {
        console.log(`🎹 Debouncing rapid attack for ${note}`);
        return;
      }
      lastNoteTimingsRef.current.set(note, now);

      // Si la nota ya está sonando, primero la detenemos (re-trigger)
      if (activeNotesRef.current.has(note)) {
        audio.stopNote(note);
        await new Promise(resolve => setTimeout(resolve, 10)); // Pequeña pausa
      }

      // Tocar la nota
      await audio.playNote(note, velocity);
      
      // Actualizar referencias locales
      activeNotesRef.current.add(note);
      pendingReleaseRef.current.delete(note);
      
      // Actualizar stores
      pianoStore.pressKey(note, velocity, source);
      
      // Actualizar estado local
      setPianoState(prev => ({
        ...prev,
        totalActiveNotes: activeNotesRef.current.size,
        lastInteractionSource: source,
        error: null
      }));

      // Disparar evento
      events?.onNoteOn?.(note, velocity, source);

      console.log(`🎹 Note ON: ${note} (vel: ${velocity.toFixed(2)}, src: ${source})`);

    } catch (error) {
      console.error(`❌ Failed to play note ${note}:`, error);
      setPianoState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to play note'
      }));
    }
  }, [audio, pianoStore, events]);

  const stopNote = useCallback((
    note: NoteName, 
    source: 'mouse' | 'keyboard' | 'midi' = 'mouse'
  ): void => {
    try {
      // Verificar que la nota esté activa
      if (!activeNotesRef.current.has(note)) {
        return;
      }

      // Lógica de sustain
      if (pianoState.sustainActive) {
        // Si hay sustain activo, marcar como "pending release" pero seguir sonando
        pendingReleaseRef.current.add(note);
        sustainedNotesRef.current.add(note);
        
        console.log(`🎼 Note ${note} marked for sustain (src: ${source})`);
      } else {
        // Liberar inmediatamente
        audio.stopNote(note);
        activeNotesRef.current.delete(note);
        pendingReleaseRef.current.delete(note);
        
        console.log(`🎹 Note OFF: ${note} (src: ${source})`);
      }

      // Actualizar stores
      pianoStore.releaseKey(note, source);
      
      // Actualizar estado local
      setPianoState(prev => ({
        ...prev,
        totalActiveNotes: activeNotesRef.current.size,
        lastInteractionSource: source
      }));

      // Disparar evento
      events?.onNoteOff?.(note, source);

    } catch (error) {
      console.error(`❌ Failed to stop note ${note}:`, error);
    }
  }, [pianoState.sustainActive, audio, pianoStore, events]);

  const stopAllNotes = useCallback((): void => {
    try {
      // Detener audio
      audio.stopAllNotes();
      
      // Limpiar referencias
      activeNotesRef.current.clear();
      sustainedNotesRef.current.clear();
      pendingReleaseRef.current.clear();
      lastNoteTimingsRef.current.clear();
      
      // Limpiar stores
      pianoStore.clearAll();
      
      // Actualizar estado
      setPianoState(prev => ({
        ...prev,
        totalActiveNotes: 0,
        sustainActive: false,
        lastInteractionSource: null
      }));

      console.log('🎹 All notes stopped (PANIC)');

    } catch (error) {
      console.error('❌ Failed to stop all notes:', error);
    }
  }, [audio, pianoStore]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DE SUSTAIN
  // ========================================================================================

  const setSustain = useCallback((active: boolean): void => {
    const wasActive = pianoState.sustainActive;
    
    setPianoState(prev => ({ ...prev, sustainActive: active }));
    pianoStore.setSustain(active);
    keyboard.setSustain(active);
    
    // Aplicar lógica de sustain
    if (!active && wasActive) {
      updateSustainLogic(undefined, true); // Force update cuando se desactiva
    }
    
    // Disparar evento
    events?.onSustainChange?.(active);
    
    console.log(`🎼 Sustain ${active ? 'ON' : 'OFF'}`);
  }, [pianoState.sustainActive, pianoStore, keyboard, updateSustainLogic, events]);

  const toggleSustain = useCallback((): void => {
    setSustain(!pianoState.sustainActive);
  }, [pianoState.sustainActive, setSustain]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DE VOLUMEN Y OCTAVA
  // ========================================================================================

  const setMasterVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Actualizar audio
    audio.setMasterVolume(clampedVolume);
    
    // Actualizar stores
    pianoStore.setMasterVolume(clampedVolume);
    
    // Actualizar estado local
    setPianoState(prev => ({ ...prev, masterVolume: clampedVolume }));
    
    // Disparar evento
    events?.onVolumeChange?.(clampedVolume);
    
    console.log(`🔊 Master volume: ${(clampedVolume * 100).toFixed(0)}%`);
  }, [audio, pianoStore, events]);

  const setOctave = useCallback((octave: number): void => {
    const clampedOctave = Math.max(1, Math.min(7, octave));
    
    // Actualizar keyboard
    keyboard.setOctave(clampedOctave);
    
    // Actualizar estado local
    setPianoState(prev => ({ ...prev, currentOctave: clampedOctave }));
    
    // Disparar evento
    events?.onOctaveChange?.(clampedOctave);
    
    console.log(`🎵 Octave: ${clampedOctave}`);
  }, [keyboard, events]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DEL SISTEMA
  // ========================================================================================

  const panic = useCallback((): void => {
    console.log('🚨 PANIC - Stopping everything!');
    
    // Detener todo
    stopAllNotes();
    
    // Resetear sustain
    setSustain(false);
    
    // Limpiar teclado
    keyboard.cleanup();
    
    console.log('🚨 PANIC completed');
  }, [stopAllNotes, setSustain, keyboard]);

  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎹 Initializing piano system...');
      
      // 1. Inicializar audio
      const audioSuccess = await audio.initializeAudio();
      if (!audioSuccess) {
        throw new Error('Failed to initialize audio');
      }
      
      // 2. Inicializar stores
      pianoStore.initialize();
      
      // 3. Sincronizar estado inicial
      const currentVolume = pianoStore.masterVolume;
      audio.setMasterVolume(currentVolume);
      
      // 4. Habilitar teclado
      keyboard.enable();
      
      // 5. Actualizar estado
      setPianoState(prev => ({
        ...prev,
        isInitialized: true,
        isReady: true,
        masterVolume: currentVolume,
        sustainActive: pianoStore.sustainActive,
        error: null
      }));

      console.log('✅ Piano system initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Piano initialization failed:', error);
      
      setPianoState(prev => ({
        ...prev,
        isInitialized: false,
        isReady: false,
        error: error instanceof Error ? error.message : 'Initialization failed'
      }));

      return false;
    }
  }, [audio, pianoStore, keyboard]);

  const enable = useCallback((): void => {
    keyboard.enable();
    setPianoState(prev => ({ ...prev, isReady: true }));
    console.log('🎹 Piano enabled');
  }, [keyboard]);

  const disable = useCallback((): void => {
    stopAllNotes();
    keyboard.disable();
    setPianoState(prev => ({ ...prev, isReady: false }));
    console.log('🎹 Piano disabled');
  }, [stopAllNotes, keyboard]);

  const cleanup = useCallback((): void => {
    console.log('🧹 Piano cleanup starting...');
    
    // Detener todo
    stopAllNotes();
    
    // Cleanup hooks
    audio.cleanup();
    keyboard.cleanup();
    
    // Limpiar referencias
    activeNotesRef.current.clear();
    sustainedNotesRef.current.clear();
    pendingReleaseRef.current.clear();
    lastNoteTimingsRef.current.clear();
    
    // Reset estado
    setPianoState({
      isReady: false,
      isInitialized: false,
      sustainActive: false,
      currentOctave: 4,
      masterVolume: 0.8,
      totalActiveNotes: 0,
      lastInteractionSource: null,
      error: null
    });

    console.log('🧹 Piano cleanup completed');
  }, [stopAllNotes, audio, keyboard]);

  // ========================================================================================
  // EFFECTS - SINCRONIZACIÓN Y AUTO-INICIALIZACIÓN
  // ========================================================================================

  // Auto-inicialización cuando se monta el componente
  useEffect(() => {
    initialize();
    
    // Cleanup al desmontar
    return cleanup;
  }, []); // Solo al montar/desmontar

  // Sincronización con cambios de sustain en el store
  useEffect(() => {
    const unsubscribe = usePianoStore.subscribe(
      (state) => state.sustainActive,
      (sustainActive) => {
        if (sustainActive !== pianoState.sustainActive) {
          setPianoState(prev => ({ ...prev, sustainActive }));
          updateSustainLogic();
        }
      }
    );

    return unsubscribe;
  }, [pianoState.sustainActive, updateSustainLogic]);

  // Sincronización con cambios de volumen en el store
  useEffect(() => {
    const unsubscribe = usePianoStore.subscribe(
      (state) => state.masterVolume,
      (volume) => {
        if (volume !== pianoState.masterVolume) {
          setPianoState(prev => ({ ...prev, masterVolume: volume }));
          audio.setMasterVolume(volume);
        }
      }
    );

    return unsubscribe;
  }, [pianoState.masterVolume, audio]);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    isReady: pianoState.isReady && audio.isInitialized,
    isInitialized: pianoState.isInitialized,
    sustainActive: pianoState.sustainActive,
    currentOctave: pianoState.currentOctave,
    masterVolume: pianoState.masterVolume,
    totalActiveNotes: pianoState.totalActiveNotes,
    lastInteractionSource: pianoState.lastInteractionSource,
    error: pianoState.error,
    
    // Controles de notas
    playNote,
    stopNote,
    stopAllNotes,
    
    // Controles de sustain
    setSustain,
    toggleSustain,
    
    // Controles de volumen y octava
    setMasterVolume,
    setOctave,
    
    // Controles del sistema
    panic,
    initialize,
    enable,
    disable,
    cleanup
  };
};