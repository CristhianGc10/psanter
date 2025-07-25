// src/App.tsx
/**
 * PIANO VIRTUAL COMPLETO - 88 TECLAS ESTÁNDAR
 * ✅ Piano completo con 88 teclas (A0 a C8)
 * ✅ 52 teclas blancas + 36 teclas negras
 * ✅ Scroll horizontal para navegar
 * ✅ Desplegables para escalas, acordes, octavas
 * ✅ Botón para marcar selección en todo el piano
 */

import { useCallback, useMemo, useState } from 'react';

// ========================================================================================
// TIPOS Y INTERFACES
// ========================================================================================

type NoteName = string;

interface ChordData {
    name: string;
    intervals: number[];
    symbol: string;
    notes: string[];
}

interface ScaleData {
    name: string;
    intervals: number[];
    notes: string[];
}

interface PatternState {
    tonic: string;
    type: string;
    category: 'chord' | 'scale';
    octave: number;
}

interface KeyCoordinate {
    note: NoteName;
    coordinates: string;
    x: number;
    width: number;
    octave: number;
}

// ========================================================================================
// DATOS MUSICALES
// ========================================================================================

const REAL_CHORDS: ChordData[] = [
    {
        name: 'Major',
        intervals: [0, 4, 7],
        symbol: '',
        notes: ['C', 'E', 'G'],
    },
    {
        name: 'Minor',
        intervals: [0, 3, 7],
        symbol: 'm',
        notes: ['C', 'Eb', 'G'],
    },
    {
        name: 'Dominant 7th',
        intervals: [0, 4, 7, 10],
        symbol: '7',
        notes: ['C', 'E', 'G', 'Bb'],
    },
    {
        name: 'Major 7th',
        intervals: [0, 4, 7, 11],
        symbol: 'maj7',
        notes: ['C', 'E', 'G', 'B'],
    },
    {
        name: 'Minor 7th',
        intervals: [0, 3, 7, 10],
        symbol: 'm7',
        notes: ['C', 'Eb', 'G', 'Bb'],
    },
    {
        name: 'Diminished',
        intervals: [0, 3, 6],
        symbol: 'dim',
        notes: ['C', 'Eb', 'Gb'],
    },
    {
        name: 'Augmented',
        intervals: [0, 4, 8],
        symbol: 'aug',
        notes: ['C', 'E', 'G#'],
    },
    {
        name: 'Sus2',
        intervals: [0, 2, 7],
        symbol: 'sus2',
        notes: ['C', 'D', 'G'],
    },
    {
        name: 'Sus4',
        intervals: [0, 5, 7],
        symbol: 'sus4',
        notes: ['C', 'F', 'G'],
    },
];

const REAL_SCALES: ScaleData[] = [
    {
        name: 'Major',
        intervals: [0, 2, 4, 5, 7, 9, 11],
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    },
    {
        name: 'Natural Minor',
        intervals: [0, 2, 3, 5, 7, 8, 10],
        notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    },
    {
        name: 'Harmonic Minor',
        intervals: [0, 2, 3, 5, 7, 8, 11],
        notes: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
    },
    {
        name: 'Melodic Minor',
        intervals: [0, 2, 3, 5, 7, 9, 11],
        notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
    },
    {
        name: 'Pentatonic Major',
        intervals: [0, 2, 4, 7, 9],
        notes: ['C', 'D', 'E', 'G', 'A'],
    },
    {
        name: 'Pentatonic Minor',
        intervals: [0, 3, 5, 7, 10],
        notes: ['C', 'Eb', 'F', 'G', 'Bb'],
    },
    {
        name: 'Dorian',
        intervals: [0, 2, 3, 5, 7, 9, 10],
        notes: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
    },
    {
        name: 'Phrygian',
        intervals: [0, 1, 3, 5, 7, 8, 10],
        notes: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
    },
    {
        name: 'Lydian',
        intervals: [0, 2, 4, 6, 7, 9, 11],
        notes: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
    },
    {
        name: 'Mixolydian',
        intervals: [0, 2, 4, 5, 7, 9, 10],
        notes: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
    },
    {
        name: 'Locrian',
        intervals: [0, 1, 3, 5, 6, 8, 10],
        notes: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
    },
];

// ========================================================================================
// CONFIGURACIÓN DEL PIANO 88 TECLAS - OPTIMIZADO PARA PANTALLA
// ========================================================================================

const SVG_CONFIG = {
    width: 1300, // Optimizado para pantallas estándar (1920px)
    height: 200,
};

