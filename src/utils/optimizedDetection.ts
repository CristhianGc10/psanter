/**
 * Sistema de detección musical optimizado con PRECISIÓN EXACTA
 * Usa datos reales de musicalData.ts para máxima precisión
 */

import type { NoteName } from '../types/piano';
import { 
  CHORD_PATTERNS, 
  SCALE_PATTERNS,
  CHORD_NAMES,
  SCALE_NAMES,
  CHROMATIC_NOTES,
  REAL_SCALES,
  REAL_CHORDS,
  getRealScale,
  getRealChord,
  type ChromaticNote
} from '../data/musicalData';

import { 
  detectChords as originalDetectChords,
  type DetectedChord,
  type ChordDetectionResult 
} from './chordDetection';

import {
  detectScales as originalDetectScales,
  type DetectedScale,
  type ScaleDetectionResult
} from './scaleDetection';

import { getNoteName } from './noteUtils';

// ========================================================================================
// TIPOS OPTIMIZADOS
// ========================================================================================

export interface OptimizedChordResult {
  chord: DetectedChord;
  confidence: number;
  alternatives: DetectedChord[];
  reasoning: string;
  certainty: 'high' | 'medium' | 'low';
  exactMatch: boolean;
}

export interface OptimizedScaleResult {
  scale: DetectedScale;
  confidence: number;
  alternatives: DetectedScale[];
  reasoning: string;
  certainty: 'high' | 'medium' | 'low';
  exactMatch: boolean;
}

// ========================================================================================
// DETECCIÓN DE PRECISIÓN EXACTA
// ========================================================================================

/**
 * Extrae pitch classes únicas de las notas
 */
const extractUniquePitchClasses = (notes: NoteName[]): string[] => {
  const pitchClasses = new Set<string>();
  notes.forEach(note => {
    pitchClasses.add(getNoteName(note));
  });
  return Array.from(pitchClasses).sort();
};

/**
 * Compara dos arrays de notas (ignorando orden)
 */
const areNoteSetsEqual = (set1: string[], set2: string[]): boolean => {
  if (set1.length !== set2.length) return false;
  const sorted1 = [...set1].sort();
  const sorted2 = [...set2].sort();
  return sorted1.every((note, i) => note === sorted2[i]);
};

/**
 * Detecta acordes con PRECISIÓN EXACTA usando REAL_CHORDS
 */
export const detectChordsOptimized = (notes: NoteName[]): OptimizedChordResult => {
  if (!notes || notes.length < 2) {
    return {
      chord: {
        name: 'No chord',
        root: '',
        type: 'MAJOR',
        notes: [],
        confidence: 0,
        inversion: 0,
        missingNotes: [],
        extraNotes: [],
        quality: 'weak'
      },
      confidence: 0,
      alternatives: [],
      reasoning: 'Insufficient notes for chord detection',
      certainty: 'low',
      exactMatch: false
    };
  }

  const pitchClasses = extractUniquePitchClasses(notes);
  const detectedChords: Array<{
    chord: DetectedChord;
    exactMatch: boolean;
    matchScore: number;
  }> = [];

  // Buscar coincidencia EXACTA en REAL_CHORDS
  for (const [tonic, chordTypes] of Object.entries(REAL_CHORDS)) {
    for (const [chordType, chordNotes] of Object.entries(chordTypes)) {
      // Verificar coincidencia exacta
      if (areNoteSetsEqual(pitchClasses, chordNotes)) {
        const chord: DetectedChord = {
          name: `${tonic} ${chordType}`,
          root: tonic,
          type: mapRealChordTypeToPattern(chordType),
          notes: notes,
          confidence: 1.0,
          inversion: detectInversion(pitchClasses, chordNotes),
          missingNotes: [],
          extraNotes: [],
          quality: 'perfect'
        };
        
        detectedChords.push({
          chord,
          exactMatch: true,
          matchScore: 1.0
        });
      } else {
        // Calcular coincidencia parcial
        const commonNotes = pitchClasses.filter(note => chordNotes.includes(note));
        const missingNotes = chordNotes.filter(note => !pitchClasses.includes(note));
        const extraNotes = pitchClasses.filter(note => !chordNotes.includes(note));
        
        const matchScore = calculateChordMatchScore(
          commonNotes.length,
          missingNotes.length,
          extraNotes.length,
          chordNotes.length
        );
        
        if (matchScore >= 0.5) {
          const confidence = matchScore;
          const quality = getQuality(confidence, missingNotes.length);
          
          const chord: DetectedChord = {
            name: `${tonic} ${chordType}`,
            root: tonic,
            type: mapRealChordTypeToPattern(chordType),
            notes: notes,
            confidence,
            inversion: detectInversion(pitchClasses, chordNotes),
            missingNotes,
            extraNotes,
            quality
          };
          
          detectedChords.push({
            chord,
            exactMatch: false,
            matchScore
          });
        }
      }
    }
  }

  // Ordenar por score (exactMatch primero, luego por matchScore)
  detectedChords.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return b.matchScore - a.matchScore;
  });

  if (detectedChords.length === 0) {
    // Fallback al sistema original si no hay coincidencias
    const originalResult = originalDetectChords(notes);
    return {
      chord: originalResult.primaryChord || {
        name: 'Unknown',
        root: '',
        type: 'MAJOR',
        notes: notes,
        confidence: 0,
        inversion: 0,
        missingNotes: [],
        extraNotes: pitchClasses,
        quality: 'weak'
      },
      confidence: originalResult.primaryChord?.confidence || 0,
      alternatives: originalResult.alternativeChords.slice(0, 3),
      reasoning: 'No exact match found in chord database',
      certainty: 'low',
      exactMatch: false
    };
  }

  const best = detectedChords[0];
  const alternatives = detectedChords.slice(1, 4).map(d => d.chord);
  
  const reasoning = best.exactMatch 
    ? `Exact match: ${best.chord.name}`
    : `Best match: ${best.chord.name} (${Math.round(best.matchScore * 100)}% match)`;
    
  const certainty = best.exactMatch ? 'high' : 
                    best.matchScore >= 0.8 ? 'medium' : 'low';

  return {
    chord: best.chord,
    confidence: best.matchScore,
    alternatives,
    reasoning,
    certainty,
    exactMatch: best.exactMatch
  };
};

