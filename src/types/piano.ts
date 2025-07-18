/**
 * Tipos TypeScript básicos para el piano virtual
 * Definiciones necesarias para la Fase 2
 */

// Tipo para nombres de notas (las 88 teclas del piano)
export type NoteName = 
  // Octava 0 (parcial)
  | 'A0' | 'A#0' | 'B0'
  // Octava 1
  | 'C1' | 'C#1' | 'D1' | 'D#1' | 'E1' | 'F1' | 'F#1' | 'G1' | 'G#1' | 'A1' | 'A#1' | 'B1'
  // Octava 2
  | 'C2' | 'C#2' | 'D2' | 'D#2' | 'E2' | 'F2' | 'F#2' | 'G2' | 'G#2' | 'A2' | 'A#2' | 'B2'
  // Octava 3
  | 'C3' | 'C#3' | 'D3' | 'D#3' | 'E3' | 'F3' | 'F#3' | 'G3' | 'G#3' | 'A3' | 'A#3' | 'B3'
  // Octava 4
  | 'C4' | 'C#4' | 'D4' | 'D#4' | 'E4' | 'F4' | 'F#4' | 'G4' | 'G#4' | 'A4' | 'A#4' | 'B4'
  // Octava 5
  | 'C5' | 'C#5' | 'D5' | 'D#5' | 'E5' | 'F5' | 'F#5' | 'G5' | 'G#5' | 'A5' | 'A#5' | 'B5'
  // Octava 6
  | 'C6' | 'C#6' | 'D6' | 'D#6' | 'E6' | 'F6' | 'F#6' | 'G6' | 'G#6' | 'A6' | 'A#6' | 'B6'
  // Octava 7
  | 'C7' | 'C#7' | 'D7' | 'D#7' | 'E7' | 'F7' | 'F#7' | 'G7' | 'G#7' | 'A7' | 'A#7' | 'B7'
  // Octava 8 (parcial)
  | 'C8';

// Interface para teclas del piano
export interface PianoKey {
  note: NoteName;
  frequency: number;
  isWhite: boolean;
  isBlack: boolean;
  octave: number;
  semitone: number; // 0-11 dentro de la octava
}

// Interface para teclas presionadas
export interface PressedKey {
  note: NoteName;
  timestamp: number;
  velocity: number;  // 0-1 (intensidad de la presión)
  source: 'mouse' | 'keyboard' | 'midi';
}

// Estado global del piano (para futuras fases)
export interface PianoState {
  pressedKeys: Map<NoteName, PressedKey>;
  sustainActive: boolean;
  volume: number; // 0-1
  currentOctave: number;
  detectedChords: string[];
  detectedScales: string[];
}

// Configuración de detección de acordes/escalas
export interface DetectionSettings {
  chordDetection: boolean;
  scaleDetection: boolean;
  sensitivity: number; // 0-1
  minNotesForChord: number;
  minNotesForScale: number;
}

// Tipos para eventos del piano
export type PianoEventType = 'noteOn' | 'noteOff' | 'sustainOn' | 'sustainOff' | 'volumeChange';

export interface PianoEvent {
  type: PianoEventType;
  note?: NoteName;
  timestamp: number;
  data?: any;
}

// Validación de tipos
export const isValidNoteName = (note: string): note is NoteName => {
  const validNotes: NoteName[] = [
    'A0', 'A#0', 'B0',
    'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
    'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
    'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
    'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
    'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
    'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
    'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7',
    'C8'
  ];
  
  return validNotes.includes(note as NoteName);
};