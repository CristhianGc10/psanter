/**
 * Sistema avanzado de detección automática de acordes
 * Identifica acordes, inversiones, extensiones y calcula nivel de confianza
 */

import type { NoteName } from '../types/piano';
import { 
  CHORD_PATTERNS, 
  CHORD_NAMES, 
  CHROMATIC_NOTES,
  type ChromaticNote
} from '../data/musicalData';
import {
  getNoteName,
  sortNotes
} from './noteUtils';

// Tipos para detección de acordes
export interface DetectedChord {
  name: string;
  root: string;
  type: keyof typeof CHORD_PATTERNS;
  notes: NoteName[];
  confidence: number; // 0-1
  inversion: number; // 0 = fundamental, 1 = primera inversión, etc.
  missingNotes: string[];
  extraNotes: string[];
  quality: 'perfect' | 'good' | 'partial' | 'weak';
}

export interface ChordDetectionResult {
  primaryChord: DetectedChord | null;
  alternativeChords: DetectedChord[];
  timestamp: number;
  inputNotes: NoteName[];
}

// Configuración de detección
interface DetectionConfig {
  minNotesForChord: number;
  maxNotesForChord: number;
  confidenceThreshold: number;
  considerInversions: boolean;
  allowIncompleteChords: boolean;
  prioritizeCommonChords: boolean;
}

const defaultConfig: DetectionConfig = {
  minNotesForChord: 2,
  maxNotesForChord: 8,
  confidenceThreshold: 0.6,
  considerInversions: true,
  allowIncompleteChords: true,
  prioritizeCommonChords: true
};

// Cache para optimizar detección
const detectionCache = new Map<string, ChordDetectionResult>();
const maxCacheSize = 1000;

/**
 * Convierte notas a clases de altura (pitch classes) sin octava
 */
const notesToPitchClasses = (notes: NoteName[]): string[] => {
  const pitchClasses = new Set<string>();
  
  notes.forEach(note => {
    const noteName = getNoteName(note);
    pitchClasses.add(noteName);
  });
  
  return Array.from(pitchClasses).sort();
};

/**
 * Normaliza un patrón de intervalos para comparación
 */
const normalizePattern = (pattern: number[]): number[] => {
  if (pattern.length === 0) return [];
  
  // Convertir a intervalos relativos al primer elemento
  const normalized = pattern.map(interval => interval - pattern[0]);
  
  // Reducir a una octava (módulo 12)
  return normalized.map(interval => interval % 12).sort((a, b) => a - b);
};

/**
 * Valida si una cadena es una nota cromática válida
 */
const isValidChromaticNote = (note: string): note is ChromaticNote => {
  return CHROMATIC_NOTES.includes(note as ChromaticNote);
};

/**
 * Calcula los intervalos entre notas
 */
const calculateIntervals = (pitchClasses: string[], root: ChromaticNote): number[] => {
  const rootIndex = CHROMATIC_NOTES.findIndex(note => note === root);
  if (rootIndex === -1) return [];
  
  return pitchClasses.map(note => {
    // CORRECCIÓN: Validar cada nota antes de procesarla
    if (!isValidChromaticNote(note)) {
      console.warn(`Nota inválida en pitch classes: ${note}`);
      return 0;
    }
    
    const noteIndex = CHROMATIC_NOTES.findIndex(n => n === note);
    if (noteIndex === -1) return 0;
    
    // Calcular intervalo desde la raíz
    let interval = noteIndex - rootIndex;
    if (interval < 0) interval += 12;
    
    return interval;
  }).sort((a, b) => a - b);
};

/**
 * Detecta el tipo de acorde basado en intervalos
 */
const detectChordType = (intervals: number[]): {
  type: keyof typeof CHORD_PATTERNS | null;
  confidence: number;
  inversion: number;
} => {
  if (intervals.length < 2) {
    return { type: null, confidence: 0, inversion: 0 };
  }
  
  const normalizedIntervals = normalizePattern(intervals);
  let bestMatch: { type: keyof typeof CHORD_PATTERNS | null; confidence: number; inversion: number } = {
    type: null,
    confidence: 0,
    inversion: 0
  };
  
  // Probar cada patrón de acorde
  Object.entries(CHORD_PATTERNS).forEach(([chordType, pattern]) => {
    // Convertir readonly array a mutable para manipulación
    const mutablePattern = [...pattern];
    const normalizedChordPattern = normalizePattern(mutablePattern);
    
    // Comparar patrones directamente
    if (arraysEqual(normalizedIntervals, normalizedChordPattern)) {
      bestMatch = { 
        type: chordType as keyof typeof CHORD_PATTERNS, 
        confidence: 1.0, 
        inversion: 0 
      };
      return;
    }
    
    // Probar inversiones si está habilitado
    if (intervals.length === pattern.length) {
      for (let inv = 0; inv < pattern.length; inv++) {
        const invertedPattern = rotateArray(mutablePattern, inv);
        const normalizedInverted = normalizePattern(invertedPattern);
        
        if (arraysEqual(normalizedIntervals, normalizedInverted)) {
          const confidence = inv === 0 ? 1.0 : 0.9; // Penalizar ligeramente las inversiones
          
          if (confidence > bestMatch.confidence) {
            bestMatch = { 
              type: chordType as keyof typeof CHORD_PATTERNS, 
              confidence, 
              inversion: inv 
            };
          }
        }
      }
    }
    
    // Detectar acordes incompletos
    if (intervals.length < pattern.length) {
      const matchScore = calculatePartialMatch(normalizedIntervals, normalizedChordPattern);
      
      if (matchScore > bestMatch.confidence) {
        bestMatch = {
          type: chordType as keyof typeof CHORD_PATTERNS,
          confidence: matchScore,
          inversion: 0
        };
      }
    }
  });
  
  return bestMatch;
};

