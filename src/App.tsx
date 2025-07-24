// src/App.tsx
/**
 * APLICACIÓN PRINCIPAL - FASE 5 COMPLETADA Y CORREGIDA
 * ✅ Manejo correcto de AudioContext con user gesture
 * ✅ Elimina re-rendering loops
 * ✅ Inicialización optimizada
 */

import { useState, useCallback } from 'react';
import PatternSelector from './components/Controls/PatternSelector';
import PianoWrapper from './components/Piano/PianoWrapper';
import { useHooks } from './hooks/useHooks';

import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import type { NoteName } from './types/piano';

interface PatternState {
  tonic: string;
  type: string;
  category: 'chord' | 'scale';
  octave: number;
}

function App() {
  // ========== HOOK MAESTRO DEL SISTEMA ==========
  const system = useHooks();
  
  // Estados locales para UI - OPTIMIZADOS
  const [currentPattern, setCurrentPattern] = useState<PatternState | null>(null);
  const [selectedTonic, setSelectedTonic] = useState<string>('C');
  const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>('chord');
  const [selectedType, setSelectedType] = useState<string>('Major');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  const [showSystemInfo, setShowSystemInfo] = useState<boolean>(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());

  // ========== 🚨 SOLUCIÓN: MANEJO CORRECTO DE USER GESTURE ==========
  
  const handleUserInteraction = useCallback(async () => {
    if (!system.hasAudioPermissions) {
      console.log('🎵 Activating audio context after user interaction...');
      const success = await system.ensureAudioContext();
      if (success) {
        console.log('✅ Audio context activated successfully');
      } else {
        console.warn('⚠️ Failed to activate audio context');
      }
    }
  }, [system.hasAudioPermissions, system.ensureAudioContext]);

  // ========== FUNCIONES DE CONTROL DEL PIANO - OPTIMIZADAS ==========

  const handleNotePress = useCallback(async (note: NoteName, velocity: number = 0.8) => {
    // ✅ CRÍTICO: Activar audio SOLO cuando el usuario interactúa
    await handleUserInteraction();
    await system.hooks.piano.playNote(note, velocity, 'mouse');
  }, [system.hooks.piano.playNote, handleUserInteraction]);

  const handleNoteRelease = useCallback((note: NoteName) => {
    system.hooks.piano.stopNote(note, 'mouse');
  }, [system.hooks.piano.stopNote]);

  const handleSustainToggle = useCallback(async () => {
    await handleUserInteraction();
    system.hooks.piano.toggleSustain();
  }, [system.hooks.piano.toggleSustain, handleUserInteraction]);

  const handlePanic = useCallback(() => {
    system.hooks.piano.panic();
  }, [system.hooks.piano.panic]);

  // ========== FUNCIONES DE CONTROL DE PATRONES - OPTIMIZADAS ==========

  const handlePatternChange = useCallback((
    tonic: string,
    type: string,
    category: 'chord' | 'scale',
    octave: number
  ) => {
    const newPattern: PatternState = { tonic, type, category, octave };
    setCurrentPattern(newPattern);
    setSelectedTonic(tonic);
    setSelectedType(type);
    setSelectedCategory(category);
    setSelectedOctave(octave);

    // Actualizar teclas seleccionadas
    try {
      const data = category === 'chord' ? REAL_CHORDS : REAL_SCALES;
      const pattern = data[tonic]?.[type];
      
      if (pattern && Array.isArray(pattern)) {
        const newSelectedKeys = new Set<NoteName>();
        pattern.forEach(note => {
          newSelectedKeys.add(`${note}${octave}` as NoteName);
        });
        setSelectedKeys(newSelectedKeys);
      } else {
        setSelectedKeys(new Set());
      }
    } catch (error) {
      console.error('Error updating selected keys:', error);
      setSelectedKeys(new Set());
    }
  }, []);

  const handlePatternPlay = useCallback(async () => {
    if (!currentPattern) return;

    await handleUserInteraction();

    try {
      const data = currentPattern.category === 'chord' ? REAL_CHORDS : REAL_SCALES;
      const pattern = data[currentPattern.tonic]?.[currentPattern.type];
      
      if (pattern && Array.isArray(pattern)) {
        console.log(`🎵 Playing ${currentPattern.category}: ${currentPattern.tonic} ${currentPattern.type}`);
        
        // Tocar patrón con delays
        for (let i = 0; i < pattern.length; i++) {
          setTimeout(async () => {
            const note = `${pattern[i]}${currentPattern.octave}` as NoteName;
            await system.hooks.piano.playNote(note, 0.8, 'mouse');
            
            // Liberar después de un tiempo
            setTimeout(() => {
              system.hooks.piano.stopNote(note, 'mouse');
            }, 500);
          }, i * 200);
        }
      }
    } catch (error) {
      console.error('❌ Pattern play failed:', error);
    }
  }, [currentPattern, system.hooks.piano.playNote, system.hooks.piano.stopNote, handleUserInteraction]);

  // ========== FUNCIONES DE CONTROL DE VOLUMEN - OPTIMIZADAS ==========

  const handleVolumeChange = useCallback((volume: number) => {
    system.hooks.piano.setMasterVolume(volume);
  }, [system.hooks.piano.setMasterVolume]);

  const handleOctaveChange = useCallback((octave: number) => {
    system.hooks.piano.setOctave(octave);
    setSelectedOctave(octave);
  }, [system.hooks.piano.setOctave]);

  // ========== FUNCIONES DE SISTEMA - OPTIMIZADAS ==========

  const handleSystemRestart = useCallback(async () => {
    console.log('🔄 Restarting system...');
    await system.restart();
  }, [system.restart]);

  const toggleSystemInfo = useCallback(() => {
    setShowSystemInfo(prev => !prev);
  }, []);

  // ========== DATOS PARA COMPONENTES - REMOVIDOS (ya no se usan) ==========

  // ========== RENDER ==========

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white"
      onClick={handleUserInteraction} // ✅ Global click handler para activar audio
    >
      {/* Header */}
      <header className="p-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Piano Virtual - Fase 5 ✅
            </h1>
            <p className="text-gray-300 mt-1">
              Sistema de hooks completamente funcional
            </p>
          </div>
          
          {/* System Status */}
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              system.isReady 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {system.isReady ? '● System Ready' : '● System Loading'}
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              system.hasAudioPermissions 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {system.hasAudioPermissions ? '🔊 Audio Active' : '🔇 Click to Enable Audio'}
            </div>

            <button 
              onClick={toggleSystemInfo}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
            >
              {showSystemInfo ? 'Hide Info' : 'Show Info'}
            </button>
          </div>
        </div>
      </header>

      {/* System Info Panel */}
      {showSystemInfo && (
        <div className="bg-black/20 p-4 border-b border-white/20">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-lg font-semibold mb-3">System Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Audio:</span>
                <span className={`ml-2 ${system.hooks.audio.isInitialized ? 'text-green-400' : 'text-red-400'}`}>
                  {system.hooks.audio.isInitialized ? 'Initialized' : 'Not Ready'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Keyboard:</span>
                <span className={`ml-2 ${system.hooks.keyboard.isActive ? 'text-green-400' : 'text-yellow-400'}`}>
                  {system.hooks.keyboard.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Piano:</span>
                <span className={`ml-2 ${system.hooks.piano.isReady ? 'text-green-400' : 'text-red-400'}`}>
                  {system.hooks.piano.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Init Time:</span>
                <span className="ml-2 text-blue-400">
                  {system.totalInitializationTime.toFixed(1)}ms
                </span>
              </div>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button 
                onClick={handleSystemRestart}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                Restart System
              </button>
              <button 
                onClick={handlePanic}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                Panic (Stop All)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Pattern Selector */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <PatternSelector
                selectedTonic={selectedTonic}
                selectedCategory={selectedCategory}
                selectedType={selectedType}
                selectedOctave={selectedOctave}
                onTonicChange={setSelectedTonic}
                onCategoryChange={setSelectedCategory}
                onTypeChange={setSelectedType}
                onOctaveChange={(octave) => {
                  setSelectedOctave(octave);
                  handleOctaveChange(octave);
                }}
                onSelectPattern={() => handlePatternChange(selectedTonic, selectedType, selectedCategory, selectedOctave)}
                onClearSelection={() => {
                  setCurrentPattern(null);
                  setSelectedKeys(new Set());
                }}
                hasSelection={currentPattern !== null}
              />
              
              {/* Play Pattern Button */}
              {currentPattern && (
                <div className="mt-4">
                  <button
                    onClick={handlePatternPlay}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
                  >
                    ▶️ Tocar Patrón
                  </button>
                </div>
              )}
            </div>

            {/* Volume Control */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">Volume Control</h3>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                defaultValue="0.7"
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Octave Control */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">Octave: {selectedOctave}</h3>
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={selectedOctave}
                onChange={(e) => handleOctaveChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Sustain Control */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">Sustain</h3>
              <button
                onClick={handleSustainToggle}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  system.hooks.piano.sustainActive
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-200'
                }`}
              >
                {system.hooks.piano.sustainActive ? 'Sustain ON' : 'Sustain OFF'}
              </button>
            </div>

          </div>

          {/* Piano Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-4">Piano Virtual</h3>
              
              {/* Audio Permission Notice */}
              {!system.hasAudioPermissions && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    🔇 Click anywhere or press any key to enable audio
                  </p>
                </div>
              )}

              <PianoWrapper 
                selectedKeys={selectedKeys}
                onNotePress={handleNotePress}
                onNoteRelease={handleNoteRelease}
                currentPattern={currentPattern}
                sustainActive={system.hooks.piano.sustainActive}
              />
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 border-t border-white/20 text-center text-gray-400 text-sm">
        <p>Piano Virtual - Fase 5 Completada ✅ | Hooks Personalizados Optimizados</p>
        <p className="mt-1">
          Presiona teclas ASDF para Do-Re-Mi-Fa-Sol-La-Si | QWERTY para sostenidos | Espacio para sustain
        </p>
      </footer>
    </div>
  );
}

export default App;