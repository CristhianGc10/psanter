// src/hooks/useDetection.ts
/**
 * HOOK DE DETECCIÓN MUSICAL - Análisis en tiempo real de acordes y escalas
 * Debouncing optimizado, integración con stores, performance optimizado
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDetectionStore } from '../store/detectionStore';
import { usePianoStore } from '../store/pianoStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface DetectionState {
  isEnabled: boolean;
  isAnalyzing: boolean;
  currentChords: string[];
  currentScales: string[];
  confidence: {
    chord: number;
    scale: number;
  };
  lastAnalysisTime: number;
  totalAnalyses: number;
  error: string | null;
}

interface DetectionControls {
  enable: () => void;
  disable: () => void;
  toggle: () => void;
  analyzeNotes: (notes: NoteName[]) => Promise<void>;
  forceAnalysis: () => Promise<void>;
  clearResults: () => void;
  setDebounceTime: (ms: number) => void;
  setSensitivity: (level: number) => void;
  cleanup: () => void;
}

interface DetectionConfig {
  debounceTime: number;
  sensitivity: number;
  minNotesForChord: number;
  minNotesForScale: number;
  maxAnalysisTime: number;
  enableChordDetection: boolean;
  enableScaleDetection: boolean;
}

interface ChordDefinition {
  name: string;
  pattern: number[];
  aliases: string[];
  weight: number;
}

interface ScaleDefinition {
  name: string;
  pattern: number[];
  aliases: string[];
  weight: number;
}

interface DetectedChord {
  name: string;
  confidence: number;
  notes: NoteName[];
  type: string;
}

interface DetectedScale {
  name: string;
  confidence: number;
  notes: NoteName[];
  type: string;
}

// ========================================================================================
// DEFINICIONES MUSICALES
// ========================================================================================

const CHORD_DEFINITIONS: ChordDefinition[] = [
  // Acordes mayores
  { name: 'C', pattern: [0, 4, 7], aliases: ['C Major'], weight: 1.0 },
  { name: 'D', pattern: [2, 6, 9], aliases: ['D Major'], weight: 1.0 },
  { name: 'E', pattern: [4, 8, 11], aliases: ['E Major'], weight: 1.0 },
  { name: 'F', pattern: [5, 9, 0], aliases: ['F Major'], weight: 1.0 },
  { name: 'G', pattern: [7, 11, 2], aliases: ['G Major'], weight: 1.0 },
  { name: 'A', pattern: [9, 1, 4], aliases: ['A Major'], weight: 1.0 },
  { name: 'B', pattern: [11, 3, 6], aliases: ['B Major'], weight: 1.0 },
  
  // Acordes menores
  { name: 'Cm', pattern: [0, 3, 7], aliases: ['C minor'], weight: 1.0 },
  { name: 'Dm', pattern: [2, 5, 9], aliases: ['D minor'], weight: 1.0 },
  { name: 'Em', pattern: [4, 7, 11], aliases: ['E minor'], weight: 1.0 },
  { name: 'Fm', pattern: [5, 8, 0], aliases: ['F minor'], weight: 1.0 },
  { name: 'Gm', pattern: [7, 10, 2], aliases: ['G minor'], weight: 1.0 },
  { name: 'Am', pattern: [9, 0, 4], aliases: ['A minor'], weight: 1.0 },
  { name: 'Bm', pattern: [11, 2, 6], aliases: ['B minor'], weight: 1.0 },
  
  // Acordes séptima
  { name: 'C7', pattern: [0, 4, 7, 10], aliases: ['C dominant 7'], weight: 0.9 },
  { name: 'Cmaj7', pattern: [0, 4, 7, 11], aliases: ['C major 7'], weight: 0.9 },
  { name: 'Cm7', pattern: [0, 3, 7, 10], aliases: ['C minor 7'], weight: 0.9 },
];

const SCALE_DEFINITIONS: ScaleDefinition[] = [
  // Escalas mayores
  { name: 'C Major', pattern: [0, 2, 4, 5, 7, 9, 11], aliases: ['C Ionian'], weight: 1.0 },
  { name: 'G Major', pattern: [7, 9, 11, 0, 2, 4, 6], aliases: ['G Ionian'], weight: 1.0 },
  { name: 'D Major', pattern: [2, 4, 6, 7, 9, 11, 1], aliases: ['D Ionian'], weight: 1.0 },
  { name: 'A Major', pattern: [9, 11, 1, 2, 4, 6, 8], aliases: ['A Ionian'], weight: 1.0 },
  { name: 'E Major', pattern: [4, 6, 8, 9, 11, 1, 3], aliases: ['E Ionian'], weight: 1.0 },
  { name: 'F Major', pattern: [5, 7, 9, 10, 0, 2, 4], aliases: ['F Ionian'], weight: 1.0 },
  
  // Escalas menores naturales
  { name: 'A minor', pattern: [9, 11, 0, 2, 4, 5, 7], aliases: ['A Aeolian'], weight: 1.0 },
  { name: 'E minor', pattern: [4, 6, 7, 9, 11, 0, 2], aliases: ['E Aeolian'], weight: 1.0 },
  { name: 'D minor', pattern: [2, 4, 5, 7, 9, 10, 0], aliases: ['D Aeolian'], weight: 1.0 },
  { name: 'G minor', pattern: [7, 9, 10, 0, 2, 3, 5], aliases: ['G Aeolian'], weight: 1.0 },
  { name: 'C minor', pattern: [0, 2, 3, 5, 7, 8, 10], aliases: ['C Aeolian'], weight: 1.0 },
  { name: 'F minor', pattern: [5, 7, 8, 10, 0, 1, 3], aliases: ['F Aeolian'], weight: 1.0 },
];

// ========================================================================================
// HOOK PRINCIPAL useDetection
// ========================================================================================

export const useDetection = (): DetectionState & DetectionControls => {

  // ========== ESTADO LOCAL ==========
  const [detectionState, setDetectionState] = useState<DetectionState>({
    isEnabled: false,
    isAnalyzing: false,
    currentChords: [],
    currentScales: [],
    confidence: { chord: 0, scale: 0 },
    lastAnalysisTime: 0,
    totalAnalyses: 0,
    error: null
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true); // 🔥 NUEVO: Track mounted state
  const debounceTimerRef = useRef<number | null>(null);
  const lastNotesRef = useRef<NoteName[]>([]);
  const analysisWorkerRef = useRef<Worker | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // ========== CONFIGURACIÓN ==========
  const configRef = useRef<DetectionConfig>({
    debounceTime: 150,
    sensitivity: 0.8,
    minNotesForChord: 3,
    minNotesForScale: 4,
    maxAnalysisTime: 50,
    enableChordDetection: true,
    enableScaleDetection: true
  });

  // ========== STORES ==========
  const detectionStore = useDetectionStore();
  const pianoStore = usePianoStore();

  // ========================================================================================
  // FUNCIONES DE ANÁLISIS MUSICAL
  // ========================================================================================

  const noteToChroma = useCallback((note: NoteName): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
      'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };
    const noteName = note.replace(/\d+/, ''); // Remover octava
    return noteMap[noteName] || 0;
  }, []);

  const detectChords = useCallback((notes: NoteName[]): DetectedChord[] => {
    if (notes.length < configRef.current.minNotesForChord) {
      return [];
    }

    const chromas = notes.map(noteToChroma);
    const uniqueChromas = [...new Set(chromas)].sort((a, b) => a - b);
    
    const results: DetectedChord[] = [];

    for (const chord of CHORD_DEFINITIONS) {
      for (let root = 0; root < 12; root++) {
        const transposedPattern = chord.pattern.map(note => (note + root) % 12);
        const matches = transposedPattern.filter(note => uniqueChromas.includes(note));
        const confidence = (matches.length / chord.pattern.length) * chord.weight;

        if (confidence >= configRef.current.sensitivity) {
          const rootNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][root];
          const chordName = chord.name.replace(/^[A-G][#b]?/, rootNote);
          
          results.push({
            name: chordName,
            confidence,
            notes: notes,
            type: 'chord'
          });
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  }, [noteToChroma]);

  const detectScales = useCallback((notes: NoteName[]): DetectedScale[] => {
    if (notes.length < configRef.current.minNotesForScale) {
      return [];
    }

    const chromas = notes.map(noteToChroma);
    const uniqueChromas = [...new Set(chromas)].sort((a, b) => a - b);
    
    const results: DetectedScale[] = [];

    for (const scale of SCALE_DEFINITIONS) {
      for (let root = 0; root < 12; root++) {
        const transposedPattern = scale.pattern.map(note => (note + root) % 12);
        const matches = transposedPattern.filter(note => uniqueChromas.includes(note));
        const confidence = (matches.length / scale.pattern.length) * scale.weight;

        if (confidence >= configRef.current.sensitivity * 0.7) { // Scales need lower threshold
          const rootNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][root];
          const scaleName = scale.name.replace(/^[A-G][#b]?/, rootNote);
          
          results.push({
            name: scaleName,
            confidence,
            notes: notes,
            type: 'scale'
          });
        }
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  }, [noteToChroma]);

  // ========================================================================================
  // ANÁLISIS PRINCIPAL CON DEBOUNCING
  // ========================================================================================

  const analyzeNotes = useCallback(async (notes: NoteName[]): Promise<void> => {
    // Evitar análisis redundante
    const notesStr = notes.sort().join(',');
    const lastNotesStr = lastNotesRef.current.sort().join(',');
    
    if (notesStr === lastNotesStr) {
      return;
    }

    lastNotesRef.current = notes;

    // Cancelar análisis previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 🔥 CORRECCIÓN: Solo setState si está montado
    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, isAnalyzing: true }));
    }

    // Debouncing
    debounceTimerRef.current = window.setTimeout(async () => {
      if (!configRef.current.enableChordDetection && !configRef.current.enableScaleDetection) {
        return;
      }

      try {
        const analysisStart = performance.now();

        // Análisis paralelo
        const [chordResults, scaleResults] = await Promise.all([
          configRef.current.enableChordDetection ? detectChords(notes) : Promise.resolve([]),
          configRef.current.enableScaleDetection ? detectScales(notes) : Promise.resolve([])
        ]);

        const analysisTime = performance.now() - analysisStart;

        // Verificar timeout
        if (analysisTime > configRef.current.maxAnalysisTime) {
          console.warn(`⚠️ Analysis took ${analysisTime.toFixed(1)}ms (limit: ${configRef.current.maxAnalysisTime}ms)`);
        }

        // Actualizar estado
        const chordNames = chordResults.map(r => r.name);
        const scaleNames = scaleResults.map(r => r.name);
        const chordConfidence = chordResults[0]?.confidence || 0;
        const scaleConfidence = scaleResults[0]?.confidence || 0;

        // 🔥 CORRECCIÓN: Solo setState si está montado
        if (isMountedRef.current) {
          setDetectionState(prev => ({
            ...prev,
            isAnalyzing: false,
            currentChords: chordNames,
            currentScales: scaleNames,
            confidence: { chord: chordConfidence, scale: scaleConfidence },
            lastAnalysisTime: Date.now(),
            totalAnalyses: prev.totalAnalyses + 1
          }));
        }

        console.log(`🎯 Analysis completed in ${analysisTime.toFixed(1)}ms:`, {
          chords: chordNames,
          scales: scaleNames,
          confidence: { chord: chordConfidence.toFixed(2), scale: scaleConfidence.toFixed(2) }
        });

      } catch (error) {
        console.error('❌ Detection analysis failed:', error);
        
        // 🔥 CORRECCIÓN: Solo setState si está montado
        if (isMountedRef.current) {
          setDetectionState(prev => ({
            ...prev,
            isAnalyzing: false,
            error: error instanceof Error ? error.message : 'Analysis failed'
          }));
        }
      }
    }, configRef.current.debounceTime);

  }, [detectionState.isEnabled, detectChords, detectScales]);

  const forceAnalysis = useCallback(async (): Promise<void> => {
    const activeNotes = Array.from(pianoStore.activeNotes);
    lastNotesRef.current = []; // Forzar análisis limpiando cache
    await analyzeNotes(activeNotes);
  }, [pianoStore.activeNotes, analyzeNotes]);

  // ========================================================================================
  // FUNCIONES DE CONTROL
  // ========================================================================================

  const enable = useCallback((): void => {
    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, isEnabled: true }));
    }
    detectionStore.enable();
    console.log('🎯 Detection enabled');
  }, [detectionStore]);

  const disable = useCallback((): void => {
    // Cancelar análisis pendiente
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // 🔥 CORRECCIÓN CRÍTICA: Solo setState si está montado
    if (isMountedRef.current) {
      setDetectionState(prev => ({
        ...prev,
        isEnabled: false,
        isAnalyzing: false,
        currentChords: [],
        currentScales: []
      }));
    }

    detectionStore.disable();
    console.log('🎯 Detection disabled');
  }, [detectionStore]);

  const toggle = useCallback((): void => {
    if (detectionState.isEnabled) {
      disable();
    } else {
      enable();
    }
  }, [detectionState.isEnabled, enable, disable]);

  const clearResults = useCallback((): void => {
    if (isMountedRef.current) {
      setDetectionState(prev => ({
        ...prev,
        currentChords: [],
        currentScales: [],
        confidence: { chord: 0, scale: 0 }
      }));
    }

    console.log('🎯 Detection results cleared');
  }, []);

  const setDebounceTime = useCallback((ms: number): void => {
    configRef.current.debounceTime = Math.max(50, Math.min(1000, ms));
    console.log(`🎯 Debounce time set to: ${configRef.current.debounceTime}ms`);
  }, []);

  const setSensitivity = useCallback((level: number): void => {
    configRef.current.sensitivity = Math.max(0.1, Math.min(1.0, level));
    console.log(`🎯 Sensitivity set to: ${(configRef.current.sensitivity * 100).toFixed(0)}%`);
  }, []);

  // ========================================================================================
  // CLEANUP - CORREGIDO PARA EVITAR SETSTATE EN UNMOUNT
  // ========================================================================================

  const cleanup = useCallback((): void => {
    // Cancelar debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Limpiar worker si existe
    if (analysisWorkerRef.current) {
      analysisWorkerRef.current.terminate();
      analysisWorkerRef.current = null;
    }

    // Ejecutar funciones de cleanup
    cleanupFunctionsRef.current.forEach(fn => fn());
    cleanupFunctionsRef.current = [];

    // 🔥 CORRECCIÓN CRÍTICA: Solo setState si está montado
    if (isMountedRef.current) {
      setDetectionState({
        isEnabled: false,
        isAnalyzing: false,
        currentChords: [],
        currentScales: [],
        confidence: { chord: 0, scale: 0 },
        lastAnalysisTime: 0,
        totalAnalyses: 0,
        error: null
      });
    }

    console.log('🧹 Detection cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS - INTEGRACIÓN CON STORES
  // ========================================================================================

  // Marcar como montado al inicializar
  useEffect(() => {
    isMountedRef.current = true;
    
    // 🔥 CORRECCIÓN CRÍTICA: Marcar unmount antes de cleanup
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suscribirse a cambios en las notas activas del piano
  useEffect(() => {
    const unsubscribe = usePianoStore.subscribe(
      (state) => state.activeNotes,
      (activeNotes) => {
        if (detectionState.isEnabled) {
          analyzeNotes(Array.from(activeNotes));
        }
      }
    );

    return unsubscribe;
  }, [detectionState.isEnabled, analyzeNotes]);

  // Cleanup al desmontar - sin setState
  useEffect(() => {
    return () => {
      // 🔥 CORRECCIÓN: Solo cleanup de timers/workers, sin setState
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (analysisWorkerRef.current) {
        analysisWorkerRef.current.terminate();
        analysisWorkerRef.current = null;
      }

      cleanupFunctionsRef.current.forEach(fn => fn());
      cleanupFunctionsRef.current = [];
    };
  }, []);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    isEnabled: detectionState.isEnabled,
    isAnalyzing: detectionState.isAnalyzing,
    currentChords: detectionState.currentChords,
    currentScales: detectionState.currentScales,
    confidence: detectionState.confidence,
    lastAnalysisTime: detectionState.lastAnalysisTime,
    totalAnalyses: detectionState.totalAnalyses,
    error: detectionState.error,
    
    // Controles
    enable,
    disable,
    toggle,
    analyzeNotes,
    forceAnalysis,
    clearResults,
    setDebounceTime,
    setSensitivity,
    cleanup
  };
};