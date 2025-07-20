import React, { useState, useEffect } from 'react';
import { 
  PIANO_KEY_COORDINATES, 
  SVG_CONFIG, 
  KEY_COLORS, 
  isWhiteKey
} from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// ⚡ IMPORTAR FUNCIONES OPTIMIZADAS
import {
  detectChordsOptimized as detectChords,  // Wrapper de compatibilidad
  detectScalesOptimized as detectScales,  // Wrapper de compatibilidad
  detectOptimalChord,                     // Nueva función optimizada
  detectOptimalScale,                     // Nueva función optimizada
  getOptimizationStats,                   // Estadísticas del sistema optimizado
  resetMusicalContext                     // Reiniciar contexto musical
} from './utils/optimizedDetection';

// Mantener importaciones de tipos originales
import {
  type DetectedChord
} from './utils/chordDetection';

import {
  type DetectedScale
} from './utils/scaleDetection';

function App() {
  // Estados esenciales (SIN CAMBIOS)
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [detectedChords, setDetectedChords] = useState<DetectedChord[]>([]);
  const [detectedScales, setDetectedScales] = useState<DetectedScale[]>([]);
  
  // ⚡ NUEVO: Estados para mostrar información optimizada
  const [optimizationInfo, setOptimizationInfo] = useState<{
    chord?: { confidence: number; reasoning: string; certainty: string };
    scale?: { confidence: number; reasoning: string; certainty: string };
  }>({});

  // ⚡ ACTUALIZACIÓN: useEffect con detección optimizada
  useEffect(() => {
    if (selectedKeys.size > 0) {
      const notesArray = Array.from(selectedKeys);
      
      // Usar funciones de compatibilidad (cambio mínimo)
      const chordResult = detectChords(notesArray);
      if (chordResult.primaryChord) {
        setDetectedChords([chordResult.primaryChord, ...chordResult.alternativeChords]);
      } else {
        setDetectedChords([]);
      }
      
      const scaleResult = detectScales(notesArray);
      if (scaleResult.primaryScale) {
        setDetectedScales([scaleResult.primaryScale, ...scaleResult.alternativeScales]);
      } else {
        setDetectedScales([]);
      }

      // Usar funciones optimizadas directamente para info adicional
      const optimalChord = detectOptimalChord(notesArray);
      const optimalScale = detectOptimalScale(notesArray);
      
      setOptimizationInfo({
        chord: optimalChord ? {
          confidence: optimalChord.confidence,
          reasoning: optimalChord.reasoning,
          certainty: optimalChord.certainty
        } : undefined,
        scale: optimalScale ? {
          confidence: optimalScale.confidence,
          reasoning: optimalScale.reasoning,
          certainty: optimalScale.certainty
        } : undefined
      });
      
    } else {
      setDetectedChords([]);
      setDetectedScales([]);
      setOptimizationInfo({});
    }
  }, [selectedKeys]);

  // ⚡ NUEVA FUNCIÓN: Limpiar contexto musical
  const handleResetContext = () => {
    resetMusicalContext();
    setOptimizationInfo({});
  };

  // Componente para tecla del piano (CORREGIDO)
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

    // ✅ CORREGIDO: Usar colores estáticos para stroke
    const strokeColor = isWhite ? '#d1d5db' : '#374151';

    return (
      <polygon
        points={coordinates}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isWhite ? 1 : 0.5}
        className={`piano-key ${isWhite ? 'white-key' : 'black-key'} transition-all duration-150 cursor-pointer hover:drop-shadow-sm`}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => {
          const newSelectedKeys = new Set(selectedKeys);
          if (selectedKeys.has(note)) {
            newSelectedKeys.delete(note);
          } else {
            newSelectedKeys.add(note);
          }
          setSelectedKeys(newSelectedKeys);
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header (SIN CAMBIOS) */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            🎹 Psanter - Piano Virtual
          </h1>
          <p className="text-gray-300">
            Sistema avanzado de detección musical con IA optimizada
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        
        {/* ⚡ NUEVA SECCIÓN: Panel de información optimizada */}
        {(optimizationInfo.chord || optimizationInfo.scale) && (
          <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">🎯 Detección Optimizada</h3>
              <button
                onClick={handleResetContext}
                className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-lg text-sm hover:bg-purple-600/50 transition-colors"
              >
                Resetear Contexto
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {optimizationInfo.chord && (
                <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
                  <h4 className="font-medium text-blue-200 mb-2">🎵 Acorde Óptimo</h4>
                  <div className="text-sm text-blue-100 space-y-1">
                    <p><strong>Confianza:</strong> {(optimizationInfo.chord.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Certeza:</strong> <span className={`px-2 py-1 rounded text-xs ${
                      optimizationInfo.chord.certainty === 'high' ? 'bg-green-500/30 text-green-200' :
                      optimizationInfo.chord.certainty === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-red-500/30 text-red-200'
                    }`}>{optimizationInfo.chord.certainty}</span></p>
                    <p><strong>Razón:</strong> {optimizationInfo.chord.reasoning}</p>
                  </div>
                </div>
              )}
              
              {optimizationInfo.scale && (
                <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
                  <h4 className="font-medium text-green-200 mb-2">🎼 Escala Óptima</h4>
                  <div className="text-sm text-green-100 space-y-1">
                    <p><strong>Confianza:</strong> {(optimizationInfo.scale.confidence * 100).toFixed(1)}%</p>
                    <p><strong>Certeza:</strong> <span className={`px-2 py-1 rounded text-xs ${
                      optimizationInfo.scale.certainty === 'high' ? 'bg-green-500/30 text-green-200' :
                      optimizationInfo.scale.certainty === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                      'bg-red-500/30 text-red-200'
                    }`}>{optimizationInfo.scale.certainty}</span></p>
                    <p><strong>Razón:</strong> {optimizationInfo.scale.reasoning}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Estadísticas del sistema optimizado */}
            <div className="mt-4 p-3 bg-gray-800/30 rounded-lg">
              <h5 className="text-sm font-medium text-gray-300 mb-2">📊 Estadísticas del Sistema</h5>
              <div className="text-xs text-gray-400">
                {(() => {
                  const stats = getOptimizationStats();
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>Acordes recientes: {stats.recentChords}</div>
                      <div>Escalas recientes: {stats.recentScales}</div>
                      <div>Tonalidad establecida: {stats.establishedKey || 'Ninguna'}</div>
                      <div>Progresión: {stats.progressionLength} elementos</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Piano SVG (CORREGIDO) */}
        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            Piano Virtual
          </h2>
          
          <div className="flex justify-center">
            <svg
              viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
              className="max-w-full h-auto border border-white/20 rounded-lg shadow-2xl bg-white/5"
            >
              {/* ✅ CORREGIDO: Renderizar teclas blancas primero */}
              {PIANO_KEY_COORDINATES
                .filter(keyCoord => keyCoord.isWhite)
                .map((keyCoord) => (
                  <PianoKey
                    key={keyCoord.note}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}  // ✅ CORREGIDO: acceder a la propiedad
                    isWhite={true}
                  />
                ))}
              
              {/* ✅ CORREGIDO: Renderizar teclas negras encima */}
              {PIANO_KEY_COORDINATES
                .filter(keyCoord => keyCoord.isBlack)
                .map((keyCoord) => (
                  <PianoKey
                    key={keyCoord.note}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}  // ✅ CORREGIDO: acceder a la propiedad
                    isWhite={false}
                  />
                ))}
            </svg>
          </div>
          
          {/* Info de teclas seleccionadas */}
          {selectedKeys.size > 0 && (
            <div className="mt-6 text-center">
              <p className="text-white">
                <strong>Teclas seleccionadas:</strong> {Array.from(selectedKeys).join(', ')}
              </p>
            </div>
          )}
        </section>

        {/* Panel de Resultados (MEJORADO) */}
        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">
            🎵 Análisis Musical
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Acordes detectados */}
            <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-400/30">
              <h3 className="text-lg font-medium text-blue-200 mb-3">🎵 Acordes</h3>
              {detectedChords.length > 0 ? (
                <div className="space-y-2">
                  {detectedChords.map((chord, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        index === 0 
                          ? 'bg-blue-600/30 border border-blue-400/50' 
                          : 'bg-blue-500/20 border border-blue-400/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-100">
                          {chord.name}
                          {index === 0 && optimizationInfo.chord && (
                            <span className="ml-2 text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded">
                              ⚡ OPTIMIZADO
                            </span>
                          )}
                        </span>
                        <span className="text-blue-300 text-sm">
                          {(chord.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-blue-200 text-sm mt-1">
                        Calidad: {chord.quality} | Notas: {chord.notes.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-300 text-center py-4">
                  Selecciona al menos 2 teclas para detectar acordes
                </p>
              )}
            </div>

            {/* Escalas detectadas */}
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-400/30">
              <h3 className="text-lg font-medium text-green-200 mb-3">🎼 Escalas</h3>
              {detectedScales.length > 0 ? (
                <div className="space-y-2">
                  {detectedScales.map((scale, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${
                        index === 0 
                          ? 'bg-green-600/30 border border-green-400/50' 
                          : 'bg-green-500/20 border border-green-400/30'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-100">
                          {scale.name}
                          {index === 0 && optimizationInfo.scale && (
                            <span className="ml-2 text-xs bg-green-500/30 text-green-200 px-2 py-1 rounded">
                              ⚡ OPTIMIZADO
                            </span>
                          )}
                        </span>
                        <span className="text-green-300 text-sm">
                          {(scale.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-green-200 text-sm mt-1">
                        Calidad: {scale.quality} | Tónica: {scale.tonic}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-green-300 text-center py-4">
                  Selecciona al menos 3 teclas para detectar escalas
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Estado del Proyecto */}
        <section className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">
            🚀 Estado del Proyecto Psanter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 1: Tipos</span>
                <span className="text-gray-400">- Sistema de tipos completo ✅</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 2: Datos</span>
                <span className="text-gray-400">- Coordenadas piano, datos musicales ✅</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 3: Utilidades</span>
                <span className="text-gray-400">- Cálculos, mapeo, detección musical ✅</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-white font-semibold">Fase 4: Optimización</span>
                <span className="text-gray-400">- IA de detección musical ✅</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-yellow-400 text-xl">🚧</span>
                <span className="text-white font-semibold">Fase 5: Stores</span>
                <span className="text-gray-400">- Próximo: gestión de estado</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-900/30 rounded-lg">
              <h4 className="font-semibold text-green-200 mb-2">🎉 Nueva Fase Completada:</h4>
              <div className="text-sm text-green-100 space-y-1">
                <p>✅ optimizedDetection.ts: IA de detección musical</p>
                <p>✅ Sistema de memoria contextual funcionando</p>
                <p>✅ Resolución automática de conflictos</p>
                <p>✅ Algoritmo híbrido de múltiples capas</p>
                <p>✅ Integración completa con sistemas existentes</p>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 p-4 mt-8">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>🎹 Psanter • Piano Virtual Profesional • IA de Detección Musical Optimizada</p>
        </div>
      </footer>
    </div>
  );
}

export default App;