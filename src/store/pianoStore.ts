import { create } from 'zustand';
import type { NoteName, PianoState } from '../types/piano';

interface PianoStore extends PianoState {
  // Actions
  pressKey: (note: NoteName, velocity?: number) => void;
  releaseKey: (note: NoteName) => void;
  toggleSustain: () => void;
  clearAllKeys: () => void;
  setDetectedChord: (chord: string | undefined) => void;
  setDetectedScale: (scale: string | undefined) => void;
}

export const usePianoStore = create<PianoStore>((set, get) => ({
  // State inicial
  pressedKeys: new Set(),
  sustainPedal: false,
  volume: 0.7,
  detectedNotes: [],
  
  // Actions implementadas
  pressKey: (note, velocity = 0.5) => {
    set((state) => ({
      pressedKeys: new Set(state.pressedKeys).add(note),
    }));
  },
  releaseKey: (note) => {
    set((state) => ({
    pressedKeys: new Set(state.pressedKeys).delete(note),
    }));    
  },
  toggleSustain: () => {
    set((state) => ({
      sustainPedal: !state.sustainPedal,
    }));
  },
  clearAllKeys: () => {
    set({ pressedKeys: new Set() });
  },
  setDetectedChord: (chord) => {
    set({ currentChord: chord });
  },
  setDetectedScale: (scale) => {
    set({ currentScale: scale });
  },
}));    