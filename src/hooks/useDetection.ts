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

// ========================================================================================
// DEFINICIONES MUSICALES
// ========================================================================================

const CHORD_DEFINITIONS: ChordDefinition[] = [
  // Triadas mayores
  { name: 'Major', pattern: [0, 4, 7], aliases: ['M', ''], weight: 1.0 },
  { name: 'Minor', pattern: [0, 3, 7], aliases: ['m', 'min'], weight: 1.0 },
  { name: 'Diminished', pattern: [0, 3, 6], aliases: ['dim', '°'], weight: 0.8 },
  { name: 'Augmented', pattern: [0, 4, 8], aliases: ['aug', '+'], weight: 0.7 },
  
  // Séptimas
  { name: 'Major 7th', pattern: [0, 4, 7, 11], aliases: ['M7', 'maj7'], weight: 0.9 },
  { name: 'Minor 7th', pattern: [0, 3, 7, 10], aliases: ['m7', 'min7'], weight: 0.9 },
  { name: 'Dominant 7th', pattern: [0, 4, 7, 10], aliases: ['7', 'dom7'], weight: 0.9 },
  { name: 'Minor-Major 7th', pattern: [0, 3, 7, 11], aliases: ['mM7', 'm(maj7)'], weight: 0.6 },
  { name: 'Half-Diminished 7th', pattern: [0, 3, 6, 10], aliases: ['m7b5', 'ø7'], weight: 0.7 },
  { name: 'Diminished 7th', pattern: [0, 3, 6, 9], aliases: ['dim7', '°7'], weight: 0.6 },
  
  // Extensiones
  { name: 'Major 9th', pattern: [0, 4, 7, 11, 14], aliases: ['M9', 'maj9'], weight: 0.7 },
  { name: 'Minor 9th', pattern: [0, 3, 7, 10, 14], aliases: ['m9', 'min9'], weight: 0.7 },
  { name: 'Dominant 9th', pattern: [0, 4, 7, 10, 14], aliases: ['9'], weight: 0.7 },
  
  // Suspendidos
  { name: 'Suspended 2nd', pattern: [0, 2, 7], aliases: ['sus2'], weight: 0.8 },
  { name: 'Suspended 4th', pattern: [0, 5, 7], aliases: ['sus4'], weight: 0.8 },
  { name: 'Suspended 7th', pattern: [0, 5, 7, 10], aliases: ['7sus4'], weight: 0.7 },
];

const SCALE_DEFINITIONS: ScaleDefinition[] = [
  // Escalas mayores
  { name: 'Major', pattern: [0, 2, 4, 5, 7, 9, 11], aliases: ['Ionian'], weight: 1.0 },
  { name: 'Natural Minor', pattern: [0, 2, 3, 5, 7, 8, 10], aliases: ['Aeolian', 'Minor'], weight: 1.0 },
  
  // Modos griegos
  { name: 'Dorian', pattern: [0, 2, 3, 5, 7, 9, 10], aliases: [], weight: 0.8 },
  { name: 'Phrygian', pattern: [0, 1, 3, 5, 7, 8, 10], aliases: [], weight: 0.7 },
  { name: 'Lydian', pattern: [0, 2, 4, 6, 7, 9, 11], aliases: [], weight: 0.8 },
  { name: 'Mixolydian', pattern: [0, 2, 4, 5, 7, 9, 10], aliases: [], weight: 0.8 },
  { name: 'Locrian', pattern: [0, 1, 3, 5, 6, 8, 10], aliases: [], weight: 0.6 },
  
  // Escalas menores
  { name: 'Harmonic Minor', pattern: [0, 2, 3, 5, 7, 8, 11], aliases: [], weight: 0.9 },
  { name: 'Melodic Minor', pattern: [0, 2, 3, 5, 7, 9, 11], aliases: [], weight: 0.8 },
  
  // Pentatónicas
  { name: 'Major Pentatonic', pattern: [0, 2, 4, 7, 9], aliases: [], weight: 0.9 },
  { name: 'Minor Pentatonic', pattern: [0, 3, 5, 7, 10], aliases: [], weight: 0.9 },
  
  // Blues
  { name: 'Blues', pattern: [0, 3, 5, 6, 7, 10], aliases: [], weight: 0.8 },
  
  // Cromática
  { name: 'Chromatic', pattern: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], aliases: [], weight: 0.3 }
];

// ========================================================================================
// CONFIGURACIÓN DEFAULT
// ========================================================================================

const DEFAULT_CONFIG: DetectionConfig = {
  debounceTime: 300,
  sensitivity: 0.7,
  minNotesForChord: 3,
  minNotesForScale: 4,
  maxAnalysisTime: 100,
  enableChordDetection: true,
  enableScaleDetection: true
};

// ========================================================================================
// HOOK PRINCIPAL useDetection
// ========================================================================================

export const useDetection = (): DetectionState & DetectionControls => {
  
  // ========== ESTADO LOCAL ==========
  const [detectionState, setDetectionState] = useState<DetectionState>({
    isEnabled: true,
    isAnalyzing: false,
    currentChords: [],
    currentScales: [],
    confidence: { chord: 0, scale: 0 },
    lastAnalysisTime: 0,
    totalAnalyses: 0,
    error: null
  });

  // ========== REFS PARA OPTIMIZACIÓN ==========
  const configRef = useRef<DetectionConfig>(DEFAULT_CONFIG);
  const debounceTimerRef = useRef<number | null>(null);
  const lastNotesRef = useRef<NoteName[]>([]);
  const analysisWorkerRef = useRef<Worker | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // ========== ZUSTAND STORES ==========
  const detectionStore = useDetectionStore();
  const pianoStore = usePianoStore();

  // ========================================================================================
  // UTILIDADES MUSICALES
  // ========================================================================================

  const noteToSemitone = useCallback((note: NoteName): number => {
    const noteMap: Record<string, number> = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
      'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
      'A#': 10, 'Bb': 10, 'B': 11
    };
    
    const noteName = note.replace(/\d+$/, '');
    return noteMap[noteName] ?? 0;
  }, []);

  // ========================================================================================
  // ALGORITMOS DE DETECCIÓN
  // ========================================================================================

  const detectChords = useCallback((notes: NoteName[]): Array<{name: string, confidence: number, root: string}> => {
    if (notes.length < configRef.current.minNotesForChord) return [];

    const results: Array<{name: string, confidence: number, root: string}> = [];

    // Probar cada posible tónica
    const uniquePitches = [...new Set(notes.map(noteToSemitone))];
    
    for (const rootPitch of uniquePitches) {
      const normalizedPattern = uniquePitches
        .map(pitch => (pitch - rootPitch + 12) % 12)
        .sort((a, b) => a - b);

      // Comparar con definiciones de acordes
      for (const chord of CHORD_DEFINITIONS) {
        const confidence = calculatePatternMatch(normalizedPattern, chord.pattern);
        
        if (confidence >= configRef.current.sensitivity) {
          const rootNote = Object.keys({
            0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
            6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
          }).find(k => parseInt(k) === rootPitch) || 'C';
          
          results.push({
            name: `${rootNote} ${chord.name}`,
            confidence: confidence * chord.weight,
            root: rootNote
          });
        }
      }
    }

    // Ordenar por confianza y retornar los mejores
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }, [noteToSemitone]);

  const detectScales = useCallback((notes: NoteName[]): Array<{name: string, confidence: number, root: string}> => {
    if (notes.length < configRef.current.minNotesForScale) return [];

    const results: Array<{name: string, confidence: number, root: string}> = [];
    const uniquePitches = [...new Set(notes.map(noteToSemitone))];

    // Probar cada posible tónica
    for (const rootPitch of uniquePitches) {
      // Comparar con definiciones de escalas
      for (const scale of SCALE_DEFINITIONS) {
        const confidence = calculateScaleMatch(uniquePitches, scale.pattern, rootPitch);
        
        if (confidence >= configRef.current.sensitivity) {
          const rootNote = Object.keys({
            0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
            6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B'
          }).find(k => parseInt(k) === rootPitch) || 'C';
          
          results.push({
            name: `${rootNote} ${scale.name}`,
            confidence: confidence * scale.weight,
            root: rootNote
          });
        }
      }
    }

    // Ordenar por confianza y retornar los mejores
    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);
  }, [noteToSemitone]);

  const calculatePatternMatch = useCallback((notes: number[], pattern: number[]): number => {
    if (notes.length === 0 || pattern.length === 0) return 0;

    // Puntuación por notas que coinciden
    const matchingNotes = pattern.filter(note => notes.includes(note)).length;
    const patternCoverage = matchingNotes / pattern.length;
    
    // Penalización por notas extra
    const extraNotes = notes.filter(note => !pattern.includes(note)).length;
    const extraPenalty = extraNotes * 0.2;
    
    // Bonificación por completitud
    const completeness = matchingNotes === pattern.length ? 0.1 : 0;
    
    return Math.max(0, patternCoverage - extraPenalty + completeness);
  }, []);

  const calculateScaleMatch = useCallback((notes: number[], scalePattern: number[], root: number): number => {
    // Normalizar notas a la tónica
    const normalizedNotes = notes.map(note => (note - root + 12) % 12);
    
    // Calcular qué porcentaje de las notas están en la escala
    const notesInScale = normalizedNotes.filter(note => scalePattern.includes(note)).length;
    const coverage = notesInScale / normalizedNotes.length;
    
    // Bonificación por diversidad de grados de la escala
    const scaleDegreesUsed = new Set(normalizedNotes.filter(note => scalePattern.includes(note))).size;
    const diversity = scaleDegreesUsed / scalePattern.length;
    
    return (coverage * 0.7) + (diversity * 0.3);
  }, []);

  // ========================================================================================
  // FUNCIONES DE ANÁLISIS PRINCIPALES
  // ========================================================================================

  const analyzeNotes = useCallback(async (notes: NoteName[]): Promise<void> => {
    // Verificar si está habilitado
    if (!detectionState.isEnabled || !configRef.current.enableChordDetection && !configRef.current.enableScaleDetection) {
      return;
    }

    // Debouncing - cancelar análisis previo
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Si las notas no han cambiado, no analizar
    const notesKey = notes.sort().join(',');
    const lastNotesKey = lastNotesRef.current.sort().join(',');
    if (notesKey === lastNotesKey) {
      return;
    }

    // Programar nuevo análisis
    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        setDetectionState(prev => ({ ...prev, isAnalyzing: true, error: null }));
        
        const startTime = performance.now();
        lastNotesRef.current = [...notes];

        let chordResults: Array<{name: string, confidence: number, root: string}> = [];
        let scaleResults: Array<{name: string, confidence: number, root: string}> = [];

        // Análisis de acordes
        if (configRef.current.enableChordDetection && notes.length >= configRef.current.minNotesForChord) {
          chordResults = detectChords(notes);
        }

        // Análisis de escalas
        if (configRef.current.enableScaleDetection && notes.length >= configRef.current.minNotesForScale) {
          scaleResults = detectScales(notes);
        }

        const analysisTime = performance.now() - startTime;

        // Verificar timeout
        if (analysisTime > configRef.current.maxAnalysisTime) {
          console.warn(`⚠️ Analysis took ${analysisTime.toFixed(1)}ms (limit: ${configRef.current.maxAnalysisTime}ms)`);
        }

        // Actualizar estado
        const chordNames = chordResults.map(r => r.name);
        const scaleNames = scaleResults.map(r => r.name);
        const chordConfidence = chordResults[0]?.confidence || 0;
        const scaleConfidence = scaleResults[0]?.confidence || 0;

        setDetectionState(prev => ({
          ...prev,
          isAnalyzing: false,
          currentChords: chordNames,
          currentScales: scaleNames,
          confidence: { chord: chordConfidence, scale: scaleConfidence },
          lastAnalysisTime: Date.now(),
          totalAnalyses: prev.totalAnalyses + 1
        }));

        console.log(`🎯 Analysis completed in ${analysisTime.toFixed(1)}ms:`, {
          chords: chordNames,
          scales: scaleNames,
          confidence: { chord: chordConfidence.toFixed(2), scale: scaleConfidence.toFixed(2) }
        });

      } catch (error) {
        console.error('❌ Detection analysis failed:', error);
        
        setDetectionState(prev => ({
          ...prev,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : 'Analysis failed'
        }));
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
    setDetectionState(prev => ({ ...prev, isEnabled: true }));
    detectionStore.enable();
    console.log('🎯 Detection enabled');
  }, [detectionStore]);

  const disable = useCallback((): void => {
    // Cancelar análisis pendiente
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setDetectionState(prev => ({
      ...prev,
      isEnabled: false,
      isAnalyzing: false,
      currentChords: [],
      currentScales: []
    }));

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
    setDetectionState(prev => ({
      ...prev,
      currentChords: [],
      currentScales: [],
      confidence: { chord: 0, scale: 0 }
    }));

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
  // CLEANUP
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

    // Reset estado
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

    console.log('🧹 Detection cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS - INTEGRACIÓN CON STORES
  // ========================================================================================

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

  // Cleanup al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

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