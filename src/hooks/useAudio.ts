// src/hooks/useAudio.ts
/**
 * HOOK DE AUDIO - VERSIÓN CORREGIDA PARA FASE 5
 * ✅ Soluciona AudioContext autoplay policy
 * ✅ Elimina re-rendering loops
 * ✅ Previene setState durante unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { useAudioStore } from '../store/audioStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES
// ========================================================================================

interface AudioContext {
  isInitialized: boolean;
  isContextStarted: boolean;
  hasUserInteraction: boolean;
  error: string | null;
}

interface AudioControls {
  playNote: (note: NoteName, velocity?: number, duration?: number) => Promise<void>;
  stopNote: (note: NoteName) => void;
  stopAllNotes: () => void;
  setMasterVolume: (volume: number) => void;
  initializeAudio: () => Promise<boolean>;
  startAudioContext: () => Promise<boolean>;
  cleanup: () => void;
}

// ========================================================================================
// 🔥 HOOK PRINCIPAL useAudio - CORREGIDO
// ========================================================================================

export const useAudio = (): AudioContext & AudioControls => {
  // ========== ESTADO LOCAL - OPTIMIZADO ==========
  const [audioContext, setAudioContext] = useState<AudioContext>({
    isInitialized: false,
    isContextStarted: false,
    hasUserInteraction: false,
    error: null
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const activeNotesRef = useRef<Map<NoteName, Tone.Unit.Time>>(new Map());
  const isInitializingRef = useRef<boolean>(false);

  // ========== STORES ==========
  const audioStore = useAudioStore();

  // ========================================================================================
  // 🚨 SOLUCIÓN 1: AUDIOCONTEXT LAZY + USER GESTURE
  // ========================================================================================

  const startAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      // ✅ CRÍTICO: Solo iniciar después de user gesture
      if (audioContext.isContextStarted && Tone.getContext().state === 'running') {
        return true;
      }

      console.log('🎵 Starting AudioContext after user interaction...');
      
      // Iniciar Tone.js context - ESTO REQUIERE USER GESTURE
      await Tone.start();
      
      const contextState = Tone.getContext().state;
      
      if (contextState === 'running' && isMountedRef.current) {
        setAudioContext(prev => ({
          ...prev,
          isContextStarted: true,
          hasUserInteraction: true,
          error: null
        }));

        console.log('✅ AudioContext started successfully');
        return true;
      }

      throw new Error(`AudioContext failed: ${contextState}`);

    } catch (error) {
      console.error('❌ AudioContext start failed:', error);
      
      if (isMountedRef.current) {
        setAudioContext(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'AudioContext failed'
        }));
      }
      
      return false;
    }
  }, [audioContext.isContextStarted]);

  // ========================================================================================
  // 🚨 SOLUCIÓN 2: INICIALIZACIÓN SIN AUTOSTART
  // ========================================================================================

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    if (isInitializingRef.current || audioContext.isInitialized) {
      return audioContext.isInitialized;
    }

    try {
      isInitializingRef.current = true;
      console.log('🎵 Initializing audio components (without starting context)...');

      // 1. Crear sintetizador - SIN iniciar contexto
      synthRef.current = new Tone.PolySynth(Tone.Synth).set({ 
        maxPolyphony: 32,
        voice: {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 1.0 }
        }
      });

      // 2. Crear volumen maestro
      masterVolumeRef.current = new Tone.Volume(-6);

      // 3. Crear reverb para mejor sonido
      reverbRef.current = new Tone.Reverb({ roomSize: 0.2, dampening: 3000 }).toDestination();
      
      // 4. ✅ NO conectar audio chain aquí - esperar a user gesture
      
      if (isMountedRef.current) {
        setAudioContext(prev => ({
          ...prev,
          isInitialized: true,
          error: null
        }));
      }

      console.log('✅ Audio components initialized (context not started yet)');
      return true;

    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      
      if (isMountedRef.current) {
        setAudioContext(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Audio init failed'
        }));
      }
      
      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [audioContext.isInitialized]);

  // ========================================================================================
  // CONECTAR AUDIO CHAIN - SOLO DESPUÉS DE USER GESTURE
  // ========================================================================================

  const connectAudioChain = useCallback((): void => {
    if (!synthRef.current || !masterVolumeRef.current) return;

    try {
      // Conectar: Synth -> Volume -> Reverb -> Destination
      synthRef.current.connect(masterVolumeRef.current);
      masterVolumeRef.current.connect(reverbRef.current!);
      
      console.log('✅ Audio chain connected with reverb after user interaction');
    } catch (error) {
      console.error('❌ Audio chain connection failed:', error);
    }
  }, []);

  // ========================================================================================
  // CONTROL DE NOTAS - CON LAZY CONTEXT START
  // ========================================================================================

  const playNote = useCallback(async (
    note: NoteName, 
    velocity: number = 0.8, 
    duration?: number
  ): Promise<void> => {
    // Inicialización lazy
    if (!audioContext.isInitialized) {
      const initialized = await initializeAudio();
      if (!initialized) return;
    }

    // ✅ CRÍTICO: Verificar y activar contexto solo cuando se necesite
    if (!audioContext.isContextStarted) {
      const contextStarted = await startAudioContext();
      if (!contextStarted) {
        console.warn('⚠️ Cannot play note - AudioContext not active');
        return;
      }
      // Conectar audio chain DESPUÉS de activar contexto
      connectAudioChain();
    }

    if (!synthRef.current) return;

    try {
      const volumeDb = -30 + (velocity * 30); // Improved volume range
      
      if (duration) {
        synthRef.current.triggerAttackRelease(note, duration, undefined, volumeDb);
      } else {
        synthRef.current.triggerAttack(note, undefined, volumeDb);
        activeNotesRef.current.set(note, Tone.now() as Tone.Unit.Time);
      }

    } catch (error) {
      console.error('❌ Note play failed:', error);
    }
  }, [audioContext.isInitialized, audioContext.isContextStarted, initializeAudio, startAudioContext, connectAudioChain]);

  const stopNote = useCallback((note: NoteName): void => {
    if (!synthRef.current) return;

    try {
      synthRef.current.triggerRelease(note);
      activeNotesRef.current.delete(note);
    } catch (error) {
      console.error('❌ Note stop failed:', error);
    }
  }, []);

  const stopAllNotes = useCallback((): void => {
    if (!synthRef.current) return;

    try {
      synthRef.current.releaseAll();
      activeNotesRef.current.clear();
    } catch (error) {
      console.error('❌ Stop all notes failed:', error);
    }
  }, []);

  const setMasterVolume = useCallback((volume: number): void => {
    if (!masterVolumeRef.current) return;

    try {
      const volumeDb = volume <= 0 ? -Infinity : -40 + (volume * 40); // Better volume curve
      masterVolumeRef.current.volume.value = volumeDb;
      
      console.log(`🔊 Master volume set to ${(volume * 100).toFixed(0)}% (${volumeDb.toFixed(1)}dB)`);
    } catch (error) {
      console.error('❌ Volume set failed:', error);
    }
  }, []);

  // ========================================================================================
  // 🚨 SOLUCIÓN 3: CLEANUP CORRECTO
  // ========================================================================================

  const cleanup = useCallback(() => {
    // Marcar como desmontado PRIMERO
    isMountedRef.current = false;

    try {
      // Detener todas las notas
      if (synthRef.current) {
        synthRef.current.releaseAll();
        synthRef.current.dispose();
        synthRef.current = null;
      }

      if (masterVolumeRef.current) {
        masterVolumeRef.current.dispose();
        masterVolumeRef.current = null;
      }

      if (reverbRef.current) {
        reverbRef.current.dispose();
        reverbRef.current = null;
      }

      activeNotesRef.current.clear();

      console.log('✅ Audio cleanup completed');
    } catch (error) {
      console.error('❌ Audio cleanup failed:', error);
    }
  }, []);

  // ========================================================================================
  // 🚨 SOLUCIÓN 4: EFFECTS OPTIMIZADOS
  // ========================================================================================

  // SOLO inicializar al montar - SIN dependencies problemáticas
  useEffect(() => {
    isMountedRef.current = true;
    
    // ✅ NO inicializar automáticamente - solo marcar como mounted
    console.log('🎵 Audio hook mounted, initialization will be lazy');

    // Cleanup al desmontar
    return () => {
      cleanup();
    };
  }, []); // ✅ Array vacío - solo al montar/desmontar

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    isInitialized: audioContext.isInitialized,
    isContextStarted: audioContext.isContextStarted,
    hasUserInteraction: audioContext.hasUserInteraction,
    error: audioContext.error,
    
    // Controles
    playNote,
    stopNote,
    stopAllNotes,
    setMasterVolume,
    initializeAudio,
    startAudioContext,
    cleanup
  };
};