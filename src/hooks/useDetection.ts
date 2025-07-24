// src/hooks/useDetection.ts
/**
 * HOOK DE DETECCIÓN - VERSIÓN COMPLETA PARA FASE 5
 * ✅ Análisis musical en tiempo real
 * ✅ Debouncing para evitar spam
 * ✅ Detección de acordes y escalas
 * ✅ Performance optimizado
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDetectionStore } from '../store/detectionStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface DetectionState {
  isEnabled: boolean;
  isAnalyzing: boolean;
  currentChord: string | null;
  currentScale: string | null;
  currentPattern: string | null;
  activeNotes: NoteName[];
  confidence: number;
  lastAnalysisTime: number;
  analysisCount: number;
  error: string | null;
}

interface DetectionControls {
  enable: () => void;
  disable: () => void;
  startAnalysis: () => void;
  stopAnalysis: () => void;
  analyzeNotes: (notes: NoteName[]) => void;
  setActiveNotes: (notes: NoteName[]) => void;
  clearDetection: () => void;
  cleanup: () => void;
}

interface DetectionEvents {
  onChordDetected?: (chord: string, confidence: number) => void;
  onScaleDetected?: (scale: string, confidence: number) => void;
  onPatternDetected?: (pattern: string, confidence: number) => void;
  onAnalysisComplete?: (results: AnalysisResults) => void;
}

interface AnalysisResults {
  chord: string | null;
  scale: string | null;
  pattern: string | null;
  confidence: number;
  notes: NoteName[];
}

// ========================================================================================
// CONSTANTES Y DATOS MUSICALES
// ========================================================================================

const DEBOUNCE_TIME = 300; // ms
const MIN_NOTES_FOR_CHORD = 2;
const MIN_NOTES_FOR_SCALE = 3;
const CONFIDENCE_THRESHOLD = 0.6;

// Mapeo de notas a números para análisis
const NOTE_TO_SEMITONE: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5,
  'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

// Patrones de acordes (intervalos desde la raíz)
const CHORD_PATTERNS: Record<string, number[]> = {
  'Major': [0, 4, 7],
  'Minor': [0, 3, 7],
  'Diminished': [0, 3, 6],
  'Augmented': [0, 4, 8],
  'Major 7th': [0, 4, 7, 11],
  'Minor 7th': [0, 3, 7, 10],
  'Dominant 7th': [0, 4, 7, 10],
  'Suspended 2nd': [0, 2, 7],
  'Suspended 4th': [0, 5, 7],
  'Major 6th': [0, 4, 7, 9],
  'Minor 6th': [0, 3, 7, 9]
};

// Patrones de escalas (intervalos desde la raíz)
const SCALE_PATTERNS: Record<string, number[]> = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10]
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// ========================================================================================
// UTILIDADES DE ANÁLISIS MUSICAL
// ========================================================================================

function normalizeNoteName(note: string): string {
  return note.replace(/\d+$/, ''); // Remover octava
}

function notesToSemitones(notes: NoteName[]): number[] {
  return notes
    .map(note => normalizeNoteName(note))
    .map(note => NOTE_TO_SEMITONE[note])
    .filter(semitone => semitone !== undefined)
    .sort((a, b) => a - b);
}

function normalizeToRoot(semitones: number[]): number[] {
  if (semitones.length === 0) return [];
  const root = semitones[0];
  return semitones.map(semitone => (semitone - root + 12) % 12);
}

function findBestChordMatch(normalizedIntervals: number[]): { chord: string; confidence: number } | null {
  let bestMatch = { chord: '', confidence: 0 };

  for (const [chordName, pattern] of Object.entries(CHORD_PATTERNS)) {
    if (normalizedIntervals.length < pattern.length) continue;

    const matches = pattern.filter(interval => normalizedIntervals.includes(interval));
    const confidence = matches.length / pattern.length;

    if (confidence > bestMatch.confidence && confidence >= CONFIDENCE_THRESHOLD) {
      bestMatch = { chord: chordName, confidence };
    }
  }

  return bestMatch.confidence > 0 ? bestMatch : null;
}

function findBestScaleMatch(normalizedIntervals: number[]): { scale: string; confidence: number } | null {
  let bestMatch = { scale: '', confidence: 0 };

  for (const [scaleName, pattern] of Object.entries(SCALE_PATTERNS)) {
    if (normalizedIntervals.length < MIN_NOTES_FOR_SCALE) continue;

    const matches = normalizedIntervals.filter(interval => pattern.includes(interval));
    const confidence = matches.length / Math.max(normalizedIntervals.length, pattern.length);

    if (confidence > bestMatch.confidence && confidence >= CONFIDENCE_THRESHOLD) {
      bestMatch = { scale: scaleName, confidence };
    }
  }

  return bestMatch.confidence > 0 ? bestMatch : null;
}

function detectPattern(notes: NoteName[]): string | null {
  const noteNames = notes.map(note => normalizeNoteName(note));
  const uniqueNotes = [...new Set(noteNames)];

  if (uniqueNotes.length >= 4) {
    if (uniqueNotes.some(note => note.includes('#') || note.includes('b'))) {
      return 'Chromatic Passage';
    }
    return 'Complex Harmony';
  }
  
  if (uniqueNotes.length === 2) {
    return 'Interval';
  }

  return null;
}

// ========================================================================================
// 🔥 HOOK PRINCIPAL useDetection
// ========================================================================================

export const useDetection = (events?: DetectionEvents): DetectionState & DetectionControls => {
  
  // ========== ESTADO LOCAL ==========
  const [detectionState, setDetectionState] = useState<DetectionState>({
    isEnabled: true,
    isAnalyzing: false,
    currentChord: null,
    currentScale: null,
    currentPattern: null,
    activeNotes: [],
    confidence: 0,
    lastAnalysisTime: 0,
    analysisCount: 0,
    error: null
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalysisRef = useRef<AnalysisResults | null>(null);
  const analysisWorkerRef = useRef<Worker | null>(null);

  // ========== STORES ==========
  const detectionStore = useDetectionStore();

  // ========================================================================================
  // WORKER PARA ANÁLISIS EN BACKGROUND
  // ========================================================================================

  const createAnalysisWorker = useCallback((): Worker => {
    const workerCode = `
      // Worker code para análisis musical intensivo
      self.onmessage = function(e) {
        const { notes, timestamp } = e.data;
        
        // Simular análisis complejo
        setTimeout(() => {
          self.postMessage({
            processed: true,
            timestamp,
            noteCount: notes.length
          });
        }, 10);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  }, []);

  // ========================================================================================
  // ANÁLISIS MUSICAL PRINCIPAL
  // ========================================================================================

  const performAnalysis = useCallback((notes: NoteName[]): AnalysisResults => {
    const timestamp = Date.now();
    
    if (notes.length === 0) {
      return {
        chord: null,
        scale: null,
        pattern: null,
        confidence: 0,
        notes: []
      };
    }

    const semitones = notesToSemitones(notes);
    const uniqueSemitones = [...new Set(semitones)];
    const normalizedIntervals = normalizeToRoot(uniqueSemitones);

    // Detectar acorde
    let chordResult = null;
    let chordName = null;
    if (notes.length >= MIN_NOTES_FOR_CHORD) {
      chordResult = findBestChordMatch(normalizedIntervals);
      if (chordResult && uniqueSemitones.length > 0) {
        const rootNote = NOTE_NAMES[uniqueSemitones[0]];
        chordName = `${rootNote} ${chordResult.chord}`;
      }
    }

    // Detectar escala
    let scaleResult = null;
    let scaleName = null;
    if (notes.length >= MIN_NOTES_FOR_SCALE) {
      scaleResult = findBestScaleMatch(normalizedIntervals);
      if (scaleResult && uniqueSemitones.length > 0) {
        const rootNote = NOTE_NAMES[uniqueSemitones[0]];
        scaleName = `${rootNote} ${scaleResult.scale}`;
      }
    }

    // Detectar patrón
    const pattern = detectPattern(notes);

    const confidence = Math.max(
      chordResult?.confidence || 0,
      scaleResult?.confidence || 0
    );

    return {
      chord: chordName,
      scale: scaleName,
      pattern,
      confidence,
      notes: [...notes]
    };
  }, []);

  // ========================================================================================
  // ANÁLISIS CON DEBOUNCING
  // ========================================================================================

  const debouncedAnalysis = useCallback((notes: NoteName[]): void => {
    if (!detectionState.isEnabled || !detectionState.isAnalyzing) return;

    // Limpiar timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Programar nuevo análisis
    debounceTimerRef.current = setTimeout(() => {
      try {
        const results = performAnalysis(notes);
        lastAnalysisRef.current = results;

        // Actualizar estado
        if (isMountedRef.current) {
          setDetectionState(prev => ({
            ...prev,
            currentChord: results.chord,
            currentScale: results.scale,
            currentPattern: results.pattern,
            confidence: results.confidence,
            lastAnalysisTime: Date.now(),
            analysisCount: prev.analysisCount + 1,
            error: null
          }));
        }

        // Actualizar store
        if (results.chord) {
          detectionStore.setCurrentChord(results.chord);
        }
        if (results.scale) {
          detectionStore.setCurrentScale(results.scale);
        }

        // Disparar eventos
        if (results.chord && results.confidence > CONFIDENCE_THRESHOLD) {
          events?.onChordDetected?.(results.chord, results.confidence);
        }
        if (results.scale && results.confidence > CONFIDENCE_THRESHOLD) {
          events?.onScaleDetected?.(results.scale, results.confidence);
        }
        if (results.pattern) {
          events?.onPatternDetected?.(results.pattern, results.confidence);
        }
        
        events?.onAnalysisComplete?.(results);

      } catch (error) {
        console.error('❌ Analysis failed:', error);
        
        if (isMountedRef.current) {
          setDetectionState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Analysis failed'
          }));
        }
      }
    }, DEBOUNCE_TIME);
  }, [detectionState.isEnabled, detectionState.isAnalyzing, performAnalysis, detectionStore, events]);

  // ========================================================================================
  // CONTROL FUNCTIONS
  // ========================================================================================

  const enable = useCallback((): void => {
    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, isEnabled: true, error: null }));
    }
    console.log('🎯 Detection enabled');
  }, []);

  const disable = useCallback((): void => {
    // Limpiar análisis en curso
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (isMountedRef.current) {
      setDetectionState(prev => ({
        ...prev,
        isEnabled: false,
        isAnalyzing: false
      }));
    }
    
    console.log('🎯 Detection disabled');
  }, []);

  const startAnalysis = useCallback((): void => {
    if (!detectionState.isEnabled) return;

    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, isAnalyzing: true }));
    }
    
    console.log('🎯 Analysis started');
  }, [detectionState.isEnabled]);

  const stopAnalysis = useCallback((): void => {
    // Limpiar timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, isAnalyzing: false }));
    }
    
    console.log('🎯 Analysis stopped');
  }, []);

  const analyzeNotes = useCallback((notes: NoteName[]): void => {
    if (!detectionState.isEnabled) return;
    
    // Actualizar notas activas
    if (isMountedRef.current) {
      setDetectionState(prev => ({ ...prev, activeNotes: [...notes] }));
    }
    
    // Realizar análisis con debouncing
    debouncedAnalysis(notes);
  }, [detectionState.isEnabled, debouncedAnalysis]);

  const setActiveNotes = useCallback((notes: NoteName[]): void => {
    analyzeNotes(notes);
  }, [analyzeNotes]);

  const clearDetection = useCallback((): void => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (isMountedRef.current) {
      setDetectionState(prev => ({
        ...prev,
        currentChord: null,
        currentScale: null,
        currentPattern: null,
        activeNotes: [],
        confidence: 0
      }));
    }

    // Limpiar store
    detectionStore.setCurrentChord(null);
    detectionStore.setCurrentScale(null);
    
    console.log('🎯 Detection cleared');
  }, [detectionStore]);

  // ========================================================================================
  // CLEANUP
  // ========================================================================================

  const cleanup = useCallback((): void => {
    isMountedRef.current = false;
    
    // Limpiar timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Limpiar worker
    if (analysisWorkerRef.current) {
      analysisWorkerRef.current.terminate();
      analysisWorkerRef.current = null;
    }
    
    console.log('🎯 Detection cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS
  // ========================================================================================

  useEffect(() => {
    isMountedRef.current = true;
    
    // Crear worker para análisis
    analysisWorkerRef.current = createAnalysisWorker();
    
    // Auto-start analysis si está habilitado
    if (detectionState.isEnabled) {
      startAnalysis();
    }
    
    return () => {
      cleanup();
    };
  }, [createAnalysisWorker, startAnalysis, cleanup]);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    ...detectionState,
    
    // Controles
    enable,
    disable,
    startAnalysis,
    stopAnalysis,
    analyzeNotes,
    setActiveNotes,
    clearDetection,
    cleanup
  };
};