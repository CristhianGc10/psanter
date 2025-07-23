import React from 'react';
import { REAL_CHORDS, REAL_SCALES } from '../data/musicalData';

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
  // Obtener datos disponibles
  const availableTonics = Object.keys(REAL_CHORDS);
  
  const getAvailableTypes = (category: 'chord' | 'scale', tonic: string): string[] => {
    if (category === 'chord') {
      return Object.keys(REAL_CHORDS[tonic] || {});
    } else {
      return Object.keys(REAL_SCALES[tonic] || {});
    }
  };

  const availableTypes = getAvailableTypes(selectedCategory, selectedTonic);
  const availableOctaves = [1, 2, 3, 4, 5, 6, 7];

  // Obtener datos actuales para mostrar
  const getCurrentPattern = () => {
    if (selectedCategory === 'chord') {
      return REAL_CHORDS[selectedTonic]?.[selectedType] || [];
    } else {
      return REAL_SCALES[selectedTonic]?.[selectedType] || [];
    }
  };

  const currentPattern = getCurrentPattern();

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Panel Principal */}
      <div className="bg-black/60 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
        
        {/* Header del Panel */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            🎛️ Selector Musical
          </h2>
          <p className="text-slate-300 text-sm">
            Explora {Object.keys(REAL_CHORDS).length * Object.keys(REAL_CHORDS.C).length} acordes y {Object.keys(REAL_SCALES).length * Object.keys(REAL_SCALES.C).length} escalas
          </p>
        </div>

        {/* Grid de Controles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Selector de Categoría */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-300 uppercase tracking-wide">
              Categoría
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value as 'chord' | 'scale')}
                className="w-full p-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
              >
                <option value="chord">🎵 Acordes</option>
                <option value="scale">🎼 Escalas</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Selector de Tónica */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-300 uppercase tracking-wide">
              Tónica
            </label>
            <div className="relative">
              <select
                value={selectedTonic}
                onChange={(e) => onTonicChange(e.target.value)}
                className="w-full p-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
              >
                {availableTonics.map(tonic => (
                  <option key={tonic} value={tonic}>{tonic}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Selector de Tipo */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-300 uppercase tracking-wide">
              Tipo
            </label>
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
                className="w-full p-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
              >
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Selector de Octava */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-emerald-300 uppercase tracking-wide">
              Octava
            </label>
            <div className="relative">
              <select
                value={selectedOctave}
                onChange={(e) => onOctaveChange(Number(e.target.value))}
                className="w-full p-4 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
              >
                {availableOctaves.map(octave => (
                  <option key={octave} value={octave}>Octava {octave}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Patrón Actual */}
        <div className="bg-slate-800/40 rounded-2xl p-6 mb-8 border border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">
                {selectedTonic} {selectedType}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedCategory === 'chord' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {selectedCategory === 'chord' ? '🎵 Acorde' : '🎼 Escala'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-600/50 text-slate-300 border border-slate-600/50">
                  {currentPattern.length} notas
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Notas base:</div>
              <div className="text-lg font-mono text-white">
                {currentPattern.join(' • ') || 'No encontrado'}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onSelectPattern}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
          >
            <span className="flex items-center justify-center gap-2">
              🎯 Seleccionar en Piano
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
          
          {hasSelection && (
            <button
              onClick={onClearSelection}
              className="w-full sm:w-auto px-6 py-4 bg-red-600/80 hover:bg-red-600 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400/30"
            >
              <span className="flex items-center justify-center gap-2">
                🗑️ Limpiar
              </span>
            </button>
          )}
        </div>

        {/* Footer con Estadísticas */}
        <div className="mt-8 pt-6 border-t border-slate-700/50">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>{availableTonics.length} tónicas disponibles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
              <span>{availableTypes.length} tipos en {selectedTonic}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Rango A0-C8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatternSelector;