/**
 * Layout completo del teclado físico y mapeo a notas del piano
 * Incluye todas las filas del teclado, modificadores y teclas especiales
 */

import type { NoteName } from '../types/piano';
import { PIANO_NOTES } from './pianoCoordinates';

// Definición de filas del teclado físico
export const KEYBOARD_ROWS = {
  // Fila 1: Teclas de función y especiales
  FUNCTION_ROW: [
    'Escape', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    'PrintScreen', 'ScrollLock', 'Pause'
  ],
  
  // Fila 2: Números y símbolos
  NUMBER_ROW: [
    'Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
    'Minus', 'Equal', 'Backspace'
  ],
  
  // Fila 3: QWERTY superior
  TOP_ROW: [
    'Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
    'BracketLeft', 'BracketRight', 'Backslash'
  ],
  
  // Fila 4: ASDF (home row)
  HOME_ROW: [
    'CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
    'Semicolon', 'Quote', 'Enter'
  ],
  
  // Fila 5: ZXCV inferior
  BOTTOM_ROW: [
    'ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM',
    'Comma', 'Period', 'Slash', 'ShiftRight'
  ],
  
  // Fila 6: Modificadores y barra espaciadora
  MODIFIER_ROW: [
    'ControlLeft', 'MetaLeft', 'AltLeft', 'Space', 'AltRight', 'MetaRight', 'ContextMenu', 'ControlRight'
  ],
  
  // Teclado numérico
  NUMPAD: [
    'NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract',
    'Numpad7', 'Numpad8', 'Numpad9', 'NumpadAdd',
    'Numpad4', 'Numpad5', 'Numpad6',
    'Numpad1', 'Numpad2', 'Numpad3', 'NumpadEnter',
    'Numpad0', 'NumpadDecimal'
  ],
  
  // Teclas de navegación
  NAVIGATION: [
    'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'
  ]
} as const;

// Teclas especiales para control del piano
export const SPECIAL_KEYS = {
  // Control de sustain
  SUSTAIN: 'Space',
  
  // Control de octavas
  OCTAVE_UP: 'ArrowUp',
  OCTAVE_DOWN: 'ArrowDown',
  
  // Control de volumen
  VOLUME_UP: 'Equal',      // Tecla +/=
  VOLUME_DOWN: 'Minus',    // Tecla -/_
  
  // Control del metrónomo
  METRONOME_TOGGLE: 'KeyM',
  TEMPO_UP: 'BracketRight',   // Tecla ]
  TEMPO_DOWN: 'BracketLeft',  // Tecla [
  
  // Cambio de preset de sonido
  PRESET_NEXT: 'Period',      // Tecla .
  PRESET_PREV: 'Comma',       // Tecla ,
  
  // Control de grabación/reproducción
  RECORD_TOGGLE: 'KeyR',
  PLAY_TOGGLE: 'KeyP',
  
  // Reset/panic
  ALL_NOTES_OFF: 'Escape'
} as const;

// Teclas principales para mapeo musical (las más accesibles)
export const MUSICAL_KEYS = [
  // Fila principal (números) - para una octava completa
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0',
  
  // Fila QWERTY
  'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP',
  
  // Fila ASDF
  'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL',
  
  // Fila ZXCV
  'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN',
  
  // Teclas adicionales para más rango
  'Tab', 'Backquote', 'Semicolon', 'Quote', 'Backslash',
  'BracketLeft', 'BracketRight'
] as const;

// Layout de piano estilo tradicional (2 octavas en el teclado)
export const PIANO_LAYOUT_TRADITIONAL = {
  // Primera octava: fila ASDF como teclas blancas, fila QWERTY como negras
  WHITE_KEYS_1: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ'], // C, D, E, F, G, A, B
  BLACK_KEYS_1: ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'],                 // C#, D#, F#, G#, A#
  
  // Segunda octava: fila ZXCV + números
  WHITE_KEYS_2: ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'], // C, D, E, F, G, A, B
  BLACK_KEYS_2: ['Digit2', 'Digit3', 'Digit5', 'Digit6', 'Digit7']        // C#, D#, F#, G#, A#
} as const;

// Estado del teclado
export interface KeyboardState {
  currentOctave: number;
  sustainActive: boolean;
  pressedKeys: Set<string>;
  octaveRange: {
    min: number;
    max: number;
  };
}

// Estado inicial del teclado
export const INITIAL_KEYBOARD_STATE: KeyboardState = {
  currentOctave: 4, // C4 como octava central
  sustainActive: false,
  pressedKeys: new Set(),
  octaveRange: {
    min: 0,
    max: 8
  }
};

// Función para generar mapeo dinámico basado en octava actual
export const generateKeyToNoteMapping = (baseOctave: number = 4): Map<string, NoteName> => {
  const mapping = new Map<string, NoteName>();
  
  // Mapeo tradicional de piano de 2 octavas
  const whiteNotePattern = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackNotePattern = ['C#', 'D#', 'F#', 'G#', 'A#'];
  
  // Primera octava (octava base)
  PIANO_LAYOUT_TRADITIONAL.WHITE_KEYS_1.forEach((key, index) => {
    if (index < whiteNotePattern.length) {
      const note = `${whiteNotePattern[index]}${baseOctave}` as NoteName;
      if (PIANO_NOTES.includes(note)) {
        mapping.set(key, note);
      }
    }
  });
  
  PIANO_LAYOUT_TRADITIONAL.BLACK_KEYS_1.forEach((key, index) => {
    if (index < blackNotePattern.length) {
      const note = `${blackNotePattern[index]}${baseOctave}` as NoteName;
      if (PIANO_NOTES.includes(note)) {
        mapping.set(key, note);
      }
    }
  });
  
  // Segunda octava (octava base + 1)
  const nextOctave = baseOctave + 1;
  PIANO_LAYOUT_TRADITIONAL.WHITE_KEYS_2.forEach((key, index) => {
    if (index < whiteNotePattern.length) {
      const note = `${whiteNotePattern[index]}${nextOctave}` as NoteName;
      if (PIANO_NOTES.includes(note)) {
        mapping.set(key, note);
      }
    }
  });
  
  PIANO_LAYOUT_TRADITIONAL.BLACK_KEYS_2.forEach((key, index) => {
    if (index < blackNotePattern.length) {
      const note = `${blackNotePattern[index]}${nextOctave}` as NoteName;
      if (PIANO_NOTES.includes(note)) {
        mapping.set(key, note);
      }
    }
  });
  
  return mapping;
};

