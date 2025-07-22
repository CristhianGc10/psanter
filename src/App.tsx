import React, { useState, useEffect } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG, 
  KEY_COLORS
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// Importar el sistema optimizado
import {
  detectChordsOptimized,
  detectScalesOptimized,
  type OptimizedChordResult,
  type OptimizedScaleResult
} from './utils/optimizedDetection';

function App() {
  // Estados esenciales
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [chordResult, setChordResult] = useState<OptimizedChordResult | null>(null);
  const [scaleResult, setScaleResult] = useState<OptimizedScaleResult | null>(null);

  // Obtener las teclas usando las funciones auxiliares
  const whiteKeys = getWhiteKeyCoordinates();
  const blackKeys = getBlackKeyCoordinates();

  // Actualizar detección cuando cambian las teclas seleccionadas
  useEffect(() => {
    if (selectedKeys.size > 0) {
      const notesArray = Array.from(selectedKeys);
      
      // Usar el sistema optimizado
      const detectedChord = detectChordsOptimized(notesArray);
      const detectedScale = detectScalesOptimized(notesArray);
      
      setChordResult(detectedChord);
      setScaleResult(detectedScale);
    } else {
      setChordResult(null);
      setScaleResult(null);
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

    const strokeColor = isWhite ? '#e5e7eb' : '#9ca3af';
    const strokeWidth = 0.5;

    return (
      <polygon
        points={coordinates}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => toggleKey(note)}
        style={{ 
          cursor: 'pointer',
          transition: 'fill 0.15s ease'
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
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
            🎹 Psanter
          </h1>
          <p className="text-gray-300 text-lg">
            Sistema de detección musical de alta precisión
          </p>
        </div>

        {/* Piano SVG */}
        <div className="bg-black/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm border border-white/10">
          <div className="w-full overflow-x-auto pb-4">
            <div style={{ minWidth: '1200px' }}>
              <svg
                width="100%"
                height="200"
                viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="border border-gray-700 rounded-lg"
                style={{ backgroundColor: '#0a0a0a' }}
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
          
          {/* Control rápido y estadísticas */}
          <div className="flex justify-between items-center mt-4 text-sm">
            <div className="text-gray-300">
              {selectedKeys.size > 0 ? (
                <span>
                  Notas seleccionadas: <span className="font-mono text-blue-400">
                    {Array.from(selectedKeys).sort().join(', ')}
                  </span> ({selectedKeys.size})
                </span>
              ) : (
                <span className="text-gray-500">
                  Haz clic en las teclas para seleccionar notas
                </span>
              )}
            </div>
            
            {selectedKeys.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Limpiar selección
              </button>
            )}
          </div>
        </div>

        {/* Resultados de Detección - Sistema Optimizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* Acorde Detectado con Precisión */}
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">
                🎵 Acorde Detectado
              </h3>
              {chordResult?.exactMatch && (
                <span className="text-xs bg-gradient-to-r from-green-600 to-green-500 px-3 py-1 rounded-full font-medium">
                  ✨ Coincidencia Exacta
                </span>
              )}
            </div>
            
            {chordResult && chordResult.chord ? (
              <div className="space-y-4">
                <div className="bg-green-900/30 border border-green-600/30 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-2xl text-green-100">{chordResult.chord.name}</h4>
                      <p className="text-sm text-green-300 mt-1">
                        Raíz: <span className="font-mono bg-green-800/50 px-2 py-0.5 rounded">{chordResult.chord.root}</span>
                        {' • '}
                        Tipo: <span className="font-mono">{chordResult.chord.type}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm px-3 py-1 rounded-md font-medium ${
                        chordResult.chord.quality === 'perfect' ? 'bg-green-600 text-white' :
                        chordResult.chord.quality === 'good' ? 'bg-blue-600 text-white' :
                        chordResult.chord.quality === 'partial' ? 'bg-yellow-600 text-gray-900' : 
                        'bg-gray-600 text-white'
                      }`}>
                        {(chordResult.confidence * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        chordResult.certainty === 'high' ? 'bg-purple-600/80' :
                        chordResult.certainty === 'medium' ? 'bg-blue-600/80' : 
                        'bg-gray-600/80'
                      }`}>
                        Certeza: {chordResult.certainty}
                      </span>
                    </div>
                  </div>
                  
                  {chordResult.chord.inversion > 0 && (
                    <p className="text-sm text-green-300">
                      Inversión: <span className="font-mono">{chordResult.chord.inversion}ª</span>
                    </p>
                  )}
                  
                  <p className="mt-3 text-xs text-green-200/70 italic">
                    💡 {chordResult.reasoning}
                  </p>
                </div>
                
                {/* Detalles técnicos */}
                {(chordResult.chord.missingNotes.length > 0 || chordResult.chord.extraNotes.length > 0) && (
                  <div className="bg-gray-800/30 rounded-lg p-3 text-xs">
                    {chordResult.chord.missingNotes.length > 0 && (
                      <p className="text-yellow-400">
                        Notas faltantes: {chordResult.chord.missingNotes.join(', ')}
                      </p>
                    )}
                    {chordResult.chord.extraNotes.length > 0 && (
                      <p className="text-blue-400">
                        Notas adicionales: {chordResult.chord.extraNotes.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Alternativas */}
                {chordResult.alternatives.length > 0 && (
                  <div className="pt-3 border-t border-green-600/20">
                    <p className="text-xs text-green-300/60 mb-2">Otras posibilidades:</p>
                    <div className="flex gap-2 flex-wrap">
                      {chordResult.alternatives.map((alt, i) => (
                        <span key={i} className="text-xs bg-green-800/30 px-3 py-1 rounded-md border border-green-700/30">
                          {alt.name} <span className="text-green-400">({(alt.confidence * 100).toFixed(0)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3 opacity-50">🎵</div>
                <p>Selecciona al menos 2 notas para detectar acordes</p>
              </div>
            )}
          </div>

          {/* Escala Detectada con Precisión */}
          <div className="bg-black/40 rounded-xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400">
                🎼 Escala Detectada
              </h3>
              {scaleResult?.exactMatch && (
                <span className="text-xs bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 rounded-full font-medium">
                  ✨ Coincidencia Exacta
                </span>
              )}
            </div>
            
            {scaleResult && scaleResult.scale ? (
              <div className="space-y-4">
                <div className="bg-blue-900/30 border border-blue-600/30 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-2xl text-blue-100">{scaleResult.scale.name}</h4>
                      <p className="text-sm text-blue-300 mt-1">
                        Tónica: <span className="font-mono bg-blue-800/50 px-2 py-0.5 rounded">{scaleResult.scale.tonic}</span>
                        {' • '}
                        Modo: <span className="font-mono">{scaleResult.scale.mode}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-sm px-3 py-1 rounded-md font-medium ${
                        scaleResult.scale.quality === 'perfect' ? 'bg-green-600 text-white' :
                        scaleResult.scale.quality === 'good' ? 'bg-blue-600 text-white' :
                        scaleResult.scale.quality === 'partial' ? 'bg-yellow-600 text-gray-900' : 
                        'bg-gray-600 text-white'
                      }`}>
                        {(scaleResult.confidence * 100).toFixed(0)}%
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        scaleResult.certainty === 'high' ? 'bg-purple-600/80' :
                        scaleResult.certainty === 'medium' ? 'bg-blue-600/80' : 
                        'bg-gray-600/80'
                      }`}>
                        Certeza: {scaleResult.certainty}
                      </span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-xs text-blue-200/70 italic">
                    💡 {scaleResult.reasoning}
                  </p>
                </div>
                
                {/* Notas de la escala */}
                <div className="bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-blue-300/80 mb-2">Notas completas de la escala:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {scaleResult.scale.notes.map((note, i) => {
                      const isPlayed = Array.from(selectedKeys).some(k => k.startsWith(note));
                      return (
                        <span 
                          key={i} 
                          className={`text-sm px-3 py-1.5 rounded-md font-mono transition-all ${
                            isPlayed 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                              : 'bg-blue-800/30 text-blue-300/60 border border-blue-700/30'
                          }`}
                        >
                          {note}
                        </span>
                      );
                    })}
                  </div>
                  {scaleResult.scale.missingNotes.length > 0 && (
                    <p className="text-xs text-yellow-400/80 mt-2">
                      Faltan: {scaleResult.scale.missingNotes.join(', ')} para completar la escala
                    </p>
                  )}
                </div>
                
                {/* Alternativas */}
                {scaleResult.alternatives.length > 0 && (
                  <div className="pt-3 border-t border-blue-600/20">
                    <p className="text-xs text-blue-300/60 mb-2">Otras posibilidades:</p>
                    <div className="flex gap-2 flex-wrap">
                      {scaleResult.alternatives.map((alt, i) => (
                        <span key={i} className="text-xs bg-blue-800/30 px-3 py-1 rounded-md border border-blue-700/30">
                          {alt.name} <span className="text-blue-400">({(alt.confidence * 100).toFixed(0)}%)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3 opacity-50">🎼</div>
                <p>Selecciona al menos 3 notas para detectar escalas</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Info adicional sobre precisión */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-gray-500 bg-black/30 px-4 py-2 rounded-lg">
            <span>💡 Sistema de detección con base de datos completa</span>
            <span>•</span>
            <span>✨ = Patrón musical exacto</span>
            <span>•</span>
            <span>88 teclas interactivas</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default App;