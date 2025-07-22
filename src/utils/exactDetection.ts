/**
 * Sistema de detección musical EXACTO y SIMPLIFICADO - FASE 3
 * Devuelve SOLO el mejor resultado para acorde y escala
 * Funciona con notas en cualquier octava del piano
 * 
 * @author Psanter Team
 * @version 3.1.0 - Un solo resultado por categoría
 */

import type { NoteName } from '../types/piano';
import { 
  REAL_CHORDS, 
  REAL_SCALES
} from '../data/musicalData';

// ========================================================================================
// TIPOS SIMPLIFICADOS - SOLO UN RESULTADO POR CATEGORÍA
// ========================================================================================

export interface SingleChordResult {
  tonic: string;
  type: string;
  name: string; // Ej: "C Major", "Am7"
  notes: string[];
  isExactMatch: boolean;
  confidence: number; // 0-1
}

export interface SingleScaleResult {
  tonic: string;
  type: string;
  name: string; // Ej: "C Major", "A Natural Minor"
  notes: string[];
  isExactMatch: boolean;
  confidence: number; // 0-1
}

export interface SimplifiedDetectionResult {
  chord: SingleChordResult | null;
  scale: SingleScaleResult | null;
  inputNotes: string[];
  hasDetection: boolean;
}

// ========================================================================================
// UTILIDADES PARA NORMALIZACIÓN DE NOTAS (SOPORTE MULTI-OCTAVA)
// ========================================================================================

/**
 * Extrae el nombre de nota sin octava (C4 → C, F#5 → F#, C8 → C)
 * FUNCIONA CON CUALQUIER OCTAVA DEL PIANO
 */
const getNoteNameOnly = (note: NoteName): string => {
  return note.replace(/\d+$/, '');
};

/**
 * Normaliza notas eliminando duplicados y octavas
 * Permite escalas/acordes en CUALQUIER combinación de octavas
 */
const normalizeNotes = (notes: NoteName[]): string[] => {
  const uniqueNotes = new Set<string>();
  notes.forEach(note => {
    uniqueNotes.add(getNoteNameOnly(note));
  });
  return Array.from(uniqueNotes).sort();
};

/**
 * Compara dos arrays de notas (sin importar orden)
 */
const areNotesEqual = (notes1: string[], notes2: string[]): boolean => {
  if (notes1.length !== notes2.length) return false;
  const sorted1 = [...notes1].sort();
  const sorted2 = [...notes2].sort();
  return sorted1.every((note, index) => note === sorted2[index]);
};

/**
 * Calcula confianza basada en coincidencias exactas
 */
const calculateConfidence = (inputNotes: string[], targetNotes: string[]): number => {
  if (targetNotes.length === 0) return 0;
  
  const matches = inputNotes.filter(note => targetNotes.includes(note)).length;
  const expectedNotes = targetNotes.length;
  const extraPenalty = Math.max(0, inputNotes.length - expectedNotes) * 0.1;
  
  return Math.max(0, (matches / expectedNotes) - extraPenalty);
};

// ========================================================================================
// DETECCIÓN SIMPLIFICADA - SOLO EL MEJOR RESULTADO
// ========================================================================================

/**
 * Encuentra EL MEJOR acorde (solo uno)
 */
const findBestChord = (inputNotes: NoteName[]): SingleChordResult | null => {
  if (inputNotes.length < 2) return null;
  
  const normalizedInput = normalizeNotes(inputNotes);
  let bestMatch: SingleChordResult | null = null;
  let bestScore = 0;
  
  // Iterar sobre todas las tónicas y tipos
  for (const [tonic, chordTypes] of Object.entries(REAL_CHORDS)) {
    for (const [type, chordNotes] of Object.entries(chordTypes)) {
      const confidence = calculateConfidence(normalizedInput, chordNotes);
      
      // Solo considerar si hay al menos 60% de coincidencia
      if (confidence >= 0.6) {
        const isExact = areNotesEqual(normalizedInput, chordNotes);
        
        // Calcular puntuación (exactos tienen prioridad)
        const score = isExact ? confidence + 1 : confidence;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            tonic,
            type,
            name: `${tonic} ${type}`,
            notes: [...chordNotes],
            isExactMatch: isExact,
            confidence
          };
        }
      }
    }
  }
  
  return bestMatch;
};

/**
 * Encuentra LA MEJOR escala (solo una)
 */
