/**
 * Sistema de mapeo bidireccional entre teclado físico y notas del piano
 * Maneja distribución inteligente de 88 notas, cambio de octavas y conflictos
 */

import type { NoteName } from '../types/piano';
import type { KeyboardMappingConfig } from '../types/keyboard';
import { 
  isWhiteKey,
  isBlackKey 
} from '../data/pianoCoordinates';
import {
  MUSICAL_KEYS,
  SPECIAL_KEYS,
  IGNORED_KEYS,
  isSpecialKey,
  getSpecialKeyFunction
} from '../data/keyboardLayout';
import {
  getNoteIndex,
  getNoteByIndex,
  transposeNote,
  isValidNoteName
  // CORRECCIÓN: Remover NOTE_STATS que no se usa
} from './noteUtils';

// Estado global del mapeo de teclado
interface KeyboardMappingState {
  currentMapping: Map<string, NoteName>;
  reverseMapping: Map<NoteName, string>;
  baseOctave: number;
  octaveShift: number;
  transposition: number;
  pressedKeys: Set<string>;
  sustainActive: boolean;
  mappingMode: 'traditional' | 'chromatic' | 'custom';
}

// Estado inicial
const mappingState: KeyboardMappingState = {
  currentMapping: new Map(),
  reverseMapping: new Map(),
  baseOctave: 4, // Octava central (C4 = Middle C)
  octaveShift: 0, // Shift temporal (-3 a +3)
  transposition: 0, // Transposición en semitonos (-12 a +12)
  pressedKeys: new Set(),
  sustainActive: false,
  mappingMode: 'traditional'
};

/**
 * Genera mapeo tradicional de piano (2 octavas)
 * Fila ASDF = teclas blancas, fila QWERTY = teclas negras
 */
export const generateTraditionalMapping = (baseOctave: number = 4): Map<string, NoteName> => {
  const mapping = new Map<string, NoteName>();
  
  try {
    // Primera octava - Fila ASDF (teclas blancas) + QWERTY (teclas negras)
    const whiteKeysFirstOctave = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ'];
    const blackKeysFirstOctave = ['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'];
    const whiteNotesPattern = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackNotesPattern = ['C#', 'D#', 'F#', 'G#', 'A#'];
    
    // Mapear teclas blancas primera octava
    whiteKeysFirstOctave.forEach((key, index) => {
      if (index < whiteNotesPattern.length) {
        const note = `${whiteNotesPattern[index]}${baseOctave}` as NoteName;
        if (isValidNoteName(note)) {
          mapping.set(key, note);
        }
      }
    });
    
    // Mapear teclas negras primera octava  
    blackKeysFirstOctave.forEach((key, index) => {
      if (index < blackNotesPattern.length) {
        const note = `${blackNotesPattern[index]}${baseOctave}` as NoteName;
        if (isValidNoteName(note)) {
          mapping.set(key, note);
        }
      }
    });
    
    // Segunda octava - Fila ZXCV (teclas blancas) + números (teclas negras)
    const whiteKeysSecondOctave = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM'];
    const blackKeysSecondOctave = ['Digit2', 'Digit3', 'Digit5', 'Digit6', 'Digit7'];
    const nextOctave = baseOctave + 1;
    
    // Mapear teclas blancas segunda octava
    whiteKeysSecondOctave.forEach((key, index) => {
      if (index < whiteNotesPattern.length) {
        const note = `${whiteNotesPattern[index]}${nextOctave}` as NoteName;
        if (isValidNoteName(note)) {
          mapping.set(key, note);
        }
      }
    });
    
    // Mapear teclas negras segunda octava
    blackKeysSecondOctave.forEach((key, index) => {
      if (index < blackNotesPattern.length) {
        const note = `${blackNotesPattern[index]}${nextOctave}` as NoteName;
        if (isValidNoteName(note)) {
          mapping.set(key, note);
        }
      }
    });
    
  } catch (error) {
    console.error('Error generando mapeo tradicional:', error);
  }
  
  return mapping;
};

