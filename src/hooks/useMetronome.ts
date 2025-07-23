// src/hooks/useMetronome.ts
/**
 * HOOK DEL METRÓNOMO - Control preciso de tempo con Tone.js
 * Temporización precisa, sonidos diferenciados, BPM dinámico y subdivisiones
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Tone from 'tone';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface MetronomeState {
  isRunning: boolean;
  bpm: number;
  currentBeat: number;
  totalBeats: number;
  timeSignature: {
    numerator: number;
    denominator: number;
  };
  subdivision: 'quarter' | 'eighth' | 'sixteenth';
  volume: number;
  accentVolume: number;
  isInitialized: boolean;
  nextBeatTime: number;
  error: string | null;
}

interface MetronomeControls {
  start: () => Promise<boolean>;
  stop: () => void;
  toggle: () => Promise<boolean>;
  setBPM: (bpm: number) => void;
  setTimeSignature: (numerator: number, denominator: number) => void;
  setSubdivision: (subdivision: 'quarter' | 'eighth' | 'sixteenth') => void;
  setVolume: (volume: number) => void;
  setAccentVolume: (volume: number) => void;
  reset: () => void;
  initialize: () => Promise<boolean>;
  cleanup: () => void;
}

interface MetronomeEvents {
  onBeat?: (beat: number, isAccent: boolean, bpm: number) => void;
  onMeasure?: (measure: number) => void;
  onStart?: () => void;
  onStop?: () => void;
}

interface BeatSound {
  frequency: number;
  duration: number;
  volume: number;
  waveform: OscillatorType;
}

// ========================================================================================
// CONFIGURACIONES DE SONIDOS
// ========================================================================================

const BEAT_SOUNDS: Record<'accent' | 'normal' | 'subdivision', BeatSound> = {
  accent: {
    frequency: 1000,    // 1kHz - sonido más agudo para acentos
    duration: 0.1,      // 100ms
    volume: -6,         // -6dB
    waveform: 'square'
  },
  normal: {
    frequency: 800,     // 800Hz - sonido medio para beats normales
    duration: 0.08,     // 80ms
    volume: -12,        // -12dB
    waveform: 'triangle'
  },
  subdivision: {
    frequency: 600,     // 600Hz - sonido más grave para subdivisiones
    duration: 0.06,     // 60ms
    volume: -18,        // -18dB (más suave)
    waveform: 'sine'
  }
};

// ========================================================================================
// HOOK PRINCIPAL useMetronome
// ========================================================================================

export const useMetronome = (events?: MetronomeEvents): MetronomeState & MetronomeControls => {
  
  // ========== ESTADO LOCAL ==========
  const [metronomeState, setMetronomeState] = useState<MetronomeState>({
    isRunning: false,
    bpm: 120,
    currentBeat: 0,
    totalBeats: 0,
    timeSignature: { numerator: 4, denominator: 4 },
    subdivision: 'quarter',
    volume: 0.7,
    accentVolume: 0.9,
    isInitialized: false,
    nextBeatTime: 0,
    error: null
  });

  // ========== REFS PARA TONE.JS Y TIMING ==========
  const transportRef = useRef<typeof Tone.Transport | null>(null);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const volumeRef = useRef<Tone.Volume | null>(null);
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const lookAheadRef = useRef<number>(25); // ms de look-ahead
  const scheduleIdRef = useRef<number | null>(null);
  const measureCountRef = useRef<number>(1);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // ========================================================================================
  // UTILIDADES DE CÁLCULO TEMPORAL
  // ========================================================================================

  const getSubdivisionMultiplier = useCallback((subdivision: string): number => {
    switch (subdivision) {
      case 'eighth': return 2;
      case 'sixteenth': return 4;
      default: return 1; // quarter note
    }
  }, []);

  const getBeatInterval = useCallback((bpm: number, subdivision: string): number => {
    const quarterNoteMs = 60000 / bpm; // ms por quarter note
    const multiplier = getSubdivisionMultiplier(subdivision);
    return quarterNoteMs / multiplier;
  }, [getSubdivisionMultiplier]);

  const isAccentBeat = useCallback((beat: number, timeSignature: { numerator: number }): boolean => {
    // Primer beat de cada compás es acento
    return (beat % timeSignature.numerator) === 0;
  }, []);

  // ========================================================================================
  // FUNCIONES DE INICIALIZACIÓN
  // ========================================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🥁 Initializing metronome...');

      // Verificar si ya está inicializado
      if (synthRef.current && metronomeState.isInitialized) {
        console.log('✅ Metronome already initialized');
        return true;
      }

      // Asegurar que el contexto de audio esté iniciado
      if (Tone.getContext().state === 'suspended') {
        await Tone.start();
      }

      // 1. Crear sintetizador para el metrónomo (MembraneSynth es ideal para beats)
      synthRef.current = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.001,
          decay: 0.4,
          sustain: 0.01,
          release: 1.4,
          attackCurve: 'exponential'
        }
      });

      // 2. Crear control de volumen
      volumeRef.current = new Tone.Volume(-10); // -10dB inicial

      // 3. Conectar cadena de audio
      synthRef.current.connect(volumeRef.current);
      volumeRef.current.toDestination();

      // 4. Configurar Transport (motor de timing de Tone.js)
      transportRef.current = Tone.Transport;
      Tone.Transport.bpm.value = metronomeState.bpm;
      Tone.Transport.timeSignature = [
        metronomeState.timeSignature.numerator,
        metronomeState.timeSignature.denominator
      ];

      // 5. Configurar cleanup
      setupCleanup();

      // 6. Actualizar estado
      setMetronomeState(prev => ({
        ...prev,
        isInitialized: true,
        error: null
      }));

      console.log(`✅ Metronome initialized at ${metronomeState.bpm} BPM`);
      return true;

    } catch (error) {
      console.error('❌ Metronome initialization failed:', error);
      
      setMetronomeState(prev => ({
        ...prev,
        isInitialized: false,
        error: error instanceof Error ? error.message : 'Metronome initialization failed'
      }));

      return false;
    }
  }, [metronomeState.isInitialized, metronomeState.bpm, metronomeState.timeSignature]);

  // ========================================================================================
  // FUNCIÓN DE REPRODUCCIÓN DE BEATS
  // ========================================================================================

  const playBeat = useCallback((beatType: 'accent' | 'normal' | 'subdivision', when?: number) => {
    if (!synthRef.current || !volumeRef.current) return;

    const sound = BEAT_SOUNDS[beatType];
    
    try {
      // Calcular volumen final basado en configuración
      const baseVolume = beatType === 'accent' ? 
        metronomeState.accentVolume : 
        metronomeState.volume;
      
      const finalVolumeDb = sound.volume + (baseVolume * 20); // Convertir 0-1 a dB offset
      
      // Reproducir con timing preciso
      const playTime = when || Tone.now();
      synthRef.current.triggerAttackRelease(
        sound.frequency,
        sound.duration,
        playTime,
        finalVolumeDb
      );

      console.log(`🥁 Beat played: ${beatType} (${sound.frequency}Hz) at ${playTime.toFixed(3)}s`);

    } catch (error) {
      console.error('❌ Failed to play beat:', error);
    }
  }, [metronomeState.volume, metronomeState.accentVolume]);

  // ========================================================================================
  // MOTOR DE SCHEDULING PERSONALIZADO
  // ========================================================================================

  const scheduleNextBeats = useCallback(() => {
    if (!metronomeState.isRunning || !transportRef.current) return;

    const currentTime = Tone.now();
    const beatInterval = getBeatInterval(metronomeState.bpm, metronomeState.subdivision) / 1000; // convertir a segundos
    const subdivisionMultiplier = getSubdivisionMultiplier(metronomeState.subdivision);
    const beatsPerMeasure = metronomeState.timeSignature.numerator * subdivisionMultiplier;

    // Programar los próximos beats dentro del look-ahead window
    let nextBeatTime = metronomeState.nextBeatTime;
    const lookAheadTime = currentTime + (lookAheadRef.current / 1000);

    while (nextBeatTime < lookAheadTime) {
      const currentBeatInMeasure = metronomeState.currentBeat % beatsPerMeasure;
      const isMainBeat = (currentBeatInMeasure % subdivisionMultiplier) === 0;
      const beatNumber = Math.floor(currentBeatInMeasure / subdivisionMultiplier);
      
      let beatType: 'accent' | 'normal' | 'subdivision';
      
      if (isMainBeat) {
        beatType = isAccentBeat(beatNumber, metronomeState.timeSignature) ? 'accent' : 'normal';
      } else {
        beatType = 'subdivision';
      }

      // Programar el beat
      playBeat(beatType, nextBeatTime);

      // Disparar eventos
      if (isMainBeat) {
        const isAccent = beatType === 'accent';
        events?.onBeat?.(beatNumber + 1, isAccent, metronomeState.bpm);
        
        // Nuevo compás
        if (isAccent && metronomeState.currentBeat > 0) {
          measureCountRef.current++;
          events?.onMeasure?.(measureCountRef.current);
        }
      }

      // Avanzar al siguiente beat
      nextBeatTime += beatInterval;
      
      setMetronomeState(prev => ({
        ...prev,
        currentBeat: prev.currentBeat + 1,
        totalBeats: prev.totalBeats + 1,
        nextBeatTime: nextBeatTime
      }));
    }

    // Programar el siguiente scheduling
    scheduleIdRef.current = window.setTimeout(scheduleNextBeats, lookAheadRef.current);
    
  }, [
    metronomeState.isRunning,
    metronomeState.bpm,
    metronomeState.subdivision,
    metronomeState.timeSignature,
    metronomeState.currentBeat,
    metronomeState.nextBeatTime,
    getBeatInterval,
    getSubdivisionMultiplier,
    isAccentBeat,
    playBeat,
    events
  ]);

  // ========================================================================================
  // FUNCIONES DE CONTROL
  // ========================================================================================

  const start = useCallback(async (): Promise<boolean> => {
    try {
      if (!metronomeState.isInitialized) {
        const initSuccess = await initialize();
        if (!initSuccess) return false;
      }

      if (metronomeState.isRunning) {
        console.log('⚠️ Metronome is already running');
        return true;
      }

      // Asegurar que el contexto de audio esté activo
      if (Tone.getContext().state === 'suspended') {
        await Tone.start();
      }

      // Configurar timing inicial
      const currentTime = Tone.now();
      const beatInterval = getBeatInterval(metronomeState.bpm, metronomeState.subdivision) / 1000;
      
      setMetronomeState(prev => ({
        ...prev,
        isRunning: true,
        nextBeatTime: currentTime + beatInterval,
        error: null
      }));

      // Iniciar el motor de scheduling
      scheduleNextBeats();

      // Disparar evento
      events?.onStart?.();

      console.log(`🥁 Metronome started at ${metronomeState.bpm} BPM`);
      return true;

    } catch (error) {
      console.error('❌ Failed to start metronome:', error);
      
      setMetronomeState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start metronome'
      }));

      return false;
    }
  }, [metronomeState.isInitialized, metronomeState.isRunning, metronomeState.bpm, initialize, getBeatInterval, scheduleNextBeats, events]);

  const stop = useCallback((): void => {
    // Detener scheduling
    if (scheduleIdRef.current) {
      clearTimeout(scheduleIdRef.current);
      scheduleIdRef.current = null;
    }

    // Actualizar estado
    setMetronomeState(prev => ({
      ...prev,
      isRunning: false
    }));

    // Disparar evento
    events?.onStop?.();

    console.log('🥁 Metronome stopped');
  }, [events]);

  const toggle = useCallback(async (): Promise<boolean> => {
    if (metronomeState.isRunning) {
      stop();
      return false;
    } else {
      return await start();
    }
  }, [metronomeState.isRunning, start, stop]);

  const reset = useCallback((): void => {
    stop();
    
    setMetronomeState(prev => ({
      ...prev,
      currentBeat: 0,
      totalBeats: 0,
      nextBeatTime: 0
    }));

    measureCountRef.current = 1;

    console.log('🥁 Metronome reset');
  }, [stop]);

  // ========================================================================================
  // FUNCIONES DE CONFIGURACIÓN
  // ========================================================================================

  const setBPM = useCallback((bpm: number): void => {
    const clampedBPM = Math.max(40, Math.min(300, bpm));
    
    setMetronomeState(prev => ({ ...prev, bpm: clampedBPM }));
    
    if (transportRef.current) {
      Tone.Transport.bpm.value = clampedBPM;
    }

    console.log(`🥁 BPM set to: ${clampedBPM}`);
  }, []);

  const setTimeSignature = useCallback((numerator: number, denominator: number): void => {
    const validNumerator = Math.max(1, Math.min(16, numerator));
    const validDenominator = [1, 2, 4, 8, 16].includes(denominator) ? denominator : 4;
    
    setMetronomeState(prev => ({
      ...prev,
      timeSignature: { numerator: validNumerator, denominator: validDenominator }
    }));

    if (transportRef.current) {
      Tone.Transport.timeSignature = [validNumerator, validDenominator];
    }

    console.log(`🥁 Time signature set to: ${validNumerator}/${validDenominator}`);
  }, []);

  const setSubdivision = useCallback((subdivision: 'quarter' | 'eighth' | 'sixteenth'): void => {
    setMetronomeState(prev => ({ ...prev, subdivision }));
    console.log(`🥁 Subdivision set to: ${subdivision} notes`);
  }, []);

  const setVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMetronomeState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (volumeRef.current) {
      const volumeDb = -30 + (clampedVolume * 30); // -30dB a 0dB
      volumeRef.current.volume.rampTo(volumeDb, 0.1);
    }

    console.log(`🥁 Volume set to: ${(clampedVolume * 100).toFixed(0)}%`);
  }, []);

  const setAccentVolume = useCallback((volume: number): void => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setMetronomeState(prev => ({ ...prev, accentVolume: clampedVolume }));
    console.log(`🥁 Accent volume set to: ${(clampedVolume * 100).toFixed(0)}%`);
  }, []);

  // ========================================================================================
  // CLEANUP
  // ========================================================================================

  const setupCleanup = useCallback(() => {
    const cleanup = () => {
      // Detener scheduling
      if (scheduleIdRef.current) {
        clearTimeout(scheduleIdRef.current);
        scheduleIdRef.current = null;
      }

      // Limpiar Tone.js objects
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }

      if (volumeRef.current) {
        volumeRef.current.dispose();
        volumeRef.current = null;
      }

      if (sequenceRef.current) {
        sequenceRef.current.dispose();
        sequenceRef.current = null;
      }

      console.log('🧹 Metronome cleanup completed');
    };

    cleanupFunctionsRef.current.push(cleanup);
  }, []);

  const cleanup = useCallback((): void => {
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];
    
    setMetronomeState(prev => ({
      ...prev,
      isRunning: false,
      isInitialized: false,
      currentBeat: 0,
      totalBeats: 0,
      nextBeatTime: 0,
      error: null
    }));

    measureCountRef.current = 1;
  }, []);

  // ========================================================================================
  // EFFECTS
  // ========================================================================================

  // Auto-inicialización
  useEffect(() => {
    initialize();
    
    return cleanup;
  }, []); // Solo al montar/desmontar

  // Actualizar Transport cuando cambia BPM o time signature
  useEffect(() => {
    if (transportRef.current) {
      Tone.Transport.bpm.value = metronomeState.bpm;
      Tone.Transport.timeSignature = [
        metronomeState.timeSignature.numerator,
        metronomeState.timeSignature.denominator
      ];
    }
  }, [metronomeState.bpm, metronomeState.timeSignature]);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    isRunning: metronomeState.isRunning,
    bpm: metronomeState.bpm,
    currentBeat: metronomeState.currentBeat,
    totalBeats: metronomeState.totalBeats,
    timeSignature: metronomeState.timeSignature,
    subdivision: metronomeState.subdivision,
    volume: metronomeState.volume,
    accentVolume: metronomeState.accentVolume,
    isInitialized: metronomeState.isInitialized,
    nextBeatTime: metronomeState.nextBeatTime,
    error: metronomeState.error,
    
    // Controles
    start,
    stop,
    toggle,
    setBPM,
    setTimeSignature,
    setSubdivision,
    setVolume,
    setAccentVolume,
    reset,
    initialize,
    cleanup
  };
};