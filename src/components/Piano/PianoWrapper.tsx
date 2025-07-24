// src/components/Piano/PianoWrapper.tsx
/**
 * PIANO WRAPPER - VERSIÓN CORREGIDA PARA ERRORES UNDEFINED
 * ✅ Soluciona error "Cannot read properties of undefined (reading 'size')"
 * ✅ Verificaciones de seguridad para todas las props
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
  selectedKeys = new Set(), // ✅ Default value para evitar undefined
  currentPattern = null,
  onNotePress,
  onNoteRelease,
  sustainActive = false
}) => {
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<NoteName>>(new Set());

  // ✅ Verificación de seguridad para coordenadas
  const whiteKeys = getWhiteKeyCoordinates() || [];
  const blackKeys = getBlackKeyCoordinates() || [];

  // ========================================================================================
  // EVENT HANDLERS - CON VERIFICACIONES DE SEGURIDAD
  // ========================================================================================

  const handleMouseDown = useCallback(async (note: NoteName) => {
    if (!note || pressedKeys.has(note)) return;
    
    setPressedKeys(prev => new Set(prev).add(note));
    
    if (onNotePress) {
      try {
        await onNotePress(note, 0.8);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    }
  }, [pressedKeys, onNotePress]);

  const handleMouseUp = useCallback((note: NoteName) => {
    if (!note || !pressedKeys.has(note)) return;
    
    setPressedKeys(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });
    
    if (onNoteRelease) {
      try {
        onNoteRelease(note);
      } catch (error) {
        console.error('Error releasing note:', error);
      }
    }
  }, [pressedKeys, onNoteRelease]);

  const handleMouseLeave = useCallback(() => {
    // ✅ Verificación de seguridad antes de usar .size
    if (pressedKeys && pressedKeys.size > 0) {
      pressedKeys.forEach(note => {
        if (onNoteRelease && note) {
          try {
            onNoteRelease(note);
          } catch (error) {
            console.error('Error releasing note on mouse leave:', error);
          }
        }
      });
      setPressedKeys(new Set());
    }
    setHoveredKey(null);
  }, [pressedKeys, onNoteRelease]);

  // ========================================================================================
  // PIANO KEY COMPONENT - CON VERIFICACIONES
  // ========================================================================================

  const PianoKey: React.FC<{ 
    note: NoteName; 
    coordinates: string; 
    isWhite: boolean; 
  }> = ({ note, coordinates, isWhite }) => {
    if (!note || !coordinates) return null; // ✅ Verificación de seguridad

    const isHovered = hoveredKey === note;
    // ✅ Verificación de seguridad para selectedKeys
    const isSelected = selectedKeys && selectedKeys.has ? selectedKeys.has(note) : false;
    const isPressed = pressedKeys && pressedKeys.has ? pressedKeys.has(note) : false;
    
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
        return isWhite ? 'rgba(5, 150, 105, 0.8)' : 'rgba(4, 120, 87, 0.8)';
      }
      if (isSelected) {
        return isWhite ? 'rgba(16, 185, 129, 0.6)' : 'rgba(5, 150, 105, 0.6)';
      }
      return isWhite ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    };

    const getStrokeWidth = () => {
      if (isPressed) return '2';
      if (isSelected) return '1.5';
      return isWhite ? '1' : '0.5';
    };

    return (
      <path
        d={coordinates}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={getStrokeWidth()}
        style={{
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          filter: isPressed ? 'brightness(0.9)' : 'none'
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          handleMouseDown(note);
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          handleMouseUp(note);
        }}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
      />
    );
  };

  // ========================================================================================
  // RENDER COMPONENT
  // ========================================================================================

  return (
    <div className="w-full">
      {/* Pattern Info */}
      {currentPattern && (
        <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-700 rounded-lg">
          <p className="text-emerald-300 font-medium">
            🎵 {currentPattern.tonic} {currentPattern.type} - {currentPattern.category === 'chord' ? 'Acorde' : 'Escala'} en octava {currentPattern.octave}
          </p>
        </div>
      )}

      {/* Sustain Indicator */}
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
            {whiteKeys.length > 0 && whiteKeys.map((keyCoord) => (
              keyCoord && keyCoord.note ? (
                <PianoKey
                  key={`white-${keyCoord.note}`}
                  note={keyCoord.note}
                  coordinates={keyCoord.coordinates}
                  isWhite={true}
                />
              ) : null
            ))}
            
            {/* Teclas negras (renderizar después) */}
            {blackKeys.length > 0 && blackKeys.map((keyCoord) => (
              keyCoord && keyCoord.note ? (
                <PianoKey
                  key={`black-${keyCoord.note}`}
                  note={keyCoord.note}
                  coordinates={keyCoord.coordinates}
                  isWhite={false}
                />
              ) : null
            ))}
          </svg>
        </div>
      </div>

      {/* Información de teclas activas - CON VERIFICACIONES */}
      {((selectedKeys && selectedKeys.size > 0) || (pressedKeys && pressedKeys.size > 0)) && (
        <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedKeys && selectedKeys.size > 0 && (
              <div className="text-emerald-300">
                Activas: {Array.from(selectedKeys).join(', ')}
              </div>
            )}
            {pressedKeys && pressedKeys.size > 0 && (
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