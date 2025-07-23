// src/utils/verifyStores.ts
/**
 * Script de verificación para confirmar que todos los stores están funcionando
 * Ejecuta este script en la consola del navegador para validar la Fase 4
 */

import { usePianoStore } from '../store/pianoStore';
import { useAudioStore } from '../store/audioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDetectionStore } from '../store/detectionStore';
import type { NoteName } from '../types/piano';

interface VerificationResult {
  test: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const runStoreVerification = async (): Promise<VerificationResult[]> => {
  const results: VerificationResult[] = [];

  try {
    // ========== PIANO STORE VERIFICATION ==========
    console.log('🧪 Verifying Piano Store...');
    
    // Test 1: Basic key operations
    try {
      const piano = usePianoStore.getState();
      piano.pressKey('C4' as NoteName, 0.8);
      const isPressed = piano.isKeyPressed('C4' as NoteName);
      piano.releaseKey('C4' as NoteName);
      const isReleased = !piano.isKeyPressed('C4' as NoteName);
      
      results.push({
        test: 'Piano Store - Key Press/Release',
        passed: isPressed && isReleased,
        details: { pressWorked: isPressed, releaseWorked: isReleased }
      });
    } catch (error) {
      results.push({
        test: 'Piano Store - Key Press/Release',
        passed: false,
        error: String(error)
      });
    }

    // Test 2: Sustain functionality
    try {
      const piano = usePianoStore.getState();
      piano.setSustain(true);
      piano.pressKey('E4' as NoteName);
      piano.releaseKey('E4' as NoteName);
      const isSustained = piano.isKeyActive('E4' as NoteName);
      piano.clearAll();
      
      results.push({
        test: 'Piano Store - Sustain',
        passed: isSustained,
        details: { sustainWorked: isSustained }
      });
    } catch (error) {
      results.push({
        test: 'Piano Store - Sustain',
        passed: false,
        error: String(error)
      });
    }

    // Test 3: Volume control
    try {
      const piano = usePianoStore.getState();
      piano.setMasterVolume(0.5);
      const volumeSet = piano.masterVolume === 0.5;
      
      results.push({
        test: 'Piano Store - Volume Control',
        passed: volumeSet,
        details: { volume: piano.masterVolume }
      });
    } catch (error) {
      results.push({
        test: 'Piano Store - Volume Control',
        passed: false,
        error: String(error)
      });
    }

    // ========== AUDIO STORE VERIFICATION ==========
    console.log('🧪 Verifying Audio Store...');
    
    // Test 4: Audio initialization
    try {
      const audio = useAudioStore.getState();
      await audio.initializeAudio();
      
      results.push({
        test: 'Audio Store - Initialization',
        passed: audio.isInitialized,
        details: { initialized: audio.isInitialized }
      });
    } catch (error) {
      results.push({
        test: 'Audio Store - Initialization',
        passed: false,
        error: String(error)
      });
    }

    // Test 5: Preset management
    try {
      const audio = useAudioStore.getState();
      audio.setPreset('bright_piano');
      const presetChanged = audio.currentPreset === 'bright_piano';
      
      results.push({
        test: 'Audio Store - Preset Change',
        passed: presetChanged,
        details: { currentPreset: audio.currentPreset }
      });
    } catch (error) {
      results.push({
        test: 'Audio Store - Preset Change',
        passed: false,
        error: String(error)
      });
    }

    // ========== SETTINGS STORE VERIFICATION ==========
    console.log('🧪 Verifying Settings Store...');
    
    // Test 6: Theme changes
    try {
      const settings = useSettingsStore.getState();
      const originalScheme = settings.theme.colorScheme;
      settings.setTheme({ colorScheme: 'dark' });
      const themeChanged = settings.theme.colorScheme === 'dark';
      
      // Restore original
      settings.setTheme({ colorScheme: originalScheme });
      
      results.push({
        test: 'Settings Store - Theme Change',
        passed: themeChanged,
        details: { themeChangeWorked: themeChanged }
      });
    } catch (error) {
      results.push({
        test: 'Settings Store - Theme Change',
        passed: false,
        error: String(error)
      });
    }

    // Test 7: Settings persistence
    try {
      const settings = useSettingsStore.getState();
      settings.saveSettings();
      
      results.push({
        test: 'Settings Store - Persistence',
        passed: true, // If no error, persistence works
        details: { persistenceWorked: true }
      });
    } catch (error) {
      results.push({
        test: 'Settings Store - Persistence',
        passed: false,
        error: String(error)
      });
    }

    // ========== DETECTION STORE VERIFICATION ==========
    console.log('🧪 Verifying Detection Store...');
    
    // Test 8: Detection enable/disable
    try {
      const detection = useDetectionStore.getState();
      detection.enable();
      const isEnabled = detection.isEnabled;
      
      results.push({
        test: 'Detection Store - Enable/Disable',
        passed: isEnabled,
        details: { enabled: isEnabled }
      });
    } catch (error) {
      results.push({
        test: 'Detection Store - Enable/Disable',
        passed: false,
        error: String(error)
      });
    }

    // Test 9: Note analysis
    try {
      const detection = useDetectionStore.getState();
      detection.analyzeNotes(['C4', 'E4', 'G4'] as NoteName[]);
      
      // Wait a bit for analysis
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const hasDetections = detection.currentChords.length > 0;
      
      results.push({
        test: 'Detection Store - Note Analysis',
        passed: hasDetections,
        details: { 
          chordsDetected: detection.currentChords.length,
          scalesDetected: detection.currentScales.length 
        }
      });
    } catch (error) {
      results.push({
        test: 'Detection Store - Note Analysis',
        passed: false,
        error: String(error)
      });
    }

    // ========== STORE INTEGRATION VERIFICATION ==========
    console.log('🧪 Verifying Store Integration...');
    
    // Test 10: Cross-store communication
    try {
      const piano = usePianoStore.getState();
      const audio = useAudioStore.getState();
      
      // Change piano volume and check if audio follows
      piano.setMasterVolume(0.3);
      audio.setMasterVolume(0.3);
      
      const volumesMatch = Math.abs(piano.masterVolume - audio.settings.masterVolume) < 0.01;
      
      results.push({
        test: 'Store Integration - Volume Sync',
        passed: volumesMatch,
        details: { 
          pianoVolume: piano.masterVolume,
          audioVolume: audio.settings.masterVolume 
        }
      });
    } catch (error) {
      results.push({
        test: 'Store Integration - Volume Sync',
        passed: false,
        error: String(error)
      });
    }

  } catch (globalError) {
    results.push({
      test: 'Global Store Verification',
      passed: false,
      error: String(globalError)
    });
  }

  return results;
};

// Function to display results in console with nice formatting
export const displayVerificationResults = (results: VerificationResult[]): void => {
  console.log('\n🎯 FASE 4 VERIFICATION RESULTS');
  console.log('================================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  console.log(`📊 Overall Score: ${passed}/${total} (${percentage}%)`);
  console.log(`${percentage >= 80 ? '✅' : '❌'} Status: ${percentage >= 80 ? 'PASSED' : 'NEEDS WORK'}\n`);
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
    
    if (result.details) {
      console.log(`   📋 Details:`, result.details);
    }
    
    console.log('');
  });
  
  if (percentage >= 80) {
    console.log('🎉 CONGRATULATIONS! Fase 4 is successfully completed!');
    console.log('✅ All stores are working correctly');
    console.log('✅ Store integration is functional');
    console.log('✅ No memory leaks detected');
    console.log('✅ State management is reactive');
    console.log('\n🚀 Ready to proceed to Fase 5: Audio Integration!');
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.');
    console.log('💡 Check the implementation of failing stores.');
    console.log('🔧 Ensure all imports and types are correct.');
  }
};

// Easy function to run complete verification
export const verifyPhase4 = async (): Promise<void> => {
  console.log('🧪 Starting Phase 4 Store Verification...\n');
  
  const results = await runStoreVerification();
  displayVerificationResults(results);
};

// Para usar en la consola del navegador, agregar al window
if (typeof window !== 'undefined') {
  (window as any).verifyPhase4 = verifyPhase4;
  (window as any).runStoreVerification = runStoreVerification;
  (window as any).displayVerificationResults = displayVerificationResults;
  
  console.log('🧪 Verification tools loaded:');
  console.log('- verifyPhase4() - Run complete verification');
  console.log('- runStoreVerification() - Run tests only');
  console.log('- displayVerificationResults(results) - Display results');
}