/**
 * Utilidades fundamentales para manejo de notas musicales
 * Cálculos de frecuencia, validaciones, conversiones y análisis
 */

import type { NoteName } from '../types/piano';
import { 
  A4_FREQUENCY, 
  CHROMATIC_NOTES, 
  PIANO_RANGE 
} from '../data/musicalData';
import { PIANO_NOTES } from '../data/pianoCoordinates';

// Cache para optimizar cálculos de frecuencia
const frequencyCache = new Map<NoteName, number>();

/**
 * Calcula la frecuencia de una nota musical usando la fórmula estándar
 * f = 440 * 2^((n-69)/12) donde n es el número MIDI de la nota
 * A4 = 440Hz es la nota de referencia (número MIDI 69)
 */
export const calculateNoteFrequency = (note: NoteName): number => {
  // Verificar cache primero
  if (frequencyCache.has(note)) {
    return frequencyCache.get(note)!;
  }

  // Validar que la nota existe en nuestro piano
  if (!PIANO_NOTES.includes(note)) {
    throw new Error(`Nota inválida: ${note}. Debe estar en el rango ${PIANO_RANGE.LOWEST_NOTE}-${PIANO_RANGE.HIGHEST_NOTE}`);
  }

  // Obtener número MIDI de la nota
  const midiNumber = getMIDINumber(note);
  
  // Calcular frecuencia usando la fórmula estándar
  // A4 (440Hz) tiene número MIDI 69
  const frequency = A4_FREQUENCY * Math.pow(2, (midiNumber - 69) / 12);
  
  // Guardar en cache y retornar
  frequencyCache.set(note, frequency);
  return frequency;
};

/**
 * Convierte una nota a su número MIDI estándar
 * C4 (Middle C) = 60, A4 = 69
 */
