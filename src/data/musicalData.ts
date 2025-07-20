/**
 * Constantes musicales fundamentales para el piano virtual
 * Incluye frecuencias, patrones de acordes, escalas e intervalos
 */

// Frecuencia de referencia para A4
export const A4_FREQUENCY = 440; // Hz

// Notas cromáticas en orden (12 semitonos)
export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 
  'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

// CORRECCIÓN: Exportar el tipo ChromaticNote
export type ChromaticNote = typeof CHROMATIC_NOTES[number];

// Nombres alternativos para notas con sostenidos/bemoles
export const ENHARMONIC_EQUIVALENTS = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb'
} as const;

// Intervalos musicales en semitonos
export const INTERVALS = {
  UNISON: 0,
  MINOR_SECOND: 1,
  MAJOR_SECOND: 2,
  MINOR_THIRD: 3,
  MAJOR_THIRD: 4,
  PERFECT_FOURTH: 5,
  TRITONE: 6,
  PERFECT_FIFTH: 7,
  MINOR_SIXTH: 8,
  MAJOR_SIXTH: 9,
  MINOR_SEVENTH: 10,
  MAJOR_SEVENTH: 11,
  OCTAVE: 12
} as const;

// Patrones de acordes (intervalos desde la fundamental)
export const CHORD_PATTERNS = {
  // Acordes básicos
  MAJOR: [0, 4, 7],
  MINOR: [0, 3, 7],
  DIMINISHED: [0, 3, 6],
  AUGMENTED: [0, 4, 8],
  
  // Acordes de séptima
  MAJOR_7: [0, 4, 7, 11],
  MINOR_7: [0, 3, 7, 10],
  DOMINANT_7: [0, 4, 7, 10],
  DIMINISHED_7: [0, 3, 6, 9],
  HALF_DIMINISHED_7: [0, 3, 6, 10],
  MINOR_MAJOR_7: [0, 3, 7, 11],
  AUGMENTED_7: [0, 4, 8, 10],
  AUGMENTED_MAJOR_7: [0, 4, 8, 11],
  
  // Acordes de novena
  MAJOR_9: [0, 4, 7, 11, 14],
  MINOR_9: [0, 3, 7, 10, 14],
  DOMINANT_9: [0, 4, 7, 10, 14],
  
  // Acordes suspendidos
  SUS_2: [0, 2, 7],
  SUS_4: [0, 5, 7],
  
  // Acordes de sexta
  MAJOR_6: [0, 4, 7, 9],
  MINOR_6: [0, 3, 7, 9],
  
  // Acordes extendidos
  MAJOR_11: [0, 4, 7, 11, 14, 17],
  MINOR_11: [0, 3, 7, 10, 14, 17],
  MAJOR_13: [0, 4, 7, 11, 14, 21],
  MINOR_13: [0, 3, 7, 10, 14, 21]
} as const;

// Nombres de acordes para display
export const CHORD_NAMES = {
  MAJOR: '',
  MINOR: 'm',
  DIMINISHED: '°',
  AUGMENTED: '+',
  MAJOR_7: 'maj7',
  MINOR_7: 'm7',
  DOMINANT_7: '7',
  DIMINISHED_7: '°7',
  HALF_DIMINISHED_7: 'ø7',
  MINOR_MAJOR_7: 'm(maj7)',
  AUGMENTED_7: '+7',
  AUGMENTED_MAJOR_7: '+maj7',
  MAJOR_9: 'maj9',
  MINOR_9: 'm9',
  DOMINANT_9: '9',
  SUS_2: 'sus2',
  SUS_4: 'sus4',
  MAJOR_6: '6',
  MINOR_6: 'm6',
  MAJOR_11: 'maj11',
  MINOR_11: 'm11',
  MAJOR_13: 'maj13',
  MINOR_13: 'm13'
} as const;

// Patrones de escalas (intervalos desde la tónica)
export const SCALE_PATTERNS = {
  // Escalas mayores
  MAJOR: [0, 2, 4, 5, 7, 9, 11],
  IONIAN: [0, 2, 4, 5, 7, 9, 11], // Mismo que mayor
  
  // Escalas menores
  NATURAL_MINOR: [0, 2, 3, 5, 7, 8, 10],
  HARMONIC_MINOR: [0, 2, 3, 5, 7, 8, 11],
  MELODIC_MINOR: [0, 2, 3, 5, 7, 9, 11],
  
  // Modos griegos
  DORIAN: [0, 2, 3, 5, 7, 9, 10],
  PHRYGIAN: [0, 1, 3, 5, 7, 8, 10],
  LYDIAN: [0, 2, 4, 6, 7, 9, 11],
  MIXOLYDIAN: [0, 2, 4, 5, 7, 9, 10],
  AEOLIAN: [0, 2, 3, 5, 7, 8, 10], // Mismo que menor natural
  LOCRIAN: [0, 1, 3, 5, 6, 8, 10],
  
  // Escalas pentatónicas
  MAJOR_PENTATONIC: [0, 2, 4, 7, 9],
  MINOR_PENTATONIC: [0, 3, 5, 7, 10],
  
  // Escalas de blues
  BLUES: [0, 3, 5, 6, 7, 10],
  MAJOR_BLUES: [0, 2, 3, 4, 7, 9],
  
  // Escalas cromáticas y especiales
  CHROMATIC: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  WHOLE_TONE: [0, 2, 4, 6, 8, 10],
  DIMINISHED: [0, 1, 3, 4, 6, 7, 9, 10],
  
  // Escalas modales modernas
  LYDIAN_DOMINANT: [0, 2, 4, 6, 7, 9, 10],
  SUPER_LOCRIAN: [0, 1, 3, 4, 6, 8, 10],
  
  // Escalas étnicas
  HUNGARIAN_MINOR: [0, 2, 3, 6, 7, 8, 11],
  GYPSY: [0, 1, 4, 5, 7, 8, 10],
  SPANISH: [0, 1, 4, 5, 7, 8, 10],
  JEWISH: [0, 1, 4, 5, 7, 8, 10]
} as const;

