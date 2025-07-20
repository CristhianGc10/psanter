/**
 * Datos musicales completos y reales basados en teoría musical estándar
 * Escalas y acordes con notas exactas para todas las tonalidades
 */

// Frecuencia de referencia para A4
export const A4_FREQUENCY = 440; // Hz

// Notas cromáticas en orden (12 semitonos)
export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 
  'F#', 'G', 'G#', 'A', 'A#', 'B'
] as const;

export type ChromaticNote = typeof CHROMATIC_NOTES[number];

// Nombres alternativos para notas con sostenidos/bemoles
export const ENHARMONIC_EQUIVALENTS = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
} as const;

// ESCALAS REALES - Datos exactos por tonalidad
export const REAL_SCALES: Record<string, Record<string, string[]>> = {
  'C': {
    'Major': ['C','D','E','F','G','A','B'],
    'Minor': ['C','D','Eb','F','G','Ab','Bb'],
    'Harmonic Minor': ['C','D','Eb','F','G','Ab','B'],
    'Melodic Minor': ['C','D','Eb','F','G','A','B'],
    'Pentatonic Major': ['C','D','E','G','A'],
    'Pentatonic Minor': ['C','Eb','F','G','Bb'],
    'Blues': ['C','Eb','F','Gb','G','Bb'],
    'Dorian': ['C','D','Eb','F','G','A','Bb'],
    'Mixolydian': ['C','D','E','F','G','A','Bb'],
    'Phrygian': ['C','Db','Eb','F','G','Ab','Bb'],
    'Lydian': ['C','D','E','Gb','G','A','B'],
    'Locrian': ['C','Db','Eb','F','Gb','Ab','Bb']
  },
  'C#': {
    'Major': ['C#','Eb','F','F#','G#','A#','C'],
    'Minor': ['C#','Eb','E','F#','G#','A','B'],
    'Harmonic Minor': ['C#','Eb','E','F#','G#','A','C'],
    'Melodic Minor': ['C#','Eb','E','F#','G#','A#','C'],
    'Pentatonic Major': ['C#','Eb','F#','G#','A#'],
    'Pentatonic Minor': ['C#','E','F#','G#','B'],
    'Blues': ['C#','E','F#','G','G#','B']
  },
  'D': {
    'Major': ['D','E','F#','G','A','B','C#'],
    'Minor': ['D','E','F','G','A','Bb','C'],
    'Harmonic Minor': ['D','E','F','G','A','Bb','C#'],
    'Melodic Minor': ['D','E','F','G','A','B','C#'],
    'Pentatonic Major': ['D','E','F#','A','B'],
    'Pentatonic Minor': ['D','F','G','A','C'],
    'Blues': ['D','F','G','Ab','A','C']
  },
  'Eb': {
    'Major': ['Eb','F','G','Ab','Bb','C','D'],
    'Minor': ['Eb','F','Gb','Ab','Bb','B','Db'],
    'Harmonic Minor': ['Eb','F','Gb','Ab','Bb','B','D'],
    'Melodic Minor': ['Eb','F','Gb','Ab','Bb','C','D'],
    'Pentatonic Major': ['Eb','F','G','Bb','C'],
    'Pentatonic Minor': ['Eb','Gb','Ab','Bb','Db'],
    'Blues': ['Eb','Gb','Ab','A','Bb','Db']
  },
  'E': {
    'Major': ['E','F#','G#','A','B','C#','D#'],
    'Minor': ['E','F#','G','A','B','C','D'],
    'Harmonic Minor': ['E','F#','G','A','B','C','D#'],
    'Melodic Minor': ['E','F#','G','A','B','C#','D#'],
    'Pentatonic Major': ['E','F#','G#','B','C#'],
    'Pentatonic Minor': ['E','G','A','B','D'],
    'Blues': ['E','G','A','Bb','B','D']
  },
  'F': {
    'Major': ['F','G','A','Bb','C','D','E'],
    'Minor': ['F','G','Ab','Bb','C','Db','Eb'],
    'Harmonic Minor': ['F','G','Ab','Bb','C','Db','E'],
    'Melodic Minor': ['F','G','Ab','Bb','C','D','E'],
    'Pentatonic Major': ['F','G','A','C','D'],
    'Pentatonic Minor': ['F','Ab','Bb','C','Eb'],
    'Blues': ['F','Ab','Bb','B','C','Eb']
  },
  'F#': {
    'Major': ['F#','G#','A#','B','C#','D#','F'],
    'Minor': ['F#','G#','A','B','C#','D','E'],
    'Harmonic Minor': ['F#','G#','A','B','C#','D','F'],
    'Melodic Minor': ['F#','G#','A','B','C#','D#','F'],
    'Pentatonic Major': ['F#','G#','A#','C#','D#'],
    'Pentatonic Minor': ['F#','A','B','C#','E'],
    'Blues': ['F#','A','B','C','C#','E']
  },
  'G': {
    'Major': ['G','A','B','C','D','E','F#'],
    'Minor': ['G','A','Bb','C','D','Eb','F'],
    'Harmonic Minor': ['G','A','Bb','C','D','Eb','F#'],
    'Melodic Minor': ['G','A','Bb','C','D','E','F#'],
    'Pentatonic Major': ['G','A','B','D','E'],
    'Pentatonic Minor': ['G','Bb','C','D','F'],
    'Blues': ['G','Bb','C','Db','D','F']
  },
  'G#': {
    'Major': ['G#','A#','C','C#','D#','F','G'],
    'Minor': ['G#','A#','B','C#','D#','E','F#'],
    'Harmonic Minor': ['G#','A#','B','C#','D#','E','G'],
    'Melodic Minor': ['G#','A#','B','C#','D#','F','G'],
    'Pentatonic Major': ['G#','A#','C','D#','F'],
    'Pentatonic Minor': ['G#','B','C#','D#','F#'],
    'Blues': ['G#','B','C#','D','D#','F#']
  },
  'A': {
    'Major': ['A','B','C#','D','E','F#','G#'],
    'Minor': ['A','B','C','D','E','F','G'],
    'Harmonic Minor': ['A','B','C','D','E','F','G#'],
    'Melodic Minor': ['A','B','C','D','E','F#','G#'],
    'Pentatonic Major': ['A','B','C#','E','F#'],
    'Pentatonic Minor': ['A','C','D','E','G'],
    'Blues': ['A','C','D','Eb','E','G']
  },
  'Bb': {
    'Major': ['Bb','C','D','Eb','F','G','A'],
    'Minor': ['Bb','C','Db','Eb','F','Gb','Ab'],
    'Harmonic Minor': ['Bb','C','Db','Eb','F','Gb','A'],
    'Melodic Minor': ['Bb','C','Db','Eb','F','G','A'],
    'Pentatonic Major': ['Bb','C','D','F','G'],
    'Pentatonic Minor': ['Bb','Db','Eb','F','Ab'],
    'Blues': ['Bb','Db','Eb','E','F','Ab']
  },
  'B': {
    'Major': ['B','C#','D#','E','F#','G#','A#'],
    'Minor': ['B','C#','D','E','F#','G','A'],
    'Harmonic Minor': ['B','C#','D','E','F#','G','A#'],
    'Melodic Minor': ['B','C#','D','E','F#','G#','A#'],
    'Pentatonic Major': ['B','C#','D#','F#','G#'],
    'Pentatonic Minor': ['B','D','E','F#','A'],
    'Blues': ['B','D','E','F','F#','A']
  }
};

