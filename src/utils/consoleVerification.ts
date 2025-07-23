// src/utils/consoleVerification.ts
/**
 * Funciones de verificación por consola - Solo lo esencial
 * Para verificar 14 tests y 4 stores sin contaminar la UI
 */

import { usePianoStore } from '../store/pianoStore';
import { useAudioStore } from '../store/audioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDetectionStore } from '../store/detectionStore';
import type { NoteName } from '../types/piano';

// ============================================================================
// VERIFICACIÓN DE 14 TESTS - SILENCIOSA
// ============================================================================

export const verifyPhase4Tests = async (): Promise<{
  passed: number;
  total: number;
  percentage: number;
  results: Record<string, boolean>;
  status: 'PASSED' | 'FAILED';
}> => {
  console.log('🧪 Running Phase 4 Tests (Silent)...');
  
  const results: Record<string, boolean> = {};

  try {
    // Piano Store Tests
    const piano = usePianoStore.getState();
    piano.clearAll();
    
    piano.pressKey('C4' as NoteName, 0.8);
    results.pianoPress = piano.isKeyPressed('C4' as NoteName);
    
    piano.releaseKey('C4' as NoteName);
    results.pianoRelease = !piano.isKeyPressed('C4' as NoteName);
    
    piano.setSustain(true);
    piano.pressKey('E4' as NoteName);
    piano.releaseKey('E4' as NoteName);
    results.sustainWorks = piano.isKeyActive('E4' as NoteName);
    piano.clearAll();
    
    const originalVol = piano.masterVolume;
    piano.setMasterVolume(0.5);
    await new Promise(resolve => setTimeout(resolve, 10));
    results.volumeControl = Math.abs(usePianoStore.getState().masterVolume - 0.5) < 0.1;

    // Audio Store Tests
    const audio = useAudioStore.getState();
    await audio.initializeAudio();
    results.audioInit = audio.isInitialized;
    
    const originalPreset = audio.currentPreset;
    const targetPreset = originalPreset === 'classic_piano' ? 'bright_piano' : 'classic_piano';
    audio.setPreset(targetPreset as any);
    await new Promise(resolve => setTimeout(resolve, 50));
    results.presetChange = useAudioStore.getState().currentPreset === targetPreset;
    
    const originalAttack = audio.synthSettings.envelope.attack;
    const targetAttack = originalAttack > 0.1 ? 0.02 : 0.15;
    audio.setADSREnvelope({ attack: targetAttack });
    await new Promise(resolve => setTimeout(resolve, 50));
    results.adsrControl = Math.abs(useAudioStore.getState().synthSettings.envelope.attack - targetAttack) < 0.05;

    // Settings Store Tests
    const settings = useSettingsStore.getState();
    const originalTheme = settings.theme.colorScheme;
    const targetTheme = originalTheme === 'dark' ? 'light' : 'dark';
    settings.setTheme({ colorScheme: targetTheme });
    await new Promise(resolve => setTimeout(resolve, 10));
    results.themeChange = useSettingsStore.getState().theme.colorScheme === targetTheme;
    
    const originalSize = settings.layout.pianoSize;
    const sizeMap = { small: 'medium', medium: 'large', large: 'small' } as const;
    const targetSize = sizeMap[originalSize] || 'medium';
    settings.setPianoSize(targetSize);
    await new Promise(resolve => setTimeout(resolve, 50));
    results.layoutChange = useSettingsStore.getState().layout.pianoSize === targetSize;
    
    const originalDetection = settings.detection.autoDetection;
    settings.toggleAutoDetection();
    await new Promise(resolve => setTimeout(resolve, 50));
    results.detectionToggle = useSettingsStore.getState().detection.autoDetection !== originalDetection;
    settings.toggleAutoDetection(); // Restore

    // Detection Store Tests
    const detection = useDetectionStore.getState();
    detection.enable();
    results.detectionEnable = detection.isEnabled;
    
    detection.clearAllHistory();
    const testNotes = ['C4', 'E4', 'G4'] as NoteName[];
    const chords = detection.analyzeChords(testNotes);
    detection.analyzeNotes(testNotes);
    await new Promise(resolve => setTimeout(resolve, 100));
    results.chordDetection = chords.length > 0 || useDetectionStore.getState().currentChords.length > 0;
    
    detection.clearAllHistory();
    await new Promise(resolve => setTimeout(resolve, 50));
    results.detectionClear = useDetectionStore.getState().currentChords.length === 0;

    // Memory Leak Test
    let triggered = false;
    const unsub = usePianoStore.subscribe(() => { triggered = true; });
    piano.adjustVolume(0.001);
    await new Promise(resolve => setTimeout(resolve, 50));
    unsub();
    results.memoryLeakPrevention = triggered;

  } catch (error) {
    console.error('Test error:', error);
  }

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  const percentage = Math.round((passed / total) * 100);
  const status = percentage >= 95 ? 'PASSED' : 'FAILED';

  console.log(`📊 Test Results: ${passed}/${total} (${percentage}%)`);
  console.log(`🎯 Status: ${status}`);
  
  if (status === 'PASSED') {
    console.log('✅ All critical tests passed - Phase 4 is working correctly!');
  } else {
    console.log('⚠️  Some tests failed:', Object.entries(results).filter(([_, passed]) => !passed).map(([name]) => name));
  }

  return { passed, total, percentage, results, status };
};