// Notas cromáticas
const CHROMATIC_NOTES = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
];

// Generar todas las 88 teclas del piano (A0 a C8)
const generatePianoKeys = (): {
    whiteKeys: KeyCoordinate[];
    blackKeys: KeyCoordinate[];
} => {
    const whiteKeys: KeyCoordinate[] = [];
    const blackKeys: KeyCoordinate[] = [];

    // Piano compacto: teclas más pequeñas para caber en pantalla
    const keyWidth = 25; // Reducido de 118 a 25px
    const blackKeyWidth = 15; // Reducido de 70 a 15px
    const blackKeyHeight = 120;
    const whiteKeyHeight = 180;

    let whiteKeyIndex = 0;

    // Empezar desde A0
    const startNote = 9; // A es índice 9 en CHROMATIC_NOTES
    const startOctave = 0;

    for (let i = 0; i < 88; i++) {
        const noteIndex = (startNote + i) % 12;
        const octave = startOctave + Math.floor((startNote + i) / 12);
        const noteName = CHROMATIC_NOTES[noteIndex];
        const fullNoteName = `${noteName}${octave}`;

        // Determinar si es tecla blanca o negra
        const isWhiteKey = !noteName.includes('#');

        if (isWhiteKey) {
            // Tecla blanca
            const x = whiteKeyIndex * keyWidth;
            whiteKeys.push({
                note: fullNoteName,
                coordinates: `M${x},0 L${x + keyWidth},0 L${
                    x + keyWidth
                },${whiteKeyHeight} L${x},${whiteKeyHeight} Z`,
                x: x,
                width: keyWidth,
                octave: octave,
            });
            whiteKeyIndex++;
        } else {
            // Tecla negra - posicionar entre teclas blancas
            const prevWhiteKeyX = (whiteKeyIndex - 1) * keyWidth;
            const x = prevWhiteKeyX + keyWidth - blackKeyWidth / 2;

            blackKeys.push({
                note: fullNoteName,
                coordinates: `M${x},0 L${x + blackKeyWidth},0 L${
                    x + blackKeyWidth
                },${blackKeyHeight} L${x},${blackKeyHeight} Z`,
                x: x,
                width: blackKeyWidth,
                octave: octave,
            });
        }
    }

    return { whiteKeys, blackKeys };
};

// ========================================================================================
// UTILIDADES MUSICALES
// ========================================================================================

const getNoteIndex = (note: string): number => {
    const noteName = note.replace(/\d+/, '');
    return CHROMATIC_NOTES.indexOf(noteName);
};

const transposeNote = (
    baseNote: string,
    semitones: number,
    octave: number
): NoteName => {
    const baseIndex = getNoteIndex(baseNote);
    let newIndex = baseIndex + semitones;
    let newOctave = octave;

    // Manejar cambios de octava
    while (newIndex >= 12) {
        newIndex -= 12;
        newOctave++;
    }
    while (newIndex < 0) {
        newIndex += 12;
        newOctave--;
    }

    const newNote = CHROMATIC_NOTES[newIndex];
    return `${newNote}${newOctave}`;
};

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

