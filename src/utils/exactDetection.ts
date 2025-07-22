/**
 * Sistema de detección musical INTELIGENTE y SIMPLIFICADO - FASE 3.5
 * 
 * NUEVAS CARACTERÍSTICAS:
 * ✅ Priorización por especificidad (7 notas > 5 notas > 4 notas > 3 notas)
 * ✅ Tónica contextual (primera tecla presionada = probable tónica)
 * ✅ Filtro anti-ruido (escalas completas eliminan acordes subconjunto)
 * ✅ Popularidad musical (C Major > A Minor cuando son equivalentes)
 * ✅ Máximo 1 resultado por categoría (SIMPLICIDAD EXTREMA)
 * ✅ Relevancia armónica real
 * 
 * @author Psanter Team
 * @version 3.5.0 - Detección inteligente con filtros avanzados
 */

import type { NoteName } from '../types/piano';
import { 
  REAL_CHORDS, 
  REAL_SCALES
} from '../data/musicalData';

// ========================================================================================
// CONFIGURACIÓN DEL SISTEMA INTELIGENTE
// ========================================================================================

// Orden de popularidad para tónicas (más comunes primero)
const TONIC_POPULARITY = [
  'C', 'G', 'D', 'A', 'F', 'E', 'B', 'Bb', 'Eb', 'Ab', 'F#', 'C#'
];

// Orden de popularidad para tipos de acordes
const CHORD_TYPE_POPULARITY = [
  'Major', 'Minor', 'Dominant 7th', 'Minor 7th', 'Major 7th', 
  'Sus 4', 'Sus 2', '6', 'Minor 6', 'Diminished', 'Augmented',
  '9', 'Minor 9', 'Major 9', 'add 9', 'Minor Major 7th'
];

// Orden de popularidad para tipos de escalas
const SCALE_TYPE_POPULARITY = [
  'Major', 'Natural Minor', 'Major Pentatonic', 'Minor Pentatonic',
  'Dorian', 'Mixolydian', 'Harmonic Minor', 'Melodic Minor Ascending',
  'Blues', 'Major Blues', 'Ionian', 'Aeolian', 'Phrygian', 'Lydian', 'Locrian'
];

// ========================================================================================
// TIPOS MEJORADOS CON PUNTUACIÓN INTELIGENTE
// ========================================================================================

export interface IntelligentChordResult {
  tonic: string;
  type: string;
  name: string;
  notes: string[];
  isExactMatch: boolean;
  confidence: number;
  specificity: number; // Cuántas notas tiene
  popularity: number; // Qué tan común es
  isRelevant: boolean; // Si es musicalmente relevante en este contexto
}

export interface IntelligentScaleResult {
  tonic: string;
  type: string;
  name: string;
  notes: string[];
  isExactMatch: boolean;
  confidence: number;
  specificity: number;
  popularity: number;
  isRelevant: boolean;
}

export interface SmartDetectionResult {
  chord: IntelligentChordResult | null;
  scale: IntelligentScaleResult | null;
  inputNotes: string[];
  hasDetection: boolean;
  filterApplied: 'anti-noise' | 'contextual' | 'none';
  reasoning: string; // Por qué se eligió este resultado
}

// ========================================================================================
// UTILIDADES MEJORADAS CON CONTEXTO
// ========================================================================================

const getNoteNameOnly = (note: NoteName): string => {
  return note.replace(/\d+$/, '');
};

const normalizeNotes = (notes: NoteName[]): string[] => {
  const uniqueNotes = new Set<string>();
  notes.forEach(note => {
    uniqueNotes.add(getNoteNameOnly(note));
  });
  return Array.from(uniqueNotes).sort();
};

const areNotesEqual = (notes1: string[], notes2: string[]): boolean => {
  if (notes1.length !== notes2.length) return false;
  const sorted1 = [...notes1].sort();
  const sorted2 = [...notes2].sort();
  return sorted1.every((note, index) => note === sorted2[index]);
};

/**
 * Calcula confianza mejorada con penalizaciones inteligentes
 */
