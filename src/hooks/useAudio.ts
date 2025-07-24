// src/hooks/useAudio.ts
/**
 * HOOK DE AUDIO - Gestión completa de síntesis con Tone.js
 * Inicialización, sintetizador, efectos, volumen y contexto de audio
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA PARA AUTOPLAY POLICY
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
  
  // ========== CONTROL DE INICIALIZACIÓN ==========
  const isInitializingRef = useRef<boolean>(false);
  const initializationPromiseRef = useRef<Promise<boolean> | null>(null);

  // ========== ZUSTAND STORE ==========
  const audioStore = useAudioStore();

  // ========================================================================================
  // GESTIÓN DEL CONTEXTO DE AUDIO - SOLO DESPUÉS DE USER GESTURE
  // ========================================================================================

  const startAudioContext = useCallback(async (): Promise<boolean> => {
    try {
      // Verificar si ya está iniciado
      if (audioContext.isContextStarted && Tone.getContext().state === 'running') {
        console.log('✅ Audio context already running');
        return true;
      }

      console.log('🎵 Starting AudioContext after user interaction...');
      
      // Iniciar Tone.js context (esto requiere user gesture)
      await Tone.start();
      
      // Verificar estado del contexto
      const contextState = Tone.getContext().state;
      console.log(`🎵 AudioContext state: ${contextState}`);

      if (contextState === 'running') {
        setAudioContext(prev => ({
          ...prev,
          isContextStarted: true,
          hasUserInteraction: true,
          error: null
        }));

        console.log('✅ AudioContext started successfully');
        return true;
      } else {
        throw new Error(`AudioContext failed to start: ${contextState}`);
      }

    } catch (error) {
      console.error('❌ Failed to start audio context:', error);
      
      setAudioContext(prev => ({
        ...prev,
        isContextStarted: false,
        error: error instanceof Error ? error.message : 'Failed to start audio context'
      }));

      return false;
    }
  }, [audioContext.isContextStarted]);

  // ========================================================================================
  // INICIALIZACIÓN DE COMPONENTES DE AUDIO - SIN ACTIVAR CONTEXTO
  // ========================================================================================

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    // Evitar múltiples inicializaciones simultáneas
    if (isInitializingRef.current) {
      console.log('⚠️ Audio initialization already in progress, waiting...');
      return initializationPromiseRef.current || false;
    }

    // Si ya está inicializado, retornar true
    if (synthRef.current && audioContext.isInitialized) {
      console.log('✅ Audio components already initialized');
      return true;
    }

    isInitializingRef.current = true;

    const initPromise = (async (): Promise<boolean> => {
      try {
        console.log('🎵 Initializing audio components (without starting context)...');
        
        // Obtener configuración actual
        const currentSettings = audioStore.synthSettings;

        // ========== CREAR COMPONENTES SIN ACTIVAR EL CONTEXTO ==========
        
        // 1. Crear el sintetizador principal
        synthRef.current = new Tone.PolySynth(Tone.FMSynth, {
          harmonicity: currentSettings.oscillator.harmonicity || 3,
          modulationIndex: currentSettings.oscillator.modulationIndex || 10,
          oscillator: {
            type: currentSettings.oscillator.type || 'sine'
          },
          modulation: {
            type: currentSettings.oscillator.modulationType || 'sine'
          },
          envelope: {
            attack: currentSettings.envelope.attack,
            decay: currentSettings.envelope.decay,
            sustain: currentSettings.envelope.sustain,
            release: currentSettings.envelope.release
          }
        });

        // Configurar polifonía
        synthRef.current.maxPolyphony = 32;

        // 2. Crear volumen maestro
        masterVolumeRef.current = new Tone.Volume(-6); // -6db inicial para headroom

        // 3. Crear filtro
        filterRef.current = new Tone.Filter({
          type: currentSettings.filter.type || 'lowpass',
          frequency: currentSettings.filter.frequency || 1000,
          Q: currentSettings.filter.Q || 1,
          gain: currentSettings.filter.gain || 0
        });

        // 4. Crear efectos (pero NO activarlos aún)
        if (currentSettings.effects.reverb.enabled) {
          reverbRef.current = new Tone.Reverb({
            decay: (currentSettings.effects.reverb.roomSize || 0.3) * 5,
            wet: currentSettings.effects.reverb.wet || 0.2
          });
          // IMPORTANTE: NO llamar a .generate() aquí porque requiere contexto activo
        }

        if (currentSettings.effects.delay.enabled) {
          delayRef.current = new Tone.FeedbackDelay({
            delayTime: currentSettings.effects.delay.delayTime || 0.1,
            feedback: currentSettings.effects.delay.feedback || 0.3,
            wet: currentSettings.effects.delay.wet || 0.1
          });
        }

        if (currentSettings.effects.chorus.enabled) {
          chorusRef.current = new Tone.Chorus({
            frequency: currentSettings.effects.chorus.frequency || 3,
            depth: currentSettings.effects.chorus.depth || 0.5,
            wet: currentSettings.effects.chorus.wet || 0.2
          });
          // IMPORTANTE: NO llamar a .start() aquí porque requiere contexto activo
        }

        // 5. Configurar cleanup
        setupCleanup();

        // 6. Actualizar estado - solo marcar componentes como inicializados
        setAudioContext(prev => ({
          ...prev,
          isInitialized: true,
          error: null
        }));

        console.log('✅ Audio components initialized (context not started yet)');
        return true;

      } catch (error) {
        console.error('❌ Audio component initialization failed:', error);
        
        setAudioContext(prev => ({
          ...prev,
          isInitialized: false,
          error: error instanceof Error ? error.message : 'Audio initialization failed'
        }));

        return false;
      } finally {
        isInitializingRef.current = false;
        initializationPromiseRef.current = null;
      }
    })();

    initializationPromiseRef.current = initPromise;
    return initPromise;

  }, [audioContext.isInitialized, audioStore.synthSettings]);

  // ========================================================================================
  // CONEXIÓN DE CADENA DE AUDIO - SOLO DESPUÉS DE QUE EL CONTEXTO ESTÉ ACTIVO
  // ========================================================================================

  const connectAudioChain = useCallback(async (): Promise<void> => {
    if (!synthRef.current || !masterVolumeRef.current || !filterRef.current) {
      console.warn('⚠️ Audio components not initialized yet');
      return;
    }

    // Verificar que el contexto esté activo
    if (Tone.getContext().state !== 'running') {
      console.warn('⚠️ AudioContext not running, cannot connect audio chain');
      return;
    }

    try {
      console.log('🔗 Connecting audio chain...');

      // Desconectar todo primero
      synthRef.current.disconnect();
      
      // Cadena: Synth -> Filter -> Effects -> MasterVolume -> Destination
      let currentNode: Tone.ToneAudioNode = synthRef.current;
      
      // 1. Conectar filtro
      currentNode = currentNode.connect(filterRef.current);
      
      // 2. Conectar efectos si están disponibles y el contexto está activo
      if (reverbRef.current) {
        // Generar reverb solo si el contexto está activo
        if (!reverbRef.current.ready) {
          await reverbRef.current.generate();
        }
        currentNode = currentNode.connect(reverbRef.current);
      }
      
      if (chorusRef.current) {
        // Iniciar chorus solo si el contexto está activo
        try {
          chorusRef.current.start();
        } catch (error) {
          // Chorus ya podría estar iniciado, ignorar error
        }
        currentNode = currentNode.connect(chorusRef.current);
      }
      
      if (delayRef.current) {
        currentNode = currentNode.connect(delayRef.current);
      }
      
      // 3. Conectar volumen maestro y destino
      currentNode.connect(masterVolumeRef.current);
      masterVolumeRef.current.toDestination();

      console.log('✅ Audio chain connected successfully');
      
    } catch (error) {
      console.error('❌ Failed to connect audio chain:', error);
    }
  }, []);

  // ========================================================================================
  // CONTROL DE NOTAS - CON VERIFICACIÓN DE CONTEXTO
  // ========================================================================================

  const playNote = useCallback(async (
    note: NoteName, 
    velocity: number = 0.8, 
    duration?: number
  ): Promise<void> => {
    // Lazy initialization: inicializar componentes solo cuando se necesiten
    if (!audioContext.isInitialized) {
      console.log('🎵 Lazy initializing audio components...');
      const initialized = await initializeAudio();
      if (!initialized) {
        console.warn('⚠️ Failed to initialize audio, cannot play note');
        return;
      }
    }

    if (!synthRef.current) {
      console.warn('⚠️ Synth not available, cannot play note:', note);
      return;
    }

    // Verificar y activar contexto si es necesario
    if (Tone.getContext().state === 'suspended') {
      const contextStarted = await startAudioContext();
      if (!contextStarted) {
        console.warn('⚠️ Could not start audio context, cannot play note');
        return;
      }
      
      // Conectar cadena de audio después de activar contexto
      await connectAudioChain();
    }

    try {
      // Mapear velocity (0-1) a volumen dB (-40 a 0)
      const volumeDb = -40 + (velocity * 40);
      
      if (duration) {
        // Nota con duración específica
        synthRef.current.triggerAttackRelease(note, duration, undefined, volumeDb);
        console.log(`🎹 Playing note ${note} for ${duration}s at ${volumeDb.toFixed(1)}dB`);
      } else {
        // Nota sostenida
        synthRef.current.triggerAttack(note, undefined, volumeDb);
        activeNotesRef.current.set(note, Tone.now() as Tone.Unit.Time);
        console.log(`🎹 Attacking note ${note} at ${volumeDb.toFixed(1)}dB`);
      }

    } catch (error) {
      console.error('❌ Failed to play note:', note, error);
    }
  }, [audioContext.isInitialized, initializeAudio, startAudioContext, connectAudioChain]);

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
      masterVolumeRef.current.volume.value = volumeDb;
      console.log(`🔊 Master volume set to ${volume.toFixed(2)} (${volumeDb.toFixed(1)}dB)`);
      
    } catch (error) {
      console.error('❌ Failed to set master volume:', error);
    }
  }, []);

  // ========================================================================================
  // CLEANUP
  // ========================================================================================

  const setupCleanup = useCallback((): void => {
    const cleanup = () => {
      try {
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
        
        activeNotesRef.current.clear();
        
      } catch (error) {
        console.error('❌ Error during audio cleanup:', error);
      }
    };

    cleanupFunctionsRef.current.push(cleanup);
  }, []);

  const cleanup = useCallback((): void => {
    console.log('🧹 Cleaning up audio system...');
    
    // Ejecutar todas las funciones de cleanup
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];

    // Reset estado
    setAudioContext({
      isInitialized: false,
      isContextStarted: false,
      hasUserInteraction: false,
      error: null
    });

    console.log('✅ Audio cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS - INICIALIZACIÓN AUTOMÁTICA SEGURA
  // ========================================================================================

  // 🔥 CORRECCIÓN: Solo inicializar componentes de forma lazy, SIN activar AudioContext
  useEffect(() => {
    // IMPORTANTE: Solo inicializar cuando sea absolutamente necesario
    // La inicialización se ejecutará cuando se necesite tocar la primera nota
    console.log('🎵 Audio hook mounted, initialization will be lazy');

    // Cleanup cuando se desmonta
    return () => {
      cleanup();
    };
  }, []); // Solo al montar/desmontar

  // Conectar cadena de audio cuando el contexto se active
  useEffect(() => {
    if (audioContext.isInitialized && audioContext.isContextStarted) {
      connectAudioChain();
    }
  }, [audioContext.isInitialized, audioContext.isContextStarted, connectAudioChain]);

  // Escuchar cambios en la configuración del store
  useEffect(() => {
    if (audioContext.isInitialized && audioStore.synthSettings && audioContext.isContextStarted) {
      // Reconectar cadena de audio si cambian los settings
      connectAudioChain();
    }
  }, [audioStore.synthSettings, audioContext.isInitialized, audioContext.isContextStarted, connectAudioChain]);

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