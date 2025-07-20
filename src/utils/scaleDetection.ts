/**
 * Sistema avanzado de detección automática de escalas musicales
 * Identifica escalas, modos, tonalidades y analiza compatibilidad armónica
 */

import type { NoteName } from '../types/piano';
import { 
  SCALE_PATTERNS, 
  SCALE_NAMES, 
  CHROMATIC_NOTES,
  type ChromaticNote // Importar el tipo
} from '../data/musicalData';
import {
  getNoteName
} from './noteUtils';
import type { DetectedChord } from './chordDetection';

// Tipos para detección de escalas
export interface DetectedScale {
  name: string;
  tonic: string;
  type: keyof typeof SCALE_PATTERNS;
  notes: string[];
  confidence: number; // 0-1
  mode: string;
  degrees: readonly number[]; // Cambiado a readonly para aceptar los patrones
  missingNotes: string[];
  extraNotes: string[];
  compatibility: number; // Compatibilidad con las notas de entrada
  quality: 'perfect' | 'good' | 'partial' | 'weak';
}

export interface ScaleDetectionResult {
  primaryScale: DetectedScale | null;
  alternativeScales: DetectedScale[];
  suggestedKey: string | null;
  modalInterchange: DetectedScale[];
  timestamp: number;
  inputNotes: NoteName[];
  analysis: ScaleAnalysis;
}

export interface ScaleAnalysis {
  tonalCenter: string | null;
  modality: 'major' | 'minor' | 'modal' | 'chromatic' | 'unknown';
  stabilityScore: number; // Qué tan estable/definida es la tonalidad
  chromaticism: number; // Nivel de cromatismo (0-1)
  suggestions: string[];
}

// Configuración de detección
interface ScaleDetectionConfig {
  minNotesForScale: number;
  maxNotesForScale: number;
  confidenceThreshold: number;
  considerModes: boolean;
  allowIncompleteScales: boolean;
  weightRecentNotes: boolean;
  chromaticTolerance: number;
}

const defaultScaleConfig: ScaleDetectionConfig = {
  minNotesForScale: 3,
  maxNotesForScale: 12,
  confidenceThreshold: 0.5,
  considerModes: true,
  allowIncompleteScales: true,
  weightRecentNotes: true,
  chromaticTolerance: 0.3
};

// Cache para optimización
const scaleDetectionCache = new Map<string, ScaleDetectionResult>();
const maxScaleCacheSize = 500;

// Pesos para diferentes escalas (más comunes = mayor peso)
const scaleWeights: Record<keyof typeof SCALE_PATTERNS, number> = {
  MAJOR: 1.0,
  NATURAL_MINOR: 1.0,
  HARMONIC_MINOR: 0.8,
  MELODIC_MINOR: 0.7,
  DORIAN: 0.6,
  MIXOLYDIAN: 0.6,
  MAJOR_PENTATONIC: 0.8,
  MINOR_PENTATONIC: 0.8,
  BLUES: 0.7,
  IONIAN: 0.9,
  AEOLIAN: 0.9,
  PHRYGIAN: 0.5,
  LYDIAN: 0.5,
  LOCRIAN: 0.3,
  CHROMATIC: 0.2,
  WHOLE_TONE: 0.3,
  DIMINISHED: 0.4,
  MAJOR_BLUES: 0.6,
  LYDIAN_DOMINANT: 0.4,
  SUPER_LOCRIAN: 0.3,
  HUNGARIAN_MINOR: 0.4,
  GYPSY: 0.4,
  SPANISH: 0.4,
  JEWISH: 0.4
};

/**
 * Valida si una cadena es una nota cromática válida
 */
const isValidChromaticNote = (note: string): note is ChromaticNote => {
  return CHROMATIC_NOTES.includes(note as ChromaticNote);
};

/**
 * Convierte notas a clases de altura únicas
 */
const extractPitchClasses = (notes: NoteName[]): string[] => {
  const pitchClassSet = new Set<string>();
  
  notes.forEach(note => {
    const pitchClass = getNoteName(note);
    pitchClassSet.add(pitchClass);
  });
  
  return Array.from(pitchClassSet).sort();
};

/**
 * Genera todas las notas de una escala desde una tónica
 */
const generateScaleNotes = (tonic: string, pattern: readonly number[]): string[] => {
  // CORRECCIÓN: Validar que tonic es una nota cromática válida
  if (!isValidChromaticNote(tonic)) {
    console.warn(`Tónica inválida en generateScaleNotes: ${tonic}`);
    return [];
  }
  
  const tonicIndex = CHROMATIC_NOTES.findIndex(note => note === tonic);
  if (tonicIndex === -1) return [];
  
  return pattern.map(interval => {
    const noteIndex = (tonicIndex + interval) % 12;
    return CHROMATIC_NOTES[noteIndex];
  });
};