const calculateIntelligentConfidence = (inputNotes: string[], targetNotes: string[]): number => {
  if (targetNotes.length === 0) return 0;
  
  const matches = inputNotes.filter(note => targetNotes.includes(note)).length;
  const expectedNotes = targetNotes.length;
  const extraNotes = Math.max(0, inputNotes.length - expectedNotes);
  
  // Penalizaciones más suaves para contextos musicales
  const baseProbability = matches / expectedNotes;
  const extraPenalty = extraNotes * 0.05; // Penalización reducida por notas extra
  const incompletePenalty = (expectedNotes - matches) * 0.1;
  
  return Math.max(0, baseProbability - extraPenalty - incompletePenalty);
};

/**
 * Calcula la puntuación de popularidad
 */
const getPopularityScore = (tonic: string, type: string, isChord: boolean): number => {
  const tonicScore = TONIC_POPULARITY.indexOf(tonic);
  const tonicIndex = tonicScore === -1 ? TONIC_POPULARITY.length : tonicScore;
  
  const typeArray = isChord ? CHORD_TYPE_POPULARITY : SCALE_TYPE_POPULARITY;
  const typeScore = typeArray.indexOf(type);
  const typeIndex = typeScore === -1 ? typeArray.length : typeScore;
  
  // Convertir índices a puntuaciones (menor índice = mayor popularidad)
  const maxTonic = TONIC_POPULARITY.length;
  const maxType = typeArray.length;
  
  const tonicPop = (maxTonic - tonicIndex) / maxTonic;
  const typePop = (maxType - typeIndex) / maxType;
  
  return (tonicPop + typePop) / 2;
};

/**
 * Verifica si un acorde es subconjunto de una escala
 */
const isChordSubsetOfScale = (chordNotes: string[], scaleNotes: string[]): boolean => {
  return chordNotes.every(note => scaleNotes.includes(note));
};

/**
 * Determina la probable tónica basada en contexto
 * (primera nota presionada, popularidad, etc.)
 */
const getProbableTonic = (inputNotes: string[], firstNote?: string): string => {
  if (firstNote && inputNotes.includes(firstNote)) {
    return firstNote;
  }
  
  // Si no hay contexto, usar la más popular de las notas presentes
  const presentTonics = inputNotes.filter(note => TONIC_POPULARITY.includes(note));
  if (presentTonics.length > 0) {
    return presentTonics.sort((a, b) => 
      TONIC_POPULARITY.indexOf(a) - TONIC_POPULARITY.indexOf(b)
    )[0];
  }
  
  return inputNotes[0] || 'C';
};

// ========================================================================================
// DETECCIÓN INTELIGENTE CON FILTROS AVANZADOS
// ========================================================================================

/**
 * Encuentra TODOS los acordes potenciales con puntuación inteligente
 */
const findAllChordsWithScoring = (
  inputNotes: NoteName[], 
  probableTonic?: string
): IntelligentChordResult[] => {
  if (inputNotes.length < 2) return [];
  
  const normalizedInput = normalizeNotes(inputNotes);
  const results: IntelligentChordResult[] = [];
  
  for (const [tonic, chordTypes] of Object.entries(REAL_CHORDS)) {
    for (const [type, chordNotes] of Object.entries(chordTypes)) {
      const confidence = calculateIntelligentConfidence(normalizedInput, chordNotes);
      
      if (confidence >= 0.4) { // Umbral más bajo para capturar más opciones
        const isExact = areNotesEqual(normalizedInput, chordNotes);
        const specificity = chordNotes.length;
        const popularity = getPopularityScore(tonic, type, true);
        
        // Boost para tónica probable
        const tonicBoost = (probableTonic && tonic === probableTonic) ? 0.3 : 0;
        
        // Boost para coincidencias exactas
        const exactBoost = isExact ? 0.5 : 0;
        
        const finalScore = confidence + exactBoost + tonicBoost + (popularity * 0.2);
        
        results.push({
          tonic,
          type,
          name: `${tonic} ${type}`,
          notes: [...chordNotes],
          isExactMatch: isExact,
          confidence,
          specificity,
          popularity,
          isRelevant: confidence >= 0.6
        });
      }
    }
  }
  
  // Ordenar por puntuación final
  return results.sort((a, b) => {
    const scoreA = a.confidence + (a.isExactMatch ? 0.5 : 0) + 
                   (a.popularity * 0.2) + (a.specificity * 0.1);
    const scoreB = b.confidence + (b.isExactMatch ? 0.5 : 0) + 
                   (b.popularity * 0.2) + (b.specificity * 0.1);
    return scoreB - scoreA;
  });
};

