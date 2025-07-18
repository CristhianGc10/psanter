import type { NoteName } from "../types/piano";

// Función que asigna cada tecla física a una nota del piano
export function createKeyboardToPianoMapping(): Map<string, NoteName> {
    const mapping = new Map<string, NoteName>();
    
    // Obtener todas las notas del piano en orden cromático
    const allNotes = getAllPianoNotes(); // A0 hasta C8
    
    // Obtener todas las teclas físicas en orden de filas
    const allPhysicalKeys = getFlattenedKeyboardKeys();
    
    // Mapear 1:1 hasta donde alcancen las teclas físicas
    allPhysicalKeys.forEach((physicalKey, index) => {
      if (index < allNotes.length) {
        mapping.set(physicalKey, allNotes[index]);
      }
    });
    
    return mapping;
  }