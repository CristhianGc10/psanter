// src/hooks/useAudio.ts
/**
 * HOOK DE AUDIO - Gestión completa de síntesis con Tone.js
 * Inicialización, sintetizador, efectos, volumen y contexto de audio
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { useAudioStore } from '../store/audioStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES Y TIPOS
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
// HOOK PRINCIPAL useAudio
// ========================================================================================

export const useAudio = (): AudioContext & AudioControls => {
  // ========== ESTADO LOCAL ==========
  const [audioContext, setAudioContext] = useState<AudioContext>({
    isInitialized: false,
    isContextStarted: false,
    hasUserInteraction: false,
    error: null
  });

  // ========== REFS PARA TONE.JS ==========
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const masterVolumeRef = useRef<Tone.Volume | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const delayRef = useRef<Tone.FeedbackDelay | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
  const activeNotesRef = useRef<Map<NoteName, Tone.Unit.Time>>(new Map());
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // ========== ZUSTAND STORE ==========
  const audioStore = useAudioStore();

  // ========================================================================================
  // FUNCIONES DE INICIALIZACIÓN
  // ========================================================================================

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎵 Initializing audio system...');
      
      // 1. Verificar si ya está inicializado
      if (synthRef.current && audioContext.isInitialized) {
        console.log('✅ Audio already initialized');
        return true;
      }

      // 2. Crear el sintetizador principal con configuración compatible con Tone.js
      const currentSettings = audioStore.synthSettings;
      
      // Crear sintetizador básico con configuración simple
      synthRef.current = new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: currentSettings.oscillator.harmonicity,
        modulationIndex: currentSettings.oscillator.modulationIndex,
        oscillator: {
          type: currentSettings.oscillator.type
        },
        modulation: {
          type: currentSettings.oscillator.modulationType
        },
        envelope: {
          attack: currentSettings.envelope.attack,
          decay: currentSettings.envelope.decay,
          sustain: currentSettings.envelope.sustain,
          release: currentSettings.envelope.release
        }
      });

      // Configurar polifonía después de crear
      synthRef.current.maxPolyphony = 32;

      // 3. Crear volumen maestro
      masterVolumeRef.current = new Tone.Volume(-6); // -6db inicial para headroom

      // 4. Crear efectos con configuración compatible
      if (currentSettings.effects.reverb.enabled) {
        reverbRef.current = new Tone.Reverb({
          decay: currentSettings.effects.reverb.roomSize * 5, // Mapear roomSize a decay
          wet: currentSettings.effects.reverb.wet
        });
        await reverbRef.current.generate();
      }

      if (currentSettings.effects.delay.enabled) {
        delayRef.current = new Tone.FeedbackDelay({
          delayTime: currentSettings.effects.delay.delayTime,
          feedback: currentSettings.effects.delay.feedback,
          wet: currentSettings.effects.delay.wet
        });
      }

      if (currentSettings.effects.chorus.enabled) {
        chorusRef.current = new Tone.Chorus({
          frequency: currentSettings.effects.chorus.frequency,
          depth: currentSettings.effects.chorus.depth,
          wet: currentSettings.effects.chorus.wet
        });
        chorusRef.current.start();
      }

      // 5. Crear filtro
      filterRef.current = new Tone.Filter({
        type: currentSettings.filter.type,
        frequency: currentSettings.filter.frequency,
        Q: currentSettings.filter.Q,
        gain: currentSettings.filter.gain
      });

      // 6. Conectar cadena de audio
      connectAudioChain();

      // 7. Configurar cleanup
      setupCleanup();

      // 8. Actualizar estado
      setAudioContext(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));

      console.log('✅ Audio system initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Audio initialization failed:', error);
      
      setAudioContext(prev => ({
        ...prev,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Audio initialization failed'
      }));

      return false;
    }
  }, [audioStore.synthSettings]);

  // ========================================================================================
  // CONEXIÓN DE CADENA DE AUDIO
  // ========================================================================================

  const connectAudioChain = useCallback(() => {
    if (!synthRef.current || !masterVolumeRef.current || !filterRef.current) return;

    try {
      // Desconectar todo primero
      synthRef.current.disconnect();
      
      // Cadena: Synth -> Filter -> Effects -> MasterVolume -> Destination
      let currentNode: Tone.ToneAudioNode = synthRef.current;
      
      // 1. Conectar filtro
      currentNode = currentNode.connect(filterRef.current);
      
      // 2. Conectar efectos en orden
      if (chorusRef.current) {
        currentNode = currentNode.connect(chorusRef.current);
      }
      
      if (delayRef.current) {
        currentNode = currentNode.connect(delayRef.current);
      }
      
      if (reverbRef.current) {
        currentNode = currentNode.connect(reverbRef.current);
      }
      
      // 3. Conectar volumen maestro y destino
      currentNode.connect(masterVolumeRef.current);
      masterVolumeRef.current.toDestination();

      console.log('🔗 Audio chain connected successfully');
      
    } catch (error) {
      console.error('❌ Failed to connect audio chain:', error);
    }
  }, []);

  // ========================================================================================
  // GESTIÓN DEL CONTEXTO DE AUDIO
  // ========================================================================================

  const startAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      if (Tone.getContext().state === 'suspended') {
        await Tone.start();
        console.log('🎵 Audio context started');
      }

      setAudioContext(prev => ({
        ...prev,
        isContextStarted: true,
        hasUserInteraction: true,
        error: null
      }));

      return true;

    } catch (error) {
      console.error('❌ Failed to start audio context:', error);
      
      setAudioContext(prev => ({
        ...prev,
        error: 'Failed to start audio context'
      }));

      return false;
    }
  }, []);

  // ========================================================================================
  // CONTROL DE NOTAS
  // ========================================================================================

  const playNote = useCallback(async (
    note: NoteName, 
    velocity: number = 0.8, 
    duration?: number
  ): Promise<void> => {
    if (!synthRef.current || !audioContext.isInitialized) {
      console.warn('⚠️ Audio not initialized, cannot play note:', note);
      return;
    }

    // Asegurar que el contexto esté iniciado
    if (Tone.getContext().state === 'suspended') {
      await startAudioContext();
    }

    try {
      // Mapear velocity (0-1) a volumen dB (-40 a 0)
      const volumeDb = -40 + (velocity * 40);
      
      if (duration) {
        // Nota con duración específica
        synthRef.current.triggerAttackRelease(note, duration, undefined, volumeDb);
        console.log(`🎹 Playing note ${note} for ${duration}s at ${volumeDb}dB`);
      } else {
        // Nota sostenida
        synthRef.current.triggerAttack(note, undefined, volumeDb);
        activeNotesRef.current.set(note, Tone.now() as Tone.Unit.Time);
        console.log(`🎹 Attacking note ${note} at ${volumeDb}dB`);
      }

    } catch (error) {
      console.error('❌ Failed to play note:', note, error);
    }
  }, [audioContext.isInitialized, startAudioContext]);

  const stopNote = useCallback((note: NoteName): void => {
    if (!synthRef.current) return;

    try {
      synthRef.current.triggerRelease(note);
      activeNotesRef.current.delete(note);
      console.log(`🎹 Released note ${note}`);
      
    } catch (error) {
      console.error('❌ Failed to stop note:', note, error);
    }
  }, []);

  const stopAllNotes = useCallback((): void => {
    if (!synthRef.current) return;

    try {
      synthRef.current.releaseAll();
      activeNotesRef.current.clear();
      console.log('🎹 All notes released');
      
    } catch (error) {
      console.error('❌ Failed to stop all notes:', error);
    }
  }, []);

  // ========================================================================================
  // CONTROL DE VOLUMEN
  // ========================================================================================

  const setMasterVolume = useCallback((volume: number): void => {
    if (!masterVolumeRef.current) return;

    try {
      // Convertir 0-1 a dB (-60 a 0)
      const volumeDb = volume <= 0 ? -60 : -60 + (volume * 60);
      masterVolumeRef.current.volume.rampTo(volumeDb, 0.1);
      
      console.log(`🔊 Master volume set to ${volume} (${volumeDb.toFixed(1)}dB)`);
      
    } catch (error) {
      console.error('❌ Failed to set master volume:', error);
    }
  }, []);

  // ========================================================================================
  // CLEANUP Y GESTIÓN DE MEMORIA
  // ========================================================================================

  const setupCleanup = useCallback(() => {
    const cleanup = () => {
      // Detener todas las notas
      if (synthRef.current) {
        synthRef.current.releaseAll();
        synthRef.current.dispose();
        synthRef.current = null;
      }

      // Limpiar efectos
      if (reverbRef.current) {
        reverbRef.current.dispose();
        reverbRef.current = null;
      }

      if (delayRef.current) {
        delayRef.current.dispose();
        delayRef.current = null;
      }

      if (chorusRef.current) {
        chorusRef.current.stop();
        chorusRef.current.dispose();
        chorusRef.current = null;
      }

      if (filterRef.current) {
        filterRef.current.dispose();
        filterRef.current = null;
      }

      if (masterVolumeRef.current) {
        masterVolumeRef.current.dispose();
        masterVolumeRef.current = null;
      }

      // Limpiar referencias
      activeNotesRef.current.clear();

      console.log('🧹 Audio cleanup completed');
    };

    cleanupFunctionsRef.current.push(cleanup);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];
    
    setAudioContext({
      isInitialized: false,
      isContextStarted: false,
      hasUserInteraction: false,
      error: null
    });
  }, []);

  // ========================================================================================
  // EFFECTS - INICIALIZACIÓN Y CLEANUP
  // ========================================================================================

  useEffect(() => {
    // Auto-inicializar audio cuando el componente se monta
    initializeAudio();

    // Cleanup cuando se desmonta
    return () => {
      cleanup();
    };
  }, []); // Solo al montar/desmontar

  // Escuchar cambios en la configuración del store
  useEffect(() => {
    if (audioContext.isInitialized && audioStore.synthSettings) {
      // Reconectar cadena de audio si cambian los settings
      connectAudioChain();
    }
  }, [audioStore.synthSettings, audioContext.isInitialized, connectAudioChain]);

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