/**
 * Detecta escalas con PRECISIÓN EXACTA usando REAL_SCALES
 */
export const detectScalesOptimized = (notes: NoteName[]): OptimizedScaleResult => {
  if (!notes || notes.length < 3) {
    return {
      scale: {
        name: 'No scale',
        tonic: '',
        type: 'MAJOR',
        notes: [],
        confidence: 0,
        mode: '',
        degrees: [],
        missingNotes: [],
        extraNotes: [],
        compatibility: 0,
        quality: 'weak'
      },
      confidence: 0,
      alternatives: [],
      reasoning: 'Insufficient notes for scale detection',
      certainty: 'low',
      exactMatch: false
    };
  }

  const pitchClasses = extractUniquePitchClasses(notes);
  const detectedScales: Array<{
    scale: DetectedScale;
    exactMatch: boolean;
    matchScore: number;
  }> = [];

  // Buscar coincidencia EXACTA en REAL_SCALES
  for (const [tonic, scaleTypes] of Object.entries(REAL_SCALES)) {
    for (const [scaleType, scaleNotes] of Object.entries(scaleTypes)) {
      // Para escalas, verificamos si las notas tocadas son un subconjunto de la escala
      const isSubset = pitchClasses.every(note => scaleNotes.includes(note));
      const isExactMatch = isSubset && pitchClasses.length >= Math.min(5, scaleNotes.length);
      
      if (isSubset) {
        const missingNotes = scaleNotes.filter(note => !pitchClasses.includes(note));
        const extraNotes = pitchClasses.filter(note => !scaleNotes.includes(note));
        
        const matchScore = calculateScaleMatchScore(
          pitchClasses.length,
          missingNotes.length,
          extraNotes.length,
          scaleNotes.length,
          isExactMatch
        );
        
        if (matchScore >= 0.4) {
          const patternType = mapRealScaleTypeToPattern(scaleType);
          const pattern = SCALE_PATTERNS[patternType] || SCALE_PATTERNS.MAJOR;
          
          const scale: DetectedScale = {
            name: `${tonic} ${scaleType}`,
            tonic,
            type: patternType,
            notes: scaleNotes,
            confidence: matchScore,
            mode: scaleType,
            degrees: pattern,
            missingNotes,
            extraNotes,
            compatibility: matchScore,
            quality: getQuality(matchScore, missingNotes.length)
          };
          
          detectedScales.push({
            scale,
            exactMatch: isExactMatch,
            matchScore
          });
        }
      }
    }
  }

  // Ordenar por score
  detectedScales.sort((a, b) => {
    if (a.exactMatch && !b.exactMatch) return -1;
    if (!a.exactMatch && b.exactMatch) return 1;
    return b.matchScore - a.matchScore;
  });

  if (detectedScales.length === 0) {
    // Fallback al sistema original
    const originalResult = originalDetectScales(notes);
    return {
      scale: originalResult.primaryScale || {
        name: 'Unknown',
        tonic: '',
        type: 'MAJOR',
        notes: [],
        confidence: 0,
        mode: '',
        degrees: [],
        missingNotes: [],
        extraNotes: pitchClasses,
        compatibility: 0,
        quality: 'weak'
      },
      confidence: originalResult.primaryScale?.confidence || 0,
      alternatives: originalResult.alternativeScales.slice(0, 3),
      reasoning: 'No match found in scale database',
      certainty: 'low',
      exactMatch: false
    };
  }

  const best = detectedScales[0];
  const alternatives = detectedScales.slice(1, 4).map(d => d.scale);
  
  const reasoning = best.exactMatch 
    ? `Perfect fit: ${best.scale.name}`
    : `Best match: ${best.scale.name} (${Math.round(best.matchScore * 100)}% match)`;
    
  const certainty = best.exactMatch ? 'high' : 
                    best.matchScore >= 0.7 ? 'medium' : 'low';

  return {
    scale: best.scale,
    confidence: best.matchScore,
    alternatives,
    reasoning,
    certainty,
    exactMatch: best.exactMatch
  };
};

