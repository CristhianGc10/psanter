import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import { useCallback, useState } from 'react';

import type { NoteName } from './types/piano';
import PianoRealistic from './components/Piano/PianoRealistic';

// ========================================================================================
// TIPOS Y DATOS MUSICALES
// ========================================================================================

const TONIC_OPTIONS = Object.keys(REAL_CHORDS); // Obtener tónicas disponibles de musicalData.ts

// ========================================================================================
// COMPONENTE PRINCIPAL
// ========================================================================================

function App() {
    // Estados
    const [selectedTonic, setSelectedTonic] = useState<string>('C');
    const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>(
        'chord'
    );
    const [selectedType, setSelectedType] = useState<string>('Major');
    const [selectedOctave, setSelectedOctave] = useState<number>(4);
    const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
    const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);

    // Obtener tipos disponibles según la categoría
    const availableTypes =
        selectedCategory === 'chord'
            ? Object.keys(REAL_CHORDS[selectedTonic] || {})
            : Object.keys(REAL_SCALES[selectedTonic] || {});

    // Validar que selectedType sea válido para la combinación actual
    const validSelectedType = availableTypes.includes(selectedType)
        ? selectedType
        : availableTypes[0] || 'Major';

    // Calcular notas del patrón seleccionado
    const calculatePatternNotes = useCallback(
        (
            tonic: string,
            type: string,
            category: 'chord' | 'scale',
            octave: number
        ): Set<NoteName> => {
            try {
                if (category === 'chord') {
                    const chordNotes = REAL_CHORDS[tonic]?.[type];
                    if (!chordNotes) return new Set();

                    // Convertir notas del acorde a la octava especificada
                    const notes = chordNotes.map((note) => {
                        // Si la nota ya tiene octava, conservarla; si no, agregar la octava especificada
                        return note.includes('0') ||
                            note.includes('1') ||
                            note.includes('2') ||
                            note.includes('3') ||
                            note.includes('4') ||
                            note.includes('5') ||
                            note.includes('6') ||
                            note.includes('7') ||
                            note.includes('8')
                            ? note
                            : `${note}${octave}`;
                    }) as NoteName[];

                    return new Set(notes);
                } else {
                    const scaleNotes = REAL_SCALES[tonic]?.[type];
                    if (!scaleNotes) return new Set();

                    // Convertir notas de la escala a la octava especificada
                    const notes = scaleNotes.map((note) => {
                        // Si la nota ya tiene octava, conservarla; si no, agregar la octava especificada
                        return note.includes('0') ||
                            note.includes('1') ||
                            note.includes('2') ||
                            note.includes('3') ||
                            note.includes('4') ||
                            note.includes('5') ||
                            note.includes('6') ||
                            note.includes('7') ||
                            note.includes('8')
                            ? note
                            : `${note}${octave}`;
                    }) as NoteName[];

                    return new Set(notes);
                }
            } catch (error) {
                console.error('Error calculating pattern notes:', error);
                return new Set();
            }
        },
        []
    );

    // Aplicar patrón
    const handleApplyPattern = useCallback(() => {
        const patternNotes = calculatePatternNotes(
            selectedTonic,
            validSelectedType,
            selectedCategory,
            selectedOctave
        );
        setSelectedKeys(patternNotes);
    }, [
        selectedTonic,
        validSelectedType,
        selectedCategory,
        selectedOctave,
        calculatePatternNotes,
    ]);

    // Limpiar selección
    const handleClearPattern = useCallback(() => {
        setSelectedKeys(new Set());
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className="container mx-auto px-4 py-8">
                {/* TÍTULO */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                        🎹 Piano Virtual
                    </h1>
                    <p className="text-slate-400">
                        Explora acordes y escalas musicales
                    </p>
                </div>

                {/* PIANO REALISTA */}
                <div className="mb-8">
                    <PianoRealistic
                        selectedKeys={selectedKeys}
                        hoveredKey={hoveredKey}
                        setHoveredKey={setHoveredKey}
                    />
                </div>

                {/* CONTROLES */}
                <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
                    {/* Desplegables */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Categoría */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-emerald-300">
                                Categoría
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    const newCategory = e.target.value as
                                        | 'chord'
                                        | 'scale';
                                    setSelectedCategory(newCategory);
                                    // Resetear el tipo a 'Major' que existe en ambas categorías
                                    setSelectedType('Major');
                                }}
                                className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
                            >
                                <option value="chord">🎵 Acordes</option>
                                <option value="scale">🎼 Escalas</option>
                            </select>
                        </div>

                        {/* Tónica */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-emerald-300">
                                Tónica
                            </label>
                            <select
                                value={selectedTonic}
                                onChange={(e) => {
                                    const newTonic = e.target.value;
                                    setSelectedTonic(newTonic);
                                    // Verificar si el tipo actual existe para la nueva tónica
                                    const newAvailableTypes =
                                        selectedCategory === 'chord'
                                            ? Object.keys(
                                                  REAL_CHORDS[newTonic] || {}
                                              )
                                            : Object.keys(
                                                  REAL_SCALES[newTonic] || {}
                                              );
                                    if (
                                        !newAvailableTypes.includes(
                                            selectedType
                                        )
                                    ) {
                                        setSelectedType('Major'); // Resetear a Major si el tipo actual no existe
                                    }
                                }}
                                className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
                            >
                                {TONIC_OPTIONS.map((note) => (
                                    <option key={note} value={note}>
                                        {note}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Tipo */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-emerald-300">
                                Tipo
                            </label>
                            <select
                                value={validSelectedType}
                                onChange={(e) =>
                                    setSelectedType(e.target.value)
                                }
                                className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
                            >
                                {availableTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Octava */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-emerald-300">
                                Octava
                            </label>
                            <select
                                value={selectedOctave}
                                onChange={(e) =>
                                    setSelectedOctave(Number(e.target.value))
                                }
                                className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
                            >
                                {[1, 2, 3, 4, 5, 6, 7].map((octave) => (
                                    <option key={octave} value={octave}>
                                        Octava {octave}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={handleApplyPattern}
                            className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
                        >
                            🎯 Mostrar en Piano
                        </button>

                        {selectedKeys.size > 0 && (
                            <button
                                onClick={handleClearPattern}
                                className="w-full sm:w-auto px-6 py-3 bg-red-600/80 hover:bg-red-600 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400/30"
                            >
                                🗑️ Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
