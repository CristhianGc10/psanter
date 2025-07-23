import React, { useState } from 'react';
import { 
  getWhiteKeyCoordinates,
  getBlackKeyCoordinates,
  SVG_CONFIG
} from './data/pianoCoordinates';
import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import type { NoteName } from './types/piano';

// Tipos para el sistema de exploración
interface PatternSelection {
  tonic: string;
  type: string;
  category: 'chord' | 'scale';
  octave: number;
}

function App() {
  // Estados principales
  const [hoveredKey, setHoveredKey] = useState<NoteName | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  
  // Estados para los desplegables
  const [selectedTonic, setSelectedTonic] = useState<string>('C');
  const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>('chord');
  const [selectedType, setSelectedType] = useState<string>('Major');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  
  // Estado para mostrar información
  const [currentPattern, setCurrentPattern] = useState<PatternSelection | null>(null);

  // Obtener coordenadas de las teclas
  const whiteKeys = getWhiteKeyCoordinates();
  const blackKeys = getBlackKeyCoordinates();

  // Obtener todas las tónicas disponibles
  const availableTonics = Object.keys(REAL_CHORDS).sort();

  // Obtener tipos disponibles según la categoría seleccionada
  const getAvailableTypes = (category: 'chord' | 'scale', tonic: string): string[] => {
    if (category === 'chord') {
      return Object.keys(REAL_CHORDS[tonic] || {}).sort();
    } else {
      return Object.keys(REAL_SCALES[tonic] || {}).sort();
    }
  };

  const availableTypes = getAvailableTypes(selectedCategory, selectedTonic);

  // Obtener octavas válidas (considerando el rango del piano A0-C8)
  const availableOctaves = [1, 2, 3, 4, 5, 6, 7];

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
        return isWhite ? '#10b981' : '#059669'; // Verde para seleccionadas
      }
      if (isHovered) {
        return isWhite ? '#f8f9fa' : '#2a2a2a';
      }
      return isWhite ? '#ffffff' : '#1a1a1a';
    };

    const getStrokeColor = () => {
      if (isSelected) {
        return isWhite ? 'rgba(16, 185, 129, 0.4)' : 'rgba(5, 150, 105, 0.4)';
      }
      return isWhite ? 'rgba(200, 200, 200, 0.3)' : 'rgba(100, 100, 100, 0.3)';
    };

    return (
      <polygon
        points={coordinates}
        fill={getFillColor()}
        stroke={getStrokeColor()}
        strokeWidth={0.1}
        onMouseEnter={() => setHoveredKey(note)}
        onMouseLeave={() => setHoveredKey(null)}
        onClick={() => toggleKey(note)}
        style={{ 
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          filter: isSelected 
            ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.8))' 
            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
        }}
      />
    );
  };

  // Alternar selección manual de tecla
  const toggleKey = (note: NoteName) => {
    setSelectedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(note)) {
        newSet.delete(note);
      } else {
        newSet.add(note);
      }
      return newSet;
    });
  };

  // Limpiar selección
  const clearSelection = () => {
    setSelectedKeys(new Set());
    setCurrentPattern(null);
  };

  // Validar si una nota está en el rango del piano
  const isNoteInPianoRange = (note: string, octave: number): boolean => {
    const noteName = `${note}${octave}` as NoteName;
    
    // Validaciones básicas del rango A0-C8
    if (octave < 0 || octave > 8) return false;
    
    // A0, A#0, B0 son las notas más bajas
    if (octave === 0 && !['A', 'A#', 'B'].includes(note)) return false;
    
    // Solo C8 está disponible en la octava 8
    if (octave === 8 && note !== 'C') return false;
    
    return true;
  };

  // Convertir notas base a NoteName con octava
  const convertToNoteNames = (baseNotes: string[], octave: number): NoteName[] => {
    const validNotes: NoteName[] = [];
    let currentOctave = octave;
    
    for (let i = 0; i < baseNotes.length; i++) {
      const note = baseNotes[i];
      
      // Para escalas largas, podríamos necesitar la siguiente octava
      if (i > 0 && baseNotes.length > 5) {
        const prevNote = baseNotes[i - 1];
        // Si la nota actual viene antes alfabéticamente que la anterior,
        // probablemente necesitamos la siguiente octava
        if (note < prevNote && i > baseNotes.length / 2) {
          currentOctave = octave + 1;
        }
      }
      
      if (isNoteInPianoRange(note, currentOctave)) {
        validNotes.push(`${note}${currentOctave}` as NoteName);
      }
    }
    
    return validNotes;
  };

  // Seleccionar patrón automáticamente
  const selectPattern = () => {
    // Obtener las notas base del patrón seleccionado
    let baseNotes: string[] = [];
    
    if (selectedCategory === 'chord') {
      const chordData = REAL_CHORDS[selectedTonic];
      if (chordData && chordData[selectedType]) {
        baseNotes = chordData[selectedType];
      }
    } else {
      const scaleData = REAL_SCALES[selectedTonic];
      if (scaleData && scaleData[selectedType]) {
        baseNotes = scaleData[selectedType];
      }
    }
    
    if (baseNotes.length === 0) {
      alert(`No se encontró el patrón: ${selectedTonic} ${selectedType}`);
      return;
    }
    
    // Convertir a NoteName con octavas
    const noteNames = convertToNoteNames(baseNotes, selectedOctave);
    
    if (noteNames.length === 0) {
      alert(`Las notas están fuera del rango del piano en la octava ${selectedOctave}`);
      return;
    }
    
    // Actualizar teclas seleccionadas
    setSelectedKeys(new Set(noteNames));
    
    // Guardar información del patrón actual
    setCurrentPattern({
      tonic: selectedTonic,
      type: selectedType,
      category: selectedCategory,
      octave: selectedOctave
    });
  };

  // Actualizar tipo cuando cambia la categoría
  const handleCategoryChange = (category: 'chord' | 'scale') => {
    setSelectedCategory(category);
    const types = getAvailableTypes(category, selectedTonic);
    if (types.length > 0) {
      setSelectedType(types[0]);
    }
  };

  // Actualizar tipo cuando cambia la tónica
  const handleTonicChange = (tonic: string) => {
    setSelectedTonic(tonic);
    const types = getAvailableTypes(selectedCategory, tonic);
    if (types.length > 0) {
      setSelectedType(types[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 text-white">
      <div className="container mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            🎹 Psanter Explorer
          </h1>
          <p className="text-slate-300 text-lg">
            Explora Acordes y Escalas Interactivamente
          </p>
          <div className="text-slate-400 text-sm mt-2">
            v5.0 • Sistema de exploración • Biblioteca musical completa
          </div>
        </div>

        {/* Panel de Control */}
        <div className="bg-black/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-white/10 mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-emerald-400">
            🎛️ Selector de Patrones Musicales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Selector de Categoría */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Categoría
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value as 'chord' | 'scale')}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-400 focus:outline-none transition-colors"
              >
                <option value="chord">🎵 Acordes</option>
                <option value="scale">🎼 Escalas</option>
              </select>
            </div>
            
            {/* Selector de Tónica */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Tónica
              </label>
              <select
                value={selectedTonic}
                onChange={(e) => handleTonicChange(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-400 focus:outline-none transition-colors"
              >
                {availableTonics.map(tonic => (
                  <option key={tonic} value={tonic}>{tonic}</option>
                ))}
              </select>
            </div>
            
            {/* Selector de Tipo */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Tipo
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-400 focus:outline-none transition-colors"
              >
                {availableTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            {/* Selector de Octava */}
            <div>
              <label className="block text-sm font-medium text-emerald-300 mb-2">
                Octava Base
              </label>
              <select
                value={selectedOctave}
                onChange={(e) => setSelectedOctave(Number(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-emerald-400 focus:outline-none transition-colors"
              >
                {availableOctaves.map(octave => (
                  <option key={octave} value={octave}>Octava {octave}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Botón de Selección */}
          <div className="text-center">
            <button
              onClick={selectPattern}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              🎯 Seleccionar en Piano
            </button>
            {selectedKeys.size > 0 && (
              <button
                onClick={clearSelection}
                className="ml-4 px-6 py-3 bg-red-600/80 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Piano */}
        <div className="bg-black/50 rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-white/10 mb-8">
          <div className="w-full overflow-x-auto pb-4">
            <div style={{ minWidth: '1200px' }}>
              <svg
                width="100%"
                height="180"
                viewBox={`0 0 ${SVG_CONFIG.width} ${SVG_CONFIG.height}`}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
                className="border-0 rounded-lg"
                style={{ backgroundColor: '#0f172a' }}
              >
                {/* Teclas blancas */}
                {whiteKeys.map((keyCoord) => (
                  <PianoKey
                    key={`white-${keyCoord.note}`}
                    note={keyCoord.note}
                    coordinates={keyCoord.coordinates}
                    isWhite={true}
                  />
                ))}
                
                {/* Teclas negras */}
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
          
          {/* Información del estado */}
          <div className="text-center mt-4">
            <div className="text-slate-300 text-sm">
              {selectedKeys.size > 0 
                ? `${selectedKeys.size} teclas seleccionadas: ${Array.from(selectedKeys).join(', ')}`
                : 'Usa el selector arriba o haz clic manualmente en las teclas'
              }
            </div>
          </div>
        </div>

        {/* Información del Patrón Actual */}
        {currentPattern && (
          <div className="bg-black/40 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <h2 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              🎵 Patrón Seleccionado
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Información del Patrón */}
              <div className="bg-emerald-900/20 rounded-xl p-5 border border-emerald-400/30">
                <h3 className="text-xl font-semibold text-emerald-300 mb-4">
                  📊 Información
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Categoría:</span>
                    <span className="text-emerald-300 font-medium">
                      {currentPattern.category === 'chord' ? '🎵 Acorde' : '🎼 Escala'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nombre:</span>
                    <span className="text-emerald-300 font-medium">
                      {currentPattern.tonic} {currentPattern.type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Octava Base:</span>
                    <span className="text-emerald-300 font-medium">
                      {currentPattern.octave}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Teclas:</span>
                    <span className="text-emerald-300 font-medium">
                      {selectedKeys.size} notas
                    </span>
                  </div>
                </div>
              </div>

              {/* Notas del Patrón */}
              <div className="bg-cyan-900/20 rounded-xl p-5 border border-cyan-400/30">
                <h3 className="text-xl font-semibold text-cyan-300 mb-4">
                  🎹 Notas
                </h3>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-100 mb-2">
                    {Array.from(selectedKeys).join(' • ')}
                  </div>
                  <div className="text-cyan-300/70 text-sm">
                    Notas en el piano seleccionadas automáticamente
                  </div>
                </div>
              </div>
            </div>

            {/* Datos de la Base de Datos */}
            <div className="mt-6 bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
              <h4 className="text-lg font-semibold text-slate-300 mb-3 text-center">
                📚 Datos de la Base Musical
              </h4>
              <div className="text-center">
                {(() => {
                  const data = currentPattern.category === 'chord' 
                    ? REAL_CHORDS[currentPattern.tonic]?.[currentPattern.type]
                    : REAL_SCALES[currentPattern.tonic]?.[currentPattern.type];
                  
                  return (
                    <div className="text-slate-300">
                      <span className="text-slate-400">Notas base:</span> {data?.join(' - ') || 'No encontrado'}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas del Sistema */}
        <div className="mt-8 bg-slate-800/50 rounded-xl p-4 border border-slate-600/30">
          <div className="text-center">
            <div className="text-sm text-slate-300 mb-2">
              <strong>Psanter Explorer v5.0</strong> - Sistema de Exploración Musical
            </div>
            <div className="flex justify-center items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                {Object.keys(REAL_CHORDS).length × Object.keys(REAL_CHORDS.C).length} Acordes
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                {Object.keys(REAL_SCALES).length × Object.keys(REAL_SCALES.C).length} Escalas
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Rango A0-C8
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;