// ACORDES REALES - Datos exactos por tonalidad
export const REAL_CHORDS: Record<string, Record<string, string[]>> = {
  'C': {
    'Major': ['C','E','G'],
    'Minor': ['C','Eb','G'],
    '5': ['C','G'],
    'Dominant 7th': ['C','E','G','Bb'],
    'Major 7th': ['C','E','G','B'],
    'Minor 7th': ['C','Eb','G','Bb'],
    'Minor Major 7th': ['C','Eb','G','B'],
    'Sus 4': ['C','F','G'],
    'Sus 2': ['C','D','G'],
    '6': ['C','E','G','A'],
    'Minor 6': ['C','Eb','G','A'],
    '9': ['C','E','G','Bb','D'],
    'Minor 9': ['C','Eb','G','Bb','D'],
    'Major 9': ['C','E','G','B','D'],
    'add 9': ['C','E','G','D'],
    'Diminished': ['C','Eb','Gb'],
    'Augmented': ['C','E','G#']
  },
  'C#': {
    'Major': ['C#','F','G#'],
    'Minor': ['C#','E','G#'],
    '5': ['C#','G#'],
    'Dominant 7th': ['C#','F','G#','B'],
    'Major 7th': ['C#','F','G#','C'],
    'Minor 7th': ['C#','E','G#','B'],
    'Sus 4': ['C#','F#','G#'],
    'Sus 2': ['C#','D#','G#']
  },
  'D': {
    'Major': ['D','F#','A'],
    'Minor': ['D','F','A'],
    '5': ['D','A'],
    'Dominant 7th': ['D','F#','A','C'],
    'Major 7th': ['D','F#','A','C#'],
    'Minor 7th': ['D','F','A','C'],
    'Sus 4': ['D','G','A'],
    'Sus 2': ['D','E','A']
  },
  'Eb': {
    'Major': ['Eb','G','Bb'],
    'Minor': ['Eb','Gb','Bb'],
    '5': ['Eb','Bb'],
    'Dominant 7th': ['Eb','G','Bb','Db'],
    'Major 7th': ['Eb','G','Bb','D'],
    'Minor 7th': ['Eb','Gb','Bb','Db'],
    'Sus 4': ['Eb','Ab','Bb'],
    'Sus 2': ['Eb','F','Bb']
  },
  'E': {
    'Major': ['E','G#','B'],
    'Minor': ['E','G','B'],
    '5': ['E','B'],
    'Dominant 7th': ['E','G#','B','D'],
    'Major 7th': ['E','G#','B','D#'],
    'Minor 7th': ['E','G','B','D'],
    'Sus 4': ['E','A','B'],
    'Sus 2': ['E','F#','B']
  },
  'F': {
    'Major': ['F','A','C'],
    'Minor': ['F','Ab','C'],
    '5': ['F','C'],
    'Dominant 7th': ['F','A','C','Eb'],
    'Major 7th': ['F','A','C','E'],
    'Minor 7th': ['F','Ab','C','Eb'],
    'Sus 4': ['F','Bb','C'],
    'Sus 2': ['F','G','C']
  },
  'F#': {
    'Major': ['F#','A#','C#'],
    'Minor': ['F#','A','C#'],
    '5': ['F#','C#'],
    'Dominant 7th': ['F#','A#','C#','E'],
    'Major 7th': ['F#','A#','C#','F'],
    'Minor 7th': ['F#','A','C#','E'],
    'Sus 4': ['F#','B','C#'],
    'Sus 2': ['F#','G#','C#']
  },
  'G': {
    'Major': ['G','B','D'],
    'Minor': ['G','Bb','D'],
    '5': ['G','D'],
    'Dominant 7th': ['G','B','D','F'],
    'Major 7th': ['G','B','D','F#'],
    'Minor 7th': ['G','Bb','D','F'],
    'Sus 4': ['G','C','D'],
    'Sus 2': ['G','A','D']
  },
  'G#': {
    'Major': ['G#','C','D#'],
    'Minor': ['G#','B','D#'],
    '5': ['G#','D#'],
    'Dominant 7th': ['G#','C','D#','F#'],
    'Major 7th': ['G#','C','D#','G'],
    'Minor 7th': ['G#','B','D#','F#'],
    'Sus 4': ['G#','C#','D#'],
    'Sus 2': ['G#','A#','D#']
  },
  'A': {
    'Major': ['A','C#','E'],
    'Minor': ['A','C','E'],
    '5': ['A','E'],
    'Dominant 7th': ['A','C#','E','G'],
    'Major 7th': ['A','C#','E','G#'],
    'Minor 7th': ['A','C','E','G'],
    'Sus 4': ['A','D','E'],
    'Sus 2': ['A','B','E']
  },
  'Bb': {
    'Major': ['Bb','D','F'],
    'Minor': ['Bb','Db','F'],
    '5': ['Bb','F'],
    'Dominant 7th': ['Bb','D','F','Ab'],
    'Major 7th': ['Bb','D','F','A'],
    'Minor 7th': ['Bb','Db','F','Ab'],
    'Sus 4': ['Bb','Eb','F'],
    'Sus 2': ['Bb','C','F']
  },
  'B': {
    'Major': ['B','D#','F#'],
    'Minor': ['B','D','F#'],
    '5': ['B','F#'],
    'Dominant 7th': ['B','D#','F#','A'],
    'Major 7th': ['B','D#','F#','A#'],
    'Minor 7th': ['B','D','F#','A'],
    'Sus 4': ['B','E','F#'],
    'Sus 2': ['B','C#','F#']
  }
};