/**
 * Compara dos arrays
 */
const arraysEqual = (a: number[], b: number[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
};

/**
 * Rota un array
 */
const rotateArray = (arr: number[], positions: number): number[] => {
  if (positions === 0 || arr.length === 0) return arr;
  const actualPositions = positions % arr.length;
  return [...arr.slice(actualPositions), ...arr.slice(0, actualPositions)];
};

/**
 * Calcula coincidencia parcial entre patrones
 */
const calculatePartialMatch = (partial: number[], full: number[]): number => {
  if (partial.length === 0 || full.length === 0) return 0;
  
  let matches = 0;
  partial.forEach(interval => {
    if (full.includes(interval)) matches++;
  });
  
  const matchRatio = matches / partial.length;
  const completenessRatio = partial.length / full.length;
  
  // Ponderar tanto la coincidencia como la completitud
  return matchRatio * 0.7 + completenessRatio * 0.3;
};

/**
 * Analiza la completitud del acorde
 */
const analyzeChordCompleteness = (
  inputNotes: string[], 
  expectedPattern: readonly number[], 
  root: ChromaticNote
): { missing: string[]; extra: string[] } => {
  const rootIndex = CHROMATIC_NOTES.findIndex(note => note === root);
  if (rootIndex === -1) return { missing: [], extra: [] };
  
  // Notas esperadas del patrón - convertir a mutable array con validación
  const expectedNotes = [...expectedPattern].map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    // Validar que el índice está en rango
    if (noteIndex >= 0 && noteIndex < CHROMATIC_NOTES.length) {
      return CHROMATIC_NOTES[noteIndex] as string;
    }
    return '';
  }).filter(note => note !== ''); // Filtrar notas vacías
  
  const inputSet = new Set(inputNotes);
  const expectedSet = new Set(expectedNotes);
  
  const missing = expectedNotes.filter(note => !inputSet.has(note));
  const extra = inputNotes.filter(note => !expectedSet.has(note));
  
  return { missing, extra };
};

/**
 * Calcula la calidad de un acorde detectado
 */
const calculateChordQuality = (chord: DetectedChord): 'perfect' | 'good' | 'partial' | 'weak' => {
  if (chord.confidence >= 0.9 && chord.missingNotes.length === 0) {
    return 'perfect';
  } else if (chord.confidence >= 0.7 && chord.missingNotes.length <= 1) {
    return 'good';
  } else if (chord.confidence >= 0.5) {
    return 'partial';
  } else {
    return 'weak';
  }
};

/**
 * Función principal de detección de acordes
 */