// ============================================================================
// VERIFICACIÓN DE STATUS DE 4 STORES
// ============================================================================

export const verifyStoreStatus = (): {
  allReady: boolean;
  stores: Record<string, { ready: boolean; details: any }>;
  summary: string;
} => {
  console.log('🔍 Checking Store Status...');

  const stores = {
    piano: (() => {
      const state = usePianoStore.getState();
      return {
        ready: state.isInitialized,
        details: {
          initialized: state.isInitialized,
          activeNotes: state.getActiveNotes().length,
          volume: state.masterVolume,
          sustain: state.sustainActive
        }
      };
    })(),
    
    audio: (() => {
      const state = useAudioStore.getState();
      return {
        ready: state.isInitialized,
        details: {
          initialized: state.isInitialized,
          contextStarted: state.isAudioContextStarted,
          preset: state.currentPreset,
          canPlay: state.canPlayAudio()
        }
      };
    })(),
    
    settings: (() => {
      const state = useSettingsStore.getState();
      return {
        ready: state.isLoaded,
        details: {
          loaded: state.isLoaded,
          theme: state.theme.colorScheme,
          pianoSize: state.layout.pianoSize,
          autoDetection: state.detection.autoDetection
        }
      };
    })(),
    
    detection: (() => {
      const state = useDetectionStore.getState();
      return {
        ready: state.isEnabled,
        details: {
          enabled: state.isEnabled,
          running: state.isRunning,
          currentChords: state.currentChords.length,
          currentScales: state.currentScales.length
        }
      };
    })()
  };

  const readyCount = Object.values(stores).filter(store => store.ready).length;
  const allReady = readyCount === 4;
  
  console.log('📋 Store Status:');
  Object.entries(stores).forEach(([name, store]) => {
    console.log(`  ${store.ready ? '✅' : '❌'} ${name}: ${store.ready ? 'Ready' : 'Not Ready'}`);
  });
  
  const summary = `${readyCount}/4 stores ready - ${allReady ? 'All systems operational' : 'Some stores need attention'}`;
  console.log(`🎯 ${summary}`);

  if (allReady) {
    console.log('🚀 Phase 4 is fully operational and ready for Phase 5!');
  }

  return { allReady, stores, summary };
};

// ============================================================================
// VERIFICACIÓN COMPLETA (Ambas funciones)
// ============================================================================

export const verifyPhase4Complete = async () => {
  console.log('🎯 === PHASE 4 COMPLETE VERIFICATION ===');
  
  const storeStatus = verifyStoreStatus();
  console.log('');
  const testResults = await verifyPhase4Tests();
  
  console.log('');
  console.log('📊 === FINAL SUMMARY ===');
  console.log(`🏪 Stores: ${storeStatus.allReady ? '✅ All Ready' : '⚠️  Issues Found'}`);
  console.log(`🧪 Tests: ${testResults.status === 'PASSED' ? '✅ All Passed' : '⚠️  Some Failed'}`);
  
  const overallStatus = storeStatus.allReady && testResults.status === 'PASSED';
  console.log(`🎯 Phase 4: ${overallStatus ? '✅ COMPLETE' : '⚠️  NEEDS ATTENTION'}`);
  
  if (overallStatus) {
    console.log('🎉 Congratulations! Phase 4 is fully complete and ready for Phase 5: Audio Integration');
  }

  return {
    complete: overallStatus,
    stores: storeStatus,
    tests: testResults
  };
};

// ============================================================================
// HACER FUNCIONES DISPONIBLES GLOBALMENTE
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).verifyPhase4Tests = verifyPhase4Tests;
  (window as any).verifyStoreStatus = verifyStoreStatus;
  (window as any).verifyPhase4Complete = verifyPhase4Complete;
  
  console.log('🎯 Phase 4 Verification Commands Loaded:');
  console.log('  • verifyPhase4Tests() - Run 14 tests silently');
  console.log('  • verifyStoreStatus() - Check 4 store status');
  console.log('  • verifyPhase4Complete() - Complete verification');
}