import React, { useState } from 'react';
import PatternSelector from './components/PatternSelector';
import PianoDisplay from './components/PianoDisplay';
import { REAL_CHORDS, REAL_SCALES } from './data/musicalData';
import { PIANO_NOTES } from './data/pianoCoordinates';
import type { NoteName } from './types/piano';

// Tipos para el estado del patrón
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

  // ✅ Función para convertir bemoles a sostenidos
  const convertFlatToSharp = (note: string): string => {
    const enharmonicMap: { [key: string]: string } = {
      'Db': 'C#',
      'Eb': 'D#', 
      'Gb': 'F#',
      'Ab': 'G#',
      'Bb': 'A#'
    };
    
    return enharmonicMap[note] || note;
  };

  // Convertir notas base a NoteName con octava específica
  const convertToNoteNames = (baseNotes: string[], octave: number): NoteName[] => {
    console.log('🎵 Convirtiendo notas:', { baseNotes, octave });
    
    const validNotes: NoteName[] = [];
    
    for (let i = 0; i < baseNotes.length; i++) {
      const originalNote = baseNotes[i];
      
      // ✅ Convertir bemoles a sostenidos
      const note = convertFlatToSharp(originalNote);
      console.log(`   ${originalNote} → ${note}`);
      
      let targetOctave = octave;
      
      // Para escalas largas, manejar cambio de octava inteligentemente
      if (baseNotes.length >= 7) {
        const tonic = convertFlatToSharp(baseNotes[0]);
        const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const tonicIndex = noteOrder.indexOf(tonic);
        const currentNoteIndex = noteOrder.indexOf(note);
        
        if (currentNoteIndex !== -1 && tonicIndex !== -1 && currentNoteIndex < tonicIndex && i > 3) {
          targetOctave = octave + 1;
        }
      }
      
      // Construir nota completa
      const fullNoteName = `${note}${targetOctave}` as NoteName;
      
      // Verificar si está en el piano
      if (PIANO_NOTES.includes(fullNoteName)) {
        validNotes.push(fullNoteName);
        console.log(`   ✅ ${fullNoteName} agregada`);
      } else {
        // Intentar octavas adyacentes
        const lowerOctave = `${note}${targetOctave - 1}` as NoteName;
        const higherOctave = `${note}${targetOctave + 1}` as NoteName;
        
        if (PIANO_NOTES.includes(lowerOctave)) {
          validNotes.push(lowerOctave);
          console.log(`   ✅ ${lowerOctave} (octava anterior)`);
        } else if (PIANO_NOTES.includes(higherOctave)) {
          validNotes.push(higherOctave);
          console.log(`   ✅ ${higherOctave} (octava siguiente)`);
        } else {
          console.warn(`   ❌ No se pudo ubicar ${originalNote} en el piano`);
        }
      }
    }
    
    console.log('✅ Resultado final:', validNotes);
    return validNotes;
  };

  // Obtener tipos disponibles
  const getAvailableTypes = (category: 'chord' | 'scale', tonic: string): string[] => {
    if (category === 'chord') {
      return Object.keys(REAL_CHORDS[tonic] || {});
    } else {
      return Object.keys(REAL_SCALES[tonic] || {});
    }
  };

  // Manejar selección de patrón
  const handleSelectPattern = () => {
    console.log('🎯 Seleccionando patrón:', { selectedTonic, selectedCategory, selectedType, selectedOctave });
    
    // Obtener notas base
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
      console.error('❌ No se encontró el patrón');
      alert(`No se encontró: ${selectedTonic} ${selectedType}`);
      return;
    }
    
    console.log('📊 Notas base encontradas:', baseNotes);
    
    // Convertir a notas del piano
    const noteNames = convertToNoteNames(baseNotes, selectedOctave);
    
    if (noteNames.length === 0) {
      console.error('❌ No se pudieron convertir las notas');
      alert('Las notas están fuera del rango del piano');
      return;
    }
    
    // Actualizar estado
    setSelectedKeys(new Set(noteNames));
    setCurrentPattern({
      tonic: selectedTonic,
      type: selectedType,
      category: selectedCategory,
      octave: selectedOctave
    });
    
    console.log('✅ Patrón aplicado exitosamente');
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Título Principal */}
        <div className="text-center">
          <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
            🎹 Psanter Explorer
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-2">
            Explora Acordes y Escalas Interactivamente
          </p>
          <div className="text-slate-400 text-sm">
            Biblioteca musical completa • Piano de 88 teclas • Interfaz moderna
          </div>
        </div>

        {/* Componente del Piano */}
        <PianoDisplay 
          selectedKeys={selectedKeys}
          currentPattern={currentPattern}
        />

        {/* Componente del Selector */}
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

        {/* Footer */}
        <div className="text-center py-8">
          <div className="text-slate-400 text-sm">
            <strong>Psanter Explorer v2.0</strong> • Arquitectura modular • Componentes separados
          </div>
          <div className="text-slate-500 text-xs mt-2">
            Desarrollado con React + TypeScript + Tailwind CSS
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;