// src/hooks/useKeyboard.ts
/**
 * HOOK DE TECLADO - Gestión completa del teclado físico
 * Event listeners, mapeo de teclas, prevención de auto-repeat y teclas especiales
 * Fase 5: Hooks Personalizados - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
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
    pressedKeys: new Set<string>(),
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

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true); // 🔥 NUEVO: Track mounted state
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const eventListenersRef = useRef<{
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    blur: () => void;
    focus: () => void;
  } | null>(null);

  // ========== STORES ==========
  // Settings store not currently used - mapping logic is self-contained

  // ========================================================================================
  // HELPER FUNCTIONS
  // ========================================================================================

  const getCurrentKeyMapping = useCallback((): KeyboardMapping => {
    // TODO: Implementar diferentes layouts desde settings
    return DEFAULT_KEY_MAPPING;
  }, []);

  const calculateVelocity = useCallback((): number => {
    // Velocidad base
    let velocity = 0.8;
    
    // Modificador por tecla shift (más fuerte)
    if (keyboardState.modifierKeys.shift) {
      velocity = Math.min(1.0, velocity + 0.2);
    }
    
    // Modificador por tecla ctrl (más suave)
    if (keyboardState.modifierKeys.ctrl) {
      velocity = Math.max(0.3, velocity - 0.3);
    }
    
    return velocity;
  }, [keyboardState.modifierKeys]);

  // ========================================================================================
  // EVENT HANDLERS PRINCIPALES
  // ========================================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    if (!keyboardState.isActive) return;

    const { code, repeat } = event;

    // Prevenir auto-repeat si está habilitado
    if (keyboardState.preventAutoRepeat && repeat) {
      event.preventDefault();
      return;
    }

    // Actualizar teclas modificadoras
    const newModifiers = { ...keyboardState.modifierKeys };
    if (code === 'ShiftLeft' || code === 'ShiftRight') newModifiers.shift = true;
    if (code === 'ControlLeft' || code === 'ControlRight') newModifiers.ctrl = true;
    if (code === 'AltLeft' || code === 'AltRight') newModifiers.alt = true;

    // ========== TECLAS ESPECIALES ==========
    
    // Sustain
    if (SPECIAL_KEYS.SUSTAIN.includes(code) && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      pressedKeysRef.current.add(code);
      const newSustain = !keyboardState.modifierKeys.sustain;
      newModifiers.sustain = newSustain;
      onSustainChange?.(newSustain);
      
      // 🔥 CORRECCIÓN: Solo setState si está montado
      if (isMountedRef.current) {
        setKeyboardState(prev => ({ ...prev, modifierKeys: newModifiers }));
      }
      return;
    }

    // Cambio de octava
    if (SPECIAL_KEYS.OCTAVE_UP.includes(code)) {
      event.preventDefault();
      const newOctave = Math.min(7, keyboardState.currentOctave + 1);
      onOctaveChange?.(newOctave);
      if (isMountedRef.current) {
        setKeyboardState(prev => ({ ...prev, currentOctave: newOctave, modifierKeys: newModifiers }));
      }
      return;
    }

    if (SPECIAL_KEYS.OCTAVE_DOWN.includes(code)) {
      event.preventDefault();
      const newOctave = Math.max(1, keyboardState.currentOctave - 1);
      onOctaveChange?.(newOctave);
      if (isMountedRef.current) {
        setKeyboardState(prev => ({ ...prev, currentOctave: newOctave, modifierKeys: newModifiers }));
      }
      return;
    }

    // Pánico (detener todas las notas)
    if (SPECIAL_KEYS.PANIC.includes(code)) {
      event.preventDefault();
      pressedKeysRef.current.clear();
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          pressedKeys: new Set(),
          modifierKeys: newModifiers
        }));
      }
      return;
    }

    // ========== NOTAS MUSICALES ==========
    
    const currentMapping = getCurrentKeyMapping();
    const keyMapping = currentMapping[code];
    
    if (keyMapping && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      
      const velocity = calculateVelocity();
      
      // Agregar a teclas presionadas
      pressedKeysRef.current.add(code);
      
      // Llamar handler
      onKeyboardNote?.(keyMapping.note, velocity, true);
      
      // 🔥 CORRECCIÓN: Solo setState si está montado
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          pressedKeys: new Set(pressedKeysRef.current),
          modifierKeys: newModifiers
        }));
      }

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
      if (isMountedRef.current) {
        setKeyboardState(prev => ({ ...prev, modifierKeys: newModifiers }));
      }
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
      
      // 🔥 CORRECCIÓN: Solo setState si está montado
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          pressedKeys: new Set(pressedKeysRef.current),
          modifierKeys: newModifiers
        }));
      }

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
    if (isMountedRef.current) {
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
    }
    console.log('⌨️ Window blur - cleared all pressed keys');
  }, []);

  const handleFocus = useCallback(() => {
    console.log('⌨️ Window focus - keyboard re-enabled');
  }, []);

  // ========================================================================================
  // FUNCIONES DE CONTROL PÚBLICO
  // ========================================================================================

  const enable = useCallback(() => {
    if (isMountedRef.current) {
      setKeyboardState(prev => ({ ...prev, isActive: true }));
    }
    console.log('⌨️ Keyboard enabled');
  }, []);

  const disable = useCallback(() => {
    // Limpiar teclas presionadas al deshabilitar
    pressedKeysRef.current.clear();
    if (isMountedRef.current) {
      setKeyboardState(prev => ({
        ...prev,
        isActive: false,
        pressedKeys: new Set()
      }));
    }
    console.log('⌨️ Keyboard disabled');
  }, []);

  const setOctave = useCallback((octave: number) => {
    const clampedOctave = Math.max(1, Math.min(7, octave));
    if (isMountedRef.current) {
      setKeyboardState(prev => ({ ...prev, currentOctave: clampedOctave }));
    }
    onOctaveChange?.(clampedOctave);
    console.log(`⌨️ Octave changed to: ${clampedOctave}`);
  }, [onOctaveChange]);

  const setSustain = useCallback((active: boolean) => {
    if (isMountedRef.current) {
      setKeyboardState(prev => ({
        ...prev,
        modifierKeys: { ...prev.modifierKeys, sustain: active }
      }));
    }
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
  // CLEANUP - CORREGIDO PARA EVITAR SETSTATE EN UNMOUNT
  // ========================================================================================

  const cleanup = useCallback(() => {
    // Remover event listeners
    if (eventListenersRef.current) {
      window.removeEventListener('keydown', eventListenersRef.current.keydown);
      window.removeEventListener('keyup', eventListenersRef.current.keyup);
      window.removeEventListener('blur', eventListenersRef.current.blur);
      window.removeEventListener('focus', eventListenersRef.current.focus);
      eventListenersRef.current = null;
    }
    
    // Limpiar refs pero NO setState durante unmount
    pressedKeysRef.current.clear();
    
    // 🔥 CORRECCIÓN CRÍTICA: Solo setState si el componente está montado
    if (isMountedRef.current) {
      setKeyboardState(prev => ({
        ...prev,
        pressedKeys: new Set(),
        modifierKeys: { shift: false, ctrl: false, alt: false, sustain: false }
      }));
    }
    
    console.log('⌨️ Keyboard cleanup completed');
  }, []);

  // ========================================================================================
  // EFFECTS - SETUP Y CLEANUP DE EVENT LISTENERS
  // ========================================================================================

  useEffect(() => {
    // Marcar como montado
    isMountedRef.current = true;

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

    // 🔥 CORRECCIÓN CRÍTICA: Cleanup function que marca unmount
    return () => {
      isMountedRef.current = false; // Marcar como desmontado PRIMERO
      cleanup(); // Luego hacer cleanup
    };
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