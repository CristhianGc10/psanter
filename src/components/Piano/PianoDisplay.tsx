import React, { useState } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from '../../data/pianoCoordinates';
import type { NoteName } from '../../types/piano';

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
        return isWhite ? '#10b981' : '#059669'; // Verde esmeralda
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
      return isWhite ? 'rgba(200, 200, 200, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    };

    const getFilter = () => {
      if (isSelected) {
        return 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))';
      }
      if (isHovered) {
        return 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))';
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
          filter: getFilter()
        }}
      />
    );
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
      
      {/* Piano SVG */}
      <div className="relative bg-slate-900 rounded-xl p-4 overflow-x-auto">
        <div style={{ minWidth: '1000px' }}>
          <svg
            width="100%"
            height="180"
            viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            className="rounded-lg"
            style={{ 
              backgroundColor: '#0f172a',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
            }}
          >
            {/* Teclas blancas (renderizar primero) */}
            {whiteKeys.map((keyCoord) => (
              <PianoKey
                key={`white-${keyCoord.note}`}
                note={keyCoord.note}
                coordinates={keyCoord.coordinates}
                isWhite={true}
              />
            ))}
            
            {/* Teclas negras (renderizar después) */}
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
  );
};

export default PianoDisplay;