/**
 * Calcula la compatibilidad entre notas de entrada y una escala
 */
const calculateScaleCompatibility = (inputNotes: string[], scaleNotes: string[]): number => {
  if (inputNotes.length === 0 || scaleNotes.length === 0) return 0;
  
  const scaleSet = new Set(scaleNotes);
  
  // Notas que coinciden
  const intersection = inputNotes.filter(note => scaleSet.has(note));
  
  // Notas que no están en la escala
  const outsideNotes = inputNotes.filter(note => !scaleSet.has(note));
  
  // Calcular compatibilidad
  const matchRatio = intersection.length / inputNotes.length;
  const penalty = outsideNotes.length / inputNotes.length;
  
  return Math.max(0, matchRatio - (penalty * 0.5));
};

/**
 * Analiza el centro tonal de un conjunto de notas
 */
const analyzeTonalCenter = (notes: string[]): { center: string | null; stability: number } => {
  if (notes.length === 0) return { center: null, stability: 0 };
  
  // Contar frecuencia de cada nota
  const noteCounts: Record<string, number> = {};
  notes.forEach(note => {
    noteCounts[note] = (noteCounts[note] || 0) + 1;
  });
  
  // Encontrar la nota más frecuente
  const sortedNotes = Object.entries(noteCounts)
    .sort(([,a], [,b]) => b - a);
  
  if (sortedNotes.length === 0) {
    return { center: null, stability: 0 };
  }
  
  const mostFrequent = sortedNotes[0];
  const stability = mostFrequent[1] / notes.length;
  
  return {
    center: mostFrequent[0],
    stability
  };
};

/**
 * Detecta el nivel de cromatismo en las notas
 */
const calculateChromaticism = (notes: string[]): number => {
  if (notes.length === 0) return 0;
  
  const uniqueNotes = new Set(notes);
  
  // Si hay muchas notas diferentes, es más cromático
  const chromaticRatio = uniqueNotes.size / 12;
  
  // Verificar intervalos cromáticos consecutivos
  const noteIndices = Array.from(uniqueNotes).map(note => 
    CHROMATIC_NOTES.findIndex(n => n === note)
  ).filter(index => index !== -1).sort();
  
  let consecutiveCount = 0;
  for (let i = 1; i < noteIndices.length; i++) {
    if (noteIndices[i] - noteIndices[i-1] === 1) {
      consecutiveCount++;
    }
  }
  
  const consecutiveRatio = consecutiveCount / Math.max(1, noteIndices.length - 1);
  
  return Math.min(1, chromaticRatio + consecutiveRatio);
};

/**
 * Identifica la modalidad general
 */
const identifyModality = (scales: DetectedScale[]): ScaleAnalysis['modality'] => {
  if (scales.length === 0) return 'unknown';
  
  const primaryScale = scales[0];
  
  if (primaryScale.type === 'CHROMATIC') return 'chromatic';
  
  const majorScales = ['MAJOR', 'IONIAN', 'LYDIAN', 'MIXOLYDIAN'];
  const minorScales = ['NATURAL_MINOR', 'HARMONIC_MINOR', 'MELODIC_MINOR', 'AEOLIAN', 'DORIAN', 'PHRYGIAN'];
  
  if (majorScales.includes(primaryScale.type)) return 'major';
  if (minorScales.includes(primaryScale.type)) return 'minor';
  
  return 'modal';
};

/**
 * Detecta escalas desde un conjunto de notas
 */
