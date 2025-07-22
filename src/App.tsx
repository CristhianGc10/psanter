import React, { useState, useEffect } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// Importar el nuevo sistema inteligente
import {
  detectMusic,
  formatChordDisplay,
  formatScaleDisplay,
  getChordNotes,
  getScaleNotes,
  hasExactDetection,
  getDetectionInfo,
  type SmartDetectionResult
} from './utils/exactDetection';

function App() {
  // Estados principales
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [detectionResult, setDetectionResult] = useState<SmartDetectionResult | null>(null);
  const [firstSelectedKey, setFirstSelectedKey] = useState<NoteName | null>(null);

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
      setFirstSelectedKey(null);
    }
  }, [selectedKeys]);

  // Componente para tecla individual con efectos mejorados
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKeys.has(note);
    const isFirstSelected = firstSelectedKey === note;
    
    // Colores con efectos especiales para primera tecla
    const getFillColor = () => {
      if (isSelected) {
        if (isFirstSelected) {
          return isWhite ? '#10b981' : '#059669'; // Verde para primera tecla
        }
        return isWhite ? '#4f46e5' : '#6366f1'; // Azul para las demás
      }
      if (isHovered) {
        return isWhite ? '#f8f9fa' : '#2a2a2a';
      }
      return isWhite ? '#ffffff' : '#1a1a1a';
    };

    const getStrokeColor = () => {
      if (isSelected) {
        if (isFirstSelected) {
          return isWhite ? 'rgba(16, 185, 129, 0.4)' : 'rgba(5, 150, 105, 0.4)';
        }
        return isWhite ? 'rgba(79, 70, 229, 0.3)' : 'rgba(99, 102, 241, 0.3)';
      }
      return isWhite ? 'rgba(200, 200, 200, 0.15)' : 'rgba(100, 100, 100, 0.2)';
    };

    const getShadowFilter = () => {
      if (isSelected) {
        if (isFirstSelected) {
          const color = isWhite ? '16, 185, 129' : '5, 150, 105';
          return `drop-shadow(0 0 4px rgba(${color}, 0.6))`;
        }
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
        strokeWidth={0.08}
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

  // Alternar selección de tecla con tracking de primera tecla
  const toggleKey = (note: NoteName) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(note)) {
        newSet.delete(note);
        // Si se quita la primera tecla, establecer nueva primera
        if (firstSelectedKey === note && newSet.size > 0) {
          setFirstSelectedKey(Array.from(newSet)[0]);
        } else if (newSet.size === 0) {
          setFirstSelectedKey(null);
        }
      } else {
        newSet.add(note);
        // Si es la primera tecla seleccionada
        if (newSet.size === 1) {
          setFirstSelectedKey(note);
        }
      }
      return newSet;
    });
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedKeys(new Set());
    setFirstSelectedKey(null);
  };

  // Obtener información de debugging si está disponible
  const debugInfo = detectionResult ? getDetectionInfo(detectionResult) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎹 Psanter
          </h1>
          <p className="text-gray-300 text-xl">
            Sistema inteligente de detección musical
          </p>
          <p className="text-gray-400 text-sm mt-2">
            v3.5 • Priorización por especificidad • Filtro anti-ruido • Máxima simplicidad
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
          
          {/* Controles con información de contexto */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-gray-300 text-sm space-y-1">
              <div>
                {selectedKeys.size > 0 
                  ? `${selectedKeys.size} teclas seleccionadas`
                  : 'Selecciona teclas para detectar acordes y escalas'
                }
              </div>
              {firstSelectedKey && (
                <div className="text-green-400 text-xs">
                  🎯 Tónica contextual: {firstSelectedKey.replace(/\d+$/, '')} (primera tecla = verde)
                </div>
              )}
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

        {/* Resultados de detección inteligente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Acorde detectado */}
          <div className="bg-black/40 rounded-xl p-8 backdrop-blur-sm border border-white/10">
            <h2 className="text-3xl font-bold text-blue-400 mb-6 text-center">
              🎵 Acorde Inteligente
            </h2>
            
            <div className="text-center">
              {detectionResult?.chord ? (
                <>
                  <div className="text-4xl font-bold mb-4">
                    {formatChordDisplay(detectionResult.chord)}
                  </div>
                  <div className="text-gray-300 text-lg mb-4">
                    {getChordNotes(detectionResult.chord)}
                  </div>
                  
                  {/* Información inteligente del acorde */}
                  <div className="space-y-2 text-sm">
                    {detectionResult.chord.isExactMatch && (
                      <div className="inline-block bg-green-600/20 text-green-400 px-3 py-1 rounded-full font-medium">
                        ✓ Coincidencia Exacta
                      </div>
                    )}
                    
                    <div className="text-gray-400 space-y-1">
                      <div>Especificidad: {detectionResult.chord.specificity} notas</div>
                      <div>Confianza: {Math.round(detectionResult.chord.confidence * 100)}%</div>
                      {detectionResult.chord.popularity > 0.7 && (
                        <div className="text-blue-400">🎯 Acorde popular</div>
                      )}
                    </div>
                  </div>
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
              🎼 Escala Inteligente
            </h2>
            
            <div className="text-center">
              {detectionResult?.scale ? (
                <>
                  <div className="text-4xl font-bold mb-4">
                    {formatScaleDisplay(detectionResult.scale)}
                  </div>
                  <div className="text-gray-300 text-lg mb-4">
                    {getScaleNotes(detectionResult.scale)}
                  </div>
                  
                  {/* Información inteligente de la escala */}
                  <div className="space-y-2 text-sm">
                    {detectionResult.scale.isExactMatch && (
                      <div className="inline-block bg-green-600/20 text-green-400 px-3 py-1 rounded-full font-medium">
                        ✓ Coincidencia Exacta
                      </div>
                    )}
                    
                    <div className="text-gray-400 space-y-1">
                      <div>Especificidad: {detectionResult.scale.specificity} notas</div>
                      <div>Confianza: {Math.round(detectionResult.scale.confidence * 100)}%</div>
                      {detectionResult.scale.popularity > 0.7 && (
                        <div className="text-purple-400">🎯 Escala popular</div>
                      )}
                    </div>
                  </div>
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

        {/* Panel de información del sistema inteligente */}
        {detectionResult?.hasDetection && (
          <div className="mt-8 bg-black/20 rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-center mb-4 text-yellow-400">
              🧠 Sistema Inteligente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Razonamiento */}
              <div className="bg-blue-600/10 rounded-lg p-4 border border-blue-400/20">
                <div className="text-blue-400 font-medium mb-2">Razonamiento</div>
                <div className="text-gray-300">{detectionResult.reasoning}</div>
              </div>
              
              {/* Filtros aplicados */}
              <div className="bg-purple-600/10 rounded-lg p-4 border border-purple-400/20">
                <div className="text-purple-400 font-medium mb-2">Filtros</div>
                <div className="text-gray-300">
                  {detectionResult.filterApplied === 'anti-noise' && '🚫 Anti-ruido'}
                  {detectionResult.filterApplied === 'contextual' && '🎯 Contextual'}
                  {detectionResult.filterApplied === 'none' && '✨ Ninguno necesario'}
                </div>
              </div>
              
              {/* Estadísticas */}
              <div className="bg-green-600/10 rounded-lg p-4 border border-green-400/20">
                <div className="text-green-400 font-medium mb-2">Estadísticas</div>
                <div className="text-gray-300 space-y-1">
                  {debugInfo && (
                    <>
                      <div>Exactas: {debugInfo.exactMatches ? '✅' : '❌'}</div>
                      <div>Notas: {debugInfo.inputCount}</div>
                      {debugInfo.hasChord && (
                        <div>Acorde: {debugInfo.chordSpecificity}n</div>
                      )}
                      {debugInfo.hasScale && (
                        <div>Escala: {debugInfo.scaleSpecificity}n</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Características del sistema */}
        <div className="mt-8 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-blue-300 mb-3">
              🎯 Características del Sistema Inteligente v3.5
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-blue-300 font-medium">Priorización</div>
                <div className="text-blue-400/70">Por especificidad</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-green-300 font-medium">Contexto</div>
                <div className="text-green-400/70">Tónica inteligente</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">🚫</div>
                <div className="text-purple-300 font-medium">Anti-ruido</div>
                <div className="text-purple-400/70">Filtra redundancias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-yellow-300 font-medium">Simplicidad</div>
                <div className="text-yellow-400/70">1 resultado/categoría</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <p className="text-gray-400 text-sm">
              🧠 <strong>Sistema Inteligente:</strong> Detección contextual • Filtros avanzados • Máxima precisión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;