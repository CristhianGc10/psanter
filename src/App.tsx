import React, { useState, useEffect } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// Importar el nuevo sistema simplificado
import {
  detectMusic,
  formatChordDisplay,
  formatScaleDisplay,
  getChordNotes,
  getScaleNotes,
  hasExactDetection,
  type SimplifiedDetectionResult
} from './utils/exactDetection';

function App() {
  // Estados principales
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [detectionResult, setDetectionResult] = useState<SimplifiedDetectionResult | null>(null);

  // Obtener coordenadas de las teclas
  const whiteKeys = getWhiteKeyCoordinates();
  const blackKeys = getBlackKeyCoordinates();

  // Detección en tiempo real cuando cambian las teclas seleccionadas
  useEffect(() => {
    if (selectedKeys.size > 0) {
      const notesArray = Array.from(selectedKeys);
      const result = detectMusic(notesArray);
      setDetectionResult(result);
    } else {
      setDetectionResult(null);
    }
  }, [selectedKeys]);

  // Componente para tecla individual con contornos ultra-finos
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKeys.has(note);
    
    // Colores con contornos ultra-sutiles
    const getFillColor = () => {
      if (isSelected) {
        return isWhite ? '#4f46e5' : '#6366f1';
      }
      if (isHovered) {
        return isWhite ? '#f8f9fa' : '#2a2a2a';
      }
      return isWhite ? '#ffffff' : '#1a1a1a';
    };

    const getStrokeColor = () => {
      if (isSelected) {
        return isWhite ? 'rgba(79, 70, 229, 0.3)' : 'rgba(99, 102, 241, 0.3)';
      }
      return isWhite ? 'rgba(200, 200, 200, 0.15)' : 'rgba(100, 100, 100, 0.2)';
    };

    // Efectos de sombra muy sutiles
    const getShadowFilter = () => {
      if (isSelected) {
        const color = isWhite ? '79, 70, 229' : '99, 102, 241';
        return `drop-shadow(0 0 3px rgba(${color}, 0.4))`;
      }
      if (isHovered) {
        return 'drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0.15)) brightness(1.02)';
      }
      return 'drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0.08))';
    };

    return (
      <polygon
        points={coordinates}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={0.08} // Ultra-fino
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => toggleKey(note)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.12s ease',
          filter: getShadowFilter(),
          transform: isHovered ? 'translateY(0.3px)' : 'none'
        }}
      />
    );
  };

  // Alternar selección de tecla
  const toggleKey = (note: NoteName) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(note)) {
        newSet.delete(note);
      } else {
        newSet.add(note);
      }
      return newSet;
    });
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedKeys(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header - Solo título */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎹 Psanter
          </h1>
          <p className="text-gray-300 text-xl">
            Detección musical exacta con soporte multi-octava
          </p>
        </div>

        {/* Piano */}
        <div className="bg-black/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm border border-white/10 mb-8">
          <div className="w-full overflow-x-auto pb-4">
            <div style={{ minWidth: '1200px' }}>
              <svg
                width="100%"
                height="200"
                viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="border-0 rounded-lg"
                style={{ 
                  backgroundColor: '#0a0a0a',
                  outline: 'none'
                }}
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
          </div>
          
          {/* Control básico */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-gray-300 text-sm">
              {selectedKeys.size > 0 
                ? `${selectedKeys.size} teclas seleccionadas`
                : 'Selecciona teclas para detectar acordes y escalas'
              }
            </div>
            {selectedKeys.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white transition-colors text-sm"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Resultados de detección - Solo acorde y escala */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Acorde detectado */}
          <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">
              🎵 Acorde
            </h2>
            
            <div className="text-center">
              {detectionResult?.chord ? (
                <>
                  <div className="text-4xl font-bold mb-4">
                    {formatChordDisplay(detectionResult.chord)}
                  </div>
                  <div className="text-gray-300 text-lg">
                    {getChordNotes(detectionResult.chord)}
                  </div>
                  {detectionResult.chord.isExactMatch && (
                    <div className="mt-4 inline-block bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                      ✓ Coincidencia Exacta
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 py-12">
                  <div className="text-6xl mb-4">🎼</div>
                  <p className="text-xl">
                    {selectedKeys.size < 2 
                      ? 'Selecciona al menos 2 teclas'
                      : 'No se detectó ningún acorde'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Escala detectada */}
          <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-3xl font-bold text-purple-400 mb-6 text-center">
              🎼 Escala
            </h2>
            
            <div className="text-center">
              {detectionResult?.scale ? (
                <>
                  <div className="text-4xl font-bold mb-4">
                    {formatScaleDisplay(detectionResult.scale)}
                  </div>
                  <div className="text-gray-300 text-lg">
                    {getScaleNotes(detectionResult.scale)}
                  </div>
                  {detectionResult.scale.isExactMatch && (
                    <div className="mt-4 inline-block bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                      ✓ Coincidencia Exacta
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 py-12">
                  <div className="text-6xl mb-4">🎹</div>
                  <p className="text-xl">
                    {selectedKeys.size < 3 
                      ? 'Selecciona al menos 3 teclas'
                      : 'No se detectó ninguna escala'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de soporte multi-octava */}
        {selectedKeys.size > 0 && detectionResult?.hasDetection && (
          <div className="mt-8 text-center">
            <div className="bg-blue-600/20 border border-blue-400/30 rounded-xl p-4">
              <p className="text-blue-300 text-sm">
                ✨ <strong>Multi-octava:</strong> Puedes tocar las mismas notas en diferentes octavas del piano
              </p>
              <p className="text-blue-400/70 text-xs mt-1">
                Ejemplo: C4 + E4 + G4 = C5 + E5 + G5 = Ambos son C Major
              </p>
            </div>
          </div>
        )}

        {/* Footer simplificado */}
        <div className="mt-12 text-center">
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">
              🎯 <strong>Fase 3:</strong> Detección exacta • Contornos ultra-finos • Soporte multi-octava
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;