export const detectScales = (notes: NoteName[], config: Partial<ScaleDetectionConfig> = {}): ScaleDetectionResult => {
  const mergedConfig = { ...defaultScaleConfig, ...config };
  const timestamp = Date.now();
  
  // Validaciones iniciales
  if (!notes || notes.length < mergedConfig.minNotesForScale) {
    return {
      primaryScale: null,
      alternativeScales: [],
      suggestedKey: null,
      modalInterchange: [],
      timestamp,
      inputNotes: notes || [],
      analysis: {
        tonalCenter: null,
        modality: 'unknown',
        stabilityScore: 0,
        chromaticism: 0,
        suggestions: []
      }
    };
  }
  
  // Verificar cache
  const cacheKey = notes.sort().join(',');
  if (scaleDetectionCache.has(cacheKey)) {
    const cached = scaleDetectionCache.get(cacheKey)!;
    return { ...cached, timestamp };
  }
  
  try {
    // Extraer clases de altura
    const pitchClasses = extractPitchClasses(notes);
    
    if (pitchClasses.length < mergedConfig.minNotesForScale) {
      return {
        primaryScale: null,
        alternativeScales: [],
        suggestedKey: null,
        modalInterchange: [],
        timestamp,
        inputNotes: notes,
        analysis: {
          tonalCenter: null,
          modality: 'unknown',
          stabilityScore: 0,
          chromaticism: 0,
          suggestions: []
        }
      };
    }
    
    const detectedScales: DetectedScale[] = [];
    
    // Probar cada nota como posible tónica
    for (const potentialTonic of CHROMATIC_NOTES) {
      // Probar cada patrón de escala
      Object.entries(SCALE_PATTERNS).forEach(([scaleType, pattern]) => {
        const scaleNotes = generateScaleNotes(potentialTonic, pattern);
        const compatibility = calculateScaleCompatibility(pitchClasses, scaleNotes);
        
        if (compatibility >= mergedConfig.confidenceThreshold) {
          const missingNotes = scaleNotes.filter(note => !pitchClasses.includes(note));
          const extraNotes = pitchClasses.filter(note => !scaleNotes.includes(note));
          
          // Aplicar peso de la escala
          const weightedConfidence = compatibility * (scaleWeights[scaleType as keyof typeof SCALE_PATTERNS] || 0.5);
          
          // Determinar calidad
          let quality: DetectedScale['quality'] = 'weak';
          if (weightedConfidence >= 0.9 && missingNotes.length <= 1) quality = 'perfect';
          else if (weightedConfidence >= 0.7 && missingNotes.length <= 2) quality = 'good';
          else if (weightedConfidence >= 0.5) quality = 'partial';
          
          const scale: DetectedScale = {
            name: `${potentialTonic} ${SCALE_NAMES[scaleType as keyof typeof SCALE_NAMES]}`,
            tonic: potentialTonic,
            type: scaleType as keyof typeof SCALE_PATTERNS,
            notes: scaleNotes,
            confidence: weightedConfidence,
            mode: SCALE_NAMES[scaleType as keyof typeof SCALE_NAMES],
            degrees: pattern,
            missingNotes,
            extraNotes,
            compatibility,
            quality
          };
          
          detectedScales.push(scale);
        }
      });
    }
    
    // Ordenar por confianza
    detectedScales.sort((a, b) => b.confidence - a.confidence);
    
    // Análisis tonal
    const tonalAnalysis = analyzeTonalCenter(pitchClasses);
    const chromaticism = calculateChromaticism(pitchClasses);
    const modality = identifyModality(detectedScales);
    
    // Sugerir tonalidad basada en Circle of Fifths
    const suggestedKey = suggestKeyFromScales(detectedScales);
    
    // Encontrar intercambio modal
    const modalInterchange = findModalInterchange(detectedScales);
    
    // Generar sugerencias
    const suggestions = generateSuggestions(detectedScales, tonalAnalysis, chromaticism);
    
    const result: ScaleDetectionResult = {
      primaryScale: detectedScales[0] || null,
      alternativeScales: detectedScales.slice(1, 8), // Máximo 8 alternativas
      suggestedKey,
      modalInterchange,
      timestamp,
      inputNotes: notes,
      analysis: {
        tonalCenter: tonalAnalysis.center,
        modality,
        stabilityScore: tonalAnalysis.stability,
        chromaticism,
        suggestions
      }
    };
    
    // Guardar en cache
    if (scaleDetectionCache.size >= maxScaleCacheSize) {
      const oldestKey = scaleDetectionCache.keys().next().value;
      if (oldestKey) {
        scaleDetectionCache.delete(oldestKey);
      }
    }
    scaleDetectionCache.set(cacheKey, result);
    
    return result;
    
  } catch (error) {
    console.error('Error en detección de escalas:', error);
    return {
      primaryScale: null,
      alternativeScales: [],
      suggestedKey: null,
      modalInterchange: [],
      timestamp,
      inputNotes: notes,
      analysis: {
        tonalCenter: null,
        modality: 'unknown',
        stabilityScore: 0,
        chromaticism: 0,
        suggestions: ['Error en análisis']
      }
    };
  }
};

/**
 * Sugiere tonalidad basada en escalas detectadas
 */
const suggestKeyFromScales = (scales: DetectedScale[]): string | null => {
  if (scales.length === 0) return null;
  
  // Priorizar escalas mayor y menor naturales
  const primaryScales = scales.filter(scale => 
    ['MAJOR', 'NATURAL_MINOR', 'IONIAN', 'AEOLIAN'].includes(scale.type)
  );
  
  if (primaryScales.length > 0) {
    return primaryScales[0].tonic;
  }
  
  return scales[0]?.tonic || null;
};

/**
 * Encuentra escalas de intercambio modal
 */