function App() {
    // ========== ESTADOS ==========
    const [currentPattern, setCurrentPattern] = useState<PatternState | null>(
        null
    );
    const [selectedTonic, setSelectedTonic] = useState<string>('C');
    const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>(
        'chord'
    );
    const [selectedType, setSelectedType] = useState<string>('Major');
    const [selectedOctave, setSelectedOctave] = useState<number>(4);
    const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
    const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);

    // ========== GENERAR TECLAS DEL PIANO ==========
    const { whiteKeys, blackKeys } = useMemo(() => generatePianoKeys(), []);

    // ========== FUNCIONES DE CÁLCULO ==========

    const calculatePatternNotes = useCallback(
        (pattern: PatternState): Set<NoteName> => {
            try {
                const { tonic, type, category, octave } = pattern;

                if (category === 'chord') {
                    const chordData = REAL_CHORDS.find((c) => c.name === type);
                    if (!chordData) {
                        console.warn(`Chord not found: ${type}`);
                        return new Set();
                    }

                    const notes: NoteName[] = chordData.intervals.map(
                        (interval) => transposeNote(tonic, interval, octave)
                    );

                    return new Set(notes);
                } else {
                    const scaleData = REAL_SCALES.find((s) => s.name === type);
                    if (!scaleData) {
                        console.warn(`Scale not found: ${type}`);
                        return new Set();
                    }

                    const notes: NoteName[] = scaleData.intervals.map(
                        (interval) => transposeNote(tonic, interval, octave)
                    );

                    return new Set(notes);
                }
            } catch (error) {
                console.error('Error calculating pattern notes:', error);
                return new Set();
            }
        },
        []
    );

    // ========== HANDLERS ==========

    const handleApplyPattern = useCallback(() => {
        const newPattern: PatternState = {
            tonic: selectedTonic,
            type: selectedType,
            category: selectedCategory,
            octave: selectedOctave,
        };

        setCurrentPattern(newPattern);
        const patternNotes = calculatePatternNotes(newPattern);
        setSelectedKeys(patternNotes);

        console.log(
            `Applied: ${newPattern.tonic} ${newPattern.type} (${newPattern.category}) in octave ${newPattern.octave}`
        );
        console.log('Notes:', Array.from(patternNotes));
    }, [
        selectedTonic,
        selectedType,
        selectedCategory,
        selectedOctave,
        calculatePatternNotes,
    ]);

    const handleClearPattern = useCallback(() => {
        setCurrentPattern(null);
        setSelectedKeys(new Set());
        console.log('Pattern cleared');
    }, []);

    const handleKeyClick = useCallback((note: NoteName) => {
        console.log(`Key clicked: ${note}`);
        // Aquí podrías agregar sonido cuando implementes audio
    }, []);

    // ========== COMPONENTE PIANO KEY ==========

    const PianoKey = ({
        note,
        coordinates,
        isWhite,
    }: {
        note: NoteName;
        coordinates: string;
        isWhite: boolean;
    }) => {
        const isSelected = selectedKeys.has(note);
        const isHovered = hoveredKey === note;

        const fillColor = isSelected
            ? isWhite
                ? '#10b981'
                : '#065f46' // emerald
            : isHovered
            ? isWhite
                ? '#f3f4f6'
                : '#374151' // gray
            : isWhite
            ? '#ffffff'
            : '#1f2937'; // default

        return (
            <path
                d={coordinates}
                fill={fillColor}
                stroke="#6b7280"
                strokeWidth="1"
                style={{
                    cursor: 'pointer',
                    transition: 'fill 0.2s ease',
                }}
                onClick={() => handleKeyClick(note)}
                onMouseEnter={() => setHoveredKey(note)}
                onMouseLeave={() => setHoveredKey(null)}
            />
        );
    };

    // ========== OPCIONES PARA DESPLEGABLES ==========

    const tonicOptions = CHROMATIC_NOTES;
    const octaveOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const currentTypeOptions =
        selectedCategory === 'chord'
            ? REAL_CHORDS.map((c) => c.name)
            : REAL_SCALES.map((s) => s.name);

    // ========== RENDER ==========

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            {/* Header */}
            <header className="p-6 border-b border-white/20">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-300 to-blue-300 bg-clip-text text-transparent">
                    Piano Virtual Completo - 88 Teclas
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                    Piano estándar completo desde A0 hasta C8
                </p>
            </header>

            {/* Main Content */}
            <main className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Panel de Controles */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <h3 className="text-lg font-semibold mb-4">
                                Controles
                            </h3>

                            {/* Selector de Categoría */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Categoría
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(
                                            e.target.value as 'chord' | 'scale'
                                        );
                                        setSelectedType('Major');
                                    }}
                                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                >
                                    <option value="chord">Acordes</option>
                                    <option value="scale">Escalas</option>
                                </select>
                            </div>

                            {/* Selector de Tónica */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    Tónica
                                </label>
                                <select
                                    value={selectedTonic}
                                    onChange={(e) =>
                                        setSelectedTonic(e.target.value)
                                    }
                                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                >
                                    {tonicOptions.map((note) => (
                                        <option key={note} value={note}>
                                            {note}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Tipo */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">
                                    {selectedCategory === 'chord'
                                        ? 'Acorde'
                                        : 'Escala'}
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) =>
                                        setSelectedType(e.target.value)
                                    }
                                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                >
                                    {currentTypeOptions.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector de Octava */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-2">
                                    Octava
                                </label>
                                <select
                                    value={selectedOctave}
                                    onChange={(e) =>
                                        setSelectedOctave(
                                            Number(e.target.value)
                                        )
                                    }
                                    className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                                >
                                    {octaveOptions.map((octave) => (
                                        <option key={octave} value={octave}>
                                            {octave}{' '}
                                            {octave === 4 ? '(central)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Botones de Acción */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleApplyPattern}
                                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    🎹 Marcar en Piano
                                </button>

                                <button
                                    onClick={handleClearPattern}
                                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    🧹 Limpiar
                                </button>
                            </div>

                            {/* Información del Patrón Actual */}
                            {currentPattern && (
                                <div className="mt-6 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                                    <h4 className="font-medium text-emerald-300 mb-2">
                                        Patrón Actual:
                                    </h4>
                                    <p className="text-sm text-emerald-200">
                                        {currentPattern.tonic}{' '}
                                        {currentPattern.type}
                                    </p>
                                    <p className="text-xs text-emerald-300 mt-1">
                                        {currentPattern.category === 'chord'
                                            ? 'Acorde'
                                            : 'Escala'}{' '}
                                        en octava {currentPattern.octave}
                                    </p>
                                    <p className="text-xs text-emerald-400 mt-2">
                                        {selectedKeys.size} notas marcadas
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Panel del Piano */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">
                                    Piano Completo - 88 Teclas
                                </h3>
                                <div className="text-sm text-gray-400">
                                    <span>
                                        52 blancas + 36 negras | A0 → C8
                                    </span>
                                </div>
                            </div>

                            {/* Piano SVG con scroll horizontal */}
                            <div className="relative bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                <div
                                    style={{
                                        minWidth: `${SVG_CONFIG.width}px`,
                                    }}
                                >
                                    <svg
                                        width={SVG_CONFIG.width}
                                        height={SVG_CONFIG.height}
                                        viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
                                        preserveAspectRatio="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="rounded-lg"
                                        style={{
                                            backgroundColor: '#0f172a',
                                            boxShadow:
                                                'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                                        }}
                                    >
                                        {/* Marcadores de octava */}
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(
                                            (octave) => {
                                                const xPos = octave * 7 * 118; // 7 teclas blancas por octava
                                                return (
                                                    <g key={`octave-${octave}`}>
                                                        <line
                                                            x1={xPos}
                                                            y1={185}
                                                            x2={xPos}
                                                            y2={195}
                                                            stroke="#666"
                                                            strokeWidth="1"
                                                        />
                                                        <text
                                                            x={xPos + 5}
                                                            y={195}
                                                            fill="#888"
                                                            fontSize="10"
                                                            fontFamily="monospace"
                                                        >
                                                            C{octave}
                                                        </text>
                                                    </g>
                                                );
                                            }
                                        )}

                                        {/* Teclas blancas primero */}
                                        {whiteKeys.map((keyData) => (
                                            <PianoKey
                                                key={`white-${keyData.note}`}
                                                note={keyData.note}
                                                coordinates={
                                                    keyData.coordinates
                                                }
                                                isWhite={true}
                                            />
                                        ))}

                                        {/* Teclas negras encima */}
                                        {blackKeys.map((keyData) => (
                                            <PianoKey
                                                key={`black-${keyData.note}`}
                                                note={keyData.note}
                                                coordinates={
                                                    keyData.coordinates
                                                }
                                                isWhite={false}
                                            />
                                        ))}
                                    </svg>
                                </div>

                                {/* Indicador de scroll */}
                                <div className="mt-2 text-center text-xs text-gray-500">
                                    ← Arrastra horizontalmente para ver todo el
                                    piano →
                                </div>
                            </div>

                            {/* Información de Teclas Activas */}
                            {selectedKeys.size > 0 && (
                                <div className="mt-4 p-3 bg-gray-800/50 border border-gray-600 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">
                                        Notas Marcadas ({selectedKeys.size}):
                                    </h4>
                                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                                        {Array.from(selectedKeys)
                                            .sort()
                                            .map((note) => (
                                                <span
                                                    key={note}
                                                    className="px-2 py-1 bg-emerald-600 text-white text-xs rounded"
                                                >
                                                    {note}
                                                </span>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Estadísticas del Piano */}
                            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-300">
                                            88
                                        </div>
                                        <div className="text-xs text-blue-400">
                                            Teclas Total
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-300">
                                            52
                                        </div>
                                        <div className="text-xs text-blue-400">
                                            Teclas Blancas
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-blue-300">
                                            36
                                        </div>
                                        <div className="text-xs text-blue-400">
                                            Teclas Negras
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 border-t border-white/20 text-center text-gray-400 text-sm">
                <p>
                    🎹 Piano Virtual Completo - 88 Teclas Estándar (A0 - C8) |
                    Selecciona acordes y escalas para visualizar
                </p>
            </footer>
        </div>
    );
}

export default App;
