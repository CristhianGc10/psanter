/**
 * DETECTION STORE - Detección Inteligente de Acordes y Escalas
 * Sistema avanzado de reconocimiento musical en tiempo real
 * Fase 4: Stores y Gestión de Estado
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { NoteName } from '../types/piano';
import { REAL_CHORDS, REAL_SCALES } from '../data/musicalData';
import { sortNotes, getNoteName } from '../utils/noteUtils';

// ========================================================================================
// INTERFACES DEL STORE
// ========================================================================================

interface DetectedChord {
  name: string; // Ej: "C Major", "Am7", "G7"
  tonic: string; // Ej: "C", "A", "G"
  type: string; // Ej: "Major", "Minor 7th", "Dominant 7th"
  notes: NoteName[]; // Notas detectadas que forman el acorde
  confidence: number; // 0-1, qué tan seguro está el algoritmo
  completeness: number; // 0-1, qué porcentaje del acorde está presente
  timestamp: number; // Cuándo fue detectado
  duration: number; // Cuánto tiempo ha estado activo (ms)
  quality: 'perfect' | 'good' | 'partial' | 'weak'; // Calidad de la detección
}

interface DetectedScale {
  name: string; // Ej: "C Major", "A Natural Minor", "G Dorian"
  tonic: string; // Ej: "C", "A", "G"
  type: string; // Ej: "Major", "Natural Minor", "Dorian"
  notes: NoteName[]; // Notas detectadas que pertenecen a la escala
  confidence: number; // 0-1, qué tan seguro está el algoritmo
  completeness: number; // 0-1, qué porcentaje de la escala está presente
  timestamp: number; // Cuándo fue detectada
  quality: 'complete' | 'substantial' | 'partial' | 'fragments'; // Calidad de la detección
  mode?: string; // Si es un modo específico
}

interface ProgressionChord {
  chord: DetectedChord;
  startTime: number;
  endTime: number;
  position: number; // Posición en la progresión (0, 1, 2...)
}

interface ChordProgression {
  id: string;
  chords: ProgressionChord[];
  key: string; // Tonalidad de la progresión
  startTime: number;
  endTime: number;
  duration: number;
  commonName?: string; // Ej: "I-V-vi-IV", "12-bar blues"
  quality: 'strong' | 'moderate' | 'weak';
}

interface DetectionConfig {
  // Configuración de sensibilidad
  chordSensitivity: number; // 0-1
  scaleSensitivity: number; // 0-1
  
  // Configuración de tiempo
  detectionWindow: number; // ms para considerar notas simultáneas
  sustainWindow: number; // ms para mantener detección con sustain
  progressionTimeout: number; // ms para finalizar progresión
  
  // Configuración de filtros
  minChordNotes: number; // Mínimo de notas para detectar acorde
  minScaleNotes: number; // Mínimo de notas para detectar escala
  requireRoot: boolean; // Si requiere nota fundamental
  allowInversions: boolean; // Si permite inversiones
  
  // Configuración de calidad
  minConfidence: number; // Confianza mínima para reportar
  minCompleteness: number; // Completitud mínima para reportar
  
  // Configuración avanzada
  enableRealTime: boolean; // Detección en tiempo real vs por lotes
  enableProgression: boolean; // Detección de progresiones
  enableSuggestions: boolean; // Sugerencias de completar acordes/escalas
  prioritizeCommonChords: boolean; // Priorizar acordes comunes
  
  // Filtros de contexto
  preferredGenre: 'classical' | 'jazz' | 'pop' | 'rock' | 'blues' | 'any';
  complexityLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

interface DetectionState {
  // === ESTADO PRINCIPAL ===
  isEnabled: boolean;
  isRunning: boolean;
  lastAnalysisTime: number;
  
  // === CONFIGURACIÓN ===
  config: DetectionConfig;
  
  // === DETECCIONES ACTUALES ===
  currentChords: DetectedChord[];
  currentScales: DetectedScale[];
  currentProgression: ChordProgression | null;
  
  // === HISTORIAL ===
  chordHistory: DetectedChord[];
  scaleHistory: DetectedScale[];
  progressionHistory: ChordProgression[];
  
  // === SUGERENCIAS ===
  chordSuggestions: {
    chord: string;
    missingNotes: NoteName[];
    confidence: number;
    reason: string;
  }[];
  scaleSuggestions: {
    scale: string;
    missingNotes: NoteName[];
    confidence: number;
    reason: string;
  }[];
  
  // === ESTADÍSTICAS ===
  stats: {
    totalChordsDetected: number;
    totalScalesDetected: number;
    totalProgressions: number;
    mostDetectedChord: string;
    mostDetectedScale: string;
    averageConfidence: number;
    detectionAccuracy: number; // Basado en feedback del usuario
  };
  
  // === ESTADO DE ANÁLISIS ===
  analysisBuffer: {
    notes: NoteName[];
    timestamps: number[];
    bufferSize: number;
    isBuffering: boolean;
  };
  
  // === FEEDBACK DEL USUARIO ===
  userFeedback: {
    correctDetections: number;
    incorrectDetections: number;
    missedDetections: number;
  };
}

interface DetectionActions {
  // === CONTROL PRINCIPAL ===
  enable: () => void;
  disable: () => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  
  // === CONFIGURACIÓN ===
  updateConfig: (config: Partial<DetectionConfig>) => void;
  setChordSensitivity: (sensitivity: number) => void;
  setScaleSensitivity: (sensitivity: number) => void;
  setDetectionWindow: (window: number) => void;
  setMinChordNotes: (notes: number) => void;
  setMinScaleNotes: (notes: number) => void;
  setGenrePreference: (genre: DetectionConfig['preferredGenre']) => void;
  setComplexityLevel: (level: DetectionConfig['complexityLevel']) => void;
  
  // === ANÁLISIS PRINCIPAL ===
  analyzeNotes: (notes: NoteName[]) => void;
  analyzeChords: (notes: NoteName[]) => DetectedChord[];
  analyzeScales: (notes: NoteName[]) => DetectedScale[];
  analyzeProgression: () => void;
  
  // === GESTIÓN DE BUFFER ===
  addNoteToBuffer: (note: NoteName) => void;
  removeNoteFromBuffer: (note: NoteName) => void;
  clearBuffer: () => void;
  processBuffer: () => void;
  
  // === GESTIÓN DE HISTORIAL ===
  clearChordHistory: () => void;
  clearScaleHistory: () => void;
  clearProgressionHistory: () => void;
  clearAllHistory: () => void;
  getRecentChords: (count?: number) => DetectedChord[];
  getRecentScales: (count?: number) => DetectedScale[];
  
  // === SUGERENCIAS ===
  generateChordSuggestions: (currentNotes: NoteName[]) => void;
  generateScaleSuggestions: (currentNotes: NoteName[]) => void;
  clearSuggestions: () => void;
  
  // === FEEDBACK ===
  markDetectionCorrect: (detectionId: string) => void;
  markDetectionIncorrect: (detectionId: string) => void;
  reportMissedDetection: (expectedChord: string) => void;
  
  // === UTILIDADES ===
  getCurrentDetections: () => { chords: DetectedChord[]; scales: DetectedScale[]; };
  getDetectionSummary: () => any;
  exportDetectionData: () => string;
  resetStats: () => void;
  
  // === ALGORITMOS AVANZADOS ===
  findBestChordMatch: (notes: NoteName[]) => DetectedChord | null;
  findBestScaleMatch: (notes: NoteName[]) => DetectedScale | null;
  calculateChordConfidence: (chord: string, notes: NoteName[]) => number;
  calculateScaleConfidence: (scale: string, notes: NoteName[]) => number;
}

type DetectionStore = DetectionState & DetectionActions;

// ========================================================================================
// CONFIGURACIÓN INICIAL
// ========================================================================================

const initialConfig: DetectionConfig = {
  chordSensitivity: 0.7,
  scaleSensitivity: 0.6,
  detectionWindow: 300,
  sustainWindow: 1000,
  progressionTimeout: 3000,
  minChordNotes: 3,
  minScaleNotes: 4,
  requireRoot: false,
  allowInversions: true,
  minConfidence: 0.6,
  minCompleteness: 0.6,
  enableRealTime: true,
  enableProgression: true,
  enableSuggestions: true,
  prioritizeCommonChords: true,
  preferredGenre: 'any',
  complexityLevel: 'intermediate'
};

const initialState: DetectionState = {
  isEnabled: true,
  isRunning: false,
  lastAnalysisTime: 0,
  
  config: initialConfig,
  
  currentChords: [],
  currentScales: [],
  currentProgression: null,
  
  chordHistory: [],
  scaleHistory: [],
  progressionHistory: [],
  
  chordSuggestions: [],
  scaleSuggestions: [],
  
  stats: {
    totalChordsDetected: 0,
    totalScalesDetected: 0,
    totalProgressions: 0,
    mostDetectedChord: '',
    mostDetectedScale: '',
    averageConfidence: 0,
    detectionAccuracy: 0
  },
  
  analysisBuffer: {
    notes: [],
    timestamps: [],
    bufferSize: 10,
    isBuffering: false
  },
  
  userFeedback: {
    correctDetections: 0,
    incorrectDetections: 0,
    missedDetections: 0
  }
};

// ========================================================================================
// ALGORITMOS DE DETECCIÓN
// ========================================================================================

// Convertir notas a nombres base (sin octava)
const getBaseNotes = (notes: NoteName[]): string[] => {
  return Array.from(new Set(notes.map(note => getNoteName(note))));
};

// Calcular similitud entre dos conjuntos de notas
const calculateNoteSimilarity = (set1: string[], set2: string[]): number => {
  const intersection = set1.filter(note => set2.includes(note));
  const union = Array.from(new Set([...set1, ...set2]));
  return union.length > 0 ? intersection.length / union.length : 0;
};

// Algoritmo principal de detección de acordes
const detectChords = (notes: NoteName[], config: DetectionConfig): DetectedChord[] => {
  if (notes.length < config.minChordNotes) return [];
  
  const baseNotes = getBaseNotes(notes);
  const detectedChords: DetectedChord[] = [];
  const now = Date.now();
  
  // Iterar por todas las tónicas posibles
  Object.entries(REAL_CHORDS).forEach(([tonic, chordTypes]) => {
    Object.entries(chordTypes).forEach(([type, chordNotes]) => {
      const similarity = calculateNoteSimilarity(baseNotes, chordNotes);
      const completeness = chordNotes.filter(note => baseNotes.includes(note)).length / chordNotes.length;
      
      if (completeness >= config.minCompleteness && similarity >= config.minConfidence) {
        // Ajustar confianza según configuración
        let confidence = similarity;
        
        // Boost para acordes comunes si está habilitado
        if (config.prioritizeCommonChords) {
          const commonChords = ['Major', 'Minor', 'Dominant 7th', 'Minor 7th', 'Major 7th'];
          if (commonChords.includes(type)) {
            confidence *= 1.2;
          }
        }
        
        // Ajustar según nivel de complejidad
        if (config.complexityLevel === 'basic') {
          const basicChords = ['Major', 'Minor', '5'];
          if (!basicChords.includes(type)) {
            confidence *= 0.8;
          }
        }
        
        confidence = Math.min(1, confidence);
        
        if (confidence >= config.minConfidence) {
          const quality: DetectedChord['quality'] = 
            completeness >= 0.9 ? 'perfect' :
            completeness >= 0.75 ? 'good' :
            completeness >= 0.6 ? 'partial' : 'weak';
          
          detectedChords.push({
            name: `${tonic} ${type}`,
            tonic,
            type,
            notes,
            confidence,
            completeness,
            timestamp: now,
            duration: 0,
            quality
          });
        }
      }
    });
  });
  
  // Ordenar por confianza y retornar los mejores
  return detectedChords
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Máximo 5 acordes detectados
};

// Algoritmo principal de detección de escalas
const detectScales = (notes: NoteName[], config: DetectionConfig): DetectedScale[] => {
  if (notes.length < config.minScaleNotes) return [];
  
  const baseNotes = getBaseNotes(notes);
  const detectedScales: DetectedScale[] = [];
  const now = Date.now();
  
  // Iterar por todas las tónicas posibles
  Object.entries(REAL_SCALES).forEach(([tonic, scaleTypes]) => {
    Object.entries(scaleTypes).forEach(([type, scaleNotes]) => {
      const notesInScale = scaleNotes.filter(note => baseNotes.includes(note));
      const completeness = notesInScale.length / scaleNotes.length;
      
      if (notesInScale.length >= config.minScaleNotes && completeness >= config.minCompleteness) {
        // Calcular confianza basada en coincidencias y ausencias
        const extraNotes = baseNotes.filter(note => !scaleNotes.includes(note));
        let confidence = completeness - (extraNotes.length * 0.1); // Penalizar notas extra
        
        // Bonus por escalas populares
        const popularScales = ['Major', 'Natural Minor', 'Dorian', 'Mixolydian', 'Major Pentatonic', 'Minor Pentatonic'];
        if (popularScales.includes(type)) {
          confidence *= 1.1;
        }
        
        confidence = Math.max(0, Math.min(1, confidence));
        
        if (confidence >= config.minConfidence) {
          const quality: DetectedScale['quality'] = 
            completeness >= 0.85 ? 'complete' :
            completeness >= 0.7 ? 'substantial' :
            completeness >= 0.5 ? 'partial' : 'fragments';
          
          detectedScales.push({
            name: `${tonic} ${type}`,
            tonic,
            type,
            notes,
            confidence,
            completeness,
            timestamp: now,
            quality
          });
        }
      }
    });
  });
  
  // Ordenar por confianza y retornar las mejores
  return detectedScales
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3); // Máximo 3 escalas detectadas
};

// ========================================================================================
// STORE PRINCIPAL
// ========================================================================================

export const useDetectionStore = create<DetectionStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // === IMPLEMENTACIÓN DE ACCIONES ===

    enable: () => {
      set((state) => ({
        ...state,
        isEnabled: true
      }));
    },

    disable: () => {
      set((state) => ({
        ...state,
        isEnabled: false,
        isRunning: false,
        currentChords: [],
        currentScales: []
      }));
    },

    start: () => {
      const state = get();
      if (state.isEnabled) {
        set((prevState) => ({
          ...prevState,
          isRunning: true
        }));
        console.log('🎵 Detection started');
      }
    },

    stop: () => {
      set((state) => ({
        ...state,
        isRunning: false,
        currentChords: [],
        currentScales: [],
        currentProgression: null
      }));
      console.log('🎵 Detection stopped');
    },

    toggle: () => {
      const state = get();
      if (state.isRunning) {
        get().stop();
      } else {
        get().start();
      }
    },

    updateConfig: (newConfig) => {
      set((state) => ({
        ...state,
        config: { ...state.config, ...newConfig }
      }));
    },

    setChordSensitivity: (sensitivity) => {
      const clampedSensitivity = Math.max(0, Math.min(1, sensitivity));
      set((state) => ({
        ...state,
        config: { ...state.config, chordSensitivity: clampedSensitivity }
      }));
    },

    setScaleSensitivity: (sensitivity) => {
      const clampedSensitivity = Math.max(0, Math.min(1, sensitivity));
      set((state) => ({
        ...state,
        config: { ...state.config, scaleSensitivity: clampedSensitivity }
      }));
    },

    setDetectionWindow: (window) => {
      const clampedWindow = Math.max(100, Math.min(2000, window));
      set((state) => ({
        ...state,
        config: { ...state.config, detectionWindow: clampedWindow }
      }));
    },

    setMinChordNotes: (notes) => {
      const clampedNotes = Math.max(2, Math.min(8, notes));
      set((state) => ({
        ...state,
        config: { ...state.config, minChordNotes: clampedNotes }
      }));
    },

    setMinScaleNotes: (notes) => {
      const clampedNotes = Math.max(3, Math.min(12, notes));
      set((state) => ({
        ...state,
        config: { ...state.config, minScaleNotes: clampedNotes }
      }));
    },

    setGenrePreference: (genre) => {
      set((state) => ({
        ...state,
        config: { ...state.config, preferredGenre: genre }
      }));
    },

    setComplexityLevel: (level) => {
      set((state) => ({
        ...state,
        config: { ...state.config, complexityLevel: level }
      }));
    },

    analyzeNotes: (notes) => {
      const state = get();
      
      if (!state.isEnabled || !state.isRunning || notes.length === 0) {
        return;
      }

      const sortedNotes = sortNotes(notes);
      const now = Date.now();
      
      // Detectar acordes
      const detectedChords = detectChords(sortedNotes, state.config);
      
      // Detectar escalas
      const detectedScales = detectScales(sortedNotes, state.config);
      
      set((prevState) => ({
        ...prevState,
        currentChords: detectedChords,
        currentScales: detectedScales,
        lastAnalysisTime: now,
        chordHistory: [
          ...prevState.chordHistory,
          ...detectedChords.map(chord => ({ ...chord, timestamp: now }))
        ].slice(-100), // Mantener últimos 100
        scaleHistory: [
          ...prevState.scaleHistory,
          ...detectedScales.map(scale => ({ ...scale, timestamp: now }))
        ].slice(-50), // Mantener últimas 50
        stats: {
          ...prevState.stats,
          totalChordsDetected: prevState.stats.totalChordsDetected + detectedChords.length,
          totalScalesDetected: prevState.stats.totalScalesDetected + detectedScales.length,
          averageConfidence: detectedChords.length > 0 
            ? detectedChords.reduce((sum, chord) => sum + chord.confidence, 0) / detectedChords.length
            : prevState.stats.averageConfidence
        }
      }));

      // Generar sugerencias si está habilitado
      if (state.config.enableSuggestions) {
        get().generateChordSuggestions(sortedNotes);
        get().generateScaleSuggestions(sortedNotes);
      }

      // Analizar progresión si está habilitado
      if (state.config.enableProgression && detectedChords.length > 0) {
        get().analyzeProgression();
      }
    },

    analyzeChords: (notes) => {
      const state = get();
      return detectChords(notes, state.config);
    },

    analyzeScales: (notes) => {
      const state = get();
      return detectScales(notes, state.config);
    },

    analyzeProgression: () => {
      const state = get();
      const recentChords = state.chordHistory.slice(-4); // Últimos 4 acordes
      
      if (recentChords.length >= 2) {
        const now = Date.now();
        const progression: ChordProgression = {
          id: `prog_${now}`,
          chords: recentChords.map((chord, index) => ({
            chord,
            startTime: chord.timestamp,
            endTime: chord.timestamp + (chord.duration || 1000),
            position: index
          })),
          key: recentChords[0].tonic, // Simplificación
          startTime: recentChords[0].timestamp,
          endTime: now,
          duration: now - recentChords[0].timestamp,
          quality: 'moderate' as const
        };
        
        set((prevState) => ({
          ...prevState,
          currentProgression: progression,
          progressionHistory: [...prevState.progressionHistory, progression].slice(-20),
          stats: {
            ...prevState.stats,
            totalProgressions: prevState.stats.totalProgressions + 1
          }
        }));
      }
    },

    addNoteToBuffer: (note) => {
      const now = Date.now();
      set((state) => ({
        ...state,
        analysisBuffer: {
          ...state.analysisBuffer,
          notes: [...state.analysisBuffer.notes, note].slice(-state.analysisBuffer.bufferSize),
          timestamps: [...state.analysisBuffer.timestamps, now].slice(-state.analysisBuffer.bufferSize),
          isBuffering: true
        }
      }));
      
      // Procesar buffer si está en modo real-time
      if (get().config.enableRealTime) {
        setTimeout(() => get().processBuffer(), 50);
      }
    },

    removeNoteFromBuffer: (note) => {
      set((state) => {
        const noteIndex = state.analysisBuffer.notes.indexOf(note);
        if (noteIndex !== -1) {
          const newNotes = [...state.analysisBuffer.notes];
          const newTimestamps = [...state.analysisBuffer.timestamps];
          newNotes.splice(noteIndex, 1);
          newTimestamps.splice(noteIndex, 1);
          
          return {
            ...state,
            analysisBuffer: {
              ...state.analysisBuffer,
              notes: newNotes,
              timestamps: newTimestamps
            }
          };
        }
        return state;
      });
    },

    clearBuffer: () => {
      set((state) => ({
        ...state,
        analysisBuffer: {
          ...state.analysisBuffer,
          notes: [],
          timestamps: [],
          isBuffering: false
        }
      }));
    },

    processBuffer: () => {
      const state = get();
      if (state.analysisBuffer.notes.length > 0) {
        get().analyzeNotes(state.analysisBuffer.notes);
      }
    },

    clearChordHistory: () => {
      set((state) => ({
        ...state,
        chordHistory: []
      }));
    },

    clearScaleHistory: () => {
      set((state) => ({
        ...state,
        scaleHistory: []
      }));
    },

    clearProgressionHistory: () => {
      set((state) => ({
        ...state,
        progressionHistory: [],
        currentProgression: null
      }));
    },

    clearAllHistory: () => {
      set((state) => ({
        ...state,
        chordHistory: [],
        scaleHistory: [],
        progressionHistory: [],
        currentProgression: null
      }));
    },

    getRecentChords: (count = 10) => {
      return get().chordHistory.slice(-count);
    },

    getRecentScales: (count = 5) => {
      return get().scaleHistory.slice(-count);
    },

    generateChordSuggestions: (currentNotes) => {
      const baseNotes = getBaseNotes(currentNotes);
      const suggestions: typeof initialState.chordSuggestions = [];
      
      // Buscar acordes que podrían completarse con las notas actuales
      Object.entries(REAL_CHORDS).forEach(([tonic, chordTypes]) => {
        Object.entries(chordTypes).forEach(([type, chordNotes]) => {
          const missingNotes = chordNotes.filter(note => !baseNotes.includes(note));
          const presentNotes = chordNotes.filter(note => baseNotes.includes(note));
          
          if (presentNotes.length >= 2 && missingNotes.length <= 2 && missingNotes.length > 0) {
            const confidence = presentNotes.length / chordNotes.length;
            
            suggestions.push({
              chord: `${tonic} ${type}`,
              missingNotes: missingNotes.map(note => `${note}4` as NoteName), // Simplificación
              confidence,
              reason: `Need ${missingNotes.join(', ')} to complete`
            });
          }
        });
      });
      
      set((state) => ({
        ...state,
        chordSuggestions: suggestions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5)
      }));
    },

    generateScaleSuggestions: (currentNotes) => {
      const baseNotes = getBaseNotes(currentNotes);
      const suggestions: typeof initialState.scaleSuggestions = [];
      
      // Buscar escalas que podrían completarse con las notas actuales
      Object.entries(REAL_SCALES).forEach(([tonic, scaleTypes]) => {
        Object.entries(scaleTypes).forEach(([type, scaleNotes]) => {
          const missingNotes = scaleNotes.filter(note => !baseNotes.includes(note));
          const presentNotes = scaleNotes.filter(note => baseNotes.includes(note));
          
          if (presentNotes.length >= 3 && missingNotes.length <= 3 && missingNotes.length > 0) {
            const confidence = presentNotes.length / scaleNotes.length;
            
            suggestions.push({
              scale: `${tonic} ${type}`,
              missingNotes: missingNotes.map(note => `${note}4` as NoteName), // Simplificación
              confidence,
              reason: `Add ${missingNotes.join(', ')} to complete scale`
            });
          }
        });
      });
      
      set((state) => ({
        ...state,
        scaleSuggestions: suggestions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 3)
      }));
    },

    clearSuggestions: () => {
      set((state) => ({
        ...state,
        chordSuggestions: [],
        scaleSuggestions: []
      }));
    },

    markDetectionCorrect: (detectionId) => {
      set((state) => ({
        ...state,
        userFeedback: {
          ...state.userFeedback,
          correctDetections: state.userFeedback.correctDetections + 1
        }
      }));
    },

    markDetectionIncorrect: (detectionId) => {
      set((state) => ({
        ...state,
        userFeedback: {
          ...state.userFeedback,
          incorrectDetections: state.userFeedback.incorrectDetections + 1
        }
      }));
    },

    reportMissedDetection: (expectedChord) => {
      set((state) => ({
        ...state,
        userFeedback: {
          ...state.userFeedback,
          missedDetections: state.userFeedback.missedDetections + 1
        }
      }));
      console.log(`🎵 Missed detection reported: ${expectedChord}`);
    },

    getCurrentDetections: () => {
      const state = get();
      return {
        chords: state.currentChords,
        scales: state.currentScales
      };
    },

    getDetectionSummary: () => {
      const state = get();
      return {
        isRunning: state.isRunning,
        currentChords: state.currentChords.length,
        currentScales: state.currentScales.length,
        chordSuggestions: state.chordSuggestions.length,
        scaleSuggestions: state.scaleSuggestions.length,
        historySize: state.chordHistory.length + state.scaleHistory.length,
        stats: state.stats,
        accuracy: state.userFeedback.correctDetections / 
          Math.max(1, state.userFeedback.correctDetections + state.userFeedback.incorrectDetections)
      };
    },

    exportDetectionData: () => {
      const state = get();
      const exportData = {
        config: state.config,
        chordHistory: state.chordHistory,
        scaleHistory: state.scaleHistory,
        progressionHistory: state.progressionHistory,
        stats: state.stats,
        userFeedback: state.userFeedback,
        exportDate: new Date().toISOString()
      };
      return JSON.stringify(exportData, null, 2);
    },

    resetStats: () => {
      set((state) => ({
        ...state,
        stats: {
          totalChordsDetected: 0,
          totalScalesDetected: 0,
          totalProgressions: 0,
          mostDetectedChord: '',
          mostDetectedScale: '',
          averageConfidence: 0,
          detectionAccuracy: 0
        },
        userFeedback: {
          correctDetections: 0,
          incorrectDetections: 0,
          missedDetections: 0
        }
      }));
    },

    findBestChordMatch: (notes) => {
      const detectedChords = get().analyzeChords(notes);
      return detectedChords.length > 0 ? detectedChords[0] : null;
    },

    findBestScaleMatch: (notes) => {
      const detectedScales = get().analyzeScales(notes);
      return detectedScales.length > 0 ? detectedScales[0] : null;
    },

    calculateChordConfidence: (chord, notes) => {
      const [tonic, ...typeParts] = chord.split(' ');
      const type = typeParts.join(' ');
      const chordNotes = REAL_CHORDS[tonic]?.[type];
      
      if (!chordNotes) return 0;
      
      const baseNotes = getBaseNotes(notes);
      return calculateNoteSimilarity(baseNotes, chordNotes);
    },

    calculateScaleConfidence: (scale, notes) => {
      const [tonic, ...typeParts] = scale.split(' ');
      const type = typeParts.join(' ');
      const scaleNotes = REAL_SCALES[tonic]?.[type];
      
      if (!scaleNotes) return 0;
      
      const baseNotes = getBaseNotes(notes);
      const notesInScale = scaleNotes.filter(note => baseNotes.includes(note));
      return notesInScale.length / scaleNotes.length;
    }
  }))
);

// ========================================================================================
// HOOKS DERIVADOS PARA OPTIMIZACIÓN
// ========================================================================================

// Hook para obtener solo las detecciones actuales
export const useCurrentDetections = () => {
  return useDetectionStore((state) => ({
    chords: state.currentChords,
    scales: state.currentScales,
    progression: state.currentProgression
  }));
};

// Hook para obtener solo las sugerencias
export const useDetectionSuggestions = () => {
  return useDetectionStore((state) => ({
    chords: state.chordSuggestions,
    scales: state.scaleSuggestions
  }));
};

// Hook para obtener solo el estado de ejecución
export const useDetectionStatus = () => {
  return useDetectionStore((state) => ({
    isEnabled: state.isEnabled,
    isRunning: state.isRunning,
    lastAnalysis: state.lastAnalysisTime
  }));
};

// Hook para obtener solo las estadísticas
export const useDetectionStats = () => {
  return useDetectionStore((state) => state.stats);
};

// ========================================================================================
// UTILIDADES Y DEBUGGING
// ========================================================================================

// Función para debugging del estado
export const debugDetectionStore = () => {
  const state = useDetectionStore.getState();
  console.log('🎵 Detection Store Debug:', {
    enabled: state.isEnabled,
    running: state.isRunning,
    currentChords: state.currentChords.map(c => c.name),
    currentScales: state.currentScales.map(s => s.name),
    suggestions: {
      chords: state.chordSuggestions.length,
      scales: state.scaleSuggestions.length
    },
    history: {
      chords: state.chordHistory.length,
      scales: state.scaleHistory.length,
      progressions: state.progressionHistory.length
    },
    stats: state.stats
  });
};

// Función para resetear completamente el store
export const resetDetectionStore = () => {
  useDetectionStore.setState(initialState);
};

// ========================================================================================
// SUBSCRIPCIONES AUTOMÁTICAS
// ========================================================================================

if (process.env.NODE_ENV === 'development') {
  // Logging de detecciones
  useDetectionStore.subscribe(
    (state) => state.currentChords.length + state.currentScales.length,
    (totalDetections) => {
      if (totalDetections > 0) {
        const state = useDetectionStore.getState();
        console.log('🎵 Detections:', {
          chords: state.currentChords.map(c => `${c.name} (${Math.round(c.confidence * 100)}%)`),
          scales: state.currentScales.map(s => `${s.name} (${Math.round(s.confidence * 100)}%)`)
        });
      }
    }
  );

  // Logging de progresiones
  useDetectionStore.subscribe(
    (state) => state.currentProgression?.id,
    (progressionId) => {
      if (progressionId) {
        const progression = useDetectionStore.getState().currentProgression;
        console.log('🎵 Progression detected:', progression?.chords.map(c => c.chord.name).join(' - '));
      }
    }
  );
}

// Log inicial
console.log('🎵 Detection Store initialized successfully');

export default useDetectionStore;