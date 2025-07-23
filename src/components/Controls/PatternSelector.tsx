import React from 'react';
import { REAL_CHORDS, REAL_SCALES } from '../../data/musicalData';

interface PatternSelectorProps {
  selectedTonic: string;
  selectedCategory: 'chord' | 'scale';
  selectedType: string;
  selectedOctave: number;
  onTonicChange: (tonic: string) => void;
  onCategoryChange: (category: 'chord' | 'scale') => void;
  onTypeChange: (type: string) => void;
  onOctaveChange: (octave: number) => void;
  onSelectPattern: () => void;
  onClearSelection: () => void;
  hasSelection: boolean;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({
  selectedTonic,
  selectedCategory,
  selectedType,
  selectedOctave,
  onTonicChange,
  onCategoryChange,
  onTypeChange,
  onOctaveChange,
  onSelectPattern,
  onClearSelection,
  hasSelection
}) => {
  
  // Datos disponibles
  const availableTonics = Object.keys(REAL_CHORDS);
  const availableOctaves = [1, 2, 3, 4, 5, 6, 7];
  
  const getAvailableTypes = (category: 'chord' | 'scale', tonic: string): string[] => {
    if (category === 'chord') {
      return Object.keys(REAL_CHORDS[tonic] || {});
    } else {
      return Object.keys(REAL_SCALES[tonic] || {});
    }
  };

  const availableTypes = getAvailableTypes(selectedCategory, selectedTonic);

  // Obtener patrón actual
  const getCurrentPattern = () => {
    if (selectedCategory === 'chord') {
      return REAL_CHORDS[selectedTonic]?.[selectedType] || [];
    } else {
      return REAL_SCALES[selectedTonic]?.[selectedType] || [];
    }
  };

  const currentPattern = getCurrentPattern();

  return (
    <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
      
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">
          🎛️ Selector Musical
        </h2>
      </div>

      {/* Controles principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Categoría */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-emerald-300">
            Categoría
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as 'chord' | 'scale')}
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
            onChange={(e) => onTonicChange(e.target.value)}
            className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
          >
            {availableTonics.map(tonic => (
              <option key={tonic} value={tonic}>{tonic}</option>
            ))}
          </select>
        </div>
        
        {/* Tipo */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-emerald-300">
            Tipo
          </label>
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
          >
            {availableTypes.map(type => (
              <option key={type} value={type}>{type}</option>
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
            onChange={(e) => onOctaveChange(Number(e.target.value))}
            className="w-full p-3 bg-slate-800/80 border border-slate-600/50 rounded-lg text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all"
          >
            {availableOctaves.map(octave => (
              <option key={octave} value={octave}>Octava {octave}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={onSelectPattern}
          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
        >
          🎯 Mostrar en Piano
        </button>
        
        {hasSelection && (
          <button
            onClick={onClearSelection}
            className="w-full sm:w-auto px-6 py-3 bg-red-600/80 hover:bg-red-600 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400/30"
          >
            🗑️ Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

export default PatternSelector;