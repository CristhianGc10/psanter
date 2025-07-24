// src/hooks/useMetronome.ts
/**
 * HOOK DE METRÓNOMO - VERSIÓN COMPLETA PARA FASE 5
 * ✅ Control preciso con Web Audio API y Tone.js
 * ✅ Temporización exacta sin drift
 * ✅ Sonidos diferenciados para acentos
 * ✅ Control de BPM y subdivisiones
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface MetronomeState {
  isRunning: boolean;
  isInitialized: boolean;
  bpm: number;
  beatsPerMeasure: number;
  subdivision: number; // 1=quarter, 2=eighth, 4=sixteenth
  currentBeat: number;
  currentMeasure: number;
  volume: number;
  accentEnabled: boolean;
  error: string | null;
}

interface MetronomeControls {
  start: () => Promise<boolean>;
  stop: () => void;
  reset: () => void;
  setBPM: (bpm: number) => void;
  setBeatsPerMeasure: (beats: number) => void;
  setSubdivision: (subdivision: number) => void;
  setVolume: (volume: number) => void;
  setAccent: (enabled: boolean) => void;
  initialize: () => Promise<boolean>;
  cleanup: () => void;
}

interface MetronomeEvents {
  onBeat?: (beat: number, measure: number, isAccent: boolean) => void;
  onStart?: () => void;
  onStop?: () => void;
}

// ========================================================================================
// CONSTANTES
// ========================================================================================

const DEFAULT_BPM = 120;
const MIN_BPM = 40;
const MAX_BPM = 300;
const DEFAULT_BEATS_PER_MEASURE = 4;
const LOOKAHEAD_TIME = 25.0; // milliseconds
const SCHEDULE_AHEAD_TIME = 0.1; // seconds

// ========================================================================================
// 🔥 HOOK PRINCIPAL useMetronome
// ========================================================================================

export const useMetronome = (events?: MetronomeEvents): MetronomeState & MetronomeControls => {
  
  // ========== ESTADO LOCAL ==========
  const [metronomeState, setMetronomeState] = useState<MetronomeState>({
    isRunning: false,
    isInitialized: false,
    bpm: DEFAULT_BPM,
    beatsPerMeasure: DEFAULT_BEATS_PER_MEASURE,
    subdivision: 1,
    currentBeat: 0,
    currentMeasure: 1,
    volume: 0.7,
    accentEnabled: true,
    error: null
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const timerWorkerRef = useRef<Worker | null>(null);
  const accentSynthRef = useRef<Tone.Synth | null>(null);
  const beatSynthRef = useRef<Tone.Synth | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);
  
  // Timing refs para precisión
  const currentBeatRef = useRef<number>(0);
  const currentMeasureRef = useRef<number>(1);
  const nextNoteTimeRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);

  // ========================================================================================
  // WORKER PARA TIMING PRECISO
  // ========================================================================================

  const createTimerWorker = useCallback((): Worker => {
    const workerCode = `
      let timerID = null;
      let interval = 100;

      self.onmessage = function(e) {
        if (e.data === "start") {
          timerID = setInterval(function() {
            self.postMessage("tick");
          }, interval);
        } else if (e.data.interval) {
          interval = e.data.interval;
          if (timerID) {
            clearInterval(timerID);
            timerID = setInterval(function() {
              self.postMessage("tick");
            }, interval);
          }
        } else if (e.data === "stop") {
          clearInterval(timerID);
          timerID = null;
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }, []);

  // ========================================================================================
  // INICIALIZACIÓN DE AUDIO
  // ========================================================================================

  const initializeAudio = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🥁 Initializing metronome audio...');

      // Crear sintetizadores diferenciados
      accentSynthRef.current = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      });

      beatSynthRef.current = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
      });

      // Crear volumen master
      volumeRef.current = new Tone.Volume(-6);

      // Conectar cadena de audio
      accentSynthRef.current.connect(volumeRef.current);
      beatSynthRef.current.connect(volumeRef.current);
      volumeRef.current.toDestination();

      console.log('✅ Metronome audio initialized');
      return true;

    } catch (error) {
      console.error('❌ Metronome audio initialization failed:', error);
      return false;
    }
  }, []);

  // ========================================================================================
  // FUNCIONES DE SONIDO
  // ========================================================================================

  const playAccentBeat = useCallback((time: number): void => {
    if (!accentSynthRef.current) return;
    
    try {
      accentSynthRef.current.triggerAttackRelease('C6', '32n', time);
    } catch (error) {
      console.error('Error playing accent beat:', error);
    }
  }, []);

  const playNormalBeat = useCallback((time: number): void => {
    if (!beatSynthRef.current) return;
    
    try {
      beatSynthRef.current.triggerAttackRelease('C5', '32n', time);
    } catch (error) {
      console.error('Error playing normal beat:', error);
    }
  }, []);

  // ========================================================================================
  // SCHEDULER PRECISO
  // ========================================================================================

  const scheduler = useCallback((): void => {
    while (nextNoteTimeRef.current < Tone.now() + SCHEDULE_AHEAD_TIME) {
      const isAccent = metronomeState.accentEnabled && (currentBeatRef.current % metronomeState.beatsPerMeasure === 0);
      
      // Programar el sonido
      if (isAccent) {
        playAccentBeat(nextNoteTimeRef.current);
      } else {
        playNormalBeat(nextNoteTimeRef.current);
      }

      // Disparar evento
      events?.onBeat?.(currentBeatRef.current + 1, currentMeasureRef.current, isAccent);

      // Actualizar estado de UI en el siguiente frame
      if (isMountedRef.current) {
        setTimeout(() => {
          setMetronomeState(prev => ({
            ...prev,
            currentBeat: (currentBeatRef.current % prev.beatsPerMeasure) + 1,
            currentMeasure: currentMeasureRef.current
          }));
        }, 0);
      }

      // Calcular siguiente beat
      const secondsPerBeat = 60.0 / (metronomeState.bpm * metronomeState.subdivision);
      nextNoteTimeRef.current += secondsPerBeat;
      
      currentBeatRef.current++;
      if (currentBeatRef.current % metronomeState.beatsPerMeasure === 0) {
        currentMeasureRef.current++;
      }
    }
  }, [metronomeState.bpm, metronomeState.beatsPerMeasure, metronomeState.subdivision, metronomeState.accentEnabled, playAccentBeat, playNormalBeat, events]);

  // ========================================================================================
  // CONTROL DEL METRÓNOMO
  // ========================================================================================

  const start = useCallback(async (): Promise<boolean> => {
    if (isRunningRef.current) return true;

    try {
      // Asegurar que Tone.js está iniciado
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }

      // Inicializar audio si no está hecho
      if (!metronomeState.isInitialized) {
        const initialized = await initializeAudio();
        if (!initialized) return false;
      }

      // Resetear timing
      nextNoteTimeRef.current = Tone.now();
      currentBeatRef.current = 0;
      currentMeasureRef.current = 1;
      isRunningRef.current = true;

      // Crear worker si no existe
      if (!timerWorkerRef.current) {
        timerWorkerRef.current = createTimerWorker();
        timerWorkerRef.current.onmessage = () => {
          if (isRunningRef.current) {
            scheduler();
          }
        };
      }

      // Iniciar worker
      timerWorkerRef.current.postMessage({ interval: LOOKAHEAD_TIME });
      timerWorkerRef.current.postMessage('start');

      if (isMountedRef.current) {
        setMetronomeState(prev => ({
          ...prev,
          isRunning: true,
          isInitialized: true,
          currentBeat: 1,
          currentMeasure: 1,
          error: null
        }));
      }

      events?.onStart?.();
      console.log(`🥁 Metronome started at ${metronomeState.bpm} BPM`);
      return true;

    } catch (error) {
      console.error('❌ Metronome start failed:', error);
      
      if (isMountedRef.current) {
        setMetronomeState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Start failed'
        }));
      }
      
      return false;
    }
  }, [metronomeState.isInitialized, metronomeState.bpm, initializeAudio, createTimerWorker, scheduler, events]);

  const stop = useCallback((): void => {
    isRunningRef.current = false;

    // Parar worker
    if (timerWorkerRef.current) {
      timerWorkerRef.current.postMessage('stop');
    }

    if (isMountedRef.current) {
      setMetronomeState(prev => ({
        ...prev,
        isRunning: false
      }));
    }

    events?.onStop?.();
    console.log('🥁 Metronome stopped');
  }, [events]);

  const reset = useCallback((): void => {
    stop();
    
    currentBeatRef.current = 0;
    currentMeasureRef.current = 1;
    
    if (isMountedRef.current) {
      setMetronomeState(prev => ({
        ...prev,
        currentBeat: 0,
        currentMeasure: 1
      }));
    }
    
    console.log('🥁 Metronome reset');
  }, [stop]);

  // ========================================================================================
  // SETTERS
  // ========================================================================================

  const setBPM = useCallback((bpm: number): void => {
    const clampedBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
    
    if (isMountedRef.current) {
      setMetronomeState(prev => ({ ...prev, bpm: clampedBPM }));
    }
    
    console.log(`🥁 BPM set to ${clampedBPM}`);
  }, []);

  const setBeatsPerMeasure = useCallback((beats: number): void => {
    const clampedBeats = Math.max(1, Math.min(16, Math.round(beats)));
    
    if (isMountedRef.current) {
      setMetronomeState(prev => ({ ...prev, beatsPerMeasure: clampedBeats }));
    }
  }, []);

  const setSubdivision = useCallback((subdivision: number): void => {
    const validSubdivisions = [1, 2, 4];
    const clampedSubdivision = validSubdivisions.includes(subdivision) ? subdivision : 1;
    
    if (isMountedRef.current) {
      setMetronomeState(prev => ({ ...prev, subdivision: clampedSubdivision }));
    }
  }, []);

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    if (volumeRef.current) {
      const volumeDb = clampedVolume <= 0 ? -Infinity : -30 + (clampedVolume * 30);
      volumeRef.current.volume.value = volumeDb;
    }
    
    if (isMountedRef.current) {
      setMetronomeState(prev => ({ ...prev, volume: clampedVolume }));
    }
  }, []);

  const setAccent = useCallback((enabled: boolean): void => {
    if (isMountedRef.current) {
      setMetronomeState(prev => ({ ...prev, accentEnabled: enabled }));
    }
  }, []);

  // ========================================================================================
  // INICIALIZACIÓN Y CLEANUP
  // ========================================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    return await initializeAudio();
  }, [initializeAudio]);

  const cleanup = useCallback((): void => {
    isMountedRef.current = false;
    
    // Parar metrónomo
    stop();
    
    // Limpiar worker
    if (timerWorkerRef.current) {
      timerWorkerRef.current.terminate();
      timerWorkerRef.current = null;
    }
    
    // Limpiar audio
    if (accentSynthRef.current) {
      accentSynthRef.current.dispose();
      accentSynthRef.current = null;
    }
    
    if (beatSynthRef.current) {
      beatSynthRef.current.dispose();
      beatSynthRef.current = null;
    }
    
    if (volumeRef.current) {
      volumeRef.current.dispose();
      volumeRef.current = null;
    }
    
    console.log('🥁 Metronome cleanup completed');
  }, [stop]);

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
    ...metronomeState,
    
    // Controles
    start,
    stop,
    reset,
    setBPM,
    setBeatsPerMeasure,
    setSubdivision,
    setVolume,
    setAccent,
    initialize,
    cleanup
  };
};