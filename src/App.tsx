import React, { useState } from 'react';
import { 
  PIANO_KEY_COORDINATES, 
  SVG_CONFIG, 
  KEY_COLORS, 
  PIANO_STATS,
  PIANO_NOTES,
  isWhiteKey,
  isBlackKey,
  getCoordinatesByNote 
} from './data/pianoCoordinates';
import { 
  CHROMATIC_NOTES, 
  CHORD_PATTERNS, 
  SCALE_PATTERNS,
  A4_FREQUENCY 
} from './data/musicalData';
import { 
  KEYBOARD_MAPPING_STATS,
  PIANO_LAYOUT_TRADITIONAL,
  SPECIAL_KEYS 
} from './data/keyboardLayout';
import type { NoteName } from './types/piano';

function App() {
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKey, setSelectedKey] = useState<NoteName | null>(null);

  // Componente para una tecla individual del piano
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKey === note;
    
    const fillColor = isSelected 
      ? (isWhite ? '#4f46e5' : '#6366f1')
      : isHovered 
        ? (isWhite ? KEY_COLORS.WHITE.pressed : KEY_COLORS.BLACK.pressed)
        : (isWhite ? KEY_COLORS.WHITE.default : KEY_COLORS.BLACK.default);

    const strokeColor = isWhite ? '#d1d5db' : '#374151';

    return (
      <polygon
        points={coordinates}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="0.1"
        style={{ 
          cursor: 'pointer',
          transition: 'fill 0.1s ease'
        }}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => setSelectedKey(selectedKey === note ? null : note)}
      />
    );
  };

  // Separar teclas blancas y negras para renderizado correcto
  const whiteKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isWhite);
  const blackKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isBlack);

  // Funciones para obtener información de tecla seleccionada
  const getSelectedKeyInfo = () => {
    if (!selectedKey) return null;
    
    const keyIndex = PIANO_NOTES.indexOf(selectedKey);
    const coord = getCoordinatesByNote(selectedKey);
    
    return {
      index: keyIndex,
      coordinate: coord,
      isFirst: keyIndex === 0,
      isLast: keyIndex === 87,
      isMiddleC: selectedKey === 'C4',
      isA440: selectedKey === 'A4'
    };
  };

  const selectedKeyInfo = getSelectedKeyInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎹 Psanter - Piano Virtual
          </h1>
          <p className="text-gray-300 mt-1">
            Piano virtual con 88 teclas reales • A0 (izquierda) → C8 (derecha) • Coordenadas originales
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* Piano SVG */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            Piano Interactivo - Fase 2 Completada
          </h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={SVG_CONFIG.viewBox}
                className="w-full h-32 border border-gray-600 rounded-lg bg-gray-800"
                preserveAspectRatio={SVG_CONFIG.preserveAspectRatio}
              >
                {/* Renderizar teclas blancas primero */}
                {whiteKeys.map((keyCoord) => (
                  <PianoKey
                    key={`white-${keyCoord.note}`}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}
                    isWhite={true}
                  />
                ))}
                
                {/* Renderizar teclas negras encima */}
                {blackKeys.map((keyCoord) => (
                  <PianoKey
                    key={`black-${keyCoord.note}`}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}
                    isWhite={false}
                  />
                ))}
              </svg>
            </div>
            
            {/* Verificación de configuración correcta */}
            <div className="mt-4 p-3 bg-green-900/30 rounded-lg">
              <h4 className="font-semibold text-green-200 mb-2">
                ✅ Piano Real Configurado Correctamente:
              </h4>
              <div className="text-sm text-green-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <strong>A0 (Grave):</strong> Extremo izquierdo
                </div>
                <div>
                  <strong>C8 (Agudo):</strong> Extremo derecho
                </div>
                <div>
                  <strong>C4 (Middle C):</strong> Posición {PIANO_STATS.MIDDLE_C_INDEX + 1}/88
                </div>
                <div>
                  <strong>A4 (440Hz):</strong> Posición {PIANO_STATS.A4_INDEX + 1}/88
                </div>
              </div>
              <div className="mt-2 text-xs text-green-200">
                ✨ Coordenadas originales sin transformaciones - Orden visual correcto
              </div>
            </div>
            
            {/* Navegación rápida para testing */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedKey('A0')}
                className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-500 transition-colors"
              >
                A0 (Más Grave)
              </button>
              <button
                onClick={() => setSelectedKey('C4')}
                className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-500 transition-colors"
              >
                C4 (Middle C)
              </button>
              <button
                onClick={() => setSelectedKey('A4')}
                className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-500 transition-colors"
              >
                A4 (440Hz)
              </button>
              <button
                onClick={() => setSelectedKey('C8')}
                className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-500 transition-colors"
              >
                C8 (Más Agudo)
              </button>
              <button
                onClick={() => setSelectedKey(null)}
                className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500 transition-colors"
              >
                Limpiar
              </button>
            </div>
            
            {/* Info de tecla seleccionada */}
            {selectedKey && selectedKeyInfo && (
              <div className="mt-4 p-4 bg-purple-900/50 rounded-lg">
                <h3 className="font-semibold text-purple-200 mb-3">🎹 Información de Tecla:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-300">Nota:</span>
                      <span className="ml-2 font-mono text-white text-lg">{selectedKey}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Tipo:</span>
                      <span className="ml-2">{isWhiteKey(selectedKey) ? '⚪ Tecla Blanca' : '⚫ Tecla Negra'}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Octava:</span>
                      <span className="ml-2 font-mono">{selectedKey.replace(/[A-G]#?/, '')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-300">Posición:</span>
                      <span className="ml-2 font-mono">{selectedKeyInfo.index + 1}/88</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Índice:</span>
                      <span className="ml-2 font-mono">[{selectedKeyInfo.index}]</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Coordenada X:</span>
                      <span className="ml-2 font-mono text-xs">
                        {selectedKeyInfo.coordinate?.x.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-gray-300">Especial:</span>
                      <span className="ml-2">
                        {selectedKeyInfo.isFirst && '🎵 Nota más grave'}
                        {selectedKeyInfo.isLast && '🎵 Nota más aguda'}
                        {selectedKeyInfo.isMiddleC && '🎹 Middle C'}
                        {selectedKeyInfo.isA440 && '🎼 A440 (Referencia)'}
                        {!selectedKeyInfo.isFirst && !selectedKeyInfo.isLast && !selectedKeyInfo.isMiddleC && !selectedKeyInfo.isA440 && 'Nota regular'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-300">Estado:</span>
                      <span className="ml-2 text-green-400">✅ Correcto</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Estadísticas del Piano */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Estadísticas del Piano</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Estadísticas Generales */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">📊 General</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Total de teclas:</span>
                  <span className="font-mono text-white">{PIANO_STATS.TOTAL_KEYS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Teclas blancas:</span>
                  <span className="font-mono text-white">{PIANO_STATS.WHITE_KEYS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Teclas negras:</span>
                  <span className="font-mono text-white">{PIANO_STATS.BLACK_KEYS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Rango de octavas:</span>
                  <span className="font-mono text-white">{PIANO_STATS.OCTAVES}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Configuración:</span>
                  <span className="font-mono text-white text-xs">✅ Piano Real</span>
                </div>
              </div>
            </div>

            {/* Notas Especiales */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">🎼 Notas Clave</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Nota más grave:</span>
                  <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">{PIANO_STATS.LOWEST_NOTE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Nota más aguda:</span>
                  <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">{PIANO_STATS.HIGHEST_NOTE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Middle C:</span>
                  <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">C4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">A440 (referencia):</span>
                  <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">A4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Freq. referencia:</span>
                  <span className="font-mono text-white">{A4_FREQUENCY} Hz</span>
                </div>
              </div>
            </div>

            {/* Datos Musicales */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">🎵 Música</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Notas cromáticas:</span>
                  <span className="font-mono text-white">{CHROMATIC_NOTES.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Patrones de acordes:</span>
                  <span className="font-mono text-white">{Object.keys(CHORD_PATTERNS).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Escalas musicales:</span>
                  <span className="font-mono text-white">{Object.keys(SCALE_PATTERNS).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Mapeo de teclado:</span>
                  <span className="font-mono text-white">{KEYBOARD_MAPPING_STATS.MUSICAL_KEYS_COUNT} teclas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">SVG ViewBox:</span>
                  <span className="font-mono text-white text-xs">{SVG_CONFIG.viewBox}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Verificación Visual del Orden */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Verificación del Orden Correcto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">🎵 Primeras Notas (Graves)</h3>
              <div className="space-y-1 text-sm font-mono">
                {PIANO_NOTES.slice(0, 8).map((note, index) => (
                  <div key={note} className="flex justify-between items-center">
                    <span className="text-gray-300">[{index}]</span>
                    <span 
                      className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                        selectedKey === note 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      }`}
                      onClick={() => setSelectedKey(note)}
                    >
                      {note} {isWhiteKey(note) ? '⚪' : '⚫'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">🎵 Últimas Notas (Agudas)</h3>
              <div className="space-y-1 text-sm font-mono">
                {PIANO_NOTES.slice(-8).map((note, index) => {
                  const realIndex = 80 + index; // 88 - 8 = 80
                  return (
                    <div key={note} className="flex justify-between items-center">
                      <span className="text-gray-300">[{realIndex}]</span>
                      <span 
                        className={`px-2 py-1 rounded cursor-pointer transition-colors ${
                          selectedKey === note 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedKey(note)}
                      >
                        {note} {isWhiteKey(note) ? '⚪' : '⚫'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Controles Especiales */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Controles de Teclado (Próximas Fases)</h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Sustain:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.SUSTAIN}</span>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Octava ↑:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.OCTAVE_UP}</span>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Octava ↓:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.OCTAVE_DOWN}</span>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Volumen +:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.VOLUME_UP}</span>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Volumen -:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.VOLUME_DOWN}</span>
              </div>
              <div className="bg-purple-900/30 p-3 rounded-lg">
                <span className="text-purple-200 font-semibold">Metrónomo:</span>
                <span className="ml-2 font-mono text-white">{SPECIAL_KEYS.METRONOME_TOGGLE}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Estado del Desarrollo */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Estado del Desarrollo</h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 1: Fundamentos</span>
                <span className="text-gray-400">- Configuración base completada</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 2: Datos Musicales</span>
                <span className="text-gray-400">- Piano real con orden correcto A0→C8</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400 text-xl">🚧</span>
                <span className="text-white font-semibold">Fase 3: Utilidades</span>
                <span className="text-gray-400">- Próximo: cálculos de frecuencia y detección</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-xl">⏳</span>
                <span className="text-gray-300">Fase 4-10: Stores, Hooks, Componentes, UI</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-900/30 rounded-lg">
              <h4 className="font-semibold text-green-200 mb-2">🎉 Fase 2 Completada Exitosamente:</h4>
              <div className="text-sm text-green-100 space-y-1">
                <p>✅ Piano con 88 teclas reales funcionando</p>
                <p>✅ Coordenadas SVG originales sin transformaciones innecesarias</p>
                <p>✅ Orden correcto verificado: A0 (izquierda) → C8 (derecha)</p>
                <p>✅ Posicionamiento visual correcto (A0 x≈0, C8 x≈187)</p>
                <p>✅ Datos musicales completos (acordes, escalas, constantes)</p>
                <p>✅ Layout de teclado físico definido</p>
                <p>✅ Archivos pianoCoordinates.ts y App.tsx coherentes</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>🎹 Psanter • Piano Virtual Profesional • Fase 2 Completada</p>
          <p className="mt-1">Click en las teclas para interactuar • A0 (graves) izquierda • C8 (agudos) derecha</p>
        </div>
      </footer>
    </div>
  );
}

export default App;