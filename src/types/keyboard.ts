// Tipos para mapeo del teclado físico al piano virtual

import type { NoteName } from './piano';

// Códigos de teclas físicas estándar
export type PhysicalKey = 
  // Fila de números
  | 'Backquote' | 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' 
  | 'Digit6' | 'Digit7' | 'Digit8' | 'Digit9' | 'Digit0' | 'Minus' | 'Equal'
  // Fila superior de letras
  | 'KeyQ' | 'KeyW' | 'KeyE' | 'KeyR' | 'KeyT' | 'KeyY' 
  | 'KeyU' | 'KeyI' | 'KeyO' | 'KeyP' | 'BracketLeft' | 'BracketRight' | 'Backslash'
  // Fila central de letras
  | 'KeyA' | 'KeyS' | 'KeyD' | 'KeyF' | 'KeyG' | 'KeyH' 
  | 'KeyJ' | 'KeyK' | 'KeyL' | 'Semicolon' | 'Quote'
  // Fila inferior de letras
  | 'KeyZ' | 'KeyX' | 'KeyC' | 'KeyV' | 'KeyB' | 'KeyN' 
  | 'KeyM' | 'Comma' | 'Period' | 'Slash'
  // Teclas de función
  | 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8' | 'F9' | 'F10' | 'F11' | 'F12'
  // Teclas especiales
  | 'Space' | 'Tab' | 'CapsLock' | 'ShiftLeft' | 'ShiftRight'
  | 'ControlLeft' | 'ControlRight' | 'AltLeft' | 'AltRight'
  | 'Enter' | 'Backspace' | 'Delete' | 'Insert' | 'Home' | 'End' | 'PageUp' | 'PageDown'
  // Teclas de flecha
  | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'
  // Teclado numérico
  | 'NumLock' | 'Numpad0' | 'Numpad1' | 'Numpad2' | 'Numpad3' | 'Numpad4'
  | 'Numpad5' | 'Numpad6' | 'Numpad7' | 'Numpad8' | 'Numpad9'
  | 'NumpadAdd' | 'NumpadSubtract' | 'NumpadMultiply' | 'NumpadDivide'
  | 'NumpadDecimal' | 'NumpadEnter';

// Tipos de funciones especiales para teclas
export type SpecialFunction = 
  | 'sustain_pedal'
  | 'octave_up'
  | 'octave_down'
  | 'volume_up'
  | 'volume_down'
  | 'metronome_toggle'
  | 'record_toggle'
  | 'all_notes_off'
  | 'transpose_up'
  | 'transpose_down';

// Mapeo individual de tecla física a nota o función
export interface KeyMapping {
  physicalKey: PhysicalKey;
  pianoNote?: NoteName;
  specialFunction?: SpecialFunction;
  modifier?: boolean; // Si requiere modificador (shift, ctrl, etc.)
  description: string;
  group?: string; // Agrupación lógica (ej: 'white_keys', 'black_keys', 'controls')
}

// Layout completo del teclado
export interface KeyboardLayout {
  name: string;
  description: string;
  mappings: KeyMapping[];
  baseOctave: number; // Octava base para el mapeo
  totalOctaves: number; // Cuántas octavas abarca el layout
}

// Configuración del mapeo de teclado
export interface KeyboardMappingConfig {
  enabled: boolean;
  currentLayout: string;
  customLayouts: Record<string, KeyboardLayout>;
  preventRepeat: boolean; // Prevenir auto-repeat de teclas
  octaveShift: number; // Shift de octava actual (-3 a +3)
  transposeShift: number; // Transposición en semitonos (-12 a +12)
  velocitySensitive: boolean; // Si la velocidad depende de timing
  velocityRange: {
    min: number; // Velocidad mínima (0-1)
    max: number; // Velocidad máxima (0-1)
  };
}

// Estado de las teclas físicas
export interface KeyboardState {
  pressedKeys: Set<PhysicalKey>;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  lastKeyTime: number;
  keyRepeatPrevention: Map<PhysicalKey, number>;
}

// Evento de tecla física
export interface PhysicalKeyEvent {
  key: PhysicalKey;
  type: 'keydown' | 'keyup';
  timestamp: number;
  modifiers: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
  repeat: boolean;
  code: string;
  originalEvent: KeyboardEvent;
}

// Layouts predefinidos de teclado
export type PresetLayout = 
  | 'qwerty_piano' // Layout tipo piano en QWERTY
  | 'qwerty_chromatic' // Layout cromático en QWERTY
  | 'dvorak_piano' // Layout para teclado Dvorak
  | 'colemak_piano' // Layout para teclado Colemak
  | 'custom'; // Layout personalizado

// Configuración de row del teclado físico
export interface KeyboardRow {
  id: number;
  name: string;
  keys: PhysicalKey[];
  defaultStartNote?: NoteName;
  type: 'number' | 'qwerty_top' | 'qwerty_middle' | 'qwerty_bottom' | 'function' | 'special';
}

// Información completa del layout físico
export interface PhysicalKeyboardInfo {
  rows: KeyboardRow[];
  totalKeys: number;
  usableKeys: PhysicalKey[]; // Teclas disponibles para mapeo
  reservedKeys: PhysicalKey[]; // Teclas reservadas para funciones especiales
}

// Estadísticas de uso del teclado
export interface KeyboardUsageStats {
  totalKeysPressed: number;
  keysPerMinute: number;
  mostUsedKeys: Map<PhysicalKey, number>;
  averageVelocity: number;
  sessionStartTime: number;
}

// Configuración de detección de velocidad
export interface VelocityDetectionConfig {
  enabled: boolean;
  method: 'timing' | 'pressure' | 'hybrid';
  timingWindow: number; // Ventana de tiempo en ms
  curve: 'linear' | 'exponential' | 'logarithmic';
  sensitivity: number; // 0-1
}

export default {};