/**
 * Genera mapeo cromático (todas las teclas disponibles en secuencia)
 */
export const generateChromaticMapping = (startNote: NoteName = 'C3'): Map<string, NoteName> => {
  const mapping = new Map<string, NoteName>();
  
  const availableKeys = MUSICAL_KEYS.filter(key => !IGNORED_KEYS.has(key));
  const startIndex = getNoteIndex(startNote);
  
  if (startIndex === -1) {
    console.error('Nota de inicio inválida:', startNote);
    return mapping;
  }
  
  availableKeys.forEach((key, index) => {
    const noteIndex = startIndex + index;
    const note = getNoteByIndex(noteIndex);
    
    if (note && isValidNoteName(note)) {
      mapping.set(key, note);
    }
  });
  
  return mapping;
};

/**
 * Aplica shift de octava al mapeo actual
 */
export const applyOctaveShift = (mapping: Map<string, NoteName>, octaveShift: number): Map<string, NoteName> => {
  const shiftedMapping = new Map<string, NoteName>();
  const semitoneShift = octaveShift * 12;
  
  mapping.forEach((note, key) => {
    const transposedNote = transposeNote(note, semitoneShift);
    if (transposedNote && isValidNoteName(transposedNote)) {
      shiftedMapping.set(key, transposedNote);
    }
  });
  
  return shiftedMapping;
};

/**
 * Aplica transposición en semitonos al mapeo actual
 */
export const applyTransposition = (mapping: Map<string, NoteName>, semitones: number): Map<string, NoteName> => {
  const transposedMapping = new Map<string, NoteName>();
  
  mapping.forEach((note, key) => {
    const transposedNote = transposeNote(note, semitones);
    if (transposedNote && isValidNoteName(transposedNote)) {
      transposedMapping.set(key, transposedNote);
    }
  });
  
  return transposedMapping;
};

/**
 * Genera mapeo reverso (nota -> tecla)
 */
export const generateReverseMapping = (mapping: Map<string, NoteName>): Map<NoteName, string> => {
  const reverseMapping = new Map<NoteName, string>();
  
  mapping.forEach((note, key) => {
    // Si ya existe una tecla para esta nota, mantener la primera
    if (!reverseMapping.has(note)) {
      reverseMapping.set(note, key);
    }
  });
  
  return reverseMapping;
};

/**
 * Actualiza el mapeo completo basado en configuración actual
 */
export const updateMapping = (): void => {
  let baseMapping: Map<string, NoteName>;
  
  // Generar mapeo base según el modo
  switch (mappingState.mappingMode) {
    case 'traditional':
      baseMapping = generateTraditionalMapping(mappingState.baseOctave);
      break;
    case 'chromatic':
      const startNote = `C${mappingState.baseOctave}` as NoteName;
      baseMapping = generateChromaticMapping(startNote);
      break;
    case 'custom':
      // TODO: Implementar mapeo personalizado
      baseMapping = generateTraditionalMapping(mappingState.baseOctave);
      break;
    default:
      baseMapping = generateTraditionalMapping(mappingState.baseOctave);
  }
  
  // Aplicar shifts
  let finalMapping = baseMapping;
  
  if (mappingState.octaveShift !== 0) {
    finalMapping = applyOctaveShift(finalMapping, mappingState.octaveShift);
  }
  
  if (mappingState.transposition !== 0) {
    finalMapping = applyTransposition(finalMapping, mappingState.transposition);
  }
  
  // Actualizar estado
  mappingState.currentMapping = finalMapping;
  mappingState.reverseMapping = generateReverseMapping(finalMapping);
};

/**
 * Obtiene la nota asignada a una tecla física
 */
export const getNoteForKey = (keyCode: string): NoteName | null => {
  return mappingState.currentMapping.get(keyCode) || null;
};

