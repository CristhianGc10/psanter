import React, { useState } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from '../data/pianoCoordinates';
import type { NoteName } from '../types/piano';

interface PianoDisplayProps {
  selectedKeys: Set<NoteName>;
  currentPattern?: {
    tonic: string;
    type: string;
    category: 'chord' | 'scale';
    octave: number;
  } | null;
}

const PianoDisplay: React.FC<PianoDisplayProps> = ({ selectedKeys, currentPattern }) => {
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);

  // Obtener coordenadas de las teclas
  const whiteKeys = getWhiteKeyCoordinates();
  const blackKeys = getBlackKeyCoordinates();

  // Componente para tecla individual
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKeys.has(note);
    
    const getFillColor = () => {
      if (isSelected) {
        return isWhite ? '#10b981' : '#059669'; // Verde esmeralda para seleccionadas
      }
      if (isHovered) {
        return isWhite ? '#f8f9fa' : '#2a2a2a';
      }
      return isWhite ? '#ffffff' : '#1a1a1a';
    };

    const getStrokeColor = () => {
      if (isSelected) {
        return isWhite ? 'rgba(16, 185, 129, 0.6)' : 'rgba(5, 150, 105, 0.6)';
      }
      if (isHovered) {
        return isWhite ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.2)';
      }
      return isWhite ? 'rgba(200, 200, 200, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    };

    const getFilter = () => {
      if (isSelected) {
        return 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8)) brightness(1.1)';
      }
      if (isHovered) {
        return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)) brightness(1.05)';
      }
      return 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))';
    };

    return (
      <polygon
        points={coordinates}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={0.12}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.2s ease-out',
          filter: getFilter(),
          transformOrigin: 'center'
        }}
        className={isHovered ? 'scale-105' : ''}
      />
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Contenedor del Piano */}
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
        
        {/* Header del Piano */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            🎹 Piano Virtual
          </h2>
          <p className="text-slate-300 text-sm">
            88 teclas • Rango completo A0 - C8
          </p>
        </div>

        {/* Piano SVG con marco elegante */}
        <div className="relative">
          {/* Marco decorativo */}
          <div className="absolute -inset-4 bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl opacity-50"></div>
          <div className="absolute -inset-2 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl"></div>
          
          {/* Piano principal */}
          <div className="relative bg-slate-900 rounded-xl p-4 overflow-x-auto">
            <div style={{ minWidth: '1200px' }}>
              <svg
                width="100%"
                height="200"
                viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="rounded-lg"
                style={{ 
                  backgroundColor: '#0f172a',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                }}
              >
                {/* Teclas blancas (renderizar primero, por debajo) */}
                {whiteKeys.map((keyCoord) => (
                  <PianoKey
                    key={`white-${keyCoord.note}`}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}
                    isWhite={true}
                  />
                ))}
                
                {/* Teclas negras (renderizar después, por encima) */}
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
        </div>

        {/* Información del estado */}
        <div className="mt-6 space-y-4">
          {/* Estado de selección */}
          <div className="text-center">
            <div className="text-slate-300 text-sm">
              {selectedKeys.size > 0 
                ? `${selectedKeys.size} tecla${selectedKeys.size !== 1 ? 's' : ''} seleccionada${selectedKeys.size !== 1 ? 's' : ''}`
                : 'Ninguna tecla seleccionada'
              }
            </div>
            {selectedKeys.size > 0 && (
              <div className="text-slate-400 text-xs mt-1">
                {Array.from(selectedKeys).join(' • ')}
              </div>
            )}
          </div>

          {/* Información del patrón actual */}
          {currentPattern && selectedKeys.size > 0 && (
            <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    {currentPattern.tonic} {currentPattern.type}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      currentPattern.category === 'chord' 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {currentPattern.category === 'chord' ? 'Acorde' : 'Escala'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Octava {currentPattern.octave}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Teclas resaltadas</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {selectedKeys.size}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          {selectedKeys.size === 0 && (
            <div className="text-center py-6">
              <div className="text-slate-400 text-sm">
                Usa el selector de patrones para resaltar teclas en el piano
              </div>
              <div className="text-slate-500 text-xs mt-1">
                Las teclas seleccionadas se resaltarán en verde esmeralda
              </div>
            </div>
          )}
        </div>

        {/* Leyenda visual */}
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-white rounded-sm border border-slate-300"></div>
              <span>Teclas blancas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-slate-800 rounded-sm border border-slate-600"></div>
              <span>Teclas negras</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-2 bg-emerald-500 rounded-sm shadow-sm"></div>
              <span>Teclas seleccionadas</span>
            </div>
            {hoveredKey && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span>Hover: {hoveredKey}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PianoDisplay;