// Nombres de escalas para display
export const SCALE_NAMES = {
  MAJOR: 'Major',
  IONIAN: 'Ionian',
  NATURAL_MINOR: 'Natural Minor',
  HARMONIC_MINOR: 'Harmonic Minor',
  MELODIC_MINOR: 'Melodic Minor',
  DORIAN: 'Dorian',
  PHRYGIAN: 'Phrygian',
  LYDIAN: 'Lydian',
  MIXOLYDIAN: 'Mixolydian',
  AEOLIAN: 'Aeolian',
  LOCRIAN: 'Locrian',
  MAJOR_PENTATONIC: 'Major Pentatonic',
  MINOR_PENTATONIC: 'Minor Pentatonic',
  BLUES: 'Blues',
  MAJOR_BLUES: 'Major Blues',
  CHROMATIC: 'Chromatic',
  WHOLE_TONE: 'Whole Tone',
  DIMINISHED: 'Diminished',
  LYDIAN_DOMINANT: 'Lydian Dominant',
  SUPER_LOCRIAN: 'Super Locrian',
  HUNGARIAN_MINOR: 'Hungarian Minor',
  GYPSY: 'Gypsy',
  SPANISH: 'Spanish',
  JEWISH: 'Jewish'
} as const;

// Circle of fifths para análisis armónico
export const CIRCLE_OF_FIFTHS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'
] as const;

// Progresiones de acordes comunes
export const COMMON_PROGRESSIONS = {
  // Progresiones en números romanos (grados de la escala)
  I_V_VI_IV: [1, 5, 6, 4], // C-G-Am-F en C mayor
  VI_IV_I_V: [6, 4, 1, 5], // Am-F-C-G en C mayor
  I_VI_IV_V: [1, 6, 4, 5], // C-Am-F-G en C mayor
  II_V_I: [2, 5, 1],       // Dm-G-C en C mayor (jazz)
  I_IV_V: [1, 4, 5],       // C-F-G en C mayor (básica)
  I_V_VI_III_IV_I_IV_V: [1, 5, 6, 3, 4, 1, 4, 5], // Pachelbel's Canon
  
  // Progresiones menores
  I_VII_VI_VII: [1, 7, 6, 7], // Am-G-F-G en A menor
  I_VI_III_VII: [1, 6, 3, 7], // Am-F-C-G en A menor
  I_IV_VII_III: [1, 4, 7, 3]  // Am-Dm-G-C en A menor
} as const;

// Configuración de rangos de octavas para el piano de 88 teclas
export const PIANO_RANGE = {
  LOWEST_NOTE: 'A0',
  HIGHEST_NOTE: 'C8',
  TOTAL_KEYS: 88,
  LOWEST_OCTAVE: 0,
  HIGHEST_OCTAVE: 8
} as const;

// Configuración de timbres/tipos de síntesis
export const SYNTH_TYPES = {
  SINE: 'sine',
  TRIANGLE: 'triangle',
  SQUARE: 'square',
  SAWTOOTH: 'sawtooth'
} as const;

// Presets de configuración ADSR
export const ADSR_PRESETS = {
  PIANO: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1.2 },
  ORGAN: { attack: 0.01, decay: 0.0, sustain: 1.0, release: 0.1 },
  STRINGS: { attack: 0.3, decay: 0.2, sustain: 0.8, release: 2.0 },
  BRASS: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.8 },
  SYNTH_PAD: { attack: 0.8, decay: 0.4, sustain: 0.7, release: 3.0 },
  PLUCK: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 }
} as const;

// Validación de tipos para TypeScript
export type ChordType = keyof typeof CHORD_PATTERNS;
export type ScaleType = keyof typeof SCALE_PATTERNS;
export type IntervalType = keyof typeof INTERVALS;
export type SynthType = typeof SYNTH_TYPES[keyof typeof SYNTH_TYPES];
export type ADSRPresetType = keyof typeof ADSR_PRESETS;