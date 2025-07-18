// Definir todos los tipos relacionados al piano
export type NoteName = string; // Ej: 'C4', 'F#3'
export type KeyType = 'white' | 'black';

export interface PianoKey {
  note: NoteName;
  frequency: number;
  keyType: KeyType;
  coordinates: number[][];
  octave: number;
  keyboardKey?: string; // Tecla física asignada
}

export interface PressedKey {
  note: NoteName;
  velocity: number;
  timestamp: number;
}

export interface PianoState {
  pressedKeys: Set<NoteName>;
  sustainPedal: boolean;
  volume: number;
  currentChord?: string;
  currentScale?: string;
  detectedNotes: NoteName[];
}