/**
 * Obtiene la tecla física asignada a una nota
 */
export const getKeyForNote = (note: NoteName): string | null => {
  return mappingState.reverseMapping.get(note) || null;
};

/**
 * Verifica si una tecla física está presionada
 */
export const isKeyPressed = (keyCode: string): boolean => {
  return mappingState.pressedKeys.has(keyCode);
};

/**
 * Registra que una tecla física fue presionada
 */
export const pressKey = (keyCode: string): NoteName | null => {
  if (isSpecialKey(keyCode)) {
    handleSpecialKey(keyCode, true);
    return null;
  }
  
  const note = getNoteForKey(keyCode);
  if (note) {
    mappingState.pressedKeys.add(keyCode);
    return note;
  }
  
  return null;
};

/**
 * Registra que una tecla física fue soltada
 */
export const releaseKey = (keyCode: string): NoteName | null => {
  if (isSpecialKey(keyCode)) {
    handleSpecialKey(keyCode, false);
    return null;
  }
  
  const note = getNoteForKey(keyCode);
  if (note) {
    mappingState.pressedKeys.delete(keyCode);
    return note;
  }
  
  return null;
};

/**
 * Maneja teclas especiales (sustain, octavas, etc.)
 */
export const handleSpecialKey = (keyCode: string, isPressed: boolean): void => {
  const specialFunction = getSpecialKeyFunction(keyCode);
  
  if (!specialFunction) return;
  
  switch (specialFunction) {
    case 'SUSTAIN':
      mappingState.sustainActive = isPressed;
      break;
      
    case 'OCTAVE_UP':
      if (isPressed && mappingState.octaveShift < 3) {
        changeOctaveShift(1);
      }
      break;
      
    case 'OCTAVE_DOWN':
      if (isPressed && mappingState.octaveShift > -3) {
        changeOctaveShift(-1);
      }
      break;
      
    case 'ALL_NOTES_OFF':
      if (isPressed) {
        clearAllPressed();
      }
      break;
  }
};

/**
 * Cambia el shift de octava temporal
 */
export const changeOctaveShift = (delta: number): void => {
  const newShift = Math.max(-3, Math.min(3, mappingState.octaveShift + delta));
  
  if (newShift !== mappingState.octaveShift) {
    mappingState.octaveShift = newShift;
    updateMapping();
    console.log(`🎹 Octave shift: ${newShift > 0 ? '+' : ''}${newShift}`);
  }
};

/**
 * Cambia la transposición en semitonos
 */
export const changeTransposition = (semitones: number): void => {
  const newTransposition = Math.max(-12, Math.min(12, semitones));
  
  if (newTransposition !== mappingState.transposition) {
    mappingState.transposition = newTransposition;
    updateMapping();
    console.log(`🎵 Transposition: ${newTransposition > 0 ? '+' : ''}${newTransposition} semitones`);
  }
};

/**
 * Cambia la octava base del mapeo
 */
export const changeBaseOctave = (octave: number): void => {
  const newOctave = Math.max(0, Math.min(8, octave));
  
  if (newOctave !== mappingState.baseOctave) {
    mappingState.baseOctave = newOctave;
    updateMapping();
    console.log(`🎹 Base octave: ${newOctave}`);
  }
};

/**
 * Cambia el modo de mapeo
 */
export const changeMappingMode = (mode: 'traditional' | 'chromatic' | 'custom'): void => {
  if (mode !== mappingState.mappingMode) {
    mappingState.mappingMode = mode;
    updateMapping();
    console.log(`🎹 Mapping mode: ${mode}`);
  }
};

/**
 * Limpia todas las teclas presionadas
 */
export const clearAllPressed = (): void => {
  mappingState.pressedKeys.clear();
  mappingState.sustainActive = false;
};

/**
 * Obtiene el estado actual del sustain
 */
export const isSustainActive = (): boolean => {
  return mappingState.sustainActive;
};