// Patrones de acordes para generación (intervalos desde la fundamental)
export const CHORD_PATTERNS = {
  MAJOR: [0, 4, 7],
  MINOR: [0, 3, 7],
  DIMINISHED: [0, 3, 6],
  AUGMENTED: [0, 4, 8],
  DOMINANT_7: [0, 4, 7, 10],
  MAJOR_7: [0, 4, 7, 11],
  MINOR_7: [0, 3, 7, 10],
  MINOR_MAJOR_7: [0, 3, 7, 11],
  SUS_2: [0, 2, 7],
  SUS_4: [0, 5, 7],
  SIXTH: [0, 4, 7, 9],
  MINOR_SIXTH: [0, 3, 7, 9],
  NINTH: [0, 4, 7, 10, 14],
  MINOR_NINTH: [0, 3, 7, 10, 14],
  MAJOR_NINTH: [0, 4, 7, 11, 14],
  ADD_9: [0, 4, 7, 14],
  MINOR_ADD_9: [0, 3, 7, 14]
} as const;

// Patrones de escalas (intervalos desde la tónica)
export const SCALE_PATTERNS = {
  MAJOR: [0, 2, 4, 5, 7, 9, 11],
  NATURAL_MINOR: [0, 2, 3, 5, 7, 8, 10],
  HARMONIC_MINOR: [0, 2, 3, 5, 7, 8, 11],
  MELODIC_MINOR: [0, 2, 3, 5, 7, 9, 11],
  MAJOR_PENTATONIC: [0, 2, 4, 7, 9],
  MINOR_PENTATONIC: [0, 3, 5, 7, 10],
  BLUES: [0, 3, 5, 6, 7, 10],
  DORIAN: [0, 2, 3, 5, 7, 9, 10],
  MIXOLYDIAN: [0, 2, 4, 5, 7, 9, 10],
  PHRYGIAN: [0, 1, 3, 5, 7, 8, 10],
  LYDIAN: [0, 2, 4, 6, 7, 9, 11],
  LOCRIAN: [0, 1, 3, 5, 6, 8, 10],
  CHROMATIC: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
} as const;