// ========================================================================================
// FUNCIONES AUXILIARES
// ========================================================================================

/**
 * Calcula el score de coincidencia para acordes
 */
const calculateChordMatchScore = (
  commonNotes: number,
  missingNotes: number,
  extraNotes: number,
  totalChordNotes: number
): number => {
  // Penalizar más las notas faltantes que las extras para acordes
  const commonRatio = commonNotes / totalChordNotes;
  const missingPenalty = missingNotes * 0.3;
  const extraPenalty = extraNotes * 0.1;
  
  return Math.max(0, commonRatio - missingPenalty - extraPenalty);
};

/**
 * Calcula el score de coincidencia para escalas
 */
const calculateScaleMatchScore = (
  playedNotes: number,
  missingNotes: number,
  extraNotes: number,
  totalScaleNotes: number,
  isExactMatch: boolean
): number => {
  if (isExactMatch && extraNotes === 0) return 1.0;
  
  const coverageRatio = playedNotes / totalScaleNotes;
  const accuracyRatio = playedNotes / (playedNotes + extraNotes);
  
  // Para escalas, valoramos tanto la cobertura como la precisión
  const baseScore = (coverageRatio * 0.6) + (accuracyRatio * 0.4);
  
  // Penalizaciones
  const extraPenalty = extraNotes * 0.15;
  const missingPenalty = Math.min(missingNotes * 0.05, 0.3); // Límite de penalización
  
  return Math.max(0, baseScore - extraPenalty - missingPenalty);
};

/**
 * Determina la calidad basada en confianza y notas faltantes
 */
const getQuality = (confidence: number, missingNotes: number): 'perfect' | 'good' | 'partial' | 'weak' => {
  if (confidence >= 0.95 && missingNotes === 0) return 'perfect';
  if (confidence >= 0.8 && missingNotes <= 1) return 'good';
  if (confidence >= 0.6 && missingNotes <= 2) return 'partial';
  return 'weak';
};

/**
 * Detecta la inversión del acorde
 */
const detectInversion = (playedNotes: string[], chordNotes: string[]): number => {
  if (playedNotes.length === 0) return 0;
  
  const bassNote = playedNotes[0]; // Primera nota tocada
  const rootIndex = chordNotes.findIndex(note => note === bassNote);
  
  return rootIndex > 0 ? rootIndex : 0;
};

/**
 * Mapea tipos de acordes reales a patrones
 */
