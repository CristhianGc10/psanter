import React, { useState, useEffect } from 'react';
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
  SPECIAL_KEYS 
} from './data/keyboardLayout';
import type { NoteName } from './types/piano';

// FASE 3 - Importar todas las utilidades
import { 
  calculateNoteFrequency,
  getNoteInfo,
  transposeNote,
  getNoteIndex,
  isValidNoteName,
  NOTE_STATS
} from './utils/noteUtils';

import {
  generateTraditionalMapping,
  generateChromaticMapping,
  getNoteForKey,
  getKeyForNote,
  getMappingStats,
  changeBaseOctave,
  changeMappingMode,
  getMappingInfo
} from './utils/keyMapping';

import {
  detectChords,
  getDetectionStats,
  type DetectedChord
} from './utils/chordDetection';

import {
  detectScales,
  getScaleDetectionStats,
  type DetectedScale
} from './utils/scaleDetection';

function App() {
  // Estados para demostración de la Fase 3
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [selectedNote, setSelectedNote] = useState<NoteName>('C4');
  const [detectedChords, setDetectedChords] = useState<DetectedChord[]>([]);
  const [detectedScales, setDetectedScales] = useState<DetectedScale[]>([]);
  const [mappingMode, setMappingMode] = useState<'traditional' | 'chromatic'>('traditional');
  const [baseOctave, setBaseOctave] = useState(4);

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

  // Actualizar mapeo cuando cambian configuraciones
  useEffect(() => {
    changeBaseOctave(baseOctave);
    changeMappingMode(mappingMode);
  }, [mappingMode, baseOctave]);

  // Componente para una tecla individual del piano
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

  // Separar teclas blancas y negras para renderizado correcto
  const whiteKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isWhite);
  const blackKeys = PIANO_KEY_COORDINATES.filter(coord => coord.isBlack);

  // Obtener información de la nota seleccionada
  const selectedNoteInfo = getNoteInfo(selectedNote);
  const mappingStats = getMappingStats();
  const chordStats = getDetectionStats();
  const scaleStats = getScaleDetectionStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎹 Psanter - Fase 3 Completa
          </h1>
          <p className="text-gray-300 mt-1">
            Utilidades Musicales Funcionando: Cálculos, Mapeo, Detección de Acordes y Escalas
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        
        {/* Piano SVG */}
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
            
            {/* Controles de selección rápida */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedKeys(new Set(['C4', 'E4', 'G4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                C Mayor (C-E-G)
              </button>
              <button
                onClick={() => setSelectedKeys(new Set(['A3', 'C4', 'E4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                A Menor (A-C-E)
              </button>
              <button
                onClick={() => setSelectedKeys(new Set(['G3', 'B3', 'D4', 'F4']))}
                className="px-3 py-1 bg-green-600 rounded text-sm hover:bg-green-500 transition-colors"
              >
                G7 (G-B-D-F)
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
            
            {/* Teclas seleccionadas */}
            {selectedKeys.size > 0 && (
              <div className="mt-4 p-3 bg-purple-900/50 rounded-lg">
                <h4 className="font-semibold text-purple-200 mb-2">
                  Notas Seleccionadas ({selectedKeys.size}):
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedKeys).sort((a, b) => getNoteIndex(a) - getNoteIndex(b)).map(note => (
                    <span 
                      key={note}
                      className="px-2 py-1 bg-purple-700 rounded text-sm font-mono"
                    >
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Detección Musical en Tiempo Real */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            🎵 Detección Musical en Tiempo Real
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detección de Acordes */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-green-200 mb-3">🎼 Acordes Detectados</h3>
              
              {detectedChords.length > 0 ? (
                <div className="space-y-3">
                  {detectedChords.slice(0, 3).map((chord, index) => (
                    <div key={index} className={`p-3 rounded-lg ${index === 0 ? 'bg-green-900/50' : 'bg-gray-800/50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{chord.name}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          chord.quality === 'perfect' ? 'bg-green-600' :
                          chord.quality === 'good' ? 'bg-blue-600' :
                          chord.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {(chord.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Raíz: {chord.root} | Tipo: {chord.type} | 
                        {chord.inversion > 0 && ` Inversión: ${chord.inversion} |`}
                        {chord.missingNotes.length > 0 && ` Faltan: ${chord.missingNotes.join(', ')}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Selecciona notas para detectar acordes</p>
              )}
            </div>

            {/* Detección de Escalas */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-blue-200 mb-3">🎼 Escalas Detectadas</h3>
              
              {detectedScales.length > 0 ? (
                <div className="space-y-3">
                  {detectedScales.slice(0, 3).map((scale, index) => (
                    <div key={index} className={`p-3 rounded-lg ${index === 0 ? 'bg-blue-900/50' : 'bg-gray-800/50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{scale.name}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          scale.quality === 'perfect' ? 'bg-green-600' :
                          scale.quality === 'good' ? 'bg-blue-600' :
                          scale.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                        }`}>
                          {(scale.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        Tónica: {scale.tonic} | Modo: {scale.mode} |
                        {scale.missingNotes.length > 0 && ` Faltan: ${scale.missingNotes.join(', ')}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Selecciona notas para detectar escalas</p>
              )}
            </div>
          </div>
        </section>

        {/* Utilidades de Notas */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            🔧 Utilidades de Notas (noteUtils.ts)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Calculadora de Frecuencias */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-yellow-200 mb-3">🧮 Calculadora de Frecuencias</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Seleccionar Nota:</label>
                  <select 
                    value={selectedNote}
                    onChange={(e) => setSelectedNote(e.target.value as NoteName)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                  >
                    {PIANO_NOTES.map(note => (
                      <option key={note} value={note}>{note}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-300">Frecuencia:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.frequency.toFixed(2)} Hz
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">MIDI:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.midiNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">Octava:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.octave}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">Tipo:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.isWhite ? 'Blanca' : 'Negra'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">Índice:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.index}/87
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">Enarmónica:</span>
                    <span className="ml-2 font-mono text-yellow-200">
                      {selectedNoteInfo.enharmonic || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Transposición */}
                <div className="pt-3 border-t border-gray-600">
                  <h4 className="text-sm font-semibold text-yellow-200 mb-2">Transposición:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[-12, -7, -5, -1, 1, 5, 7, 12].map(semitones => {
                      const transposed = transposeNote(selectedNote, semitones);
                      return (
                        <button
                          key={semitones}
                          onClick={() => transposed && setSelectedNote(transposed)}
                          className="px-2 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-xs transition-colors"
                          disabled={!transposed}
                        >
                          {semitones > 0 ? '+' : ''}{semitones}st
                          {transposed && (
                            <div className="text-xs font-mono">{transposed}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas del Sistema */}
            <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
              <h3 className="text-lg font-semibold text-yellow-200 mb-3">📊 Estadísticas del Sistema</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-yellow-200 mb-2">Notas (NOTE_STATS):</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Total: {NOTE_STATS.TOTAL_NOTES}</div>
                    <div>Blancas: {NOTE_STATS.WHITE_KEYS}</div>
                    <div>Negras: {NOTE_STATS.BLACK_KEYS}</div>
                    <div>Octavas: {NOTE_STATS.OCTAVES}</div>
                    <div>A4: {NOTE_STATS.A4_FREQUENCY} Hz</div>
                    <div>C4: {NOTE_STATS.MIDDLE_C_FREQUENCY.toFixed(2)} Hz</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-yellow-200 mb-2">Detección (Acordes):</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Cache: {chordStats.cacheSize}</div>
                    <div>Tipos: {chordStats.supportedChordTypes}</div>
                    <div>Mín notas: {chordStats.defaultConfig.minNotesForChord}</div>
                    <div>Confianza: {(chordStats.defaultConfig.confidenceThreshold * 100).toFixed(0)}%</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-yellow-200 mb-2">Detección (Escalas):</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Cache: {scaleStats.cacheSize}</div>
                    <div>Tipos: {scaleStats.supportedScaleTypes}</div>
                    <div>Mín notas: {scaleStats.defaultConfig.minNotesForScale}</div>
                    <div>Confianza: {(scaleStats.defaultConfig.confidenceThreshold * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mapeo de Teclado */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-purple-300">
            ⌨️ Mapeo de Teclado (keyMapping.ts)
          </h2>
          
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Configuración */}
              <div>
                <h3 className="text-lg font-semibold text-orange-200 mb-3">⚙️ Configuración</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Modo de Mapeo:</label>
                    <select 
                      value={mappingMode}
                      onChange={(e) => setMappingMode(e.target.value as 'traditional' | 'chromatic')}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      <option value="traditional">Tradicional (2 octavas)</option>
                      <option value="chromatic">Cromático (secuencial)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Octava Base:</label>
                    <select 
                      value={baseOctave}
                      onChange={(e) => setBaseOctave(parseInt(e.target.value))}
                      className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(octave => (
                        <option key={octave} value={octave}>Octava {octave}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div>
                <h3 className="text-lg font-semibold text-orange-200 mb-3">📈 Estadísticas de Mapeo</h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Modo:</span>
                    <span className="font-mono text-orange-200">{mappingStats.mappingMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Octava base:</span>
                    <span className="font-mono text-orange-200">{mappingStats.baseOctave}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Teclas mapeadas:</span>
                    <span className="font-mono text-orange-200">{mappingStats.totalMapped}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Blancas mapeadas:</span>
                    <span className="font-mono text-orange-200">{mappingStats.whiteKeysMapped}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Negras mapeadas:</span>
                    <span className="font-mono text-orange-200">{mappingStats.blackKeysMapped}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Shift octava:</span>
                    <span className="font-mono text-orange-200">
                      {mappingStats.octaveShift > 0 ? '+' : ''}{mappingStats.octaveShift}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Transposición:</span>
                    <span className="font-mono text-orange-200">
                      {mappingStats.transposition > 0 ? '+' : ''}{mappingStats.transposition} st
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ejemplos de Mapeo */}
            <div className="mt-6 pt-6 border-t border-gray-600">
              <h4 className="font-semibold text-orange-200 mb-3">Ejemplos de Mapeo Actual:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  { key: 'KeyA', label: 'A' },
                  { key: 'KeyS', label: 'S' },
                  { key: 'KeyD', label: 'D' },
                  { key: 'KeyF', label: 'F' },
                  { key: 'KeyW', label: 'W' },
                  { key: 'KeyE', label: 'E' },
                  { key: 'KeyZ', label: 'Z' },
                  { key: 'KeyX', label: 'X' }
                ].map(({ key, label }) => {
                  const note = getNoteForKey(key);
                  return (
                    <div key={key} className="p-2 bg-gray-800 rounded">
                      <div className="font-mono text-orange-200">{label}</div>
                      <div className="text-xs text-gray-300">
                        {note || 'No mapeado'}
                      </div>
                    </div>
                  );
                })}
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
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 3: Utilidades</span>
                <span className="text-gray-400">- Cálculos, mapeo y detección musical funcionando</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400 text-xl">🚧</span>
                <span className="text-white font-semibold">Fase 4: Stores</span>
                <span className="text-gray-400">- Próximo: gestión de estado con Zustand</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-xl">⏳</span>
                <span className="text-gray-300">Fase 5-10: Hooks, Componentes, UI, Optimización</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-900/30 rounded-lg">
              <h4 className="font-semibold text-green-200 mb-2">🎉 Fase 3 Completada Exitosamente:</h4>
              <div className="text-sm text-green-100 space-y-1">
                <p>✅ noteUtils.ts: Cálculos de frecuencia y transposición funcionando</p>
                <p>✅ keyMapping.ts: Mapeo bidireccional de teclado físico ↔ piano</p>
                <p>✅ chordDetection.ts: Detección automática de acordes en tiempo real</p>
                <p>✅ scaleDetection.ts: Identificación de escalas y tonalidades</p>
                <p>✅ Interfaz interactiva demostrando todas las funcionalidades</p>
                <p>✅ Sistema robusto y sin errores TypeScript</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          <p>🎹 Psanter • Piano Virtual Profesional • Fase 3 Completada</p>
          <p className="mt-1">
            Click en teclas para detectar acordes y escalas • Utilidades musicales funcionando
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;