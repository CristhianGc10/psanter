import React, { useState } from 'react';
import PatternSelector from './components/Controls/PatternSelector';
import PianoDisplay from './components/Piano/PianoDisplay'; 
import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import { PIANO_NOTES } from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

interface PatternState {
  tonic: string;
  type: string;
  category: 'chord' | 'scale';
  octave: number;
}

function App() {
  // Estados principales
  const [selectedKeys, setSelectedKeys] = useState<Set<NoteName>>(new Set());
  const [currentPattern, setCurrentPattern] = useState<PatternState | null>(null);
  
  // Estados para los controles
  const [selectedTonic, setSelectedTonic] = useState<string>('C');
  const [selectedCategory, setSelectedCategory] = useState<'chord' | 'scale'>('chord');
  const [selectedType, setSelectedType] = useState<string>('Major');
  const [selectedOctave, setSelectedOctave] = useState<number>(4);

  // Convertir bemoles a sostenidos para compatibilidad con el piano
  const convertFlatToSharp = (note: string): string => {
    const enharmonicMap: { [key: string]: string } = {
      'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
    };
    return enharmonicMap[note] || note;
  };

  // Convertir notas base a NoteName con octava específica
  const convertToNoteNames = (baseNotes: string[], octave: number): NoteName[] => {
    const validNotes: NoteName[] = [];
    
    for (let i = 0; i < baseNotes.length; i++) {
      const originalNote = baseNotes[i];
      const note = convertFlatToSharp(originalNote);
      
      let targetOctave = octave;
      
      // Para escalas largas, manejar cambio de octava
      if (baseNotes.length >= 7) {
        const tonic = convertFlatToSharp(baseNotes[0]);
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const tonicIndex = noteOrder.indexOf(tonic);
        const currentNoteIndex = noteOrder.indexOf(note);
        
        if (currentNoteIndex !== -1 && tonicIndex !== -1 && currentNoteIndex < tonicIndex && i > 3) {
          targetOctave = octave + 1;
        }
      }
      
      const fullNoteName = `${note}${targetOctave}` as NoteName;
      
      // Verificar si está en el piano o buscar octavas adyacentes
      if (PIANO_NOTES.includes(fullNoteName)) {
        validNotes.push(fullNoteName);
      } else {
        const lowerOctave = `${note}${targetOctave - 1}` as NoteName;
        const higherOctave = `${note}${targetOctave + 1}` as NoteName;
        
        if (PIANO_NOTES.includes(lowerOctave)) {
          validNotes.push(lowerOctave);
        } else if (PIANO_NOTES.includes(higherOctave)) {
          validNotes.push(higherOctave);
        }
      }
    }
    
    return validNotes;
  };

  // Obtener tipos disponibles según categoría y tónica
  const getAvailableTypes = (category: 'chord' | 'scale', tonic: string): string[] => {
    if (category === 'chord') {
      return Object.keys(REAL_CHORDS[tonic] || {});
    } else {
      return Object.keys(REAL_SCALES[tonic] || {});
    }
  };

  // Seleccionar patrón y actualizar piano
  const handleSelectPattern = () => {
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
    
    if (baseNotes.length === 0) return;
    
    const noteNames = convertToNoteNames(baseNotes, selectedOctave);
    
    if (noteNames.length > 0) {
      setSelectedKeys(new Set(noteNames));
      setCurrentPattern({
        tonic: selectedTonic,
        type: selectedType,
        category: selectedCategory,
        octave: selectedOctave
      });
    }
  };

  // Limpiar selección
  const handleClearSelection = () => {
    setSelectedKeys(new Set());
    setCurrentPattern(null);
  };

  // Manejar cambio de categoría
  const handleCategoryChange = (category: 'chord' | 'scale') => {
    setSelectedCategory(category);
    const types = getAvailableTypes(category, selectedTonic);
    if (types.length > 0) {
      setSelectedType(types[0]);
    }
  };

  // Manejar cambio de tónica
  const handleTonicChange = (tonic: string) => {
    setSelectedTonic(tonic);
    const types = getAvailableTypes(selectedCategory, tonic);
    if (types.length > 0) {
      setSelectedType(types[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        
        {/* Título Principal */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Psanter
          </h1>
        </div>

        {/* Layout Principal */}
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Piano Display */}
          <PianoDisplay 
            selectedKeys={selectedKeys}
            currentPattern={currentPattern}
          />

          {/* Pattern Selector */}
          <PatternSelector
            selectedTonic={selectedTonic}
            selectedCategory={selectedCategory}
            selectedType={selectedType}
            selectedOctave={selectedOctave}
            onTonicChange={handleTonicChange}
            onCategoryChange={handleCategoryChange}
            onTypeChange={setSelectedType}
            onOctaveChange={setSelectedOctave}
            onSelectPattern={handleSelectPattern}
            onClearSelection={handleClearSelection}
            hasSelection={selectedKeys.size > 0}
          />

        </div>

      </div>
    </div>
  );
}

export default App;