const findModalInterchange = (scales: DetectedScale[]): DetectedScale[] => {
  if (scales.length < 2) return [];
  
  const primaryTonic = scales[0].tonic;
  
  // Buscar otras escalas con la misma tónica
  return scales.filter(scale => 
    scale.tonic === primaryTonic && 
    scale.type !== scales[0].type &&
    scale.confidence >= 0.4
  ).slice(0, 3);
};

/**
 * Genera sugerencias musicales
 */
const generateSuggestions = (
  scales: DetectedScale[], 
  tonalAnalysis: { center: string | null; stability: number },
  chromaticism: number
): string[] => {
  const suggestions: string[] = [];
  
  if (scales.length === 0) {
    suggestions.push('Toca más notas para detectar escalas');
    return suggestions;
  }
  
  const primary = scales[0];
  
  if (primary.quality === 'perfect') {
    suggestions.push(`Tonalidad clara: ${primary.name}`);
  } else if (primary.quality === 'good') {
    suggestions.push(`Probable tonalidad: ${primary.name}`);
  } else {
    suggestions.push(`Posible tonalidad: ${primary.name}`);
  }
  
  if (chromaticism > 0.6) {
    suggestions.push('Pasaje altamente cromático');
  } else if (chromaticism > 0.3) {
    suggestions.push('Cromatismo moderado detectado');
  }
  
  if (tonalAnalysis.stability < 0.3) {
    suggestions.push('Tonalidad ambigua, considera modulación');
  }
  
  if (primary.missingNotes.length > 0) {
    suggestions.push(`Notas faltantes: ${primary.missingNotes.join(', ')}`);
  }
  
  return suggestions;
};

/**
 * Analiza compatibilidad entre acorde y escala
 */
export const analyzeChordScaleCompatibility = (
  chord: DetectedChord, 
  scale: DetectedScale
): { compatible: boolean; reason: string; score: number } => {
  if (!chord || !scale) {
    return { compatible: false, reason: 'Acorde o escala no válidos', score: 0 };
  }
  
  const chordNotes = new Set(chord.notes.map(note => getNoteName(note)));
  const scaleNotes = new Set(scale.notes);
  
  const compatibleNotes = Array.from(chordNotes).filter(note => scaleNotes.has(note));
  const incompatibleNotes = Array.from(chordNotes).filter(note => !scaleNotes.has(note));
  
  const compatibilityScore = compatibleNotes.length / chordNotes.size;
  
  let reason = '';
  if (compatibilityScore >= 0.8) {
    reason = 'Acorde totalmente compatible con la escala';
  } else if (compatibilityScore >= 0.6) {
    reason = 'Acorde mayormente compatible';
  } else if (compatibilityScore >= 0.4) {
    reason = `Parcialmente compatible. Notas fuera: ${incompatibleNotes.join(', ')}`;
  } else {
    reason = `Incompatible. Notas conflictivas: ${incompatibleNotes.join(', ')}`;
  }
  
  return {
    compatible: compatibilityScore >= 0.6,
    reason,
    score: compatibilityScore
  };
};

/**
 * Obtiene estadísticas de detección de escalas
 */
export const getScaleDetectionStats = () => {
  return {
    cacheSize: scaleDetectionCache.size,
    maxCacheSize: maxScaleCacheSize,
    supportedScaleTypes: Object.keys(SCALE_PATTERNS).length,
    defaultConfig: { ...defaultScaleConfig },
    scaleWeights: { ...scaleWeights }
  };
};

/**
 * Limpia el cache de detección de escalas
 */
export const clearScaleDetectionCache = (): void => {
  scaleDetectionCache.clear();
  console.log('🎼 Cache de detección de escalas limpiado');
};

/**
 * Sugiere escalas relacionadas a una escala dada
 */
export const suggestRelatedScales = (scale: DetectedScale): DetectedScale[] => {
  if (!scale) return [];
  
  // Escalas relacionadas por tónica
  const relatedTonics = [scale.tonic];
  
  // Agregar relativo mayor/menor
  const tonicIndex = CHROMATIC_NOTES.findIndex(note => note === scale.tonic);
  if (tonicIndex !== -1) {
    const relativeMajor = CHROMATIC_NOTES[(tonicIndex + 3) % 12]; // tercera menor arriba
    const relativeMinor = CHROMATIC_NOTES[(tonicIndex + 9) % 12]; // tercera menor abajo
    relatedTonics.push(relativeMajor, relativeMinor);
  }
  
  // TODO: Implementar lógica completa de escalas relacionadas
  return [];
};

// Logging inicial
console.log('🎼 ScaleDetection cargado:');
console.log('- Tipos de escala soportados:', Object.keys(SCALE_PATTERNS).length);
console.log('- Configuración por defecto:', defaultScaleConfig);

export default {
  detectScales,
  analyzeChordScaleCompatibility,
  getScaleDetectionStats,
  clearScaleDetectionCache,
  suggestRelatedScales
};