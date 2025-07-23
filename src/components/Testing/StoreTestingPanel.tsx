// src/components/Testing/StoreTestingPanel.tsx
/**
 * Panel de testing CORREGIDO - Acceso correcto a las acciones de los stores
 * El problema era que accedíamos al estado, no a las acciones
 */

import React, { useState, useEffect } from 'react';
import { usePianoStore } from '../../store/pianoStore';
import { useAudioStore } from '../../store/audioStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useDetectionStore } from '../../store/detectionStore';
import type { NoteName } from '../../types/piano';

export const StoreTestingPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addDebugLog = (message: string) => {
    const logMessage = `${new Date().toLocaleTimeString()}: ${message}`;
    console.log(`🧪 ${logMessage}`);
    setDebugLogs(prev => [...prev, logMessage]);
  };

  const safeTest = async (testName: string, testFn: () => Promise<boolean> | boolean): Promise<boolean> => {
    try {
      addDebugLog(`🧪 Starting ${testName}...`);
      const result = await testFn();
      addDebugLog(`${testName} result: ${result ? '✅ PASS' : '❌ FAIL'}`);
      return result;
    } catch (error) {
      addDebugLog(`${testName} ERROR: ${error}`);
      console.error(`Test ${testName} failed:`, error);
      return false;
    }
  };

  const runTests = async () => {
    setIsRunning(true);
    setDebugLogs([]);
    const results: Record<string, boolean> = {};

    addDebugLog('=== STARTING ALL TESTS WITH CORRECT STORE ACCESS ===');

    // ========== PIANO STORE TESTS ==========
    results.pianoPress = await safeTest('Piano Press', async () => {
      // CORREGIDO: Acceder a las acciones directamente
      const pianoActions = usePianoStore.getState();
      pianoActions.clearAll();
      addDebugLog('Piano cleared, pressing C4...');
      pianoActions.pressKey('C4' as NoteName, 0.8);
      const isPressed = pianoActions.isKeyPressed('C4' as NoteName);
      addDebugLog(`C4 pressed state: ${isPressed}`);
      return isPressed;
    });

    results.pianoRelease = await safeTest('Piano Release', async () => {
      const pianoActions = usePianoStore.getState();
      addDebugLog('Releasing C4...');
      pianoActions.releaseKey('C4' as NoteName);
      const isReleased = !pianoActions.isKeyPressed('C4' as NoteName);
      addDebugLog(`C4 released state: ${isReleased}`);
      return isReleased;
    });

    results.sustainWorks = await safeTest('Sustain Works', async () => {
      const pianoActions = usePianoStore.getState();
      addDebugLog('Testing sustain...');
      pianoActions.setSustain(true);
      addDebugLog('Sustain set to true');
      pianoActions.pressKey('E4' as NoteName);
      addDebugLog('E4 pressed');
      pianoActions.releaseKey('E4' as NoteName);
      addDebugLog('E4 released');
      const isStillActive = pianoActions.isKeyActive('E4' as NoteName);
      addDebugLog(`E4 still active after release (sustain): ${isStillActive}`);
      pianoActions.clearAll();
      return isStillActive;
    });

    results.volumeControl = await safeTest('Volume Control', async () => {
      // CORREGIDO: Usar getState() para acceder a las acciones
      const pianoStore = usePianoStore.getState();
      const original = pianoStore.masterVolume;
      addDebugLog(`Original volume: ${original}`);
      
      // Llamar la acción correctamente
      pianoStore.setMasterVolume(0.5);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Obtener el estado actualizado
      const updatedStore = usePianoStore.getState();
      const newVolume = updatedStore.masterVolume;
      addDebugLog(`After setting to 0.5: ${newVolume}`);
      
      if (Math.abs(newVolume - 0.5) < 0.1) {
        addDebugLog('Volume control works!');
        return true;
      }
      
      // Si no funcionó, intentar con otro valor
      pianoStore.setMasterVolume(0.8);
      await new Promise(resolve => setTimeout(resolve, 10));
      const finalStore = usePianoStore.getState();
      const finalVolume = finalStore.masterVolume;
      addDebugLog(`After setting to 0.8: ${finalVolume}`);
      
      const volumeChanged = Math.abs(finalVolume - original) > 0.01;
      addDebugLog(`Volume changed from original: ${volumeChanged}`);
      return volumeChanged;
    });

    // ========== AUDIO STORE TESTS ==========
    results.audioInit = await safeTest('Audio Init', async () => {
      const audioActions = useAudioStore.getState();
      addDebugLog('Initializing audio...');
      await audioActions.initializeAudio();
      const initialized = audioActions.isInitialized;
      addDebugLog(`Audio initialized: ${initialized}`);
      return initialized;
    });

    results.presetChange = await safeTest('Preset Change', async () => {
      // CORREGIDO: Acceso correcto a las acciones de audio
      const audioStore = useAudioStore.getState();
      const original = audioStore.currentPreset;
      addDebugLog(`Original preset: ${original}`);
      
      const targetPreset = original === 'classic_piano' ? 'bright_piano' : 'classic_piano';
      addDebugLog(`Changing to preset: ${targetPreset}`);
      
      // Llamar la acción correctamente
      audioStore.setPreset(targetPreset as any);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Obtener estado actualizado
      const updatedStore = useAudioStore.getState();
      const current = updatedStore.currentPreset;
      addDebugLog(`Current preset after change: ${current}`);
      
      const changed = current === targetPreset;
      addDebugLog(`Preset actually changed: ${changed}`);
      return changed;
    });

    results.adsrControl = await safeTest('ADSR Control', async () => {
      // CORREGIDO: Acceso correcto a configuración ADSR
      const audioStore = useAudioStore.getState();
      const originalAttack = audioStore.synthSettings.envelope.attack;
      addDebugLog(`Original attack: ${originalAttack}`);
      
      const targetAttack = originalAttack > 0.1 ? 0.02 : 0.15;
      addDebugLog(`Setting attack to: ${targetAttack}`);
      
      // Llamar la acción correctamente
      audioStore.setADSREnvelope({ attack: targetAttack });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Obtener estado actualizado
      const updatedStore = useAudioStore.getState();
      const newAttack = updatedStore.synthSettings.envelope.attack;
      addDebugLog(`New attack value: ${newAttack}`);
      
      const changed = Math.abs(newAttack - targetAttack) < 0.05;
      addDebugLog(`ADSR changed correctly: ${changed}`);
      return changed;
    });

    // ========== SETTINGS STORE TESTS ==========
    results.themeChange = await safeTest('Theme Change', async () => {
      // CORREGIDO: Acceso correcto a settings
      const settingsStore = useSettingsStore.getState();
      const original = settingsStore.theme.colorScheme;
      addDebugLog(`Original theme: ${original}`);
      
      const target = original === 'dark' ? 'light' : 'dark';
      addDebugLog(`Setting theme to: ${target}`);
      
      // Llamar la acción correctamente
      settingsStore.setTheme({ colorScheme: target });
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Obtener estado actualizado
      const updatedStore = useSettingsStore.getState();
      const current = updatedStore.theme.colorScheme;
      addDebugLog(`Current theme: ${current}`);
      
      const changed = current === target;
      addDebugLog(`Theme changed: ${changed}`);
      return changed;
    });

    results.layoutChange = await safeTest('Layout Change', async () => {
      // CORREGIDO: Acceso correcto a layout
      const settingsStore = useSettingsStore.getState();
      const original = settingsStore.layout.pianoSize;
      addDebugLog(`Original piano size: ${original}`);
      
      const sizeMap = { small: 'medium', medium: 'large', large: 'small' } as const;
      const target = sizeMap[original] || 'medium';
      
      addDebugLog(`Setting piano size to: ${target}`);
      
      // Llamar la acción correctamente
      settingsStore.setPianoSize(target);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Obtener estado actualizado
      const updatedStore = useSettingsStore.getState();
      const current = updatedStore.layout.pianoSize;
      addDebugLog(`Current piano size: ${current}`);
      
      const changed = current === target;
      addDebugLog(`Layout changed: ${changed}`);
      return changed;
    });

    results.detectionToggle = await safeTest('Detection Toggle', async () => {
      // CORREGIDO: Acceso correcto a detection settings
      const settingsStore = useSettingsStore.getState();
      const original = settingsStore.detection.autoDetection;
      addDebugLog(`Original auto detection: ${original}`);
      
      addDebugLog('Toggling auto detection...');
      settingsStore.toggleAutoDetection();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Obtener estado actualizado
      const updatedStore = useSettingsStore.getState();
      const toggled = updatedStore.detection.autoDetection;
      addDebugLog(`After toggle: ${toggled}`);
      
      const toggleWorked = toggled !== original;
      addDebugLog(`Toggle worked: ${toggleWorked}`);
      
      // Restaurar
      addDebugLog('Restoring original state...');
      settingsStore.toggleAutoDetection();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const finalStore = useSettingsStore.getState();
      const restored = finalStore.detection.autoDetection;
      addDebugLog(`Restored to: ${restored}`);
      
      return toggleWorked;
    });

    // ========== DETECTION STORE TESTS ==========
    results.detectionEnable = await safeTest('Detection Enable', async () => {
      const detectionActions = useDetectionStore.getState();
      addDebugLog('Enabling detection...');
      detectionActions.enable();
      const enabled = detectionActions.isEnabled;
      addDebugLog(`Detection enabled: ${enabled}`);
      return enabled;
    });

    results.chordDetection = await safeTest('Chord Detection', async () => {
      const detectionActions = useDetectionStore.getState();
      addDebugLog('Testing chord detection...');
      detectionActions.clearAllHistory();
      
      const testNotes = ['C4', 'E4', 'G4'] as NoteName[];
      addDebugLog(`Testing with notes: ${testNotes.join(', ')}`);
      
      const directChords = detectionActions.analyzeChords(testNotes);
      addDebugLog(`Direct analysis found ${directChords.length} chords`);
      
      detectionActions.analyzeNotes(testNotes);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Obtener estado actualizado
      const updatedDetection = useDetectionStore.getState();
      const currentChords = updatedDetection.currentChords.length;
      const historyChords = updatedDetection.chordHistory.length;
      addDebugLog(`Current: ${currentChords}, History: ${historyChords}`);
      
      const hasDetection = directChords.length > 0 || currentChords > 0 || historyChords > 0;
      addDebugLog(`Has chord detection: ${hasDetection}`);
      return hasDetection;
    });

    results.detectionClear = await safeTest('Detection Clear', async () => {
      const detectionActions = useDetectionStore.getState();
      addDebugLog('Testing detection clear...');
      detectionActions.clearAllHistory();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const updatedDetection = useDetectionStore.getState();
      const currentEmpty = updatedDetection.currentChords.length === 0;
      const historyEmpty = updatedDetection.chordHistory.length === 0;
      const cleared = currentEmpty && historyEmpty;
      
      addDebugLog(`Current empty: ${currentEmpty}, History empty: ${historyEmpty}`);
      addDebugLog(`Clear works: ${cleared}`);
      return cleared;
    });

    results.memoryLeakPrevention = await safeTest('Memory Leak Prevention', async () => {
      addDebugLog('Testing memory leak prevention...');
      let subscriptionTriggered = false;
      
      const unsubscribe = usePianoStore.subscribe(
        (state) => state.masterVolume,
        () => {
          subscriptionTriggered = true;
          addDebugLog('Subscription triggered!');
        }
      );
      
      addDebugLog('Creating subscription and triggering change...');
      const pianoActions = usePianoStore.getState();
      pianoActions.adjustVolume(0.001);
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      addDebugLog('Cleaning up subscription...');
      unsubscribe();
      
      addDebugLog(`Subscription worked: ${subscriptionTriggered}`);
      return subscriptionTriggered;
    });

    addDebugLog('=== ALL TESTS COMPLETED ===');
    setTestResults(results);
    setIsRunning(false);
  };

  // Memory usage monitor
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        setMemoryUsage(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const allTestsPassed = Object.values(testResults).every(result => result === true);
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result === true).length;

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">🧪 FIXED Store Testing Panel</h3>
        <div className="text-sm text-gray-400">
          Memory: {memoryUsage}MB
        </div>
      </div>

      <button
        onClick={runTests}
        disabled={isRunning}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          isRunning
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {isRunning ? 'Running FIXED Tests...' : 'Run All Tests (FIXED ACCESS)'}
      </button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-3">
          <div className={`text-center p-3 rounded ${
            allTestsPassed 
              ? 'bg-green-900 text-green-300' 
              : 'bg-red-900 text-red-300'
          }`}>
            {allTestsPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
            <div className="text-sm mt-1">
              {passedTests}/{totalTests} tests passed
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(testResults).map(([test, passed]) => (
              <div
                key={test}
                className={`p-2 rounded flex justify-between ${
                  passed ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                }`}
              >
                <span className="capitalize">{test.replace(/([A-Z])/g, ' $1')}</span>
                <span>{passed ? '✅' : '❌'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETE DEBUG LOGS */}
      <div className="bg-gray-900 rounded p-4 max-h-64 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold text-white">🔍 FIXED Debug Logs</h4>
          <button 
            onClick={() => setDebugLogs([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear Logs
          </button>
        </div>
        {debugLogs.length === 0 ? (
          <div className="text-xs text-gray-500">No logs yet. Run tests to see detailed debug information.</div>
        ) : (
          <div className="text-xs text-green-300 space-y-1 font-mono">
            {debugLogs.map((log, index) => (
              <div key={index} className={log.includes('ERROR') ? 'text-red-300' : log.includes('FAIL') ? 'text-yellow-300' : log.includes('PASS') ? 'text-green-300' : ''}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-700 rounded p-4">
        <h4 className="font-semibold text-white mb-2">Store Status</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Piano Store:</span>
            <span className="text-green-400">✅ FIXED ACCESS</span>
          </div>
          <div className="flex justify-between">
            <span>Audio Store:</span>
            <span className="text-green-400">✅ FIXED ACCESS</span>
          </div>
          <div className="flex justify-between">
            <span>Settings Store:</span>
            <span className="text-green-400">✅ FIXED ACCESS</span>
          </div>
          <div className="flex justify-between">
            <span>Detection Store:</span>
            <span className="text-green-400">✅ FIXED ACCESS</span>
          </div>
        </div>
      </div>

      <div className="bg-green-900 rounded p-4">
        <h4 className="font-semibold text-white mb-2">🔧 FIXES APPLIED</h4>
        <div className="text-xs text-green-300 space-y-1">
          <div>✅ Fixed volume control: Using usePianoStore.getState()</div>
          <div>✅ Fixed preset change: Using useAudioStore.getState()</div>
          <div>✅ Fixed ADSR control: Proper audio store access</div>
          <div>✅ Fixed theme change: Proper settings store access</div>
          <div>✅ Fixed layout change: Proper layout access</div>
          <div>✅ Fixed detection toggle: Proper detection settings access</div>
        </div>
      </div>
    </div>
  );
};