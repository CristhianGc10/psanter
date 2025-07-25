import {
    SVG_CONFIG,
    getBlackKeyCoordinates,
    getWhiteKeyCoordinates,
} from '../../data/pianoCoordinates';

import type { NoteName } from '../../types/piano';
import React from 'react';

// ========================================================================================
// TIPOS
// ========================================================================================

interface PianoRealisticProps {
    selectedKeys: Set<NoteName>;
    hoveredKey: NoteName | null;
    setHoveredKey: (key: NoteName | null) => void;
}

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

const PianoRealistic: React.FC<PianoRealisticProps> = ({
    selectedKeys,
    hoveredKey,
    setHoveredKey,
}) => {
    // Obtener coordenadas de las teclas desde el archivo existente
    const whiteKeys = getWhiteKeyCoordinates();
    const blackKeys = getBlackKeyCoordinates();

    // Escalar las coordenadas para el tamaño deseado (aprovechar toda la pantalla)
    const SCALE_FACTOR = 10; // Aumentado para aprovechar más pantalla
    const PIANO_WIDTH = SVG_CONFIG.width * SCALE_FACTOR; // ~1870px
    const PIANO_HEIGHT = SVG_CONFIG.height * SCALE_FACTOR * 1.3; // ~260px con espacio extra

    // Componente para cada tecla individual
    const PianoKey: React.FC<{
        note: NoteName;
        coordinates: string;
        isWhite: boolean;
    }> = ({ note, coordinates, isWhite }) => {
        const isSelected = selectedKeys.has(note);
        const isHovered = hoveredKey === note;

        // Escalar coordenadas manteniendo las proporciones exactas
        const scaledCoords = coordinates
            .split(' ')
            .map((coord) => {
                const [x, y] = coord.split(',').map(Number);
                return `${x * SCALE_FACTOR},${y * SCALE_FACTOR}`;
            })
            .join(' ');

        // Colores según estado y tipo de tecla
        const getFillColor = (): string => {
            if (isSelected) {
                return isWhite ? '#10b981' : '#059669'; // Verde esmeralda
            }
            if (isHovered) {
                return isWhite ? '#f8f9fa' : '#374151'; // Gris hover
            }
            return isWhite ? '#ffffff' : '#1a1a1a'; // Colores normales
        };

        const getStrokeColor = (): string => {
            if (isSelected) {
                return isWhite ? '#0d9488' : '#047857';
            }
            return isWhite ? '#d1d5db' : '#000000';
        };

        return (
            <polygon
                points={scaledCoords}
                fill={getFillColor()}
                stroke={getStrokeColor()}
                strokeWidth={isWhite ? 1 : 0}
                style={{
                    cursor: 'pointer',
                    filter: isSelected
                        ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                        : 'none',
                    transition: 'all 0.15s ease',
                }}
                onMouseEnter={() => setHoveredKey(note)}
                onMouseLeave={() => setHoveredKey(null)}
            />
        );
    };

    return (
        <div className="relative w-full">
            {/* Contenedor con scroll horizontal */}
            <div className="overflow-x-auto pb-4">
                {/* Marco de madera moderno - MÁS PROMINENTE */}
                <div
                    className="relative mx-auto bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 rounded-3xl shadow-2xl border-8 border-amber-400"
                    style={{
                        width: PIANO_WIDTH + 120, // Más padding del marco
                        minWidth: PIANO_WIDTH + 120,
                    }}
                >
                    {/* Efecto de vetas de madera MÁS VISIBLE */}
                    <div
                        className="absolute inset-0 opacity-30 rounded-3xl"
                        style={{
                            background: `repeating-linear-gradient(
                                 90deg,
                                 transparent,
                                 transparent 3px,
                                 rgba(139, 69, 19, 0.15) 4px,
                                 rgba(139, 69, 19, 0.15) 8px
                             )`,
                        }}
                    />

                    {/* Marco exterior decorativo */}
                    <div className="absolute inset-2 rounded-2xl border-4 border-amber-500/40" />

                    {/* Sombra interior del marco */}
                    <div className="absolute inset-8 rounded-xl shadow-inner bg-gradient-to-b from-slate-50 to-slate-200" />

                    {/* Piano SVG */}
                    <div className="relative p-12">
                        <svg
                            width={PIANO_WIDTH}
                            height={PIANO_HEIGHT}
                            viewBox={`0 0 ${PIANO_WIDTH} ${PIANO_HEIGHT}`}
                            className="mx-auto bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl shadow-xl border-2 border-gray-400"
                        >
                            {/* Teclas blancas primero (capa inferior) */}
                            {whiteKeys.map((keyCoord) => (
                                <PianoKey
                                    key={`white-${keyCoord.note}`}
                                    note={keyCoord.note}
                                    coordinates={keyCoord.coordinates}
                                    isWhite={true}
                                />
                            ))}

                            {/* Teclas negras encima (capa superior) */}
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

                    {/* Detalles decorativos del marco MÁS PROMINENTES */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-amber-500 rounded-full opacity-80" />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-2 bg-amber-500 rounded-full opacity-80" />

                    {/* Esquinas decorativas MÁS GRANDES */}
                    <div className="absolute top-6 left-6 w-4 h-4 bg-amber-500 rounded-full opacity-60" />
                    <div className="absolute top-6 right-6 w-4 h-4 bg-amber-500 rounded-full opacity-60" />
                    <div className="absolute bottom-6 left-6 w-4 h-4 bg-amber-500 rounded-full opacity-60" />
                    <div className="absolute bottom-6 right-6 w-4 h-4 bg-amber-500 rounded-full opacity-60" />

                    {/* Detalles laterales del marco */}
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-amber-500 rounded-full opacity-50" />
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-amber-500 rounded-full opacity-50" />
                </div>
            </div>

            {/* Indicador de scroll (solo en pantallas pequeñas) */}
            <div className="flex justify-center mt-4 lg:hidden">
                <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
                    ← Desliza horizontalmente para ver todo el piano →
                </div>
            </div>
        </div>
    );
};

export default PianoRealistic;
