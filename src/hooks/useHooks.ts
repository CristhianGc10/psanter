// src/hooks/useHooks.ts
/**
 * HOOK MAESTRO DE INTEGRACIÓN - Coordina todos los hooks de la Fase 5
 * Integra audio + keyboard + piano + metronome + detection de forma optimizada
 * Fase 5: Hooks Personalizados - Coordinación Completa
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

  // ========== REFS PARA COORDINACIÓN ==========
  const initializationStartRef = useRef<number>(0);
  const healthCheckIntervalRef = useRef<number | null>(null);
  const isInitializingRef = useRef<boolean>(false);

  // ========== INSTANCIAS DE HOOKS ==========
  
  // 1. Store Integration (base fundamental)
  const stores = useStoreIntegration();
  
  // 2. Audio System
  const audio = useAudio();
  
  // 3. Keyboard System con callbacks coordinados
  const keyboard = useKeyboard(
    // onKeyboardNote - coordinado con piano
    useCallback((note: NoteName, velocity: number, pressed: boolean) => {
      console.log(`🎹 Keyboard event: ${note} ${pressed ? 'ON' : 'OFF'} (vel: ${velocity.toFixed(2)})`);
    }, []),
    
    // onSustainChange - coordinado con piano
    useCallback((active: boolean) => {
      console.log(`🎼 Keyboard sustain: ${active ? 'ON' : 'OFF'}`);
    }, []),
    
    // onOctaveChange - coordinado con piano
    useCallback((octave: number) => {
      console.log(`🎵 Keyboard octave: ${octave}`);
    }, [])
  );

  // 4. Piano System (maestro) con eventos coordinados
  const piano = usePiano({
    onNoteOn: useCallback((note: NoteName, velocity: number, source: string) => {
      // Trigger detection automático si está habilitado
      console.log(`🎹 Note ON: ${note} (${source}, vel: ${velocity.toFixed(2)})`);
    }, []),
    
    onNoteOff: useCallback((note: NoteName, source: string) => {
      console.log(`🎹 Note OFF: ${note} (${source})`);
    }, []),
    
    onSustainChange: useCallback((active: boolean) => {
      console.log(`🎼 Piano sustain: ${active ? 'ACTIVE' : 'INACTIVE'}`);
    }, []),
    
    onVolumeChange: useCallback((volume: number) => {
      console.log(`🔊 Master volume: ${(volume * 100).toFixed(0)}%`);
    }, []),
    
    onOctaveChange: useCallback((octave: number) => {
      console.log(`🎵 Piano octave: ${octave}`);
    }, [])
  });

  // 5. Metronome System con eventos
  const metronome = useMetronome({
    onBeat: useCallback((beat: number, isAccent: boolean, bpm: number) => {
      console.log(`🥁 Beat ${beat} ${isAccent ? '(ACCENT)' : ''} @ ${bpm} BPM`);
    }, []),
    
    onMeasure: useCallback((measure: number) => {
      console.log(`🥁 Measure ${measure}`);
    }, []),
    
    onStart: useCallback(() => {
      console.log('🥁 Metronome started');
    }, []),
    
    onStop: useCallback(() => {
      console.log('🥁 Metronome stopped');
    }, [])
  });

  // 6. Detection System
  const detection = useDetection();

  // ========================================================================================
  // FUNCIONES DE COORDINACIÓN
  // ========================================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    if (isInitializingRef.current) {
      console.log('⚠️ Initialization already in progress');
      return false;
    }

    try {
      isInitializingRef.current = true;
      initializationStartRef.current = performance.now();
      
      console.log('🚀 Starting system initialization...');
      
      setSystemState(prev => ({
        ...prev,
        lastError: null
      }));

      // === FASE 1: VERIFICAR STORES ===
      console.log('📦 Phase 1: Checking stores...');
      if (!stores.isReady) {
        throw new Error('Stores are not ready');
      }

      // === FASE 2: INICIALIZAR AUDIO ===
      console.log('🎵 Phase 2: Initializing audio...');
      const audioSuccess = await audio.initializeAudio();
      if (!audioSuccess) {
        throw new Error('Audio initialization failed');
      }

      // Verificar permisos de audio
      const hasPermissions = await audio.startAudioContext();
      setSystemState(prev => ({ ...prev, hasAudioPermissions: hasPermissions }));

      // === FASE 3: INICIALIZAR PIANO (MAESTRO) ===
      console.log('🎹 Phase 3: Initializing piano system...');
      const pianoSuccess = await piano.initialize();
      if (!pianoSuccess) {
        throw new Error('Piano initialization failed');
      }

      // === FASE 4: INICIALIZAR METRÓNOMO ===
      console.log('🥁 Phase 4: Initializing metronome...');
      const metronomeSuccess = await metronome.initialize();
      if (!metronomeSuccess) {
        console.warn('⚠️ Metronome initialization failed, continuing...');
      }

      // === FASE 5: HABILITAR DETECCIÓN ===
      console.log('🎯 Phase 5: Enabling detection...');
      detection.enable();

      // === FASE 6: HEALTH CHECK INICIAL ===
      console.log('🏥 Phase 6: Running health check...');
      const health = await runHealthCheck();
      
      // === FINALIZACIÓN ===
      const totalTime = performance.now() - initializationStartRef.current;
      
      setSystemState(prev => ({
        ...prev,
        isReady: true,
        isInitialized: true,
        totalInitializationTime: totalTime,
        systemHealth: health
      }));

      // Configurar health check periódico
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
      healthCheckIntervalRef.current = window.setInterval(async () => {
        const newHealth = await runHealthCheck();
        setSystemState(prev => ({ ...prev, systemHealth: newHealth }));
      }, 10000); // Cada 10 segundos

      console.log(`✅ System initialization completed in ${totalTime.toFixed(1)}ms`);
      console.log('🎹 Piano Virtual System Ready!');
      
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      console.error('❌ System initialization failed:', errorMessage);
      
      setSystemState(prev => ({
        ...prev,
        isReady: false,
        isInitialized: false,
        lastError: errorMessage
      }));

      return false;
      
    } finally {
      isInitializingRef.current = false;
    }
  }, [stores.isReady, audio, piano, metronome, detection]);

  const restart = useCallback(async (): Promise<boolean> => {
    console.log('🔄 Restarting system...');
    
    // Shutdown primero
    shutdown();
    
    // Esperar un momento para cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Re-inicializar
    return await initialize();
  }, [initialize]);

  const shutdown = useCallback((): void => {
    console.log('🛑 Shutting down system...');
    
    // Detener health check
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }

    // Shutdown en orden inverso
    try {
      detection.disable();
      metronome.stop();
      piano.disable();
      keyboard.disable();
      audio.cleanup();
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }

    // Reset estado
    setSystemState({
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

    console.log('🛑 System shutdown completed');
  }, [detection, metronome, piano, keyboard, audio]);

  const enableAll = useCallback((): void => {
    console.log('✅ Enabling all systems...');
    
    try {
      piano.enable();
      keyboard.enable();
      detection.enable();
      // No habilitar metrónomo automáticamente
      
      console.log('✅ All systems enabled');
    } catch (error) {
      console.error('❌ Error enabling systems:', error);
    }
  }, [piano, keyboard, detection]);

  const disableAll = useCallback((): void => {
    console.log('⏸️ Disabling all systems...');
    
    try {
      detection.disable();
      metronome.stop();
      piano.disable();
      keyboard.disable();
      
      console.log('⏸️ All systems disabled');
    } catch (error) {
      console.error('❌ Error disabling systems:', error);
    }
  }, [detection, metronome, piano, keyboard]);

  // ========================================================================================
  // HEALTH CHECK SYSTEM
  // ========================================================================================

  const runHealthCheck = useCallback(async (): Promise<SystemState['systemHealth']> => {
    const health: SystemState['systemHealth'] = {
      audio: 'failed',
      keyboard: 'failed',
      detection: 'failed',
      metronome: 'failed'
    };

    try {
      // Audio Health
      if (audio.isInitialized && audio.isContextStarted) {
        health.audio = 'healthy';
      } else if (audio.isInitialized) {
        health.audio = 'degraded';
      }

      // Keyboard Health
      if (keyboard.isActive) {
        health.keyboard = 'healthy';
      }

      // Detection Health
      if (detection.isEnabled && !detection.error) {
        health.detection = 'healthy';
      } else if (detection.isEnabled) {
        health.detection = 'degraded';
      }

      // Metronome Health
      if (metronome.isInitialized && !metronome.error) {
        health.metronome = 'healthy';
      } else if (metronome.isInitialized) {
        health.metronome = 'degraded';
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
    }

    return health;
  }, [audio, keyboard, detection, metronome]);

  const getSystemStats = useCallback((): Record<string, any> => {
    return {
      system: {
        isReady: systemState.isReady,
        isInitialized: systemState.isInitialized,
        initTime: systemState.totalInitializationTime,
        health: systemState.systemHealth
      },
      audio: {
        isInitialized: audio.isInitialized,
        hasContext: audio.isContextStarted,
        hasPermissions: systemState.hasAudioPermissions,
        error: audio.error
      },
      piano: {
        isReady: piano.isReady,
        activeNotes: piano.totalActiveNotes,
        sustain: piano.sustainActive,
        volume: piano.masterVolume,
        octave: piano.currentOctave
      },
      keyboard: {
        isActive: keyboard.isActive,
        pressedKeys: keyboard.pressedKeys.size,
        currentOctave: keyboard.currentOctave,
        modifiers: keyboard.modifierKeys
      },
      metronome: {
        isRunning: metronome.isRunning,
        bpm: metronome.bpm,
        currentBeat: metronome.currentBeat,
        totalBeats: metronome.totalBeats
      },
      detection: {
        isEnabled: detection.isEnabled,
        isAnalyzing: detection.isAnalyzing,
        chords: detection.currentChords,
        scales: detection.currentScales,
        confidence: detection.confidence,
        totalAnalyses: detection.totalAnalyses
      }
    };
  }, [systemState, audio, piano, keyboard, metronome, detection]);

  // ========================================================================================
  // EFFECTS - AUTO-INICIALIZACIÓN
  // ========================================================================================

  // Auto-inicialización cuando stores están listos
  useEffect(() => {
    if (stores.isReady && !systemState.isInitialized && !isInitializingRef.current) {
      console.log('🚀 Auto-initializing system...');
      initialize();
    }
  }, [stores.isReady, systemState.isInitialized, initialize]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      shutdown();
    };
  }, [shutdown]);

  // ========================================================================================
  // LOGGING Y DEBUG
  // ========================================================================================

  // Log estado del sistema cada vez que cambia
  useEffect(() => {
    if (systemState.isReady) {
      console.log('📊 System Status:', {
        ready: systemState.isReady,
        audio: audio.isInitialized,
        piano: piano.isReady,
        keyboard: keyboard.isActive,
        metronome: metronome.isInitialized,
        detection: detection.isEnabled
      });
    }
  }, [systemState.isReady, audio.isInitialized, piano.isReady, keyboard.isActive, metronome.isInitialized, detection.isEnabled]);

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