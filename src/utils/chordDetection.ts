/**
 * Sistema avanzado de detección automática de acordes
 * Identifica acordes, inversiones, extensiones y calcula nivel de confianza
 */

import type { NoteName } from '../types/piano';
import { 
  CHORD_PATTERNS, 
  CHORD_NAMES, 
  CHROMATIC_NOTES 
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
 * Calcula los intervalos entre notas
 */
const calculateIntervals = (pitchClasses: string[], root: string): number[] => {
  // Validar que root sea una nota cromática válida
  const rootIndex = CHROMATIC_NOTES.findIndex(note => note === root);
  if (rootIndex === -1) return [];
  
  return pitchClasses.map(note => {
    // Type assertion para asegurar que note es una nota cromática válida
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
    // Convertir readonly array a mutable array
    const mutablePattern = [...pattern];
    const normalizedPattern = normalizePattern(mutablePattern);
    
    // Comparar con acorde fundamental
    const fundamentalConfidence = comparePatterns(normalizedIntervals, normalizedPattern);
    
    if (fundamentalConfidence > bestMatch.confidence) {
      bestMatch = {
        type: chordType as keyof typeof CHORD_PATTERNS,
        confidence: fundamentalConfidence,
        inversion: 0
      };
    }
    
    // Si consideramos inversiones, probar rotaciones del patrón
    if (defaultConfig.considerInversions && mutablePattern.length > 2) {
      for (let inversion = 1; inversion < mutablePattern.length; inversion++) {
        const invertedPattern = createInvertedPattern(mutablePattern, inversion);
        const normalizedInverted = normalizePattern(invertedPattern);
        const inversionConfidence = comparePatterns(normalizedIntervals, normalizedInverted);
        
        if (inversionConfidence > bestMatch.confidence) {
          bestMatch = {
            type: chordType as keyof typeof CHORD_PATTERNS,
            confidence: inversionConfidence,
            inversion
          };
        }
      }
    }
  });
  
  return bestMatch;
};

/**
 * Crea un patrón invertido de acorde
 */
const createInvertedPattern = (pattern: number[], inversion: number): number[] => {
  if (inversion === 0 || inversion >= pattern.length) return pattern;
  
  const inverted = [...pattern];
  
  // Mover las notas del bajo hacia arriba
  for (let i = 0; i < inversion; i++) {
    const note = inverted.shift()!;
    inverted.push(note + 12); // Una octava arriba
  }
  
  return inverted;
};

/**
 * Compara dos patrones de intervalos y retorna similitud (0-1)
 */
const comparePatterns = (pattern1: number[], pattern2: number[]): number => {
  if (pattern1.length === 0 || pattern2.length === 0) return 0;
  
  // Convertir ambos patrones a sets para comparación
  const set1 = new Set(pattern1);
  const set2 = new Set(pattern2);
  
  // Calcular intersección y unión
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Similitud de Jaccard
  const jaccardSimilarity = intersection.size / union.size;
  
  // Bonificación si los intervalos esenciales están presentes
  let bonus = 0;
  if (set1.has(0)) bonus += 0.1; // raíz
  if (set1.has(4) || set1.has(3)) bonus += 0.1; // tercera
  if (set1.has(7)) bonus += 0.1; // quinta
  
  return Math.min(1, jaccardSimilarity + bonus);
};

/**
 * Encuentra notas faltantes y extras en un acorde
 */
const analyzeChordCompleteness = (
  inputNotes: string[],
  expectedPattern: readonly number[], // Aceptar readonly array
  root: string
): { missing: string[]; extra: string[] } => {
  const rootIndex = CHROMATIC_NOTES.findIndex(note => note === root);
  if (rootIndex === -1) return { missing: [], extra: [] };
  
  // Notas esperadas del patrón - convertir a mutable array con validación
  const expectedNotes = [...expectedPattern].map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    // Validar que el índice está en rango
    if (noteIndex >= 0 && noteIndex < CHROMATIC_NOTES.length) {
      return CHROMATIC_NOTES[noteIndex];
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
      inputNotes: notes
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
      const intervals = calculateIntervals(pitchClasses, potentialRoot);
      const detection = detectChordType(intervals);
      
      if (detection.type && detection.confidence >= mergedConfig.confidenceThreshold) {
        const chordPattern = CHORD_PATTERNS[detection.type];
        const analysis = analyzeChordCompleteness(pitchClasses, chordPattern, potentialRoot);
        
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
      detectionCache.delete(oldestKey);
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