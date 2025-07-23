// src/components/Piano/PianoWrapper.tsx
/**
 * PIANO WRAPPER - Extiende PianoDisplay con manejo de eventos
 * Compatible con la Fase 5 de hooks personalizados - VERSIÓN FINAL
 */

import React, { useState, useCallback } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from '../../data/pianoCoordinates';
import type { NoteName } from '../../types/piano';

interface PianoWrapperProps {
  selectedKeys: Set<NoteName>;
  currentPattern?: {
    tonic: string;
    type: string;
    category: 'chord' | 'scale';
    octave: number;
  } | null;
  onNotePress?: (note: NoteName, velocity?: number) => Promise<void>;
  onNoteRelease?: (note: NoteName) => void;
  sustainActive?: boolean;
}

const PianoWrapper: React.FC<PianoWrapperProps> = ({ 
  selectedKeys, 
  currentPattern,
  onNotePress,
  onNoteRelease,
  sustainActive 
}) => {
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<NoteName>>(new Set());

  // Obtener coordenadas de las teclas
  const whiteKeys = getWhiteKeyCoordinates();
  const blackKeys = getBlackKeyCoordinates();

  // Manejadores de eventos
  const handleMouseDown = useCallback(async (note: NoteName) => {
    if (pressedKeys.has(note)) return;
    
    setPressedKeys(prev => new Set(prev).add(note));
    
    if (onNotePress) {
      await onNotePress(note, 0.8);
    }
  }, [pressedKeys, onNotePress]);

  const handleMouseUp = useCallback((note: NoteName) => {
    if (!pressedKeys.has(note)) return;
    
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    
    if (onNoteRelease) {
      onNoteRelease(note);
    }
  }, [pressedKeys, onNoteRelease]);

  const handleMouseLeave = useCallback(() => {
    // Liberar todas las teclas cuando el mouse sale del piano
    if (pressedKeys.size > 0) {
      pressedKeys.forEach(note => {
        if (onNoteRelease) {
          onNoteRelease(note);
        }
      });
      setPressedKeys(new Set());
    }
    setHoveredKey(null);
  }, [pressedKeys, onNoteRelease]);

  // Componente para tecla individual con eventos
  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    const isHovered = hoveredKey === note;
    const isSelected = selectedKeys.has(note);
    const isPressed = pressedKeys.has(note);
    
    const getFillColor = () => {
      if (isPressed) {
        return isWhite ? '#059669' : '#047857'; // Verde más oscuro cuando presionado
      }
      if (isSelected) {
        return isWhite ? '#10b981' : '#059669'; // Verde esmeralda
      }
      if (isHovered) {
        return isWhite ? '#f8f9fa' : '#2a2a2a';
      }
      return isWhite ? '#ffffff' : '#1a1a1a';
    };

    const getStrokeColor = () => {
      if (isPressed) {
        return isWhite ? 'rgba(4, 120, 87, 0.8)' : 'rgba(4, 120, 87, 0.8)';
      }
      if (isSelected) {
        return isWhite ? 'rgba(16, 185, 129, 0.6)' : 'rgba(5, 150, 105, 0.6)';
      }
      return isWhite ? 'rgba(200, 200, 200, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    };

    const getFilter = () => {
      if (isPressed) {
        return 'drop-shadow(0 0 12px rgba(4, 120, 87, 1))';
      }
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
        onMouseDown={() => handleMouseDown(note)}
        onMouseUp={() => handleMouseUp(note)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.15s ease-out',
          filter: getFilter(),
          userSelect: 'none'
        }}
      />
    );
  };

  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
      
      {/* Información del patrón actual */}
      {currentPattern && (
        <div className="mb-4 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <h3 className="text-emerald-300 font-semibold">
            Patrón Actual: {currentPattern.tonic} {currentPattern.type}
          </h3>
          <p className="text-emerald-200 text-sm">
            {currentPattern.category === 'chord' ? 'Acorde' : 'Escala'} en octava {currentPattern.octave}
          </p>
        </div>
      )}

      {/* Indicador de sustain */}
      {sustainActive && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
          <p className="text-blue-300 text-sm font-medium">
            🎼 Sustain Activo - Las notas seguirán sonando al soltarlas
          </p>
        </div>
      )}
      
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
            onMouseLeave={handleMouseLeave}
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

      {/* Información de teclas activas */}
      {(selectedKeys.size > 0 || pressedKeys.size > 0) && (
        <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedKeys.size > 0 && (
              <div className="text-emerald-300">
                Activas: {Array.from(selectedKeys).join(', ')}
              </div>
            )}
            {pressedKeys.size > 0 && (
              <div className="text-blue-300">
                Presionadas: {Array.from(pressedKeys).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PianoWrapper;