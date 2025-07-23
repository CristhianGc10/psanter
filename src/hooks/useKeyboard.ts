// src/hooks/useKeyboard.ts
/**
 * HOOK DE TECLADO - Gestión completa del teclado físico
 * Event listeners, mapeo de teclas, prevención de auto-repeat y teclas especiales
 * Fase 5: Hooks Personalizados
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES Y TIPOS
// ========================================================================================

interface KeyboardState {
  pressedKeys: Set<string>;
  modifierKeys: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    sustain: boolean;
  };
  currentOctave: number;
  isActive: boolean;
  preventAutoRepeat: boolean;
}

interface KeyboardMapping {
  [key: string]: {
    note: NoteName;
    octave?: number;
    isBlackKey?: boolean;
  };
}

interface KeyboardControls {
  enable: () => void;
  disable: () => void;
  setOctave: (octave: number) => void;
  setSustain: (active: boolean) => void;
  getKeyMapping: () => KeyboardMapping;
  isKeyPressed: (code: string) => boolean;
  cleanup: () => void;
}

type KeyboardEventHandler = (note: NoteName, velocity: number, pressed: boolean) => void;
type SustainEventHandler = (active: boolean) => void;
type OctaveEventHandler = (octave: number) => void;

// ========================================================================================
// MAPEO DE TECLAS DEFAULT (QWERTY)
// ========================================================================================

const DEFAULT_KEY_MAPPING: KeyboardMapping = {
  // Fila inferior (teclas blancas) - ASDF... 
  'KeyA': { note: 'C4' as NoteName, isBlackKey: false },
  'KeyS': { note: 'D4' as NoteName, isBlackKey: false },
  'KeyD': { note: 'E4' as NoteName, isBlackKey: false },
  'KeyF': { note: 'F4' as NoteName, isBlackKey: false },
  'KeyG': { note: 'G4' as NoteName, isBlackKey: false },
  'KeyH': { note: 'A4' as NoteName, isBlackKey: false },
  'KeyJ': { note: 'B4' as NoteName, isBlackKey: false },
  'KeyK': { note: 'C5' as NoteName, isBlackKey: false },
  'KeyL': { note: 'D5' as NoteName, isBlackKey: false },
  'Semicolon': { note: 'E5' as NoteName, isBlackKey: false },
  
  // Fila superior (teclas negras) - QWERTY...
  'KeyQ': { note: 'C#4' as NoteName, isBlackKey: true },
  'KeyW': { note: 'D#4' as NoteName, isBlackKey: true },
  'KeyE': { note: 'F#4' as NoteName, isBlackKey: true },
  'KeyR': { note: 'G#4' as NoteName, isBlackKey: true },
  'KeyT': { note: 'A#4' as NoteName, isBlackKey: true },
  'KeyY': { note: 'C#5' as NoteName, isBlackKey: true },
  'KeyU': { note: 'D#5' as NoteName, isBlackKey: true },
  'KeyI': { note: 'F#5' as NoteName, isBlackKey: true },
  'KeyO': { note: 'G#5' as NoteName, isBlackKey: true },
  'KeyP': { note: 'A#5' as NoteName, isBlackKey: true },

  // Octava inferior
  'KeyZ': { note: 'C3' as NoteName, isBlackKey: false },
  'KeyX': { note: 'D3' as NoteName, isBlackKey: false },
  'KeyC': { note: 'E3' as NoteName, isBlackKey: false },
  'KeyV': { note: 'F3' as NoteName, isBlackKey: false },
  'KeyB': { note: 'G3' as NoteName, isBlackKey: false },
  'KeyN': { note: 'A3' as NoteName, isBlackKey: false },
  'KeyM': { note: 'B3' as NoteName, isBlackKey: false },
};

// Teclas especiales
const SPECIAL_KEYS = {
  SUSTAIN: ['Space'],
  OCTAVE_UP: ['ArrowUp', 'PageUp'],
  OCTAVE_DOWN: ['ArrowDown', 'PageDown'],
  PANIC: ['Escape'],
  VOLUME_UP: ['BracketRight'],
  VOLUME_DOWN: ['BracketLeft']
};

// ========================================================================================
// HOOK PRINCIPAL useKeyboard
// ========================================================================================

export const useKeyboard = (
  onKeyboardNote?: KeyboardEventHandler,
  onSustainChange?: SustainEventHandler,
  onOctaveChange?: OctaveEventHandler
): KeyboardState & KeyboardControls => {
  
  // ========== ESTADO LOCAL ==========
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    pressedKeys: new Set(),
    modifierKeys: {
      shift: false,
      ctrl: false,
      alt: false,
      sustain: false
    },
    currentOctave: 4,
    isActive: true,
    preventAutoRepeat: true
  });

  // ========== REFS PARA OPTIMIZACIÓN ==========
  const pressedKeysRef = useRef<Set<string>>(new Set());
  // keyMappingRef disponible para configuración futura
  const eventListenersRef = useRef<{
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    blur: () => void;
    focus: () => void;
  } | null>(null);

  // ========== ZUSTAND STORE (para configuración futura) ==========
  // const settingsStore = useSettingsStore();

  // ========================================================================================
  // UTILIDADES PARA MAPEO DE OCTAVAS
  // ========================================================================================

  const adjustNoteForOctave = useCallback((note: NoteName, octaveShift: number): NoteName => {
    const noteMatch = note.match(/^([A-G]#?)(\d+)$/);
    if (!noteMatch) return note;

    const [, noteName, octaveStr] = noteMatch;
    const currentOctave = parseInt(octaveStr);
    const newOctave = Math.max(0, Math.min(8, currentOctave + octaveShift));
    
    return `${noteName}${newOctave}` as NoteName;
  }, []);

  const getCurrentKeyMapping = useCallback((): KeyboardMapping => {
    const octaveShift = keyboardState.currentOctave - 4; // 4 es la octava base
    const adjustedMapping: KeyboardMapping = {};

    Object.entries(DEFAULT_KEY_MAPPING).forEach(([key, value]) => {
      adjustedMapping[key] = {
        ...value,
        note: adjustNoteForOctave(value.note, octaveShift)
      };
    });

    return adjustedMapping;
  }, [keyboardState.currentOctave, adjustNoteForOctave]);

  // ========================================================================================
  // CÁLCULO DE VELOCITY BASADO EN TIMING
  // ========================================================================================

  const calculateVelocity = useCallback((_keyCode: string): number => {
    // Velocidad base
    let velocity = 0.8;

    // Modificadores
    if (keyboardState.modifierKeys.shift) {
      velocity = Math.min(1.0, velocity + 0.2); // Shift = más fuerte
    }

    if (keyboardState.modifierKeys.ctrl) {
      velocity = Math.max(0.1, velocity - 0.3); // Ctrl = más suave
    }

    // Randomización ligera para humanizar
    velocity += (Math.random() - 0.5) * 0.1;
    
    return Math.max(0.1, Math.min(1.0, velocity));
  }, [keyboardState.modifierKeys]);

  // ========================================================================================
  // MANEJADORES DE EVENTOS
  // ========================================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    // Verificar si el hook está activo
    if (!keyboardState.isActive) return;

    const { code, repeat, target } = event;

    // Prevenir auto-repeat si está habilitado
    if (keyboardState.preventAutoRepeat && repeat) return;

    // Ignorar eventos en inputs/textareas
    if (target && (target as HTMLElement).tagName?.match(/INPUT|TEXTAREA|SELECT/)) {
      return;
    }

    // Actualizar teclas modificadoras
    const newModifiers = { ...keyboardState.modifierKeys };
    if (code === 'ShiftLeft' || code === 'ShiftRight') newModifiers.shift = true;
    if (code === 'ControlLeft' || code === 'ControlRight') newModifiers.ctrl = true;
    if (code === 'AltLeft' || code === 'AltRight') newModifiers.alt = true;

    // ========== TECLAS ESPECIALES ==========
    
    // Sustain (Barra espaciadora)
    if (SPECIAL_KEYS.SUSTAIN.includes(code)) {
      event.preventDefault();
      if (!pressedKeysRef.current.has(code)) {
        newModifiers.sustain = !newModifiers.sustain;
        onSustainChange?.(newModifiers.sustain);
        pressedKeysRef.current.add(code);
      }
      setKeyboardState(prev => ({ ...prev, modifierKeys: newModifiers }));
      return;
    }

    // Cambio de octava
    if (SPECIAL_KEYS.OCTAVE_UP.includes(code)) {
      event.preventDefault();
      if (!pressedKeysRef.current.has(code)) {
        const newOctave = Math.min(7, keyboardState.currentOctave + 1);
        setKeyboardState(prev => ({ ...prev, currentOctave: newOctave }));
        onOctaveChange?.(newOctave);
        pressedKeysRef.current.add(code);
      }
      return;
    }

    if (SPECIAL_KEYS.OCTAVE_DOWN.includes(code)) {
      event.preventDefault();
      if (!pressedKeysRef.current.has(code)) {
        const newOctave = Math.max(1, keyboardState.currentOctave - 1);
        setKeyboardState(prev => ({ ...prev, currentOctave: newOctave }));
        onOctaveChange?.(newOctave);
        pressedKeysRef.current.add(code);
      }
      return;
    }

    // Panic (ESC - detener todas las notas)
    if (SPECIAL_KEYS.PANIC.includes(code)) {
      event.preventDefault();
      pressedKeysRef.current.clear();
      setKeyboardState(prev => ({ 
        ...prev, 
        pressedKeys: new Set(),
        modifierKeys: { ...prev.modifierKeys, sustain: false }
      }));
      onSustainChange?.(false);
      return;
    }

    // ========== NOTAS MUSICALES ==========
    
    const currentMapping = getCurrentKeyMapping();
    const keyMapping = currentMapping[code];
    
    if (keyMapping && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      
      const velocity = calculateVelocity(code);
      
      // Agregar a teclas presionadas
      pressedKeysRef.current.add(code);
      
      // Llamar handler
      onKeyboardNote?.(keyMapping.note, velocity, true);
      
      // Actualizar estado
      setKeyboardState(prev => ({
        ...prev,
        pressedKeys: new Set(pressedKeysRef.current),
        modifierKeys: newModifiers
      }));

      console.log(`⌨️ Key pressed: ${code} -> ${keyMapping.note} (vel: ${velocity.toFixed(2)})`);
    }
  }, [
    keyboardState.isActive,
    keyboardState.preventAutoRepeat,
    keyboardState.modifierKeys,
    keyboardState.currentOctave,
    getCurrentKeyMapping,
    calculateVelocity,
    onKeyboardNote,
    onSustainChange,
    onOctaveChange
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    if (!keyboardState.isActive) return;

    const { code } = event;

    // Actualizar teclas modificadoras
    const newModifiers = { ...keyboardState.modifierKeys };
    if (code === 'ShiftLeft' || code === 'ShiftRight') newModifiers.shift = false;
    if (code === 'ControlLeft' || code === 'ControlRight') newModifiers.ctrl = false;
    if (code === 'AltLeft' || code === 'AltRight') newModifiers.alt = false;

    // Ignorar teclas especiales que no generan notas
    if (SPECIAL_KEYS.SUSTAIN.includes(code) ||
        SPECIAL_KEYS.OCTAVE_UP.includes(code) ||
        SPECIAL_KEYS.OCTAVE_DOWN.includes(code) ||
        SPECIAL_KEYS.PANIC.includes(code)) {
      pressedKeysRef.current.delete(code);
      setKeyboardState(prev => ({ ...prev, modifierKeys: newModifiers }));
      return;
    }

    // ========== LIBERAR NOTAS MUSICALES ==========
    
    const currentMapping = getCurrentKeyMapping();
    const keyMapping = currentMapping[code];
    
    if (keyMapping && pressedKeysRef.current.has(code)) {
      // Remover de teclas presionadas
      pressedKeysRef.current.delete(code);
      
      // Llamar handler
      onKeyboardNote?.(keyMapping.note, 0, false);
      
      // Actualizar estado
      setKeyboardState(prev => ({
        ...prev,
        pressedKeys: new Set(pressedKeysRef.current),
        modifierKeys: newModifiers
      }));

      console.log(`⌨️ Key released: ${code} -> ${keyMapping.note}`);
    }
  }, [
    keyboardState.isActive,
    keyboardState.modifierKeys,
    getCurrentKeyMapping,
    onKeyboardNote
  ]);

  // ========================================================================================
  // MANEJADORES DE FOCUS (PARA LIMPIAR ESTADO)
  // ========================================================================================

  const handleBlur = useCallback(() => {
    // Limpiar todas las teclas cuando se pierde el foco
    pressedKeysRef.current.clear();
    setKeyboardState(prev => ({
      ...prev,
      pressedKeys: new Set(),
      modifierKeys: {
        shift: false,
        ctrl: false,
        alt: false,
        sustain: prev.modifierKeys.sustain // Mantener sustain
      }
    }));
    console.log('⌨️ Window blur - cleared all pressed keys');
  }, []);

  const handleFocus = useCallback(() => {
    console.log('⌨️ Window focus - keyboard re-enabled');
  }, []);

  // ========================================================================================
  // FUNCIONES DE CONTROL PÚBLICO
  // ========================================================================================

  const enable = useCallback(() => {
    setKeyboardState(prev => ({ ...prev, isActive: true }));
    console.log('⌨️ Keyboard enabled');
  }, []);

  const disable = useCallback(() => {
    // Limpiar teclas presionadas al deshabilitar
    pressedKeysRef.current.clear();
    setKeyboardState(prev => ({
      ...prev,
      isActive: false,
      pressedKeys: new Set()
    }));
    console.log('⌨️ Keyboard disabled');
  }, []);

  const setOctave = useCallback((octave: number) => {
    const clampedOctave = Math.max(1, Math.min(7, octave));
    setKeyboardState(prev => ({ ...prev, currentOctave: clampedOctave }));
    onOctaveChange?.(clampedOctave);
    console.log(`⌨️ Octave changed to: ${clampedOctave}`);
  }, [onOctaveChange]);

  const setSustain = useCallback((active: boolean) => {
    setKeyboardState(prev => ({
      ...prev,
      modifierKeys: { ...prev.modifierKeys, sustain: active }
    }));
    onSustainChange?.(active);
    console.log(`⌨️ Sustain ${active ? 'enabled' : 'disabled'}`);
  }, [onSustainChange]);

  const isKeyPressed = useCallback((code: string): boolean => {
    return pressedKeysRef.current.has(code);
  }, []);

  const getKeyMapping = useCallback((): KeyboardMapping => {
    return getCurrentKeyMapping();
  }, [getCurrentKeyMapping]);

  // ========================================================================================
  // CLEANUP
  // ========================================================================================

  const cleanup = useCallback(() => {
    if (eventListenersRef.current) {
      window.removeEventListener('keydown', eventListenersRef.current.keydown);
      window.removeEventListener('keyup', eventListenersRef.current.keyup);
      window.removeEventListener('blur', eventListenersRef.current.blur);
      window.removeEventListener('focus', eventListenersRef.current.focus);
      eventListenersRef.current = null;
    }
    
    pressedKeysRef.current.clear();
    setKeyboardState(prev => ({
      ...prev,
      pressedKeys: new Set(),
      modifierKeys: { shift: false, ctrl: false, alt: false, sustain: false }
    }));
    
    console.log('⌨️ Keyboard cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS - SETUP Y CLEANUP DE EVENT LISTENERS
  // ========================================================================================

  useEffect(() => {
    // Crear los event listeners
    const listeners = {
      keydown: handleKeyDown,
      keyup: handleKeyUp,
      blur: handleBlur,
      focus: handleFocus
    };

    // Agregar event listeners
    window.addEventListener('keydown', listeners.keydown);
    window.addEventListener('keyup', listeners.keyup);
    window.addEventListener('blur', listeners.blur);
    window.addEventListener('focus', listeners.focus);

    // Guardar referencia para cleanup
    eventListenersRef.current = listeners;

    console.log('⌨️ Keyboard event listeners attached');

    // Cleanup al desmontar
    return cleanup;
  }, [handleKeyDown, handleKeyUp, handleBlur, handleFocus, cleanup]);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado
    pressedKeys: keyboardState.pressedKeys,
    modifierKeys: keyboardState.modifierKeys,
    currentOctave: keyboardState.currentOctave,
    isActive: keyboardState.isActive,
    preventAutoRepeat: keyboardState.preventAutoRepeat,
    
    // Controles
    enable,
    disable,
    setOctave,
    setSustain,
    getKeyMapping,
    isKeyPressed,
    cleanup
  };
};