export const getMIDINumber = (note: NoteName): number => {
  const noteName = note.replace(/\d+/, ''); // Remover octava
  const octave = parseInt(note.replace(/[A-G]#?/, '')); // Extraer octava
  
  // A0 es MIDI 21 (primera tecla del piano de 88 teclas)
  const noteIndex = CHROMATIC_NOTES.indexOf(noteName as any);
  if (noteIndex === -1) {
    throw new Error(`Nombre de nota inválido: ${noteName}`);
  }
  
  // Calcular número MIDI
  // A0 = 21, C1 = 24, etc.
  let midiNumber;
  
  if (noteName === 'A' || noteName === 'A#' || noteName === 'B') {
    // Notas A, A#, B están en la octava anterior para MIDI
    midiNumber = (octave + 1) * 12 + noteIndex + 9;
  } else {
    // Notas C, C#, D, D#, E, F, F#, G, G#
    midiNumber = octave * 12 + noteIndex + 12;
  }
  
  return midiNumber;
};

/**
 * Convierte un número MIDI a NoteName
 */
export const midiNumberToNote = (midiNumber: number): NoteName | null => {
  // Verificar que está en el rango del piano de 88 teclas
  if (midiNumber < 21 || midiNumber > 108) {
    return null;
  }
  
  const noteIndex = midiNumber % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  
  // Ajustar para A0, A#0, B0 que están en octava 0
  let finalOctave = octave;
  if (noteIndex >= 9) { // A, A#, B
    finalOctave = octave - 1;
  }
  
  const noteName = CHROMATIC_NOTES[noteIndex];
  const fullNote = `${noteName}${finalOctave}` as NoteName;
  
  // Verificar que la nota está en nuestro rango
  return PIANO_NOTES.includes(fullNote) ? fullNote : null;
};

/**
 * Determina si una nota es tecla blanca
 */
export const isWhiteKey = (note: NoteName): boolean => {
  const noteName = note.replace(/\d+/, '');
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(noteName);
};

/**
 * Determina si una nota es tecla negra
 */
export const isBlackKey = (note: NoteName): boolean => {
  return !isWhiteKey(note);
};

/**
 * Extrae la octava de una nota
 */
export const getOctave = (note: NoteName): number => {
  return parseInt(note.replace(/[A-G]#?/, ''));
};

/**
 * Extrae el nombre de la nota sin octava
 */
export const getNoteName = (note: NoteName): string => {
  return note.replace(/\d+/, '');
};

/**
 * Obtiene el índice de una nota en el piano (0-87)
 */
export const getNoteIndex = (note: NoteName): number => {
  return PIANO_NOTES.indexOf(note);
};

/**
 * Obtiene una nota por su índice en el piano
 */
export const getNoteByIndex = (index: number): NoteName | null => {
  if (index < 0 || index >= PIANO_NOTES.length) {
    return null;
  }
  return PIANO_NOTES[index];
};

/**
 * Transpone una nota por un número de semitonos
 */
export const transposeNote = (note: NoteName, semitones: number): NoteName | null => {
  const currentIndex = getNoteIndex(note);
  if (currentIndex === -1) return null;
  
  const newIndex = currentIndex + semitones;
  return getNoteByIndex(newIndex);
};

/**
 * Calcula la distancia en semitonos entre dos notas
 */
export const getInterval = (note1: NoteName, note2: NoteName): number => {
  const index1 = getNoteIndex(note1);
  const index2 = getNoteIndex(note2);
  
  if (index1 === -1 || index2 === -1) {
    throw new Error('Una o ambas notas son inválidas');
  }
  
  return index2 - index1;
};

/**
 * Obtiene la nota fundamental de una octava específica
 */
export const getNoteInOctave = (noteName: string, octave: number): NoteName | null => {
  const fullNote = `${noteName}${octave}` as NoteName;
  return PIANO_NOTES.includes(fullNote) ? fullNote : null;
};

/**
 * Valida si una cadena es un nombre de nota válido
 */
export const isValidNoteName = (noteString: string): noteString is NoteName => {
  return PIANO_NOTES.includes(noteString as NoteName);
};

/**
 * Convierte una nota a su equivalente enarmónico (si existe)
 * Ej: C# -> Db, F# -> Gb
 */
export const getEnharmonicEquivalent = (note: NoteName): string | null => {
  const noteName = getNoteName(note);
  const octave = getOctave(note);
  
  const enharmonics: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb', 
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#'
  };
  
  const enharmonic = enharmonics[noteName];
  return enharmonic ? `${enharmonic}${octave}` : null;
};

/**
 * Obtiene todas las notas en una octava específica
 */
export const getNotesInOctave = (octave: number): NoteName[] => {
  return PIANO_NOTES.filter(note => getOctave(note) === octave);
};

/**
 * Obtiene el rango de notas entre dos notas (inclusive)
 */
export const getNoteRange = (startNote: NoteName, endNote: NoteName): NoteName[] => {
  const startIndex = getNoteIndex(startNote);
  const endIndex = getNoteIndex(endNote);
  
  if (startIndex === -1 || endIndex === -1) {
    return [];
  }
  
  const start = Math.min(startIndex, endIndex);
  const end = Math.max(startIndex, endIndex);
  
  return PIANO_NOTES.slice(start, end + 1);
};

/**
 * Convierte una frecuencia a la nota más cercana
 */
export const frequencyToNote = (frequency: number): NoteName | null => {
  if (frequency <= 0) return null;
  
  // Calcular número MIDI más cercano
  const midiNumber = Math.round(69 + 12 * Math.log2(frequency / A4_FREQUENCY));
  
  return midiNumberToNote(midiNumber);
};

/**
 * Compara dos notas y retorna su orden relativo
 */
export const compareNotes = (note1: NoteName, note2: NoteName): number => {
  const index1 = getNoteIndex(note1);
  const index2 = getNoteIndex(note2);
  
  return index1 - index2;
};

/**
 * Ordena un array de notas de grave a agudo
 */
export const sortNotes = (notes: NoteName[]): NoteName[] => {
  return [...notes].sort(compareNotes);
};

/**
 * Obtiene información detallada de una nota
 */
export interface NoteInfo {
  note: NoteName;
  frequency: number;
  midiNumber: number;
  octave: number;
  noteName: string;
  isWhite: boolean;
  isBlack: boolean;
  index: number;
  enharmonic: string | null;
}

export const getNoteInfo = (note: NoteName): NoteInfo => {
  return {
    note,
    frequency: calculateNoteFrequency(note),
    midiNumber: getMIDINumber(note),
    octave: getOctave(note),
    noteName: getNoteName(note),
    isWhite: isWhiteKey(note),
    isBlack: isBlackKey(note),
    index: getNoteIndex(note),
    enharmonic: getEnharmonicEquivalent(note)
  };
};

/**
 * Estadísticas del sistema de notas
 */
export const NOTE_STATS = {
  TOTAL_NOTES: PIANO_NOTES.length,
  WHITE_KEYS: PIANO_NOTES.filter(isWhiteKey).length,
  BLACK_KEYS: PIANO_NOTES.filter(isBlackKey).length,
  OCTAVES: Math.ceil(PIANO_NOTES.length / 12),
  LOWEST_FREQUENCY: calculateNoteFrequency(PIANO_NOTES[0]),
  HIGHEST_FREQUENCY: calculateNoteFrequency(PIANO_NOTES[PIANO_NOTES.length - 1]),
  MIDDLE_C_FREQUENCY: calculateNoteFrequency('C4'),
  A4_FREQUENCY: A4_FREQUENCY
} as const;

// Validaciones al cargar el módulo
console.log('🎵 NoteUtils cargado:');
console.log('- Total notas:', NOTE_STATS.TOTAL_NOTES);
console.log('- Rango frecuencias:', NOTE_STATS.LOWEST_FREQUENCY.toFixed(2), 'Hz -', NOTE_STATS.HIGHEST_FREQUENCY.toFixed(2), 'Hz');
console.log('- A4 frecuencia:', NOTE_STATS.A4_FREQUENCY, 'Hz');
console.log('- Middle C frecuencia:', NOTE_STATS.MIDDLE_C_FREQUENCY.toFixed(2), 'Hz');

export default {
  calculateNoteFrequency,
  getMIDINumber,
  midiNumberToNote,
  isWhiteKey,
  isBlackKey,
  getOctave,
  getNoteName,
  getNoteIndex,
  getNoteByIndex,
  transposeNote,
  getInterval,
  getNoteInOctave,
  isValidNoteName,
  getEnharmonicEquivalent,
  getNotesInOctave,
  getNoteRange,
  frequencyToNote,
  compareNotes,
  sortNotes,
  getNoteInfo,
  NOTE_STATS
};