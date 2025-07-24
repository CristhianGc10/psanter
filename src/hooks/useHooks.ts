// src/hooks/useHooks.ts
/**
 * HOOK MAESTRO - VERSIÓN CORREGIDA PARA FASE 5
 * ✅ Elimina re-rendering loops
 * ✅ Manejo correcto de AudioContext
 * ✅ Inicialización optimizada
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
// INTERFACES
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
  ensureAudioContext: () => Promise<boolean>;
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
// 🔥 HOOK MAESTRO useHooks - CORREGIDO
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
  const isInitializingRef = useRef<boolean>(false);
  const isShuttingDownRef = useRef<boolean>(false);

  // ========== INSTANCIAS DE HOOKS CON HANDLERS ESTABLES ==========

  // 1. Store Integration (base fundamental)
  const stores = useStoreIntegration();
  
  // 2. Audio System
  const audio = useAudio();

  // ✅ HANDLERS ESTABLES - useCallback con dependencies mínimas
  const handleKeyboardNote = useCallback((note: NoteName, velocity: number, pressed: boolean) => {
    if (!isShuttingDownRef.current && piano.isReady) {
      if (pressed) {
        piano.playNote(note, velocity, 'keyboard');
      } else {
        piano.stopNote(note, 'keyboard');
      }
    }
  }, []); // ✅ Sin dependencies - piano.isReady se verifica internamente

  const handleSustainChange = useCallback((active: boolean) => {
    if (!isShuttingDownRef.current && piano.isReady) {
      piano.setSustain(active);
    }
  }, []);

  const handleOctaveChange = useCallback((octave: number) => {
    if (!isShuttingDownRef.current) {
      console.log(`🎹 Octave changed: ${octave}`);
    }
  }, []);

  // 3. Keyboard System con handlers estables
  const keyboard = useKeyboard(
    handleKeyboardNote,
    handleSustainChange,
    handleOctaveChange
  );

  // ✅ PIANO HANDLERS ESTABLES
  const handlePianoNoteOn = useCallback((note: NoteName, velocity: number, source: string) => {
    if (!isShuttingDownRef.current) {
      console.log(`🎹 Note ON: ${note} (vel: ${velocity.toFixed(2)}, src: ${source})`);
    }
  }, []);

  const handlePianoNoteOff = useCallback((note: NoteName, source: string) => {
    if (!isShuttingDownRef.current) {
      console.log(`🎹 Note OFF: ${note} (src: ${source})`);
    }
  }, []);

  const handlePianoSustainChange = useCallback((active: boolean) => {
    if (!isShuttingDownRef.current) {
      console.log(`🎹 Sustain: ${active ? 'ON' : 'OFF'}`);
    }
  }, []);

  // 4. Piano System (maestro) con handlers estables
  const piano = usePiano({
    onNoteOn: handlePianoNoteOn,
    onNoteOff: handlePianoNoteOff,
    onSustainChange: handlePianoSustainChange
  });
  
  // 5. Metronome System
  const metronome = useMetronome();
  
  // 6. Detection System
  const detection = useDetection();

  // ========================================================================================
  // HELPER FUNCTIONS - ESTABLES
  // ========================================================================================

  const updateSystemState = useCallback((updates: Partial<SystemState>) => {
    if (isMountedRef.current) {
      setSystemState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // ========================================================================================
  // 🚨 SOLUCIÓN: CONTROL CORRECTO DE AUDIOCONTEXT
  // ========================================================================================

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
  }, [audio.hasUserInteraction, audio.startAudioContext, updateSystemState]);

  // ========================================================================================
  // INICIALIZACIÓN DEL SISTEMA - OPTIMIZADA
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

      // 1. Inicializar audio primero (SIN activar contexto)
      console.log('🔊 Initializing audio components...');
      const audioSuccess = await audio.initializeAudio();
      
      if (!audioSuccess) {
        throw new Error('Audio component initialization failed');
      }

      // ✅ IMPORTANTE: NO verificar permisos automáticamente
      console.log('ℹ️ Audio context will start on first user interaction');

      // 2. Inicializar piano (maestro)
      console.log('🎹 Initializing piano...');
      const pianoSuccess = await piano.initialize?.() || piano.isReady;
      
      if (!pianoSuccess) {
        throw new Error('Piano initialization failed');
      }

      // 3. Habilitar sistemas auxiliares
      console.log('⌨️ Enabling keyboard...');
      keyboard.enable();
      
      console.log('🎯 Enabling detection...');
      detection.enable?.();

      // 4. Calcular tiempo total
      const totalTime = performance.now() - initializationStartRef.current;

      // 5. Actualizar estado final
      updateSystemState({
        isInitialized: true,
        isReady: true,
        totalInitializationTime: totalTime,
        systemHealth: {
          audio: audioSuccess ? 'healthy' : 'failed',
          keyboard: 'healthy',
          detection: 'healthy',
          metronome: 'healthy'
        }
      });

      console.log(`✅ System initialized successfully in ${totalTime.toFixed(1)}ms`);
      return true;

    } catch (error) {
      console.error('❌ System initialization failed:', error);
      
      updateSystemState({
        isInitialized: false,
        isReady: false,
        lastError: error instanceof Error ? error.message : 'Initialization failed'
      });

      return false;
    } finally {
      isInitializingRef.current = false;
    }
  }, [audio, piano, keyboard, detection, updateSystemState]);

  // ========================================================================================
  // CONTROL DEL SISTEMA - OPTIMIZADO
  // ========================================================================================

  const restart = useCallback(async (): Promise<boolean> => {
    console.log('🔄 Restarting system...');
    
    shutdown();
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequeño delay
    
    return await initialize();
  }, [initialize]);

  const shutdown = useCallback(() => {
    isShuttingDownRef.current = true;
    
    console.log('🛑 Shutting down system...');
    
    // Detener todo
    piano.panic?.();
    metronome.stop?.();
    
    // Limpiar hooks
    audio.cleanup();
    keyboard.cleanup();
    detection.cleanup?.();
    
    updateSystemState({
      isReady: false,
      isInitialized: false,
      hasAudioPermissions: false
    });

    console.log('✅ System shutdown completed');
    isShuttingDownRef.current = false;
  }, [audio, keyboard, piano, metronome, detection, updateSystemState]);

  const enableAll = useCallback(() => {
    keyboard.enable();
    detection.enable?.();
    console.log('🎮 All systems enabled');
  }, [keyboard, detection]);

  const disableAll = useCallback(() => {
    keyboard.disable();
    detection.disable?.();
    console.log('⏸️ All systems disabled');
  }, [keyboard, detection]);

  const getSystemStats = useCallback(() => {
    return {
      isReady: systemState.isReady,
      hasAudioPermissions: systemState.hasAudioPermissions,
      totalInitializationTime: systemState.totalInitializationTime,
      audioInitialized: audio.isInitialized,
      audioContextStarted: audio.isContextStarted,
      keyboardActive: keyboard.isActive,
      pianoReady: piano.isReady,
      currentOctave: keyboard.currentOctave
    };
  }, [systemState, audio, keyboard, piano]);

  // ========================================================================================
  // 🚨 SOLUCIÓN: EFFECTS OPTIMIZADOS
  // ========================================================================================

  // Inicialización automática SOLO al montar
  useEffect(() => {
    isMountedRef.current = true;
    
    // ✅ Inicializar automáticamente pero SIN AudioContext
    const initializeSystem = async () => {
      if (!systemState.isInitialized) {
        console.log('🎯 Auto-initializing system...');
        await initialize();
      }
    };

    initializeSystem();

    // Cleanup al desmontar
    return () => {
      isMountedRef.current = false;
      isShuttingDownRef.current = true;
    };
  }, []); // ✅ Array vacío - solo al montar

  // ========================================================================================
  // RETURN HOOK
  // ========================================================================================

  return {
    // Estado del sistema
    ...systemState,
    
    // Controles del sistema
    initialize,
    restart,
    shutdown,
    enableAll,
    disableAll,
    ensureAudioContext,
    getSystemStats,
    
    // Instancias de hooks
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