const findBestScale = (inputNotes: NoteName[]): SingleScaleResult | null => {
  if (inputNotes.length < 3) return null;
  
  const normalizedInput = normalizeNotes(inputNotes);
  let bestMatch: SingleScaleResult | null = null;
  let bestScore = 0;
  
  // Iterar sobre todas las tónicas y tipos
  for (const [tonic, scaleTypes] of Object.entries(REAL_SCALES)) {
    for (const [type, scaleNotes] of Object.entries(scaleTypes)) {
      const confidence = calculateConfidence(normalizedInput, scaleNotes);
      
      // Solo considerar si hay al menos 50% de coincidencia
      if (confidence >= 0.5) {
        const isExact = areNotesEqual(normalizedInput, scaleNotes);
        
        // Calcular puntuación (exactos tienen prioridad)
        const score = isExact ? confidence + 1 : confidence;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            tonic,
            type,
            name: `${tonic} ${type}`,
            notes: [...scaleNotes],
            isExactMatch: isExact,
            confidence
          };
        }
      }
    }
  }
  
  return bestMatch;
};

// ========================================================================================
// FUNCIÓN PRINCIPAL - DETECCIÓN SIMPLIFICADA
// ========================================================================================

/**
 * Detecta EL mejor acorde y LA mejor escala
 * FUNCIONA CON NOTAS EN CUALQUIER OCTAVA
 */
export const detectMusic = (inputNotes: NoteName[]): SimplifiedDetectionResult => {
  const normalizedInput = normalizeNotes(inputNotes);
  
  const chord = findBestChord(inputNotes);
  const scale = findBestScale(inputNotes);
  
  return {
    chord,
    scale,
    inputNotes: normalizedInput,
    hasDetection: chord !== null || scale !== null
  };
};

// ========================================================================================
// FUNCIONES DE UTILIDAD PARA LA UI
// ========================================================================================

/**
 * Formatea el resultado del acorde para mostrar
 */
export const formatChordDisplay = (chord: SingleChordResult | null): string => {
  if (!chord) return 'Ningún acorde detectado';
  
  const precision = chord.isExactMatch ? ' ✓' : ` (${Math.round(chord.confidence * 100)}%)`;
  return `${chord.name}${precision}`;
};

/**
 * Formatea el resultado de la escala para mostrar
 */
export const formatScaleDisplay = (scale: SingleScaleResult | null): string => {
  if (!scale) return 'Ninguna escala detectada';
  
  const precision = scale.isExactMatch ? ' ✓' : ` (${Math.round(scale.confidence * 100)}%)`;
  return `${scale.name}${precision}`;
};

/**
 * Obtiene las notas del acorde para mostrar
 */
export const getChordNotes = (chord: SingleChordResult | null): string => {
  if (!chord) return '';
  return chord.notes.join(' - ');
};

/**
 * Obtiene las notas de la escala para mostrar  
 */
export const getScaleNotes = (scale: SingleScaleResult | null): string => {
  if (!scale) return '';
  return scale.notes.join(' - ');
};

/**
 * Verifica si hay alguna detección exacta
 */
export const hasExactDetection = (result: SimplifiedDetectionResult): boolean => {
  return (result.chord?.isExactMatch || result.scale?.isExactMatch) || false;
};

// ========================================================================================
// FUNCIONES DE COMPATIBILIDAD Y UTILIDAD
// ========================================================================================

/**
 * Obtiene información sobre soporte multi-octava
 */
export const getOctaveInfo = () => {
  return {
    supportsMultipleOctaves: true,
    description: 'El sistema detecta acordes y escalas en cualquier combinación de octavas',
    examples: [
      'C4 + E4 + G4 = C Major',
      'C5 + E5 + G5 = C Major',  
      'C4 + E5 + G6 = C Major (mezclando octavas)',
      'C3 + D4 + E5 + F4 + G5 + A4 + B4 = C Major Scale'
    ]
  };
};

/**
 * Función de debug para verificar normalización
 */
export const debugNormalization = (notes: NoteName[]): { 
  original: NoteName[], 
  normalized: string[] 
} => {
  return {
    original: notes,
    normalized: normalizeNotes(notes)
  };
};

// ========================================================================================
// INICIALIZACIÓN Y LOGGING
// ========================================================================================

// Log de inicialización (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  console.log('🎯 Sistema de detección simplificado inicializado');
  console.log('- Un solo resultado por categoría (mejor acorde + mejor escala)');
  console.log('- Soporte completo para múltiples octavas');
  console.log('- Precisión: 100% basada en datos reales de musicalData.ts');
  
  const octaveInfo = getOctaveInfo();
  console.log(`- ${octaveInfo.description}`);
}

// Exportar como función principal
export default detectMusic;