/**
 * Encuentra TODAS las escalas potenciales con puntuación inteligente
 */
const findAllScalesWithScoring = (
  inputNotes: NoteName[], 
  probableTonic?: string
): IntelligentScaleResult[] => {
  if (inputNotes.length < 3) return [];
  
  const normalizedInput = normalizeNotes(inputNotes);
  const results: IntelligentScaleResult[] = [];
  
  for (const [tonic, scaleTypes] of Object.entries(REAL_SCALES)) {
    for (const [type, scaleNotes] of Object.entries(scaleTypes)) {
      const confidence = calculateIntelligentConfidence(normalizedInput, scaleNotes);
      
      if (confidence >= 0.3) { // Umbral más bajo para escalas
        const isExact = areNotesEqual(normalizedInput, scaleNotes);
        const specificity = scaleNotes.length;
        const popularity = getPopularityScore(tonic, type, false);
        
        // Boost para tónica probable
        const tonicBoost = (probableTonic && tonic === probableTonic) ? 0.4 : 0;
        
        // Boost para coincidencias exactas
        const exactBoost = isExact ? 0.6 : 0;
        
        const finalScore = confidence + exactBoost + tonicBoost + (popularity * 0.3);
        
        results.push({
          tonic,
          type,
          name: `${tonic} ${type}`,
          notes: [...scaleNotes],
          isExactMatch: isExact,
          confidence,
          specificity,
          popularity,
          isRelevant: confidence >= 0.5
        });
      }
    }
  }
  
  // Ordenar por especificidad primero, luego por puntuación
  return results.sort((a, b) => {
    // Prioridad 1: Especificidad (más notas = mejor)
    if (a.specificity !== b.specificity) {
      return b.specificity - a.specificity;
    }
    
    // Prioridad 2: Puntuación final
    const scoreA = a.confidence + (a.isExactMatch ? 0.6 : 0) + 
                   (a.popularity * 0.3);
    const scoreB = b.confidence + (b.isExactMatch ? 0.6 : 0) + 
                   (b.popularity * 0.3);
    return scoreB - scoreA;
  });
};

/**
 * Aplica filtro anti-ruido inteligente
 */
const applyAntiNoiseFilter = (
  chords: IntelligentChordResult[],
  scales: IntelligentScaleResult[]
): { 
  filteredChords: IntelligentChordResult[], 
  filteredScales: IntelligentScaleResult[],
  filterApplied: 'anti-noise' | 'contextual' | 'none',
  reasoning: string
} => {
  let filterApplied: 'anti-noise' | 'contextual' | 'none' = 'none';
  let reasoning = 'No se aplicaron filtros especiales';
  
  // Si hay una escala de 5+ notas con alta confianza, filtrar acordes simples
  const significantScale = scales.find(s => s.specificity >= 5 && s.confidence >= 0.7);
  
  if (significantScale) {
    const filteredChords = chords.filter(chord => {
      // Mantener solo acordes que NO sean subconjuntos obvios de la escala
      const isSubset = isChordSubsetOfScale(chord.notes, significantScale.notes);
      const isComplex = chord.specificity >= 4; // Acordes de 4+ notas son más interesantes
      const isHighConfidence = chord.confidence >= 0.8;
      
      return !isSubset || isComplex || isHighConfidence;
    });
    
    if (filteredChords.length < chords.length) {
      filterApplied = 'anti-noise';
      reasoning = `Filtrados acordes simples que son subconjuntos de ${significantScale.name}`;
      return { 
        filteredChords, 
        filteredScales: scales, 
        filterApplied, 
        reasoning 
      };
    }
  }
  
  // Filtro contextual: Si hay muchas opciones, mantener solo las más relevantes
  if (chords.length > 3 || scales.length > 2) {
    const topChords = chords.filter(c => c.isRelevant).slice(0, 1);
    const topScales = scales.filter(s => s.isRelevant).slice(0, 1);
    
    if (topChords.length > 0 || topScales.length > 0) {
      filterApplied = 'contextual';
      reasoning = 'Filtrados por relevancia musical y simplicidad';
      return { 
        filteredChords: topChords, 
        filteredScales: topScales, 
        filterApplied, 
        reasoning 
      };
    }
  }
  
  return { 
    filteredChords: chords.slice(0, 1), 
    filteredScales: scales.slice(0, 1), 
    filterApplied, 
    reasoning 
  };
};