// Función para generar mapeo inverso (nota a tecla)
export const generateNoteToKeyMapping = (baseOctave: number = 4): Map<NoteName, string> => {
  const noteToKey = new Map<NoteName, string>();
  const keyToNote = generateKeyToNoteMapping(baseOctave);
  
  keyToNote.forEach((note, key) => {
    noteToKey.set(note, key);
  });
  
  return noteToKey;
};

// Mapeo completo de todas las teclas disponibles
export const ALL_AVAILABLE_KEYS = [
  ...KEYBOARD_ROWS.FUNCTION_ROW,
  ...KEYBOARD_ROWS.NUMBER_ROW,
  ...KEYBOARD_ROWS.TOP_ROW,
  ...KEYBOARD_ROWS.HOME_ROW,
  ...KEYBOARD_ROWS.BOTTOM_ROW,
  ...KEYBOARD_ROWS.MODIFIER_ROW,
  ...KEYBOARD_ROWS.NUMPAD,
  ...KEYBOARD_ROWS.NAVIGATION
] as const;

// Teclas que deben ser ignoradas para el mapeo musical
export const IGNORED_KEYS = new Set([
  'CapsLock', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
  'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'ContextMenu',
  'NumLock', 'ScrollLock', 'Pause', 'PrintScreen', 'Insert', 'Delete',
  'Home', 'End', 'PageUp', 'PageDown', 'Enter', 'Backspace', 'Tab'
]);

// Función para verificar si una tecla es válida para mapeo musical
export const isValidMusicalKey = (keyCode: string): boolean => {
  return MUSICAL_KEYS.includes(keyCode as any) && !IGNORED_KEYS.has(keyCode);
};

// Función para verificar si una tecla es especial
export const isSpecialKey = (keyCode: string): boolean => {
  return Object.values(SPECIAL_KEYS).includes(keyCode as any);
};

// Función para obtener el tipo de tecla especial
export const getSpecialKeyFunction = (keyCode: string): string | undefined => {
  const specialKey = Object.entries(SPECIAL_KEYS).find(([_, key]) => key === keyCode);
  return specialKey ? specialKey[0] : undefined;
};

// Configuración predeterminada de octavas para diferentes rangos del piano
export const OCTAVE_PRESETS = {
  BASS: { base: 2, name: 'Bass Range (C2-B3)' },
  LOW: { base: 3, name: 'Low Range (C3-B4)' },
  MIDDLE: { base: 4, name: 'Middle Range (C4-B5)' },
  HIGH: { base: 5, name: 'High Range (C5-B6)' },
  TREBLE: { base: 6, name: 'Treble Range (C6-B7)' }
} as const;

// Función para calcular cuántas teclas están disponibles para mapeo
export const getAvailableKeyCount = (): number => {
  return MUSICAL_KEYS.filter(key => !IGNORED_KEYS.has(key)).length;
};

// Función para distribuir las 88 notas entre las teclas disponibles
export const generateFullKeyboardMapping = (): Map<string, NoteName> => {
  const availableKeys = MUSICAL_KEYS.filter(key => !IGNORED_KEYS.has(key));
  const mapping = new Map<string, NoteName>();
  
  // Distribución inteligente: usar las teclas más accesibles para el rango medio
  const totalKeys = availableKeys.length;
  const totalNotes = PIANO_NOTES.length;
  
  // Empezar desde una nota que permita un buen rango
  const startNoteIndex = Math.max(0, Math.floor((totalNotes - totalKeys) / 2));
  
  availableKeys.forEach((key, index) => {
    const noteIndex = startNoteIndex + index;
    if (noteIndex < PIANO_NOTES.length) {
      mapping.set(key, PIANO_NOTES[noteIndex]);
    }
  });
  
  return mapping;
};

// Estadísticas del mapeo de teclado
export const KEYBOARD_MAPPING_STATS = {
  TOTAL_PHYSICAL_KEYS: ALL_AVAILABLE_KEYS.length,
  MUSICAL_KEYS_COUNT: MUSICAL_KEYS.length,
  AVAILABLE_FOR_NOTES: getAvailableKeyCount(),
  SPECIAL_KEYS_COUNT: Object.keys(SPECIAL_KEYS).length,
  IGNORED_KEYS_COUNT: IGNORED_KEYS.size,
  PIANO_NOTES_COUNT: PIANO_NOTES.length
} as const;

// Validaciones
console.log('Keyboard Mapping Statistics:', KEYBOARD_MAPPING_STATS);
console.log('Can map all piano notes:', KEYBOARD_MAPPING_STATS.AVAILABLE_FOR_NOTES >= KEYBOARD_MAPPING_STATS.PIANO_NOTES_COUNT);

// Exportar mapeo por defecto con octava central
export const DEFAULT_KEY_TO_NOTE_MAPPING = generateKeyToNoteMapping(4);
export const DEFAULT_NOTE_TO_KEY_MAPPING = generateNoteToKeyMapping(4);