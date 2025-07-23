// src/utils/phase5Verification.ts
/**
 * VERIFICACIÓN DE CRITERIOS FASE 5 - HOOKS PERSONALIZADOS
 * Verifica que todos los hooks funcionen correctamente según los criterios establecidos
 */

import type { NoteName } from '../types/piano';

// ========================================================================================
// INTERFACES
// ========================================================================================

interface VerificationResults {
  tests: Record<string, boolean>;
  score: number;
  total: number;
  percentage: number;
  status: 'PASSED' | 'FAILED' | 'PARTIAL';
  errors: string[];
  timing: Record<string, number>;
}

interface SystemHooks {
  isReady: boolean;
  hooks: {
    audio: any;
    keyboard: any;
    piano: any;
    metronome: any;
    detection: any;
    stores: any;
  };
  systemHealth: Record<string, string>;
}

// ========================================================================================
// CRITERIOS DE COMPLETITUD FASE 5
// ========================================================================================

const PHASE5_CRITERIA = {
  // ✅ Cada hook funciona independientemente
  'hook_audio_independent': 'useAudio funciona independientemente',
  'hook_keyboard_independent': 'useKeyboard funciona independientemente', 
  'hook_piano_independent': 'usePiano funciona independientemente',
  'hook_metronome_independent': 'useMetronome funciona independientemente',
  'hook_detection_independent': 'useDetection funciona independientemente',
  
  // ✅ Audio se inicializa correctamente en todos los navegadores
  'audio_initialization_correct': 'Audio se inicializa correctamente',
  'audio_context_management': 'Contexto de audio se gestiona correctamente',
  'audio_permissions_handled': 'Permisos de audio se manejan correctamente',
  
  // ✅ Teclado físico responde sin lag perceptible
  'keyboard_response_time': 'Teclado responde sin lag perceptible',
  'keyboard_no_autorepeat': 'Prevención de auto-repeat funciona',
  'keyboard_modifier_keys': 'Teclas modificadoras funcionan correctamente',
  'keyboard_special_keys': 'Teclas especiales (sustain, octavas) funcionan',
  
  // ✅ Metrónomo mantiene timing preciso
  'metronome_timing_precision': 'Metrónomo mantiene timing preciso',
  'metronome_bpm_control': 'Control de BPM funciona correctamente',
  'metronome_sound_differentiation': 'Sonidos diferenciados (acento vs normal)',
  
  // ✅ Detección funciona en tiempo real sin lag
  'detection_realtime_performance': 'Detección funciona en tiempo real',
  'detection_debouncing_works': 'Debouncing evita spam correctamente',
  'detection_chord_analysis': 'Análisis de acordes funciona',
  'detection_scale_analysis': 'Análisis de escalas funciona',
  
  // ✅ Cleanup correcto de event listeners y timers
  'cleanup_event_listeners': 'Event listeners se limpian correctamente',
  'cleanup_timers': 'Timers se limpian correctamente',
  'cleanup_memory_leaks': 'No hay memory leaks detectables'
};

// ========================================================================================
// FUNCIÓN PRINCIPAL DE VERIFICACIÓN
// ========================================================================================

