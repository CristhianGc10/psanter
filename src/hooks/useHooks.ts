// src/hooks/useHooks.ts
/**
 * HOOK MAESTRO DE INTEGRACIÓN - Coordina todos los hooks de la Fase 5
 * Integra audio + keyboard + piano + metronome + detection de forma optimizada
 * Fase 5: Hooks Personalizados - Coordinación Completa - VERSIÓN CORREGIDA
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAudio } from './useAudio';
import { useKeyboard } from './useKeyboard';
import { usePiano } from './usePiano';
import { useMetronome } from './useMetronome';
import { useDetection } from './useDetection';
import { useStoreIntegration } from './useStoreIntegration';
import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES PRINCIPALES
// ========================================================================================

interface SystemState {
  isReady: boolean;
  isInitialized: boolean;
  hasAudioPermissions: boolean;
  totalInitializationTime: number;
  lastError: string | null;
  systemHealth: {
    audio: 'healthy' | 'degraded' | 'failed';
    keyboard: 'healthy' | 'degraded' | 'failed';
    detection: 'healthy' | 'degraded' | 'failed';
    metronome: 'healthy' | 'degraded' | 'failed';
  };
}

interface SystemControls {
  initialize: () => Promise<boolean>;
  restart: () => Promise<boolean>;
  shutdown: () => void;
  enableAll: () => void;
  disableAll: () => void;
  runHealthCheck: () => Promise<SystemState['systemHealth']>;
  getSystemStats: () => Record<string, any>;
  ensureAudioContext: () => Promise<boolean>;
}

interface HookInstances {
  audio: ReturnType<typeof useAudio>;
  keyboard: ReturnType<typeof useKeyboard>;
  piano: ReturnType<typeof usePiano>;
  metronome: ReturnType<typeof useMetronome>;
  detection: ReturnType<typeof useDetection>;
  stores: ReturnType<typeof useStoreIntegration>;
}

// ========================================================================================
// HOOK MAESTRO useHooks
// ========================================================================================

export const useHooks = (): SystemState & SystemControls & { hooks: HookInstances } => {
  
  // ========== ESTADO DEL SISTEMA ==========
  const [systemState, setSystemState] = useState<SystemState>({
    isReady: false,
    isInitialized: false,
    hasAudioPermissions: false,
    totalInitializationTime: 0,
    lastError: null,
    systemHealth: {
      audio: 'failed',
      keyboard: 'failed',
      detection: 'failed',
      metronome: 'failed'
    }
  });

  // ========== REFS CRÍTICOS ==========
  const isMountedRef = useRef<boolean>(true);
  const initializationStartRef = useRef<number>(0);
  const healthCheckIntervalRef = useRef<number | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isShuttingDownRef = useRef<boolean>(false);

  // ========== INSTANCIAS DE HOOKS ==========
  
  // 1. Store Integration (base fundamental)
  const stores = useStoreIntegration();
  
  // 2. Audio System
  const audio = useAudio();
  
  // 3. Keyboard System
  const keyboard = useKeyboard(
    // onKeyboardNote
    (note: NoteName, velocity: number, pressed: boolean) => {
      if (piano.isReady && !isShuttingDownRef.current) {
        if (pressed) {
          piano.playNote(note, velocity, 'keyboard');
        } else {
          piano.stopNote(note, 'keyboard');
        }
      }
    },
    // onSustainChange
    (active: boolean) => {
      if (piano.isReady && !isShuttingDownRef.current) {
        piano.setSustain(active);
      }
    },
    // onOctaveChange
    (octave: number) => {
      if (!isShuttingDownRef.current) {
        console.log(`🎹 Octave changed: ${octave}`);
      }
    }
  );
  
  // 4. Piano System (maestro)
  const piano = usePiano({
    onNoteOn: (note: NoteName, velocity: number, source: string) => {
      if (!isShuttingDownRef.current) {
        console.log(`🎹 Note ON: ${note} (vel: ${velocity.toFixed(2)}, src: ${source})`);
      }
    },
    onNoteOff: (note: NoteName, source: string) => {
      if (!isShuttingDownRef.current) {
        console.log(`🎹 Note OFF: ${note} (src: ${source})`);
      }
    },
    onSustainChange: (active: boolean) => {
      if (!isShuttingDownRef.current) {
        console.log(`🎹 Sustain: ${active ? 'ON' : 'OFF'}`);
      }
    }
  });
  
  // 5. Metronome System
  const metronome = useMetronome();
  
  // 6. Detection System
  const detection = useDetection();

  // ========================================================================================
  // HELPER FUNCTIONS
  // ========================================================================================

  const updateSystemState = useCallback((updates: Partial<SystemState>) => {
    if (isMountedRef.current) {
      setSystemState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const ensureAudioContext = useCallback(async (): Promise<boolean> => {
    if (!audio.hasUserInteraction) {
      console.log('🎵 Activating AudioContext after user interaction...');
      const success = await audio.startAudioContext();
      
      if (success) {
        updateSystemState({ hasAudioPermissions: true });
        console.log('✅ AudioContext activated successfully');
        return true;
      } else {
        console.warn('⚠️ Failed to activate AudioContext');
        return false;
      }
    }
    
    return true; // Ya estaba activado
  }, [audio, updateSystemState]);

  // ========================================================================================
  // CONTROL DEL SISTEMA
  // ========================================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitializingRef.current || isShuttingDownRef.current) {
      return false;
    }

    try {
      isInitializingRef.current = true;
      initializationStartRef.current = performance.now();
      
      console.log('🚀 Initializing system...');
      updateSystemState({ lastError: null });

      // 1. Inicializar audio primero
      console.log('🔊 Initializing audio components...');
      const audioSuccess = await audio.initializeAudio?.() || audio.isInitialized;
      
      if (!audioSuccess) {
        throw new Error('Audio component initialization failed');
      }

      // NOTE: NO verificar permisos automáticamente - eso requiere user gesture
      console.log('ℹ️ Audio context will start on first user interaction');

      // === FASE 3: INICIALIZAR PIANO (MAESTRO) ===
      console.log('🎹 Initializing piano...');
      const pianoSuccess = await piano.initialize?.() || piano.isReady;
      
      if (!pianoSuccess) {
        throw new Error('Piano initialization failed');
      }

      // 3. Habilitar sistemas auxiliares
      console.log('⌨️ Enabling keyboard...');
      keyboard.enable();
      
      console.log('🥁 Enabling metronome...');
      // Metronome doesn't need explicit enabling
      
      console.log('🎯 Enabling detection...');
      detection.enable();

      // 4. Calcular tiempo de inicialización
      const totalTime = performance.now() - initializationStartRef.current;
      
      updateSystemState({
        isInitialized: true,
        isReady: true,
        hasAudioPermissions: false, // Se activará con la primera interacción
        totalInitializationTime: totalTime,
        systemHealth: {
          audio: audio.isInitialized ? 'healthy' : 'failed',
          keyboard: keyboard.isActive ? 'healthy' : 'failed',
          detection: detection.isEnabled ? 'healthy' : 'failed',
          metronome: metronome.isInitialized ? 'healthy' : 'failed'
        }
      });

      console.log(`✅ System initialized successfully in ${totalTime.toFixed(1)}ms`);
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ System initialization failed:', errorMessage);
      
      updateSystemState({
        lastError: errorMessage,
        isInitialized: false,
        isReady: false
      });
      
      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [audio, piano, keyboard, metronome, detection, updateSystemState]);

  const restart = useCallback(async (): Promise<boolean> => {
    console.log('🔄 Restarting system...');
    shutdown();
    
    // Esperar un poco para que el shutdown complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return await initialize();
  }, [initialize]);

  const shutdown = useCallback((): void => {
    if (isShuttingDownRef.current) {
      return;
    }

    try {
      isShuttingDownRef.current = true;
      console.log('🛑 Shutting down system...');

      // Limpiar health check interval
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }

      // 1. Parar todo inmediatamente
      try {
        console.log('⌨️ Shutting down keyboard...');
        keyboard.disable?.();
      } catch (error) {
        console.warn('⚠️ Error during keyboard shutdown:', error);
      }

      try {
        console.log('🎯 Shutting down detection...');
        detection.disable?.();
      } catch (error) {
        console.warn('⚠️ Error during detection shutdown:', error);
      }

      try {
        console.log('🥁 Shutting down metronome...');
        metronome.stop?.();
      } catch (error) {
        console.warn('⚠️ Error during metronome shutdown:', error);
      }

      try {
        console.log('🎹 Shutting down piano...');
        piano.panic?.();
      } catch (error) {
        console.warn('⚠️ Error during piano shutdown:', error);
      }

      // 2. Cleanup en orden inverso (solo si están montados)
      try {
        if (isMountedRef.current) {
          detection.cleanup?.();
        }
      } catch (error) {
        console.warn('⚠️ Error during detection cleanup:', error);
      }

      try {
        if (isMountedRef.current) {
          keyboard.cleanup?.();
        }
      } catch (error) {
        console.warn('⚠️ Error during keyboard cleanup:', error);
      }

      try {
        if (isMountedRef.current) {
          metronome.cleanup?.();
        }
      } catch (error) {
        console.warn('⚠️ Error during metronome cleanup:', error);
      }

      try {
        if (isMountedRef.current) {
          piano.cleanup?.();
        }
      } catch (error) {
        console.warn('⚠️ Error during piano cleanup:', error);
      }

      try {
        if (isMountedRef.current) {
          audio.cleanup?.();
        }
      } catch (error) {
        console.warn('⚠️ Error during audio cleanup:', error);
      }

      // 3. Actualizar estado final solo si está montado
      if (isMountedRef.current) {
        updateSystemState({
          isReady: false,
          isInitialized: false,
          systemHealth: {
            audio: 'failed',
            keyboard: 'failed',
            detection: 'failed',
            metronome: 'failed'
          }
        });
      }

      console.log('✅ System shutdown completed');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    } finally {
      isShuttingDownRef.current = false;
    }
  }, [audio, piano, keyboard, metronome, detection, updateSystemState]);

  const enableAll = useCallback((): void => {
    if (isShuttingDownRef.current) return;
    
    console.log('🔛 Enabling all systems...');
    keyboard.enable();
    detection.enable();
    console.log('✅ All systems enabled');
  }, [keyboard, detection]);

  const disableAll = useCallback((): void => {
    if (isShuttingDownRef.current) return;
    
    console.log('🔴 Disabling all systems...');
    keyboard.disable();
    detection.disable();
    metronome.stop?.();
    console.log('✅ All systems disabled');
  }, [keyboard, detection, metronome]);

  const runHealthCheck = useCallback(async (): Promise<SystemState['systemHealth']> => {
    const health = {
      audio: audio.isInitialized ? 'healthy' as const : 'failed' as const,
      keyboard: keyboard.isActive ? 'healthy' as const : 'failed' as const,
      detection: detection.isEnabled ? 'healthy' as const : 'failed' as const,
      metronome: metronome.isInitialized ? 'healthy' as const : 'failed' as const
    };

    updateSystemState({ systemHealth: health });
    return health;
  }, [audio, keyboard, detection, metronome, updateSystemState]);

  const getSystemStats = useCallback((): Record<string, any> => {
    return {
      initialization: {
        isReady: systemState.isReady,
        isInitialized: systemState.isInitialized,
        initTime: systemState.totalInitializationTime,
        lastError: systemState.lastError
      },
      audio: {
        initialized: audio.isInitialized,
        contextStarted: audio.isContextStarted,
        userInteraction: audio.hasUserInteraction,
        error: audio.error
      },
      piano: {
        ready: piano.isReady,
        activeNotes: piano.totalActiveNotes,
        sustainActive: piano.sustainActive,
        masterVolume: piano.masterVolume
      },
      keyboard: {
        active: keyboard.isActive,
        pressedKeys: keyboard.pressedKeys.size,
        currentOctave: keyboard.currentOctave,
        sustain: keyboard.modifierKeys.sustain
      },
      metronome: {
        initialized: metronome.isInitialized,
        isRunning: metronome.isRunning,
        bpm: metronome.bpm,
        volume: metronome.volume
      },
      detection: {
        enabled: detection.isEnabled,
        analyzing: detection.isAnalyzing,
        totalAnalyses: detection.totalAnalyses,
        currentChords: detection.currentChords.length,
        currentScales: detection.currentScales.length
      }
    };
  }, [systemState, audio, piano, keyboard, metronome, detection]);

  // ========================================================================================
  // EFFECTS Y LIFECYCLE
  // ========================================================================================

  // Marcar como montado al inicializar
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      isShuttingDownRef.current = true;
    };
  }, []);

  // Auto-inicialización cuando stores estén listos
  useEffect(() => {
    if (stores.isReady && !systemState.isInitialized && !isInitializingRef.current && !isShuttingDownRef.current) {
      console.log('🚀 Auto-initializing system...');
      initialize();
    }
  }, [stores.isReady, systemState.isInitialized, initialize]);

  // Health check periódico
  useEffect(() => {
    if (systemState.isReady && !isShuttingDownRef.current) {
      healthCheckIntervalRef.current = window.setInterval(() => {
        if (!isShuttingDownRef.current) {
          runHealthCheck();
        }
      }, 10000); // Cada 10 segundos

      return () => {
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
          healthCheckIntervalRef.current = null;
        }
      };
    }
  }, [systemState.isReady, runHealthCheck]);

  // Cleanup al desmontar SIN setState
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      isShuttingDownRef.current = true;
      
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }
      
      try { detection.cleanup?.(); } catch {}
      try { keyboard.cleanup?.(); } catch {}
      try { metronome.cleanup?.(); } catch {}
      try { piano.cleanup?.(); } catch {}
      try { audio.cleanup?.(); } catch {}
    };
  }, []);

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado del Sistema
    isReady: systemState.isReady,
    isInitialized: systemState.isInitialized,
    hasAudioPermissions: systemState.hasAudioPermissions,
    totalInitializationTime: systemState.totalInitializationTime,
    lastError: systemState.lastError,
    systemHealth: systemState.systemHealth,
    
    // Controles del Sistema
    initialize,
    restart,
    shutdown,
    enableAll,
    disableAll,
    runHealthCheck,
    getSystemStats,
    ensureAudioContext,
    
    // Instancias de Hooks
    hooks: {
      audio,
      keyboard,
      piano,
      metronome,
      detection,
      stores
    }
  };
};