const mapRealChordTypeToPattern = (realType: string): keyof typeof CHORD_PATTERNS => {
  const mapping: Record<string, keyof typeof CHORD_PATTERNS> = {
    'Major': 'MAJOR',
    'Minor': 'MINOR',
    'Diminished': 'DIMINISHED',
    'Augmented': 'AUGMENTED',
    'Dominant 7th': 'DOMINANT_7',
    'Major 7th': 'MAJOR_7',
    'Minor 7th': 'MINOR_7',
    'Minor Major 7th': 'MINOR_MAJOR_7',
    'Sus 2': 'SUS_2',
    'Sus 4': 'SUS_4',
    '6': 'SIXTH',
    'Minor 6': 'MINOR_SIXTH',
    '9': 'NINTH',
    'Minor 9': 'MINOR_NINTH',
    'Major 9': 'MAJOR_NINTH',
    'add 9': 'ADD_9',
    '5': 'MAJOR' // Power chord, default to major
  };
  
  return mapping[realType] || 'MAJOR';
};

/**
 * Mapea tipos de escalas reales a patrones
 */
const mapRealScaleTypeToPattern = (realType: string): keyof typeof SCALE_PATTERNS => {
  const mapping: Record<string, keyof typeof SCALE_PATTERNS> = {
    'Major': 'MAJOR',
    'Natural Minor': 'NATURAL_MINOR',
    'Harmonic Minor': 'HARMONIC_MINOR',
    'Melodic Minor Ascending': 'MELODIC_MINOR',
    'Melodic Minor Descending': 'NATURAL_MINOR',
    'Major Pentatonic': 'MAJOR_PENTATONIC',
    'Minor Pentatonic': 'MINOR_PENTATONIC',
    'Major Blues': 'MAJOR_BLUES',
    'Minor Blues': 'BLUES',
    'Ionian': 'IONIAN',
    'Dorian': 'DORIAN',
    'Phrygian': 'PHRYGIAN',
    'Lydian': 'LYDIAN',
    'Mixolydian': 'MIXOLYDIAN',
    'Aeolian': 'AEOLIAN',
    'Locrian': 'LOCRIAN',
    'Major Bebop': 'MAJOR_BEBOP',
    'Minor Bebop': 'MINOR_BEBOP',
    'Super Locrian': 'SUPER_LOCRIAN',
    'Nine Tone': 'NINE_TONE',
    'Algerian': 'ALGERIAN',
    'Arabic': 'ARABIC',
    'Augmented': 'AUGMENTED',
    'Balinese': 'BALINESE',
    'Byzantine': 'BYZANTINE',
    'Chinese': 'CHINESE',
    'Diminished': 'DIMINISHED',
    'Dominant Diminished': 'DOMINANT_DIMINISHED',
    'Egyptian': 'EGYPTIAN',
    'Eight Tone Spanish': 'EIGHT_TONE_SPANISH',
    'Enigmatic': 'ENIGMATIC',
    'Geez': 'GEEZ',
    'Hawaiian': 'HAWAIIAN',
    'Hindu': 'HINDU',
    'Hirajoshi': 'HIRAJOSHI',
    'Hungarian Gypsy': 'HUNGARIAN_GYPSY',
    'Hungarian Major': 'HUNGARIAN_MAJOR',
    'Iberian': 'IBERIAN',
    'Indian Ascending': 'INDIAN_ASCENDING',
    'Indian Descending': 'INDIAN_DESCENDING',
    'Iwato': 'IWATO',
    'Japanese': 'JAPANESE',
    'Lydian #5': 'LYDIAN_SHARP_5',
    'Lydian b7': 'LYDIAN_FLAT_7',
    'Neapolitan Minor': 'NEAPOLITAN_MINOR',
    'Neapolitan Major': 'NEAPOLITAN_MAJOR',
    'Oriental': 'ORIENTAL',
    'Prometheus': 'PROMETHEUS',
    'Romanian Minor': 'ROMANIAN_MINOR',
    'Spanish Gypsy': 'SPANISH_GYPSY',
    'Whole Tone': 'WHOLE_TONE',
    'Yo': 'YO',
    'Chromatic': 'CHROMATIC'
  };
  
  return mapping[realType] || 'MAJOR';
};

// ========================================================================================
// EXPORTACIÓN PRINCIPAL
// ========================================================================================

console.log('🎯 Sistema de detección optimizado con PRECISIÓN EXACTA cargado');
console.log('✅ Usando base de datos REAL_CHORDS y REAL_SCALES');
console.log('🎵 Detección de alta precisión activa');

export default {
  detectChordsOptimized,
  detectScalesOptimized
};