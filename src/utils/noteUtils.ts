import type { NoteName } from "../types/piano";

// Funciones para trabajar con notas musicales
export function getNoteFrequency(note: NoteName): number {
    // Calcular frecuencia basada en A4 = 440Hz
  }
  
  export function isBlackKey(note: NoteName): boolean {
    return note.includes('#');
  }
  
  export function getNoteOctave(note: NoteName): number {
    return parseInt(note.slice(-1));
  }
  
  export function getAllPianoNotes(): NoteName[] {
    // Retornar array con todas las 88 notas en orden
  }