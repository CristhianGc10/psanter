// src/hooks/useKeyboard.ts
/**
 * HOOK DE TECLADO - VERSIÓN CORREGIDA PARA FASE 5
 * ✅ Elimina re-rendering loops
 * ✅ Previene setState durante unmount
 * ✅ Event listeners optimizados
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES
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
// MAPEO DE TECLAS OPTIMIZADO
// ========================================================================================

const DEFAULT_KEY_MAPPING: KeyboardMapping = {
  // Fila inferior (teclas blancas)
  'KeyA': { note: 'C4' as NoteName, isBlackKey: false },
  'KeyS': { note: 'D4' as NoteName, isBlackKey: false },
  'KeyD': { note: 'E4' as NoteName, isBlackKey: false },
  'KeyF': { note: 'F4' as NoteName, isBlackKey: false },
  'KeyG': { note: 'G4' as NoteName, isBlackKey: false },
  'KeyH': { note: 'A4' as NoteName, isBlackKey: false },
  'KeyJ': { note: 'B4' as NoteName, isBlackKey: false },
  'KeyK': { note: 'C5' as NoteName, isBlackKey: false },
  'KeyL': { note: 'D5' as NoteName, isBlackKey: false },
  
  // Fila superior (teclas negras)
  'KeyW': { note: 'C#4' as NoteName, isBlackKey: true },
  'KeyE': { note: 'D#4' as NoteName, isBlackKey: true },
  'KeyT': { note: 'F#4' as NoteName, isBlackKey: true },
  'KeyY': { note: 'G#4' as NoteName, isBlackKey: true },
  'KeyU': { note: 'A#4' as NoteName, isBlackKey: true },
  'KeyO': { note: 'C#5' as NoteName, isBlackKey: true },
  'KeyP': { note: 'D#5' as NoteName, isBlackKey: true },
  
  // Extensión derecha
  'Semicolon': { note: 'E5' as NoteName, isBlackKey: false },
  'Quote': { note: 'F5' as NoteName, isBlackKey: false },

  // Octava inferior
  'KeyZ': { note: 'C3' as NoteName, isBlackKey: false },
  'KeyX': { note: 'D3' as NoteName, isBlackKey: false },
  'KeyC': { note: 'E3' as NoteName, isBlackKey: false },
  'KeyV': { note: 'F3' as NoteName, isBlackKey: false },
  'KeyB': { note: 'G3' as NoteName, isBlackKey: false },
  'KeyN': { note: 'A3' as NoteName, isBlackKey: false },
  'KeyM': { note: 'B3' as NoteName, isBlackKey: false },
};

const SPECIAL_KEYS = {
  SUSTAIN: ['Space'],
  OCTAVE_UP: ['ArrowUp', 'PageUp', 'BracketRight'],
  OCTAVE_DOWN: ['ArrowDown', 'PageDown', 'BracketLeft'],
  PANIC: ['Escape'],
  VOLUME_UP: ['Equal'],
  VOLUME_DOWN: ['Minus']
};

// ========================================================================================
// 🔥 HOOK PRINCIPAL useKeyboard - CORREGIDO
// ========================================================================================

export const useKeyboard = (
  onKeyboardNote?: KeyboardEventHandler,
  onSustainChange?: SustainEventHandler,
  onOctaveChange?: OctaveEventHandler
): KeyboardState & KeyboardControls => {

  // ========== ESTADO LOCAL - OPTIMIZADO ==========
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    pressedKeys: new Set<string>(),
    modifierKeys: { shift: false, ctrl: false, alt: false, sustain: false },
    currentOctave: 4,
    isActive: true,
    preventAutoRepeat: true
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const eventListenersRef = useRef<{
    keydown: (e: KeyboardEvent) => void;
    keyup: (e: KeyboardEvent) => void;
    blur: () => void;
    focus: () => void;
  } | null>(null);

  // ✅ REFS ESTABLES para handlers (evitan re-rendering)
  const onKeyboardNoteRef = useRef(onKeyboardNote);
  const onSustainChangeRef = useRef(onSustainChange);
  const onOctaveChangeRef = useRef(onOctaveChange);

  // Actualizar refs cuando cambien los handlers
  useEffect(() => {
    onKeyboardNoteRef.current = onKeyboardNote;
    onSustainChangeRef.current = onSustainChange;
    onOctaveChangeRef.current = onOctaveChange;
  }, [onKeyboardNote, onSustainChange, onOctaveChange]);

  // ========================================================================================
  // HELPER FUNCTIONS - ESTABLES
  // ========================================================================================

  const getCurrentKeyMapping = useCallback((): KeyboardMapping => {
    return DEFAULT_KEY_MAPPING;
  }, []);

  const calculateVelocity = useCallback((): number => {
    let velocity = 0.8;
    if (keyboardState.modifierKeys.shift) velocity = Math.min(1.0, velocity + 0.2);
    if (keyboardState.modifierKeys.ctrl) velocity = Math.max(0.3, velocity - 0.3);
    if (keyboardState.modifierKeys.alt) velocity = Math.min(1.0, velocity + 0.1);
    return velocity;
  }, [keyboardState.modifierKeys.shift, keyboardState.modifierKeys.ctrl, keyboardState.modifierKeys.alt]);

  // ========================================================================================
  // 🚨 SOLUCIÓN: EVENT HANDLERS ESTABLES
  // ========================================================================================

  const handleKeyDown = useCallback((event: KeyboardEvent): void => {
    if (!keyboardState.isActive) return;

    const { code, repeat } = event;

    // Prevenir auto-repeat
    if (keyboardState.preventAutoRepeat && repeat) {
      event.preventDefault();
      return;
    }

    // Actualizar modificadores
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
      onSustainChangeRef.current?.(newSustain);
      
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          modifierKeys: newModifiers
        }));
      }
      return;
    }

    // Octavas
    if (SPECIAL_KEYS.OCTAVE_UP.includes(code) && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      pressedKeysRef.current.add(code);
      const newOctave = Math.min(7, keyboardState.currentOctave + 1);
      onOctaveChangeRef.current?.(newOctave);
      
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          currentOctave: newOctave,
          modifierKeys: newModifiers
        }));
      }
      return;
    }

    if (SPECIAL_KEYS.OCTAVE_DOWN.includes(code) && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      pressedKeysRef.current.add(code);
      const newOctave = Math.max(1, keyboardState.currentOctave - 1);
      onOctaveChangeRef.current?.(newOctave);
      
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          currentOctave: newOctave,
          modifierKeys: newModifiers
        }));
      }
      return;
    }

    // ========== NOTAS MUSICALES ==========
    
    const keyMapping = getCurrentKeyMapping()[code];
    
    if (keyMapping && !pressedKeysRef.current.has(code)) {
      event.preventDefault();
      pressedKeysRef.current.add(code);
      
      const velocity = calculateVelocity();
      onKeyboardNoteRef.current?.(keyMapping.note, velocity, true);
      
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          pressedKeys: new Set(pressedKeysRef.current),
          modifierKeys: newModifiers
        }));
      }
    }
  }, [
    keyboardState.isActive,
    keyboardState.preventAutoRepeat,
    keyboardState.modifierKeys.sustain,
    keyboardState.currentOctave,
    getCurrentKeyMapping,
    calculateVelocity
  ]);

  const handleKeyUp = useCallback((event: KeyboardEvent): void => {
    if (!keyboardState.isActive) return;

    const { code } = event;

    // Actualizar modificadores
    const newModifiers = { ...keyboardState.modifierKeys };
    if (code === 'ShiftLeft' || code === 'ShiftRight') newModifiers.shift = false;
    if (code === 'ControlLeft' || code === 'ControlRight') newModifiers.ctrl = false;
    if (code === 'AltLeft' || code === 'AltRight') newModifiers.alt = false;

    // Ignorar teclas especiales
    if (SPECIAL_KEYS.SUSTAIN.includes(code) ||
        SPECIAL_KEYS.OCTAVE_UP.includes(code) ||
        SPECIAL_KEYS.OCTAVE_DOWN.includes(code)) {
      pressedKeysRef.current.delete(code);
      if (isMountedRef.current) {
        setKeyboardState(prev => ({ ...prev, modifierKeys: newModifiers }));
      }
      return;
    }

    // Liberar notas musicales
    const keyMapping = getCurrentKeyMapping()[code];
    
    if (keyMapping && pressedKeysRef.current.has(code)) {
      pressedKeysRef.current.delete(code);
      onKeyboardNoteRef.current?.(keyMapping.note, 0, false);
      
      if (isMountedRef.current) {
        setKeyboardState(prev => ({
          ...prev,
          pressedKeys: new Set(pressedKeysRef.current),
          modifierKeys: newModifiers
        }));
      }
    }
  }, [keyboardState.isActive, getCurrentKeyMapping]);

  const handleBlur = useCallback((): void => {
    // Liberar todas las teclas al perder foco
    const releasedKeys = Array.from(pressedKeysRef.current);
    pressedKeysRef.current.clear();

    // Liberar notas
    const keyMapping = getCurrentKeyMapping();
    releasedKeys.forEach(code => {
      const mapping = keyMapping[code];
      if (mapping) {
        onKeyboardNoteRef.current?.(mapping.note, 0, false);
      }
    });

    if (isMountedRef.current) {
      setKeyboardState(prev => ({
        ...prev,
        pressedKeys: new Set(),
        modifierKeys: { shift: false, ctrl: false, alt: false, sustain: false }
      }));
    }

    console.log('⌨️ Window blur - cleared all pressed keys');
  }, [getCurrentKeyMapping]);

  const handleFocus = useCallback((): void => {
    console.log('⌨️ Window focus - keyboard re-enabled');
  }, []);

  // ========================================================================================
  // CONTROL FUNCTIONS - ESTABLES
  // ========================================================================================

  const enable = useCallback(() => {
    if (isMountedRef.current) {
      setKeyboardState(prev => ({ ...prev, isActive: true }));
    }
    console.log('⌨️ Keyboard enabled');
  }, []);

  const disable = useCallback(() => {
    if (isMountedRef.current) {
      setKeyboardState(prev => ({ ...prev, isActive: false }));
    }
    console.log('⌨️ Keyboard disabled');
  }, []);

  const setOctave = useCallback((octave: number) => {
    const clampedOctave = Math.max(1, Math.min(7, octave));
    if (isMountedRef.current) {
      setKeyboardState(prev => ({ ...prev, currentOctave: clampedOctave }));
    }
    onOctaveChangeRef.current?.(clampedOctave);
  }, []);

  const setSustain = useCallback((active: boolean) => {
    if (isMountedRef.current) {
      setKeyboardState(prev => ({
        ...prev,
        modifierKeys: { ...prev.modifierKeys, sustain: active }
      }));
    }
    onSustainChangeRef.current?.(active);
  }, []);

  const isKeyPressed = useCallback((code: string): boolean => {
    return pressedKeysRef.current.has(code);
  }, []);

  const getKeyMapping = useCallback((): KeyboardMapping => {
    return getCurrentKeyMapping();
  }, [getCurrentKeyMapping]);

  // ========================================================================================
  // 🚨 SOLUCIÓN: CLEANUP CORRECTO
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
    
    // Limpiar refs
    pressedKeysRef.current.clear();
    
    console.log('⌨️ Keyboard cleanup completed');
  }, []);

  // ========================================================================================
  // 🚨 SOLUCIÓN: EFFECTS OPTIMIZADOS
  // ========================================================================================

  useEffect(() => {
    isMountedRef.current = true;

    // Crear handlers estables
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

    eventListenersRef.current = listeners;

    console.log('⌨️ Keyboard event listeners attached');

    // Cleanup optimizado
    return () => {
      isMountedRef.current = false;
      cleanup();
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