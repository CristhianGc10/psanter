import React, { useState, useEffect } from 'react';
import { 
  PIANO_KEY_COORDINATES, 
  SVG_CONFIG, 
  KEY_COLORS
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

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
  const [primaryChord, setPrimaryChord] = useState<DetectedChord | null>(null);
  const [primaryScale, setPrimaryScale] = useState<DetectedScale | null>(null);

  // Actualizar detección cuando cambian las teclas seleccionadas
  useEffect(() => {
    if (selectedKeys.size > 0) {
      const notesArray = Array.from(selectedKeys);
      
      // Detectar solo el acorde primario (más confiable)
      const chordResult = detectChords(notesArray);
      setPrimaryChord(chordResult.primaryChord);
      
      // Detectar solo la escala primaria (más confiable)
      const scaleResult = detectScales(notesArray);
      setPrimaryScale(scaleResult.primaryScale);
    } else {
      setPrimaryChord(null);
      setPrimaryScale(null);
    }
  }, [selectedKeys]);

  // Componente para tecla del piano (contorno prácticamente indetectable)
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

    // Contorno muy fino, prácticamente indetectable
    const strokeColor = isWhite ? '#e5e7eb' : '#4b5563';

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
        strokeWidth="0.02"  // Contorno prácticamente indetectable
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

  // Limpiar selección
  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Piano Interactivo */}
        <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10 mb-6">
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
          
          {/* Control rápido */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-300">
              {selectedKeys.size > 0 && (
                <span>
                  Notas seleccionadas: {Array.from(selectedKeys).join(', ')} ({selectedKeys.size})
                </span>
              )}
            </div>
            
            {selectedKeys.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Resultados de Detección - Solo 1 Acorde y 1 Escala */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Acorde Detectado */}
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h3 className="text-lg font-semibold text-green-200 mb-4">
              🎵 Acorde Detectado
            </h3>
            
            {primaryChord ? (
              <div className="bg-green-900/50 border border-green-600/30 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xl">{primaryChord.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    primaryChord.quality === 'perfect' ? 'bg-green-600' :
                    primaryChord.quality === 'good' ? 'bg-blue-600' :
                    primaryChord.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {(primaryChord.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm text-green-100">
                  <div>Raíz: <span className="font-mono">{primaryChord.root}</span> • Tipo: {primaryChord.type}</div>
                  {primaryChord.inversion > 0 && (
                    <div>Inversión: {primaryChord.inversion}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-2">🎵</div>
                <p>Selecciona notas para detectar acorde</p>
              </div>
            )}
          </div>

          {/* Escala Detectada */}
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <h3 className="text-lg font-semibold text-blue-200 mb-4">
              🎼 Escala Detectada
            </h3>
            
            {primaryScale ? (
              <div className="bg-blue-900/50 border border-blue-600/30 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-xl">{primaryScale.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    primaryScale.quality === 'perfect' ? 'bg-green-600' :
                    primaryScale.quality === 'good' ? 'bg-blue-600' :
                    primaryScale.quality === 'partial' ? 'bg-yellow-600' : 'bg-gray-600'
                  }`}>
                    {(primaryScale.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm text-blue-100">
                  <div>Tónica: <span className="font-mono">{primaryScale.tonic}</span> • Tipo: {primaryScale.type}</div>
                  <div>Modo: {primaryScale.mode}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <div className="text-3xl mb-2">🎼</div>
                <p>Selecciona notas para detectar escala</p>
              </div>
            )}
          </div>
          
        </div>
        
      </div>
    </div>
  );
}

export default App;