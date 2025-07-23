// src/App.tsx
/**
 * APLICACIÓN PRINCIPAL - Versión Final Limpia
 * Panel de testing removido, verificación solo por consola
 */

import { useEffect, useState } from 'react';
import PatternSelector from './components/Controls/PatternSelector';
import PianoDisplay from './components/Piano/PianoDisplay';
import { useStoreIntegration } from './hooks/useStoreIntegration';

// Hooks optimizados de stores
import { useActiveNotes, useSustainState, useMasterVolume } from './store/pianoStore';
import { useAudioInitState, useCurrentPreset } from './store/audioStore';
import { useThemeSettings, useDetectionSettings } from './store/settingsStore';
import { useCurrentDetections } from './store/detectionStore';

import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import type { NoteName } from './types/piano';

interface PatternState {
  tonic: string;
  type: string;
  category: 'chord' | 'scale';
  octave: number;
}

function App() {
  // ========== INTEGRACIÓN DE STORES ==========
  const { isReady, stores } = useStoreIntegration();
  
  // Estados derivados optimizados
  const activeNotes = useActiveNotes();
  const sustainState = useSustainState();
  const masterVolume = useMasterVolume();
  const audioState = useAudioInitState();
  const themeSettings = useThemeSettings();
  const detectionSettings = useDetectionSettings();
  const currentDetections = useCurrentDetections();
  const currentPreset = useCurrentPreset();

  // Estados locales para UI
  const [currentPattern, setCurrentPattern] = useState<PatternState | null>(null);
  const [selectedTonic, setSelectedTonic] = useState<string>('C');
  const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>('chord');
  const [selectedType, setSelectedType] = useState<string>('Major');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);

  // ========== INICIALIZACIÓN ==========
  useEffect(() => {
    if (!isReady) return;

    const initOnce = () => {
      // Aplicar configuraciones iniciales
      if (themeSettings.colorScheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        stores.settings.setTheme({ 
          colorScheme: prefersDark ? 'dark' : 'light' 
        });
      }
    };

    initOnce();
    
  }, [isReady]);

  // ========== MANEJO DE PATRONES ==========
  const convertFlatToSharp = (note: string): string => {
    const enharmonicMap: { [key: string]: string } = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    return enharmonicMap[note] || note;
  };

  const convertToNoteNames = (baseNotes: string[], octave: number): NoteName[] => {
    const validNotes: NoteName[] = [];
    
    for (let i = 0; i < baseNotes.length; i++) {
      const originalNote = baseNotes[i];
      const note = convertFlatToSharp(originalNote);
      
      let targetOctave = octave;
      
      if (baseNotes.length >= 7) {
        const tonic = convertFlatToSharp(baseNotes[0]);
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const tonicIndex = noteOrder.indexOf(tonic);
        const currentNoteIndex = noteOrder.indexOf(note);
        
        if (currentNoteIndex < tonicIndex && i > 0) {
          targetOctave += 1;
        }
      }
      
      const noteName = `${note}${targetOctave}` as NoteName;
      
      if (['A0', 'A#0', 'B0'].includes(noteName) || 
          noteName.match(/^[A-G]#?[1-7]$/) || 
          noteName === 'C8') {
        validNotes.push(noteName);
      }
    }
    
    return validNotes;
  };

  const handlePatternSelect = (tonic: string, type: string, category: 'chord' | 'scale', octave: number) => {
    stores.piano.clearAll();
    
    const data = category === 'chord' ? REAL_CHORDS : REAL_SCALES;
    const sharpTonic = convertFlatToSharp(tonic);
    const pattern = data[sharpTonic]?.[type];
    
    if (pattern) {
      const noteNames = convertToNoteNames(pattern, octave);
      
      noteNames.forEach((note, index) => {
        setTimeout(() => {
          stores.piano.pressKey(note, 0.7, 'mouse');
        }, index * 50);
      });
      
      setCurrentPattern({ tonic: sharpTonic, type, category, octave });
      
      if (detectionSettings.autoDetection) {
        setTimeout(() => {
          stores.detection.analyzeNotes(noteNames);
        }, noteNames.length * 50 + 100);
      }
    }
  };

  const handleClearAll = () => {
    stores.piano.clearAll();
    stores.detection.clearAllHistory();
    setCurrentPattern(null);
  };

  // ========== MANEJO DE ERRORES ==========
  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 
                      flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">🎹 Inicializando Piano Virtual</h2>
          <p className="text-gray-300">Cargando stores y configuraciones...</p>
        </div>
      </div>
    );
  }

  // ========== RENDER PRINCIPAL ==========
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      themeSettings.colorScheme === 'dark' 
        ? 'bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800'
        : 'bg-gradient-to-br from-blue-50 via-emerald-50 to-blue-100'
    }`}>
      
      {/* Header */}
      <header className="p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className={`text-5xl font-bold bg-gradient-to-r ${
              themeSettings.colorScheme === 'dark'
                ? 'from-emerald-400 to-cyan-400'
                : 'from-emerald-600 to-cyan-600'
            } bg-clip-text text-transparent mb-2`}>
              🎹 Psanter
            </h1>
            <p className={`text-lg ${
              themeSettings.colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Piano Virtual Profesional - Fase 4 Completada
            </p>
          </div>
          
          {/* Status indicators minimalistas */}
          <div className="flex space-x-4">
            <div className="text-center">
              <div className={`text-2xl ${activeNotes.length > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                🎵
              </div>
              <div className="text-xs text-gray-400">{activeNotes.length} notas</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl ${sustainState.active ? 'text-yellow-400' : 'text-gray-400'}`}>
                🎚️
              </div>
              <div className="text-xs text-gray-400">Sustain</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl ${currentDetections.chords.length > 0 ? 'text-purple-400' : 'text-gray-400'}`}>
                🎯
              </div>
              <div className="text-xs text-gray-400">Detección</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Piano Display */}
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <PianoDisplay 
            selectedKeys={new Set(activeNotes)}
          />
          
          {/* Volume and Sustain Controls */}
          <div className="mt-6 flex justify-center space-x-6">
            <div className="flex items-center space-x-3">
              <label className="text-white font-medium">Volumen:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={masterVolume}
                onChange={(e) => stores.piano.setMasterVolume(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-white text-sm">{Math.round(masterVolume * 100)}%</span>
            </div>
            
            <button
              onClick={() => stores.piano.toggleSustain()}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                sustainState.active
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
            >
              Sustain {sustainState.active ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Pattern Selector */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <PatternSelector
            selectedTonic={selectedTonic}
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            selectedOctave={selectedOctave}
            onTonicChange={setSelectedTonic}
            onTypeChange={setSelectedType}
            onCategoryChange={setSelectedCategory}
            onOctaveChange={setSelectedOctave}
            onSelectPattern={() => handlePatternSelect(selectedTonic, selectedType, selectedCategory, selectedOctave)}
            onClearSelection={handleClearAll}
            hasSelection={activeNotes.length > 0 || currentPattern !== null}
          />
        </div>

        {/* Detection Results */}
        {detectionSettings.enabled && (currentDetections.chords.length > 0 || currentDetections.scales.length > 0) && (
          <div className="bg-purple-900/20 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">🎯 Detección Automática</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {currentDetections.chords.length > 0 && (
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Acordes Detectados:</h4>
                  <div className="space-y-2">
                    {currentDetections.chords.map((chord, index) => (
                      <div key={index} className="bg-purple-800/30 rounded-lg p-3">
                        <div className="font-medium text-white">{chord.name}</div>
                        <div className="text-sm text-purple-200">
                          Confianza: {Math.round(chord.confidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {currentDetections.scales.length > 0 && (
                <div>
                  <h4 className="font-semibold text-emerald-300 mb-2">Escalas Detectadas:</h4>
                  <div className="space-y-2">
                    {currentDetections.scales.map((scale, index) => (
                      <div key={index} className="bg-emerald-800/30 rounded-lg p-3">
                        <div className="font-medium text-white">{scale.name}</div>
                        <div className="text-sm text-emerald-200">
                          Completitud: {Math.round(scale.completeness * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer limpio */}
      <footer className="mt-16 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm">
            🎯 Fase 4 Completada: Stores integrados y funcionando correctamente
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Preset: {currentPreset.config?.name || currentPreset.preset} • 
            Audio: {audioState.canPlay ? 'Ready' : 'Loading...'} • 
            Theme: {themeSettings.colorScheme}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;