// Nombres de acordes para display
export const CHORD_NAMES = {
  MAJOR: '',
  MINOR: 'm',
  DIMINISHED: '°',
  AUGMENTED: '+',
  DOMINANT_7: '7',
  MAJOR_7: 'maj7',
  MINOR_7: 'm7',
  MINOR_MAJOR_7: 'm(maj7)',
  SUS_2: 'sus2',
  SUS_4: 'sus4',
  SIXTH: '6',
  MINOR_SIXTH: 'm6',
  NINTH: '9',
  MINOR_NINTH: 'm9',
  MAJOR_NINTH: 'maj9',
  ADD_9: 'add9',
  MINOR_ADD_9: 'm(add9)'
} as const;

// Nombres de escalas para display
export const SCALE_NAMES = {
  MAJOR: 'Major',
  NATURAL_MINOR: 'Natural Minor',
  HARMONIC_MINOR: 'Harmonic Minor',
  MELODIC_MINOR: 'Melodic Minor',
  MAJOR_PENTATONIC: 'Major Pentatonic',
  MINOR_PENTATONIC: 'Minor Pentatonic',
  BLUES: 'Blues',
  DORIAN: 'Dorian',
  MIXOLYDIAN: 'Mixolydian',
  PHRYGIAN: 'Phrygian',
  LYDIAN: 'Lydian',
  LOCRIAN: 'Locrian',
  CHROMATIC: 'Chromatic'
} as const;

// Círculo de quintas para análisis armónico
export const CIRCLE_OF_FIFTHS = [
  'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'
] as const;

// Funciones de utilidad para acceder a los datos reales
export const getRealScale = (tonic: string, scaleType: string): string[] | null => {
  const tonicData = REAL_SCALES[tonic];
  if (!tonicData) return null;
  return tonicData[scaleType] || null;
};

export const getRealChord = (tonic: string, chordType: string): string[] | null => {
  const tonicData = REAL_CHORDS[tonic];
  if (!tonicData) return null;
  return tonicData[chordType] || null;
};

export const getAllScaleTypes = (tonic: string): string[] => {
  const tonicData = REAL_SCALES[tonic];
  return tonicData ? Object.keys(tonicData) : [];
};

export const getAllChordTypes = (tonic: string): string[] => {
  const tonicData = REAL_CHORDS[tonic];
  return tonicData ? Object.keys(tonicData) : [];
};

// Configuración de rangos de octavas para el piano de 88 teclas
export const PIANO_RANGE = {
  LOWEST_NOTE: 'A0',
  HIGHEST_NOTE: 'C8',
  TOTAL_KEYS: 88,
  LOWEST_OCTAVE: 0,
  HIGHEST_OCTAVE: 8
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

// Progresiones de acordes comunes
export const COMMON_PROGRESSIONS = {
  // Progresiones en números romanos (grados de la escala)
  I_V_VI_IV: [1, 5, 6, 4], // C-G-Am-F en C mayor
  VI_IV_I_V: [6, 4, 1, 5], // Am-F-C-G en C mayor
  I_VI_IV_V: [1, 6, 4, 5], // C-Am-F-G en C mayor
  II_V_I: [2, 5, 1],       // Dm-G-C en C mayor (jazz)
  I_IV_V: [1, 4, 5],       // C-F-G en C mayor (básica)
  
  // Progresiones menores
  I_VII_VI_VII: [1, 7, 6, 7], // Am-G-F-G en A menor
  I_VI_III_VII: [1, 6, 3, 7], // Am-F-C-G en A menor
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

console.log('🎵 Datos musicales reales cargados:');
console.log('- Escalas disponibles:', Object.keys(REAL_SCALES).length, 'tonalidades');
console.log('- Acordes disponibles:', Object.keys(REAL_CHORDS).length, 'tonalidades');
console.log('- Tipos de escala:', Object.keys(SCALE_PATTERNS).length);
console.log('- Tipos de acorde:', Object.keys(CHORD_PATTERNS).length);