/**
 * Obtiene todas las notas actualmente presionadas
 */
export const getPressedNotes = (): NoteName[] => {
  const notes: NoteName[] = [];
  
  mappingState.pressedKeys.forEach(keyCode => {
    const note = getNoteForKey(keyCode);
    if (note) {
      notes.push(note);
    }
  });
  
  return notes;
};

/**
 * Obtiene estadísticas del mapeo actual
 */
export const getMappingStats = () => {
  const totalMapped = mappingState.currentMapping.size;
  const whiteKeysMapped = Array.from(mappingState.currentMapping.values())
    .filter(note => isWhiteKey(note)).length;
  const blackKeysMapped = Array.from(mappingState.currentMapping.values())
    .filter(note => isBlackKey(note)).length;
  
  return {
    totalMapped,
    whiteKeysMapped,
    blackKeysMapped,
    baseOctave: mappingState.baseOctave,
    octaveShift: mappingState.octaveShift,
    transposition: mappingState.transposition,
    mappingMode: mappingState.mappingMode,
    sustainActive: mappingState.sustainActive,
    pressedKeysCount: mappingState.pressedKeys.size,
    availableKeys: MUSICAL_KEYS.length,
    specialKeys: Object.keys(SPECIAL_KEYS).length
  };
};

/**
 * Obtiene información detallada del mapeo para debugging
 */
export const getMappingInfo = () => {
  const mapping: Record<string, string> = {};
  const reverseMapping: Record<string, string> = {};
  
  mappingState.currentMapping.forEach((note, key) => {
    mapping[key] = note;
  });
  
  mappingState.reverseMapping.forEach((key, note) => {
    reverseMapping[note] = key;
  });
  
  return {
    mapping,
    reverseMapping,
    stats: getMappingStats(),
    pressedKeys: Array.from(mappingState.pressedKeys),
    pressedNotes: getPressedNotes()
  };
};

/**
 * Resetea el mapeo a configuración por defecto
 */
export const resetMapping = (): void => {
  mappingState.baseOctave = 4;
  mappingState.octaveShift = 0;
  mappingState.transposition = 0;
  mappingState.mappingMode = 'traditional';
  mappingState.pressedKeys.clear();
  mappingState.sustainActive = false;
  
  updateMapping();
  console.log('🎹 Mapeo reseteado a configuración por defecto');
};

/**
 * Valida si una configuración de mapeo es válida
 */
export const validateMappingConfig = (config: Partial<KeyboardMappingConfig>): boolean => {
  try {
    if (config.octaveShift !== undefined) {
      if (config.octaveShift < -3 || config.octaveShift > 3) return false;
    }
    
    if (config.transposeShift !== undefined) {
      if (config.transposeShift < -12 || config.transposeShift > 12) return false;
    }
    
    if (config.velocityRange !== undefined) {
      const { min, max } = config.velocityRange;
      if (min < 0 || min > 1 || max < 0 || max > 1 || min >= max) return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Inicializar mapeo por defecto
updateMapping();

// Logging inicial
const initialStats = getMappingStats();
console.log('🎹 KeyMapping inicializado:');
console.log('- Modo:', initialStats.mappingMode);
console.log('- Octava base:', initialStats.baseOctave);
console.log('- Teclas mapeadas:', initialStats.totalMapped);
console.log('- Blancas/Negras:', initialStats.whiteKeysMapped, '/', initialStats.blackKeysMapped);

export default {
  generateTraditionalMapping,
  generateChromaticMapping,
  updateMapping,
  getNoteForKey,
  getKeyForNote,
  isKeyPressed,
  pressKey,
  releaseKey,
  handleSpecialKey,
  changeOctaveShift,
  changeTransposition,
  changeBaseOctave,
  changeMappingMode,
  clearAllPressed,
  isSustainActive,
  getPressedNotes,
  getMappingStats,
  getMappingInfo,
  resetMapping,
  validateMappingConfig
};