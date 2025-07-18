import React, { useState } from 'react';
import { 
  PIANO_KEY_COORDINATES, 
  SVG_CONFIG, 
  KEY_COLORS, 
  PIANO_STATS,
  isWhiteKey,
  isBlackKey,
  getCoordinatesByNote 
} from './data/pianoCoordinates';
import { 
  CHROMATIC_NOTES, 
  CHORD_PATTERNS, 
  SCALE_PATTERNS,
  A4_FREQUENCY 
} from './data/musicalConstants';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎹 Psanter - Fase 2 Demo
          </h1>
          <p className="text-gray-300 mt-1">
            Piano virtual con coordenadas SVG reales • 88 teclas • Datos musicales completos
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* Piano SVG */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Piano Interactivo</h2>
          
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
            
            {/* Info de tecla seleccionada */}
            {selectedKey && (
              <div className="mt-4 p-4 bg-purple-900/50 rounded-lg">
                <h3 className="font-semibold text-purple-200">Tecla Seleccionada:</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-300">Nota:</span>
                    <span className="ml-2 font-mono text-white">{selectedKey}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Tipo:</span>
                    <span className="ml-2">{isWhiteKey(selectedKey) ? 'Tecla Blanca' : 'Tecla Negra'}</span>
                  </div>
                  <div>
                    <span className="text-gray-300">Frecuencia (aprox):</span>
                    <span className="ml-2 font-mono">
                      {selectedKey === 'A4' ? '440 Hz' : 'Calculada en Fase 3'}
                    </span>
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
                  <span className="text-gray-300">Freq. referencia:</span>
                  <span className="font-mono text-white">{A4_FREQUENCY} Hz</span>
                </div>
              </div>
            </div>

            {/* Mapeo de Teclado */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-purple-200 mb-3">⌨️ Teclado</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Teclas físicas:</span>
                  <span className="font-mono text-white">{KEYBOARD_MAPPING_STATS.TOTAL_PHYSICAL_KEYS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Para música:</span>
                  <span className="font-mono text-white">{KEYBOARD_MAPPING_STATS.MUSICAL_KEYS_COUNT}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Especiales:</span>
                  <span className="font-mono text-white">{KEYBOARD_MAPPING_STATS.SPECIAL_KEYS_COUNT}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Disponibles:</span>
                  <span className="font-mono text-white">{KEYBOARD_MAPPING_STATS.AVAILABLE_FOR_NOTES}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Información de Coordenadas SVG */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">Coordenadas SVG</h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-purple-200 mb-3">📐 Dimensiones</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">ViewBox:</span>
                    <span className="font-mono text-white">{SVG_CONFIG.viewBox}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Ancho SVG:</span>
                    <span className="font-mono text-white">{SVG_CONFIG.width} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Alto SVG:</span>
                    <span className="font-mono text-white">{SVG_CONFIG.height} unidades</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Rango X:</span>
                    <span className="font-mono text-white">{PIANO_STATS.X_RANGE.min} - {PIANO_STATS.X_RANGE.max}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Rango Y:</span>
                    <span className="font-mono text-white">{PIANO_STATS.Y_RANGE.min} - {PIANO_STATS.Y_RANGE.max}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-purple-200 mb-3">🎹 Rango de Notas</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Primera nota:</span>
                    <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">A0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Última nota:</span>
                    <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">C8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Nota central:</span>
                    <span className="font-mono text-white bg-purple-900/50 px-2 py-1 rounded">A4 (440Hz)</span>
                  </div>
                </div>
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

        {/* Status y Próximos Pasos */}
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
                <span className="text-gray-400">- 88 coordenadas reales, constantes musicales</span>
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
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>🎹 Psanter • Piano Virtual Profesional • Fase 2 Demo</p>
          <p className="mt-1">Click en las teclas del piano para interactuar • Desarrollado con React + TypeScript</p>
        </div>
      </footer>
    </div>
  );
}

export default App;