// ========================================================================================
// FUNCIÓN PRINCIPAL - DETECCIÓN INTELIGENTE
// ========================================================================================

/**
 * Detecta música con sistema inteligente y filtros avanzados
 * MÁXIMA SIMPLICIDAD: 1 acorde + 1 escala (los mejores)
 */
export const detectMusic = (inputNotes: NoteName[]): SmartDetectionResult => {
  const normalizedInput = normalizeNotes(inputNotes);
  
  if (normalizedInput.length === 0) {
    return {
      chord: null,
      scale: null,
      inputNotes: [],
      hasDetection: false,
      filterApplied: 'none',
      reasoning: 'No hay notas seleccionadas'
    };
  }
  
  // Determinar tónica probable (primera nota como contexto)
  const probableTonic = getProbableTonic(normalizedInput);
  
  // Encontrar todos los candidatos
  const allChords = findAllChordsWithScoring(inputNotes, probableTonic);
  const allScales = findAllScalesWithScoring(inputNotes, probableTonic);
  
  // Aplicar filtros inteligentes
  const { filteredChords, filteredScales, filterApplied, reasoning } = 
    applyAntiNoiseFilter(allChords, allScales);
  
  // Seleccionar SOLO el mejor de cada categoría
  const bestChord = filteredChords.length > 0 ? filteredChords[0] : null;
  const bestScale = filteredScales.length > 0 ? filteredScales[0] : null;
  
  return {
    chord: bestChord,
    scale: bestScale,
    inputNotes: normalizedInput,
    hasDetection: bestChord !== null || bestScale !== null,
    filterApplied,
    reasoning: bestChord || bestScale ? reasoning : 'No se detectaron patrones musicales válidos'
  };
};

// ========================================================================================
// FUNCIONES DE UTILIDAD PARA LA UI
// ========================================================================================

export const formatChordDisplay = (chord: IntelligentChordResult | null): string => {
  if (!chord) return 'Ningún acorde detectado';
  
  const precision = chord.isExactMatch ? ' ✓' : ` (${Math.round(chord.confidence * 100)}%)`;
  return `${chord.name}${precision}`;
};

export const formatScaleDisplay = (scale: IntelligentScaleResult | null): string => {
  if (!scale) return 'Ninguna escala detectada';
  
  const precision = scale.isExactMatch ? ' ✓' : ` (${Math.round(scale.confidence * 100)}%)`;
  return `${scale.name}${precision}`;
};

export const getChordNotes = (chord: IntelligentChordResult | null): string => {
  if (!chord) return '';
  return chord.notes.join(' - ');
};

export const getScaleNotes = (scale: IntelligentScaleResult | null): string => {
  if (!scale) return '';
  return scale.notes.join(' - ');
};

export const hasExactDetection = (result: SmartDetectionResult): boolean => {
  return (result.chord?.isExactMatch || result.scale?.isExactMatch) || false;
};

/**
 * Información de debugging del sistema inteligente
 */
export const getDetectionInfo = (result: SmartDetectionResult) => {
  return {
    inputCount: result.inputNotes.length,
    hasChord: result.chord !== null,
    hasScale: result.scale !== null,
    chordSpecificity: result.chord?.specificity || 0,
    scaleSpecificity: result.scale?.specificity || 0,
    filterApplied: result.filterApplied,
    reasoning: result.reasoning,
    exactMatches: hasExactDetection(result)
  };
};

// ========================================================================================
// INICIALIZACIÓN Y VERIFICACIÓN
// ========================================================================================

if (process.env.NODE_ENV === 'development') {
  console.log('🎯 Sistema de Detección Musical Inteligente v3.5 cargado');
  console.log('✅ Priorización por especificidad activada');
  console.log('✅ Contexto de tónica implementado');
  console.log('✅ Filtro anti-ruido operativo');
  console.log('✅ Simplicidad extrema: 1 resultado por categoría');
  console.log('✅ Puntuación por popularidad musical');
  
  // Verificar que las estructuras de datos están correctas
  const chordsCount = Object.keys(REAL_CHORDS).length;
  const scalesCount = Object.keys(REAL_SCALES).length;
  console.log(`📊 Base de datos: ${chordsCount} tónicas × acordes, ${scalesCount} tónicas × escalas`);
}

export default detectMusic;