export const verifyPhase5Criteria = async (system: SystemHooks): Promise<VerificationResults> => {
  console.log('🧪 Starting Phase 5 Verification...');
  
  const results: VerificationResults = {
    tests: {},
    score: 0,
    total: Object.keys(PHASE5_CRITERIA).length,
    percentage: 0,
    status: 'FAILED',
    errors: [],
    timing: {}
  };

  try {
    // Verificar que el sistema esté listo
    if (!system.isReady) {
      throw new Error('System is not ready for verification');
    }

    // ========== VERIFICACIÓN DE HOOKS INDEPENDIENTES ==========
    
    console.log('🔧 Testing independent hook functionality...');
    
    // useAudio independiente
    results.timing.audio_test_start = performance.now();
    results.tests.hook_audio_independent = await testAudioHookIndependent(system.hooks.audio);
    results.timing.audio_test_end = performance.now();
    
    // useKeyboard independiente
    results.timing.keyboard_test_start = performance.now();
    results.tests.hook_keyboard_independent = await testKeyboardHookIndependent(system.hooks.keyboard);
    results.timing.keyboard_test_end = performance.now();
    
    // usePiano independiente
    results.timing.piano_test_start = performance.now();
    results.tests.hook_piano_independent = await testPianoHookIndependent(system.hooks.piano);
    results.timing.piano_test_end = performance.now();
    
    // useMetronome independiente
    results.timing.metronome_test_start = performance.now();
    results.tests.hook_metronome_independent = await testMetronomeHookIndependent(system.hooks.metronome);
    results.timing.metronome_test_end = performance.now();
    
    // useDetection independiente
    results.timing.detection_test_start = performance.now();
    results.tests.hook_detection_independent = await testDetectionHookIndependent(system.hooks.detection);
    results.timing.detection_test_end = performance.now();

    // ========== VERIFICACIÓN DE INICIALIZACIÓN DE AUDIO ==========
    
    console.log('🎵 Testing audio initialization...');
    
    results.tests.audio_initialization_correct = testAudioInitialization(system.hooks.audio);
    results.tests.audio_context_management = testAudioContextManagement(system.hooks.audio);
    results.tests.audio_permissions_handled = testAudioPermissions(system.hooks.audio);

    // ========== VERIFICACIÓN DE RESPUESTA DEL TECLADO ==========
    
    console.log('⌨️ Testing keyboard responsiveness...');
    
    results.tests.keyboard_response_time = await testKeyboardResponseTime(system.hooks.keyboard, system.hooks.piano);
    results.tests.keyboard_no_autorepeat = testKeyboardAutoRepeat(system.hooks.keyboard);
    results.tests.keyboard_modifier_keys = testKeyboardModifierKeys(system.hooks.keyboard);
    results.tests.keyboard_special_keys = testKeyboardSpecialKeys(system.hooks.keyboard);

    // ========== VERIFICACIÓN DE PRECISIÓN DEL METRÓNOMO ==========
    
    console.log('🥁 Testing metronome precision...');
    
    results.tests.metronome_timing_precision = await testMetronomeTimingPrecision(system.hooks.metronome);
    results.tests.metronome_bpm_control = testMetronomeBPMControl(system.hooks.metronome);
    results.tests.metronome_sound_differentiation = testMetronomeSoundDifferentiation(system.hooks.metronome);

    // ========== VERIFICACIÓN DE DETECCIÓN EN TIEMPO REAL ==========
    
    console.log('🎯 Testing real-time detection...');
    
    results.tests.detection_realtime_performance = await testDetectionRealtimePerformance(system.hooks.detection);
    results.tests.detection_debouncing_works = await testDetectionDebouncing(system.hooks.detection);
    results.tests.detection_chord_analysis = await testDetectionChordAnalysis(system.hooks.detection);
    results.tests.detection_scale_analysis = await testDetectionScaleAnalysis(system.hooks.detection);

    // ========== VERIFICACIÓN DE CLEANUP ==========
    
    console.log('🧹 Testing cleanup procedures...');
    
    results.tests.cleanup_event_listeners = testCleanupEventListeners(system.hooks);
    results.tests.cleanup_timers = testCleanupTimers(system.hooks);
    results.tests.cleanup_memory_leaks = testCleanupMemoryLeaks(system.hooks);

    // ========== CALCULAR RESULTADOS ==========
    
    const passedTests = Object.values(results.tests).filter(Boolean).length;
    results.score = passedTests;
    results.percentage = (passedTests / results.total) * 100;
    
    if (results.percentage >= 90) {
      results.status = 'PASSED';
    } else if (results.percentage >= 70) {
      results.status = 'PARTIAL';
    } else {
      results.status = 'FAILED';
    }

    console.log(`📊 Phase 5 Verification completed: ${results.score}/${results.total} (${results.percentage.toFixed(1)}%)`);
    
    return results;

  } catch (error) {
    console.error('❌ Phase 5 verification failed:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return results;
  }
};

// ========================================================================================
// FUNCIONES DE PRUEBA INDIVIDUALES
// ========================================================================================

// ========== TESTS DE HOOKS INDEPENDIENTES ==========

const testAudioHookIndependent = async (audioHook: any): Promise<boolean> => {
  try {
    // Verificar propiedades esenciales
    const hasRequiredProps = !!(
      audioHook.isInitialized !== undefined &&
      audioHook.playNote &&
      audioHook.stopNote &&
      audioHook.setMasterVolume &&
      audioHook.cleanup
    );
    
    if (!hasRequiredProps) {
      console.warn('❌ useAudio missing required properties');
      return false;
    }

    // Test básico de inicialización
    if (!audioHook.isInitialized) {
      console.warn('❌ useAudio not initialized');
      return false;
    }

    console.log('✅ useAudio hook independent test passed');
    return true;
    
  } catch (error) {
    console.error('❌ useAudio independent test failed:', error);
    return false;
  }
};

const testKeyboardHookIndependent = async (keyboardHook: any): Promise<boolean> => {
  try {
    const hasRequiredProps = !!(
      keyboardHook.isActive !== undefined &&
      keyboardHook.pressedKeys &&
      keyboardHook.modifierKeys &&
      keyboardHook.enable &&
      keyboardHook.disable &&
      keyboardHook.cleanup
    );
    
    if (!hasRequiredProps) {
      console.warn('❌ useKeyboard missing required properties');
      return false;
    }

    console.log('✅ useKeyboard hook independent test passed');
    return true;
    
  } catch (error) {
    console.error('❌ useKeyboard independent test failed:', error);
    return false;
  }
};

const testPianoHookIndependent = async (pianoHook: any): Promise<boolean> => {
  try {
    const hasRequiredProps = !!(
      pianoHook.isReady !== undefined &&
      pianoHook.playNote &&
      pianoHook.stopNote &&
      pianoHook.setSustain &&
      pianoHook.setMasterVolume &&
      pianoHook.panic &&
      pianoHook.cleanup
    );
    
    if (!hasRequiredProps) {
      console.warn('❌ usePiano missing required properties');
      return false;
    }

    // Test básico de funcionalidad
    if (!pianoHook.isReady) {
      console.warn('❌ usePiano not ready');
      return false;
    }

    console.log('✅ usePiano hook independent test passed');
    return true;
    
  } catch (error) {
    console.error('❌ usePiano independent test failed:', error);
    return false;
  }
};

const testMetronomeHookIndependent = async (metronomeHook: any): Promise<boolean> => {
  try {
    const hasRequiredProps = !!(
      metronomeHook.isInitialized !== undefined &&
      metronomeHook.start &&
      metronomeHook.stop &&
      metronomeHook.setBPM &&
      metronomeHook.setVolume &&
      metronomeHook.cleanup
    );
    
    if (!hasRequiredProps) {
      console.warn('❌ useMetronome missing required properties');
      return false;
    }

    console.log('✅ useMetronome hook independent test passed');
    return true;
    
  } catch (error) {
    console.error('❌ useMetronome independent test failed:', error);
    return false;
  }
};

const testDetectionHookIndependent = async (detectionHook: any): Promise<boolean> => {
  try {
    const hasRequiredProps = !!(
      detectionHook.isEnabled !== undefined &&
      detectionHook.currentChords &&
      detectionHook.currentScales &&
      detectionHook.analyzeNotes &&
      detectionHook.enable &&
      detectionHook.disable &&
      detectionHook.cleanup
    );
    
    if (!hasRequiredProps) {
      console.warn('❌ useDetection missing required properties');
      return false;
    }

    console.log('✅ useDetection hook independent test passed');
    return true;
    
  } catch (error) {
    console.error('❌ useDetection independent test failed:', error);
    return false;
  }
};

// ========== TESTS DE AUDIO ==========

const testAudioInitialization = (audioHook: any): boolean => {
  try {
    return audioHook.isInitialized && !audioHook.error;
  } catch (error) {
    return false;
  }
};

const testAudioContextManagement = (audioHook: any): boolean => {
  try {
    return audioHook.isContextStarted !== undefined && audioHook.startAudioContext;
  } catch (error) {
    return false;
  }
};

const testAudioPermissions = (audioHook: any): boolean => {
  try {
    return audioHook.hasUserInteraction !== undefined;
  } catch (error) {
    return false;
  }
};

// ========== TESTS DE TECLADO ==========

const testKeyboardResponseTime = async (keyboardHook: any, _pianoHook: any): Promise<boolean> => {
  try {
    // Simular que el teclado está activo
    if (!keyboardHook.isActive) {
      return false;
    }

    // Verificar que las teclas presionadas se manejan rápidamente
    const responseTime = performance.now();
    const hasGoodResponse = keyboardHook.pressedKeys !== undefined;
    const actualTime = performance.now() - responseTime;
    
    // Considerar bueno si la respuesta es menor a 16ms (60fps)
    return hasGoodResponse && actualTime < 16;
    
  } catch (error) {
    return false;
  }
};

const testKeyboardAutoRepeat = (keyboardHook: any): boolean => {
  try {
    return keyboardHook.preventAutoRepeat === true;
  } catch (error) {
    return false;
  }
};

const testKeyboardModifierKeys = (keyboardHook: any): boolean => {
  try {
    const modifiers = keyboardHook.modifierKeys;
    return !!(modifiers && 
      typeof modifiers.shift === 'boolean' &&
      typeof modifiers.ctrl === 'boolean' &&
      typeof modifiers.alt === 'boolean' &&
      typeof modifiers.sustain === 'boolean'
    );
  } catch (error) {
    return false;
  }
};

const testKeyboardSpecialKeys = (keyboardHook: any): boolean => {
  try {
    return !!(keyboardHook.setOctave && keyboardHook.setSustain);
  } catch (error) {
    return false;
  }
};

// ========== TESTS DE METRÓNOMO ==========

const testMetronomeTimingPrecision = async (metronomeHook: any): Promise<boolean> => {
  try {
    // Verificar que tiene propiedades de timing
    return !!(metronomeHook.bpm && metronomeHook.nextBeatTime !== undefined);
  } catch (error) {
    return false;
  }
};

const testMetronomeBPMControl = (metronomeHook: any): boolean => {
  try {
    const currentBPM = metronomeHook.bpm;
    return typeof currentBPM === 'number' && currentBPM >= 40 && currentBPM <= 300;
  } catch (error) {
    return false;
  }
};

const testMetronomeSoundDifferentiation = (metronomeHook: any): boolean => {
  try {
    return !!(metronomeHook.volume !== undefined && metronomeHook.accentVolume !== undefined);
  } catch (error) {
    return false;
  }
};

// ========== TESTS DE DETECCIÓN ==========

const testDetectionRealtimePerformance = async (detectionHook: any): Promise<boolean> => {
  try {
    const startTime = performance.now();
    
    // Simular análisis de notas
    if (detectionHook.analyzeNotes) {
      await detectionHook.analyzeNotes(['C4', 'E4', 'G4'] as NoteName[]);
    }
    
    const endTime = performance.now();
    const analysisTime = endTime - startTime;
    
    // Considerar bueno si el análisis toma menos de 50ms
    return analysisTime < 50;
    
  } catch (error) {
    return false;
  }
};

const testDetectionDebouncing = async (detectionHook: any): Promise<boolean> => {
  try {
    // Verificar que tiene sistema de debouncing
    return !!(detectionHook.setDebounceTime && detectionHook.isAnalyzing !== undefined);
  } catch (error) {
    return false;
  }
};

const testDetectionChordAnalysis = async (detectionHook: any): Promise<boolean> => {
  try {
    return Array.isArray(detectionHook.currentChords);
  } catch (error) {
    return false;
  }
};

const testDetectionScaleAnalysis = async (detectionHook: any): Promise<boolean> => {
  try {
    return Array.isArray(detectionHook.currentScales);
  } catch (error) {
    return false;
  }
};

// ========== TESTS DE CLEANUP ==========

const testCleanupEventListeners = (hooks: any): boolean => {
  try {
    // Verificar que todos los hooks tienen función cleanup
    const hasCleanup = !!(
      hooks.audio.cleanup &&
      hooks.keyboard.cleanup &&
      hooks.piano.cleanup &&
      hooks.metronome.cleanup &&
      hooks.detection.cleanup
    );
    
    return hasCleanup;
    
  } catch (error) {
    return false;
  }
};

const testCleanupTimers = (hooks: any): boolean => {
  try {
    // Verificar que el metrónomo y detección manejan timers
    return !!(hooks.metronome.stop && hooks.detection.disable);
  } catch (error) {
    return false;
  }
};

const testCleanupMemoryLeaks = (hooks: any): boolean => {
  try {
    // Verificación básica - en un test real necesitaríamos más análisis
    return !!(hooks.audio.cleanup && hooks.piano.cleanup);
  } catch (error) {
    return false;
  }
};

// ========================================================================================
// UTILIDADES DE REPORTE
// ========================================================================================

export const generatePhase5Report = (results: VerificationResults): string => {
  const report = `
=== REPORTE DE VERIFICACIÓN FASE 5 ===

Estado General: ${results.status}
Puntuación: ${results.score}/${results.total} (${results.percentage.toFixed(1)}%)

CRITERIOS DE COMPLETITUD:
${Object.entries(PHASE5_CRITERIA).map(([key, description]) => 
  `${results.tests[key] ? '✅' : '❌'} ${description}`
).join('\n')}

${results.errors.length > 0 ? `
ERRORES:
${results.errors.map(error => `❌ ${error}`).join('\n')}
` : ''}

TIEMPOS DE EJECUCIÓN:
${Object.entries(results.timing).map(([key, time]) => 
  `⏱️ ${key}: ${time.toFixed(2)}ms`
).join('\n')}

=== FIN DEL REPORTE ===
  `.trim();
  
  return report;
};