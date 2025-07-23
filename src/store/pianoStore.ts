/**
 * PIANO STORE - Estado Principal del Piano
 * Gestiona teclas presionadas, sustain, volumen y notas activas
 * Fase 4: Stores y Gestión de Estado
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { NoteName, PressedKey, PianoEvent } from '../types/piano';

// ========================================================================================
// INTERFACES DEL STORE
// ========================================================================================

interface PianoState {
  // Estado de teclas presionadas (Map para eficiencia)
  pressedKeys: Map<NoteName, PressedKey>;
  
  // Estado del pedal de sustain
  sustainActive: boolean;
  sustainedKeys: Set<NoteName>;
  
  // Volumen maestro (0-1)
  masterVolume: number;
  
  // Notas actualmente sonando (incluye sustain)
  activeNotes: Set<NoteName>;
  
  // Última nota presionada (para referencia)
  lastPressedNote: NoteName | null;
  
  // Tiempo del último evento
  lastEventTime: number;
  
  // Contador de eventos para debugging
  totalEventsProcessed: number;
  
  // Estado de inicialización
  isInitialized: boolean;
  
  // Configuración de velocidad
  velocitySettings: {
    enabled: boolean;
    sensitivity: number; // 0-1
    curve: 'linear' | 'exponential' | 'logarithmic';
  };
}

interface PianoActions {
  // === ACCIONES DE TECLAS ===
  pressKey: (note: NoteName, velocity?: number, source?: 'mouse' | 'keyboard' | 'midi') => void;
  releaseKey: (note: NoteName, source?: 'mouse' | 'keyboard' | 'midi') => void;
  
  // === ACCIONES DE SUSTAIN ===
  toggleSustain: () => void;
  setSustain: (active: boolean) => void;
  
  // === ACCIONES DE LIMPIEZA ===
  clearAllPressed: () => void;
  clearSustainedKeys: () => void;
  clearAll: () => void; // Limpia todo (pressed + sustained)
  
  // === ACCIONES DE VOLUMEN ===
  setMasterVolume: (volume: number) => void;
  adjustVolume: (delta: number) => void;
  
  // === ACCIONES DE CONFIGURACIÓN ===
  setVelocitySettings: (settings: Partial<PianoState['velocitySettings']>) => void;
  
  // === UTILIDADES ===
  isKeyPressed: (note: NoteName) => boolean;
  isKeyActive: (note: NoteName) => boolean; // Presionada O sustained
  getKeyVelocity: (note: NoteName) => number;
  getPressedNotes: () => NoteName[];
  getActiveNotes: () => NoteName[];
  getSustainedNotes: () => NoteName[];
  
  // === EVENTOS ===
  getLastEvent: () => PianoEvent | null;
  
  // === INICIALIZACIÓN ===
  initialize: () => void;
  
  // === ESTADÍSTICAS ===
  getStats: () => {
    totalPressed: number;
    totalSustained: number;
    totalActive: number;
    masterVolume: number;
    sustainActive: boolean;
    lastEventTime: number;
    totalEvents: number;
  };
}

type PianoStore = PianoState & PianoActions;

// ========================================================================================
// ESTADO INICIAL
// ========================================================================================

const initialState: PianoState = {
  pressedKeys: new Map(),
  sustainActive: false,
  sustainedKeys: new Set(),
  masterVolume: 0.7,
  activeNotes: new Set(),
  lastPressedNote: null,
  lastEventTime: 0,
  totalEventsProcessed: 0,
  isInitialized: false,
  velocitySettings: {
    enabled: true,
    sensitivity: 0.7,
    curve: 'exponential'
  }
};

// ========================================================================================
// STORE PRINCIPAL
// ========================================================================================

export const usePianoStore = create<PianoStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // === IMPLEMENTACIÓN DE ACCIONES ===

    pressKey: (note: NoteName, velocity = 0.7, source = 'mouse') => {
      const now = Date.now();
      
      set((state) => {
        // No presionar si ya está presionada
        if (state.pressedKeys.has(note)) {
          return state;
        }

        // Calcular velocidad basada en configuración
        let finalVelocity = velocity;
        if (state.velocitySettings.enabled) {
          const sensitivity = state.velocitySettings.sensitivity;
          switch (state.velocitySettings.curve) {
            case 'exponential':
              finalVelocity = Math.pow(velocity * sensitivity, 1.5);
              break;
            case 'logarithmic':
              finalVelocity = Math.log(velocity * sensitivity * 9 + 1) / Math.log(10);
              break;
            default:
              finalVelocity = velocity * sensitivity;
          }
          finalVelocity = Math.max(0.1, Math.min(1, finalVelocity));
        }

        // Crear nueva entrada de tecla presionada
        const pressedKey: PressedKey = {
          note,
          timestamp: now,
          velocity: finalVelocity,
          source
        };

        // Crear nuevos Maps/Sets para inmutabilidad
        const newPressedKeys = new Map(state.pressedKeys);
        newPressedKeys.set(note, pressedKey);

        const newActiveNotes = new Set(state.activeNotes);
        newActiveNotes.add(note);

        return {
          ...state,
          pressedKeys: newPressedKeys,
          activeNotes: newActiveNotes,
          lastPressedNote: note,
          lastEventTime: now,
          totalEventsProcessed: state.totalEventsProcessed + 1
        };
      });
    },

    releaseKey: (note: NoteName, source = 'mouse') => {
      const now = Date.now();
      
      set((state) => {
        // Solo procesar si la tecla está presionada
        if (!state.pressedKeys.has(note)) {
          return state;
        }

        // Crear nuevos Maps/Sets
        const newPressedKeys = new Map(state.pressedKeys);
        newPressedKeys.delete(note);

        let newActiveNotes = new Set(state.activeNotes);
        let newSustainedKeys = new Set(state.sustainedKeys);

        // Si sustain está activo, mantener la nota como sustained
        if (state.sustainActive) {
          newSustainedKeys.add(note);
        } else {
          // Sin sustain, remover de activas
          newActiveNotes.delete(note);
          newSustainedKeys.delete(note);
        }

        return {
          ...state,
          pressedKeys: newPressedKeys,
          activeNotes: newActiveNotes,
          sustainedKeys: newSustainedKeys,
          lastEventTime: now,
          totalEventsProcessed: state.totalEventsProcessed + 1
        };
      });
    },

    toggleSustain: () => {
      set((state) => {
        const newSustainActive = !state.sustainActive;
        let newActiveNotes = new Set(state.activeNotes);
        let newSustainedKeys = new Set<NoteName>();

        if (newSustainActive) {
          // Activar sustain: todas las notas presionadas se vuelven sustained
          state.pressedKeys.forEach((_, note) => {
            newSustainedKeys.add(note);
          });
        } else {
          // Desactivar sustain: solo mantener las notas presionadas
          newActiveNotes.clear();
          state.pressedKeys.forEach((_, note) => {
            newActiveNotes.add(note);
          });
        }

        return {
          ...state,
          sustainActive: newSustainActive,
          sustainedKeys: newSustainedKeys,
          activeNotes: newActiveNotes,
          lastEventTime: Date.now(),
          totalEventsProcessed: state.totalEventsProcessed + 1
        };
      });
    },

    setSustain: (active: boolean) => {
      set((state) => {
        if (state.sustainActive === active) return state;

        let newActiveNotes = new Set(state.activeNotes);
        let newSustainedKeys = new Set<NoteName>();

        if (active) {
          // Activar sustain
          state.pressedKeys.forEach((_, note) => {
            newSustainedKeys.add(note);
          });
        } else {
          // Desactivar sustain
          newActiveNotes.clear();
          state.pressedKeys.forEach((_, note) => {
            newActiveNotes.add(note);
          });
        }

        return {
          ...state,
          sustainActive: active,
          sustainedKeys: newSustainedKeys,
          activeNotes: newActiveNotes,
          lastEventTime: Date.now(),
          totalEventsProcessed: state.totalEventsProcessed + 1
        };
      });
    },

    clearAllPressed: () => {
      set((state) => ({
        ...state,
        pressedKeys: new Map(),
        activeNotes: new Set(state.sustainedKeys),
        lastEventTime: Date.now(),
        totalEventsProcessed: state.totalEventsProcessed + 1
      }));
    },

    clearSustainedKeys: () => {
      set((state) => {
        const newActiveNotes = new Set<NoteName>();
        state.pressedKeys.forEach((_, note) => {
          newActiveNotes.add(note);
        });

        return {
          ...state,
          sustainedKeys: new Set(),
          activeNotes: newActiveNotes,
          lastEventTime: Date.now(),
          totalEventsProcessed: state.totalEventsProcessed + 1
        };
      });
    },

    clearAll: () => {
      set((state) => ({
        ...state,
        pressedKeys: new Map(),
        sustainedKeys: new Set(),
        activeNotes: new Set(),
        sustainActive: false,
        lastPressedNote: null,
        lastEventTime: Date.now(),
        totalEventsProcessed: state.totalEventsProcessed + 1
      }));
    },

    setMasterVolume: (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      set((state) => ({
        ...state,
        masterVolume: clampedVolume,
        lastEventTime: Date.now()
      }));
    },

    adjustVolume: (delta: number) => {
      set((state) => {
        const newVolume = Math.max(0, Math.min(1, state.masterVolume + delta));
        return {
          ...state,
          masterVolume: newVolume,
          lastEventTime: Date.now()
        };
      });
    },

    setVelocitySettings: (newSettings) => {
      set((state) => ({
        ...state,
        velocitySettings: {
          ...state.velocitySettings,
          ...newSettings
        }
      }));
    },

    // === UTILIDADES ===

    isKeyPressed: (note: NoteName) => {
      return get().pressedKeys.has(note);
    },

    isKeyActive: (note: NoteName) => {
      return get().activeNotes.has(note);
    },

    getKeyVelocity: (note: NoteName) => {
      const pressedKey = get().pressedKeys.get(note);
      return pressedKey?.velocity || 0;
    },

    getPressedNotes: () => {
      return Array.from(get().pressedKeys.keys());
    },

    getActiveNotes: () => {
      return Array.from(get().activeNotes);
    },

    getSustainedNotes: () => {
      return Array.from(get().sustainedKeys);
    },

    getLastEvent: () => {
      const state = get();
      if (state.lastEventTime === 0) return null;
      
      return {
        type: 'noteOn' as const,
        timestamp: state.lastEventTime,
        data: {
          note: state.lastPressedNote,
          totalEvents: state.totalEventsProcessed
        }
      };
    },

    initialize: () => {
      set((state) => ({
        ...state,
        isInitialized: true,
        lastEventTime: Date.now()
      }));
    },

    getStats: () => {
      const state = get();
      return {
        totalPressed: state.pressedKeys.size,
        totalSustained: state.sustainedKeys.size,
        totalActive: state.activeNotes.size,
        masterVolume: state.masterVolume,
        sustainActive: state.sustainActive,
        lastEventTime: state.lastEventTime,
        totalEvents: state.totalEventsProcessed
      };
    }
  }))
);

// ========================================================================================
// HOOKS DERIVADOS PARA OPTIMIZACIÓN
// ========================================================================================

// Hook para obtener solo las notas presionadas (optimizado)
export const usePressedNotes = () => {
  return usePianoStore((state) => Array.from(state.pressedKeys.keys()));
};

// Hook para obtener solo las notas activas (optimizado)
export const useActiveNotes = () => {
  return usePianoStore((state) => Array.from(state.activeNotes));
};

// Hook para obtener solo el estado del sustain (optimizado)
export const useSustainState = () => {
  return usePianoStore((state) => ({
    active: state.sustainActive,
    sustainedCount: state.sustainedKeys.size
  }));
};

// Hook para obtener solo el volumen (optimizado)
export const useMasterVolume = () => {
  return usePianoStore((state) => state.masterVolume);
};

// Hook para verificar si una nota específica está presionada
export const useIsKeyPressed = (note: NoteName) => {
  return usePianoStore((state) => state.pressedKeys.has(note));
};

// Hook para verificar si una nota específica está activa
export const useIsKeyActive = (note: NoteName) => {
  return usePianoStore((state) => state.activeNotes.has(note));
};

// ========================================================================================
// UTILITIES Y DEBUGGING
// ========================================================================================

// Función para debugging del estado
export const debugPianoStore = () => {
  const state = usePianoStore.getState();
  console.log('🎹 Piano Store Debug:', {
    pressed: Array.from(state.pressedKeys.keys()),
    sustained: Array.from(state.sustainedKeys),
    active: Array.from(state.activeNotes),
    sustainActive: state.sustainActive,
    volume: state.masterVolume,
    totalEvents: state.totalEventsProcessed,
    initialized: state.isInitialized
  });
};

// Función para resetear completamente el store
export const resetPianoStore = () => {
  usePianoStore.setState(initialState);
};

// Función para exportar estado (para persistencia)
export const exportPianoState = () => {
  const state = usePianoStore.getState();
  return {
    masterVolume: state.masterVolume,
    velocitySettings: state.velocitySettings,
    sustainActive: state.sustainActive
  };
};

// Función para importar estado (para persistencia)
export const importPianoState = (savedState: any) => {
  usePianoStore.setState((state) => ({
    ...state,
    masterVolume: savedState.masterVolume || state.masterVolume,
    velocitySettings: savedState.velocitySettings || state.velocitySettings,
    sustainActive: savedState.sustainActive || false,
    // No restaurar teclas presionadas por seguridad
    pressedKeys: new Map(),
    activeNotes: new Set(),
    sustainedKeys: new Set()
  }));
};

// ========================================================================================
// SUBSCRIPCIONES AUTOMÁTICAS PARA DEBUGGING
// ========================================================================================

if (process.env.NODE_ENV === 'development') {
  // Suscripción para logging de cambios importantes
  usePianoStore.subscribe(
    (state) => state.totalEventsProcessed,
    (totalEvents) => {
      if (totalEvents > 0 && totalEvents % 10 === 0) {
        console.log(`🎹 Piano events processed: ${totalEvents}`);
      }
    }
  );

  // Suscripción para logging de cambios de sustain
  usePianoStore.subscribe(
    (state) => state.sustainActive,
    (sustainActive) => {
      console.log(`🎹 Sustain ${sustainActive ? 'ON' : 'OFF'}`);
    }
  );
}

// Log inicial
console.log('🎹 Piano Store initialized successfully');

export default usePianoStore;