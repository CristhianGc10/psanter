// src/hooks/usePiano.ts
/**
 * HOOK MAESTRO DEL PIANO - VERSIÓN CORREGIDA PARA FASE 5
 * ✅ Coordinación completa entre audio + keyboard + stores
 * ✅ Props corregidas para interfaces
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
    masterVolume: 0.7,
    totalActiveNotes: 0,
    lastInteractionSource: null,
    error: null
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const activeNotesRef = useRef<Set<NoteName>>(new Set());
  const sustainedNotesRef = useRef<Set<NoteName>>(new Set());
  
  // ========== HOOKS DEPENDENCIES ==========
  const audio = useAudio();
  
  // ✅ HANDLERS ESTABLES para keyboard - Fixed forward reference
  const handleKeyboardNote = useCallback((note: NoteName, velocity: number, pressed: boolean) => {
    if (pressed) {
      // Forward call to be defined later
      void Promise.resolve().then(() => playNote(note, velocity, 'keyboard'));
    } else {
      // Forward call to be defined later  
      setTimeout(() => stopNote(note, 'keyboard'), 0);
    }
  }, []); // Sin dependencies problemáticas

  const handleSustainChange = useCallback((active: boolean) => {
    setSustain(active);
  }, []);

  const handleOctaveChange = useCallback((octave: number) => {
    setOctave(octave);
  }, []);

  const keyboard = useKeyboard(
    handleKeyboardNote,
    handleSustainChange,
    handleOctaveChange
  );

  // ========== STORES ==========
  const pianoStore = usePianoStore();

  // ========================================================================================
  // FUNCIONES DE CONTROL DE NOTAS
  // ========================================================================================

  const playNote = useCallback(async (
    note: NoteName, 
    velocity: number = 0.8, 
    source: 'mouse' | 'keyboard' | 'midi' = 'mouse'
  ): Promise<void> => {
    try {
      // Tocar la nota con audio
      await audio.playNote(note, velocity);
      
      // Actualizar estado
      activeNotesRef.current.add(note);
      
      // Actualizar store
      pianoStore.setActiveNotes(Array.from(activeNotesRef.current));
      
      if (isMountedRef.current) {
        setPianoState(prev => ({
          ...prev,
          totalActiveNotes: activeNotesRef.current.size,
          lastInteractionSource: source
        }));
      }

      // Disparar evento
      events?.onNoteOn?.(note, velocity, source);

    } catch (error) {
      console.error('Error playing note:', error);
    }
  }, [audio, events, pianoStore]);

  const stopNote = useCallback((
    note: NoteName, 
    source: 'mouse' | 'keyboard' | 'midi' = 'mouse'
  ): void => {
    try {
      // Si está en sustain y es nota de teclado, mover a sustainedNotes
      if (pianoState.sustainActive && source === 'keyboard') {
        sustainedNotesRef.current.add(note);
      } else {
        // Parar la nota inmediatamente
        audio.stopNote(note);
        sustainedNotesRef.current.delete(note);
      }
      
      // Remover de notas activas
      activeNotesRef.current.delete(note);
      
      // Actualizar store
      pianoStore.setActiveNotes(Array.from(activeNotesRef.current));
      
      if (isMountedRef.current) {
        setPianoState(prev => ({
          ...prev,
          totalActiveNotes: activeNotesRef.current.size,
          lastInteractionSource: source
        }));
      }

      // Disparar evento
      events?.onNoteOff?.(note, source);

    } catch (error) {
      console.error('Error stopping note:', error);
    }
  }, [audio, pianoState.sustainActive, events, pianoStore]);

  const stopAllNotes = useCallback((): void => {
    try {
      // Parar todas las notas en audio
      audio.stopAllNotes();
      
      // Limpiar sets de notas
      activeNotesRef.current.clear();
      sustainedNotesRef.current.clear();
      
      if (isMountedRef.current) {
        setPianoState(prev => ({
          ...prev,
          totalActiveNotes: 0
        }));
      }

    } catch (error) {
      console.error('Error stopping all notes:', error);
    }
  }, [audio]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DE SUSTAIN
  // ========================================================================================

  const setSustain = useCallback((active: boolean): void => {
    if (isMountedRef.current) {
      setPianoState(prev => ({ ...prev, sustainActive: active }));
    }

    // Si se desactiva sustain, parar todas las notas sostenidas
    if (!active && sustainedNotesRef.current.size > 0) {
      sustainedNotesRef.current.forEach(note => {
        audio.stopNote(note);
      });
      sustainedNotesRef.current.clear();
    }

    // Disparar evento
    events?.onSustainChange?.(active);

  }, [audio, events]);

  const toggleSustain = useCallback((): void => {
    setSustain(!pianoState.sustainActive);
  }, [pianoState.sustainActive, setSustain]);

  // ========================================================================================
  // FUNCIONES DE CONTROL DE VOLUMEN Y OCTAVA
  // ========================================================================================

  const setMasterVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    // Aplicar al audio
    audio.setMasterVolume(clampedVolume);
    
    // Actualizar estado local
    if (isMountedRef.current) {
      setPianoState(prev => ({ ...prev, masterVolume: clampedVolume }));
    }
    
    // Disparar evento
    events?.onVolumeChange?.(clampedVolume);
    
    console.log(`🔊 Master volume: ${(clampedVolume * 100).toFixed(0)}%`);
  }, [audio, events]);

  const setOctave = useCallback((octave: number): void => {
    const clampedOctave = Math.max(1, Math.min(7, octave));
    
    // Actualizar keyboard
    keyboard.setOctave(clampedOctave);
    
    // Actualizar estado local
    if (isMountedRef.current) {
      setPianoState(prev => ({ ...prev, currentOctave: clampedOctave }));
    }
    
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
    
    console.log('🚨 PANIC completed');
  }, [stopAllNotes, setSustain]);

  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎹 Initializing piano system...');
      
      // 1. Inicializar audio
      const audioSuccess = await audio.initializeAudio();
      if (!audioSuccess) {
        throw new Error('Failed to initialize audio');
      }
      
      // 2. Habilitar teclado
      keyboard.enable();
      
      // 3. Actualizar estado
      if (isMountedRef.current) {
        setPianoState(prev => ({
          ...prev,
          isInitialized: true,
          isReady: true,
          error: null
        }));
      }

      console.log('✅ Piano system initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Piano initialization failed:', error);
      
      if (isMountedRef.current) {
        setPianoState(prev => ({
          ...prev,
          isInitialized: false,
          isReady: false,
          error: error instanceof Error ? error.message : 'Initialization failed'
        }));
      }
      
      return false;
    }
  }, [audio, keyboard]);

  const enable = useCallback((): void => {
    keyboard.enable();
    if (isMountedRef.current) {
      setPianoState(prev => ({ ...prev, isReady: true }));
    }
  }, [keyboard]);

  const disable = useCallback((): void => {
    keyboard.disable();
    stopAllNotes();
    if (isMountedRef.current) {
      setPianoState(prev => ({ ...prev, isReady: false }));
    }
  }, [keyboard, stopAllNotes]);

  const cleanup = useCallback((): void => {
    isMountedRef.current = false;
    
    // Parar todas las notas
    stopAllNotes();
    
    // Limpiar keyboard
    keyboard.cleanup();
    
    console.log('🎹 Piano cleanup completed');
  }, [stopAllNotes, keyboard]);

  // ========================================================================================
  // EFFECTS
  // ========================================================================================

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    ...pianoState,
    
    // Controles
    playNote,
    stopNote,
    stopAllNotes,
    setSustain,
    toggleSustain,
    setMasterVolume,
    setOctave,
    panic,
    initialize,
    enable,
    disable,
    cleanup
  };
};