export const detectChords = (notes: NoteName[], config: Partial<DetectionConfig> = {}): ChordDetectionResult => {
  const mergedConfig = { ...defaultConfig, ...config };
  const timestamp = Date.now();
  
  // Validaciones iniciales
  if (!notes || notes.length < mergedConfig.minNotesForChord) {
    return {
      primaryChord: null,
      alternativeChords: [],
      timestamp,
      inputNotes: notes || []
    };
  }
  
  if (notes.length > mergedConfig.maxNotesForChord) {
    // Tomar solo las notas más graves para evitar ruido
    const sortedNotes = sortNotes(notes);
    notes = sortedNotes.slice(0, mergedConfig.maxNotesForChord);
  }
  
  // Verificar cache
  const cacheKey = notes.sort().join(',');
  if (detectionCache.has(cacheKey)) {
    const cached = detectionCache.get(cacheKey)!;
    return { ...cached, timestamp };
  }
  
  try {
    // Convertir a clases de altura
    const pitchClasses = notesToPitchClasses(notes);
    
    if (pitchClasses.length < mergedConfig.minNotesForChord) {
      return {
        primaryChord: null,
        alternativeChords: [],
        timestamp,
        inputNotes: notes
      };
    }
    
    const detectedChords: DetectedChord[] = [];
    
    // Probar cada nota como posible raíz
    for (const potentialRoot of pitchClasses) {
      // CORRECCIÓN: Validar que potentialRoot es una nota cromática válida
      if (!isValidChromaticNote(potentialRoot)) {
        console.warn(`Nota potencial raíz inválida: ${potentialRoot}`);
        continue;
      }
      
      // Type assertion: después de la validación, sabemos que es ChromaticNote
      const intervals = calculateIntervals(pitchClasses, potentialRoot as ChromaticNote);
      const detection = detectChordType(intervals);
      
      if (detection.type && detection.confidence >= mergedConfig.confidenceThreshold) {
        const chordPattern = CHORD_PATTERNS[detection.type];
        const analysis = analyzeChordCompleteness(pitchClasses, chordPattern, potentialRoot as ChromaticNote);
        
        const chord: DetectedChord = {
          name: `${potentialRoot}${CHORD_NAMES[detection.type]}`,
          root: potentialRoot,
          type: detection.type,
          notes: notes,
          confidence: detection.confidence,
          inversion: detection.inversion,
          missingNotes: analysis.missing,
          extraNotes: analysis.extra,
          quality: 'weak' // Se calculará después
        };
        
        chord.quality = calculateChordQuality(chord);
        detectedChords.push(chord);
      }
    }
    
    // Ordenar por confianza
    detectedChords.sort((a, b) => b.confidence - a.confidence);
    
    // Aplicar prioridad a acordes comunes si está habilitado
    if (mergedConfig.prioritizeCommonChords) {
      const commonChordTypes = ['MAJOR', 'MINOR', 'DOMINANT_7', 'MAJOR_7', 'MINOR_7'];
      detectedChords.sort((a, b) => {
        const aIsCommon = commonChordTypes.includes(a.type);
        const bIsCommon = commonChordTypes.includes(b.type);
        
        if (aIsCommon && !bIsCommon) return -1;
        if (!aIsCommon && bIsCommon) return 1;
        
        return b.confidence - a.confidence;
      });
    }
    
    const result: ChordDetectionResult = {
      primaryChord: detectedChords[0] || null,
      alternativeChords: detectedChords.slice(1, 5), // Máximo 5 alternativas
      timestamp,
      inputNotes: notes
    };
    
    // Guardar en cache
    if (detectionCache.size >= maxCacheSize) {
      // Limpiar cache más antiguo
      const oldestKey = detectionCache.keys().next().value;
      if (oldestKey) {
        detectionCache.delete(oldestKey);
      }
    }
    detectionCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('Error en detección de acordes:', error);
    return {
      primaryChord: null,
      alternativeChords: [],
      timestamp,
      inputNotes: notes
    };
  }
};

/**
 * Detecta progresión de acordes desde un historial
 */
export const detectProgression = (chordHistory: DetectedChord[]): {
  progression: string[];
  key: string | null;
  analysis: string;
} => {
  if (chordHistory.length < 2) {
    return {
      progression: [],
      key: null,
      analysis: 'Necesario al menos 2 acordes para detectar progresión'
    };
  }
  
  const progression = chordHistory
    .filter(chord => chord.quality !== 'weak')
    .map(chord => chord.name);
  
  // Análisis básico de tonalidad (simplificado)
  const roots = chordHistory.map(chord => chord.root);
  const rootCounts = roots.reduce((acc, root) => {
    acc[root] = (acc[root] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonRoot = Object.entries(rootCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;
  
  const keyName = mostCommonRoot || 'indefinida';
  
  return {
    progression,
    key: mostCommonRoot,
    analysis: `Progresión de ${progression.length} acordes. Posible tonalidad: ${keyName}`
  };
};

/**
 * Sugiere siguiente acorde en una progresión
 */
export const suggestNextChord = (currentChord: DetectedChord): string[] => {
  if (!currentChord) return [];
  
  // Progresiones comunes desde cada tipo de acorde
  const commonProgressions: Record<string, string[]> = {
    'MAJOR': ['vi', 'IV', 'V', 'ii'],
    'MINOR': ['VII', 'III', 'VI', 'iv'],
    'DOMINANT_7': ['I', 'vi'],
    'SUBDOMINANT': ['V', 'I']
  };
  
  const suggestions = commonProgressions[currentChord.type] || [];
  
  // Convertir números romanos a acordes reales (simplificado)
  return suggestions.map(roman => `${currentChord.root} → ${roman}`);
};

/**
 * Obtiene estadísticas de detección
 */
export const getDetectionStats = () => {
  return {
    cacheSize: detectionCache.size,
    maxCacheSize,
    supportedChordTypes: Object.keys(CHORD_PATTERNS).length,
    defaultConfig: { ...defaultConfig }
  };
};

/**
 * Limpia el cache de detección
 */
export const clearDetectionCache = (): void => {
  detectionCache.clear();
  console.log('🎵 Cache de detección de acordes limpiado');
};

// Logging inicial
console.log('🎵 ChordDetection cargado:');
console.log('- Tipos de acorde soportados:', Object.keys(CHORD_PATTERNS).length);
console.log('- Configuración por defecto:', defaultConfig);

export default {
  detectChords,
  detectProgression,
  suggestNextChord,
  getDetectionStats,
  clearDetectionCache
};