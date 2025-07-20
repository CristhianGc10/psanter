import React, { useState, useEffect } from 'react';
import { 
  PIANO_KEY_COORDINATES, 
  SVG_CONFIG, 
  KEY_COLORS, 
  isWhiteKey
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// Importar utilidades de la Fase 3
import { 
  calculateNoteFrequency,
  getNoteInfo,
  NOTE_STATS
} from './utils/noteUtils';

import {
  getMappingStats
} from './utils/keyMapping';

import {
  detectChords,
  type DetectedChord
} from './utils/chordDetection';

import {
  detectScales,
  type DetectedScale
} from './utils/scaleDetection';

function App() {
  // Estados esenciales
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [detectedChords, setDetectedChords] = useState<DetectedChord[]>([]);
  const [detectedScales, setDetectedScales] = useState<DetectedScale[]>([]);

  // Actualizar detección cuando cambian las teclas seleccionadas
  useEffect(() => {
    if (selectedKeys.size > 0) {
      const notesArray = Array.from(selectedKeys);
      
      // Detectar acordes
      const chordResult = detectChords(notesArray);
      if (chordResult.primaryChord) {
        setDetectedChords([chordResult.primaryChord, ...chordResult.alternativeChords]);
      } else {
        setDetectedChords([]);
      }
      
      // Detectar escalas
      const scaleResult = detectScales(notesArray);
      if (scaleResult.primaryScale) {
        setDetectedScales([scaleResult.primaryScale, ...scaleResult.alternativeScales]);
      } else {
        setDetectedScales([]);
      }
    } else {
      setDetectedChords([]);
      setDetectedScales([]);
    }
  }, [selectedKeys]);

  // Componente para tecla del piano
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKeys.has(note);
    
    const fillColor = isSelected 
      ? (isWhite ? '#4f46e5' : '#6366f1')
      : isHovered 
        ? (isWhite ? KEY_COLORS.WHITE.pressed : KEY_COLORS.BLACK.pressed)
        : (isWhite ? KEY_COLORS.WHITE.default : KEY_COLORS.BLACK.default);

    const strokeColor = isWhite ? '#d1d5db' : '#374151';

    const handleClick = () => {
      const newSelectedKeys = new Set(selectedKeys);
      if (selectedKeys.has(note)) {
        newSelectedKeys.delete(note);
      } else {
        newSelectedKeys.add(note);
      }
      setSelectedKeys(newSelectedKeys);
    };

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
        onClick={handleClick}
      />
    );
  };

  // Separar teclas blancas y negras
  const whiteKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isWhite);
  const blackKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isBlack);

  // Stats básicos
  const mappingStats = getMappingStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎹 Psanter - Fase 3 Completada
          </h1>
          <p className="text-gray-300 mt-1">
            Utilidades Musicales • Detección de Acordes y Escalas • Cálculos de Frecuencia
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        
        {/* Piano Interactivo */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            Piano Interactivo - Click para Seleccionar Notas
          </h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={SVG_CONFIG.viewBox}
                className="w-full h-32 border border-gray-600 rounded-lg bg-gray-800"
                preserveAspectRatio={SVG_CONFIG.preserveAspectRatio}
              >
                {/* Teclas blancas primero */}
                {whiteKeys.map((keyCoord) => (
                  <PianoKey
                    key={`white-${keyCoord.note}`}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}
                    isWhite={true}
                  />
                ))}
                
                {/* Teclas negras encima */}
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
            
            {/* Controles rápidos */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedKeys(new Set(['C4', 'E4', 'G4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                C Mayor
              </button>
              <button
                onClick={() => setSelectedKeys(new Set(['A3', 'C4', 'E4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                A Menor
              </button>
              <button
                onClick={() => setSelectedKeys(new Set(['G3', 'B3', 'D4', 'F4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                G7
              </button>
              <button
                onClick={() => setSelectedKeys(new Set(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']))}
                className="px-3 py-1 bg-blue-600 rounded text-sm hover:bg-blue-500 transition-colors"
              >
                Escala C Mayor
              </button>
              <button
                onClick={() => setSelectedKeys(new Set())}
                className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500 transition-colors"
              >
                Limpiar
              </button>
            </div>
            
            {/* Notas seleccionadas */}
            {selectedKeys.size > 0 && (
              <div className="mt-4 p-3 bg-purple-900/50 rounded-lg">
                <h4 className="font-semibold text-purple-200 mb-2">
                  Notas Seleccionadas ({selectedKeys.size}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedKeys).sort().map(note => {
                    const freq = calculateNoteFrequency(note);
                    return (
                      <span 
                        key={note}
                        className="px-2 py-1 bg-purple-700 rounded text-sm font-mono"
                        title={`${freq.toFixed(2)} Hz`}
                      >
                        {note}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Detección Musical */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            🎵 Detección Musical en Tiempo Real
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acordes Detectados */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-green-200 mb-4 flex items-center">
                🎼 Acordes Detectados
              </h3>
              
              {detectedChords.length > 0 ? (
                <div className="space-y-3">
                  {detectedChords.slice(0, 3).map((chord, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-green-900/50 border border-green-600/30' : 'bg-gray-800/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{chord.name}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          chord.quality === 'perfect' ? 'bg-green-600' :
                          chord.quality === 'good' ? 'bg-blue-600' :
                          chord.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {(chord.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div>Raíz: <span className="font-mono">{chord.root}</span> • Tipo: {chord.type}</div>
                        {chord.inversion > 0 && (
                          <div>Inversión: {chord.inversion}</div>
                        )}
                        {chord.missingNotes.length > 0 && (
                          <div>Faltan: {chord.missingNotes.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🎵</div>
                  <p>Selecciona 2 o más notas para detectar acordes</p>
                </div>
              )}
            </div>

            {/* Escalas Detectadas */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center">
                🎼 Escalas Detectadas
              </h3>
              
              {detectedScales.length > 0 ? (
                <div className="space-y-3">
                  {detectedScales.slice(0, 3).map((scale, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      index === 0 ? 'bg-blue-900/50 border border-blue-600/30' : 'bg-gray-800/50'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">{scale.name}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          scale.quality === 'perfect' ? 'bg-green-600' :
                          scale.quality === 'good' ? 'bg-blue-600' :
                          scale.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {(scale.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div>Tónica: <span className="font-mono">{scale.tonic}</span> • Modo: {scale.mode}</div>
                        {scale.missingNotes.length > 0 && (
                          <div>Faltan: {scale.missingNotes.join(', ')}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🎼</div>
                  <p>Selecciona 3 o más notas para detectar escalas</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Calculadora de Frecuencias Simplificada */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            🔧 Utilidades de Notas Funcionando
          </h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Calculadora */}
              <div>
                <h3 className="text-lg font-semibold text-yellow-200 mb-3">Calculadora de Frecuencias</h3>
                {hoveredKey && (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-yellow-300">{hoveredKey}</div>
                    <div className="text-sm text-gray-300">
                      Frecuencia: <span className="font-mono text-yellow-200">
                        {calculateNoteFrequency(hoveredKey).toFixed(2)} Hz
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      Tipo: <span className="text-yellow-200">
                        {isWhiteKey(hoveredKey) ? 'Tecla Blanca' : 'Tecla Negra'}
                      </span>
                    </div>
                  </div>
                )}
                {!hoveredKey && (
                  <p className="text-gray-400 text-sm">Pasa el mouse sobre una tecla para ver su frecuencia</p>
                )}
              </div>

              {/* Mapeo de Teclado */}
              <div>
                <h3 className="text-lg font-semibold text-orange-200 mb-3">Mapeo de Teclado</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Teclas mapeadas:</span>
                    <span className="font-mono text-orange-200">{mappingStats.totalMapped}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Octava base:</span>
                    <span className="font-mono text-orange-200">{mappingStats.baseOctave}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Modo:</span>
                    <span className="font-mono text-orange-200">{mappingStats.mappingMode}</span>
                  </div>
                </div>
              </div>

              {/* Sistema Musical */}
              <div>
                <h3 className="text-lg font-semibold text-purple-200 mb-3">Sistema Musical</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total notas:</span>
                    <span className="font-mono text-purple-200">{NOTE_STATS.TOTAL_NOTES}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">A4 referencia:</span>
                    <span className="font-mono text-purple-200">{NOTE_STATS.A4_FREQUENCY} Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Middle C:</span>
                    <span className="font-mono text-purple-200">{NOTE_STATS.MIDDLE_C_FREQUENCY.toFixed(2)} Hz</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Estado del Desarrollo */}
        <section>
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-purple-300">Estado del Desarrollo</h2>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 1: Fundamentos</span>
                <span className="text-gray-400">- Configuración completada</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 2: Datos Musicales</span>
                <span className="text-gray-400">- Piano real 88 teclas A0→C8</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 3: Utilidades</span>
                <span className="text-gray-400">- Cálculos, mapeo, detección musical ✅</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400 text-xl">🚧</span>
                <span className="text-white font-semibold">Fase 4: Stores</span>
                <span className="text-gray-400">- Próximo: gestión de estado</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-900/30 rounded-lg">
              <h4 className="font-semibold text-green-200 mb-2">🎉 Fase 3 Completada:</h4>
              <div className="text-sm text-green-100 space-y-1">
                <p>✅ noteUtils.ts: Cálculos de frecuencia funcionando</p>
                <p>✅ keyMapping.ts: Mapeo teclado físico ↔ piano</p>
                <p>✅ chordDetection.ts: Detección de acordes en tiempo real</p>
                <p>✅ scaleDetection.ts: Identificación de escalas</p>
                <p>✅ musicalData.ts: Base de datos musical completa</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer simplificado */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>🎹 Psanter • Piano Virtual Profesional • Fase 3 Completada</p>
        </div>
      </footer>
    </div>
  );
}

export default App;