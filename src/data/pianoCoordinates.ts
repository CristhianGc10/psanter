/**
 * Coordenadas SVG para todas las 88 teclas del piano
 * Piano con orden correcto: A0 (izquierda) → C8 (derecha)
 * CON TRANSFORMACIÓN Y CORREGIDA - Coordenadas adaptadas para SVG
 */

import type { NoteName } from '../types/piano';

// Configuración del SVG principal
export const SVG_CONFIG = {
  viewBox: '0 0 187.1 20',
  width: 187.1,
  height: 20,
  preserveAspectRatio: 'xMidYMid meet'
} as const;

// Dimensiones promedio de las teclas
export const KEY_DIMENSIONS = {
  WHITE_KEY: {
    averageWidth: 3.6,
    height: 20,
    gap: 0
  },
  BLACK_KEY: {
    averageWidth: 2.0,
    height: 14,
    gap: 0
  }
} as const;

// Colores de las teclas
export const KEY_COLORS = {
  WHITE: {
    default: '#ffffff',
    pressed: '#e0e0e0',
    sustained: '#f0f0f0'
  },
  BLACK: {
    default: '#1a1a1a',
    pressed: '#404040',
    sustained: '#2a2a2a'
  }
} as const;

// ORDEN LÓGICO CORRECTO de las 88 teclas del piano (A0 → C8)
export const PIANO_NOTES: NoteName[] = [
  // Subcontra octave (partial)
  'A0', 'A#0', 'B0',
  // Contra octave
  'C1', 'C#1', 'D1', 'D#1', 'E1', 'F1', 'F#1', 'G1', 'G#1', 'A1', 'A#1', 'B1',
  // Great octave
  'C2', 'C#2', 'D2', 'D#2', 'E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2',
  // Small octave
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  // One-line octave (contains middle C)
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  // Two-line octave
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
  // Three-line octave
  'C6', 'C#6', 'D6', 'D#6', 'E6', 'F6', 'F#6', 'G6', 'G#6', 'A6', 'A#6', 'B6',
  // Four-line octave
  'C7', 'C#7', 'D7', 'D#7', 'E7', 'F7', 'F#7', 'G7', 'G#7', 'A7', 'A#7', 'B7',
  // Five-line octave (partial)
  'C8'
];

// Coordenadas exactas del SVG original para las 88 teclas del piano
// ESTAS COORDENADAS NECESITAN TRANSFORMACIÓN Y PARA SVG
const ORIGINAL_COORDINATES: Record<NoteName, number[][]> = {
  'A0': [[3.0,20.0], [0.0,20.0], [0.0,0.0], [3.5,0.0], [3.5,6.0], [3.0,6.0]],
  'A#0': [[5.05,20.0], [3.05,20.0], [3.05,6.05], [5.05,6.05], [5.05,20.0]],
  'B0': [[7.1,0.0], [7.1,20.0], [5.1,20.0], [5.1,6.0], [3.6,6.0], [3.6,0.0], [7.1,0.0]],
  'C1': [[7.2,0.0], [7.2,20.0], [9.2,20.0], [9.2,6.0], [10.7,6.0], [10.7,0.0], [7.2,0.0]],
  'C#1': [[9.375,20.0], [11.375,20.0], [11.375,6.05], [9.375,6.05], [9.375,20.0]],
  'D1': [[13.55,6.0], [13.55,20.0], [11.55,20.0], [11.55,6.0], [10.8,6.0], [10.8,0.0], [14.3,0.0], [14.3,6.0]],
  'D#1': [[15.725,20.0], [13.725,20.0], [13.725,6.05], [15.725,6.05], [15.725,20.0]],
  'E1': [[17.9,0.0], [17.9,20.0], [15.9,20.0], [15.9,6.0], [14.4,6.0], [14.4,0.0], [17.9,0.0]],
  'F1': [[18.0,0.0], [18.0,20.0], [20.0,20.0], [20.0,6.0], [21.5,6.0], [21.5,0.0], [18.0,0.0]],
  'F#1': [[20.05,20.0], [22.05,20.0], [22.05,6.05], [20.05,6.05], [20.05,20.0]],
  'G1': [[21.6,0.0], [21.6,6.0], [22.1,6.0], [22.1,20.0], [24.1,20.0], [24.1,6.0], [25.1,6.0], [25.1,0.0], [21.6,0.0]],
  'G#1': [[24.15,20.0], [26.15,20.0], [26.15,6.05], [24.15,6.05], [24.15,20.0]],
  'A1': [[28.7,0.0], [28.7,6.0], [28.2,6.0], [28.2,20.0], [26.2,20.0], [26.2,6.0], [25.2,6.0], [25.2,0.0], [28.7,0.0]],
  'A#1': [[30.25,20.0], [28.25,20.0], [28.25,6.05], [30.25,6.05], [30.25,20.0]],
  'B1': [[32.3,0.0], [32.3,20.0], [30.3,20.0], [30.3,6.0], [28.8,6.0], [28.8,0.0], [32.3,0.0]],
  'C2': [[32.4,0.0], [32.4,20.0], [34.4,20.0], [34.4,6.0], [35.9,6.0], [35.9,0.0], [32.4,0.0]],
  'C#2': [[34.575,20.0], [36.575,20.0], [36.575,6.05], [34.575,6.05], [34.575,20.0]],
  'D2': [[38.75,6.0], [38.75,20.0], [36.75,20.0], [36.75,6.0], [36.0,6.0], [36.0,0.0], [39.5,0.0], [39.5,6.0]],
  'D#2': [[40.925,20.0], [38.925,20.0], [38.925,6.05], [40.925,6.05], [40.925,20.0]],
  'E2': [[43.1,0.0], [43.1,20.0], [41.1,20.0], [41.1,6.0], [39.6,6.0], [39.6,0.0], [43.1,0.0]],
  'F2': [[43.2,0.0], [43.2,20.0], [45.2,20.0], [45.2,6.0], [46.7,6.0], [46.7,0.0], [43.2,0.0]],
  'F#2': [[45.25,20.0], [47.25,20.0], [47.25,6.05], [45.25,6.05], [45.25,20.0]],
  'G2': [[46.8,0.0], [46.8,6.0], [47.3,6.0], [47.3,20.0], [49.3,20.0], [49.3,6.0], [50.3,6.0], [50.3,0.0], [46.8,0.0]],
  'G#2': [[49.35,20.0], [51.35,20.0], [51.35,6.05], [49.35,6.05], [49.35,20.0]],
  'A2': [[53.9,0.0], [53.9,6.0], [53.4,6.0], [53.4,20.0], [51.4,20.0], [51.4,6.0], [50.4,6.0], [50.4,0.0], [53.9,0.0]],
  'A#2': [[55.45,20.0], [53.45,20.0], [53.45,6.05], [55.45,6.05], [55.45,20.0]],
  'B2': [[57.5,0.0], [57.5,20.0], [55.5,20.0], [55.5,6.0], [54.0,6.0], [54.0,0.0], [57.5,0.0]],
  'C3': [[57.6,0.0], [57.6,20.0], [59.6,20.0], [59.6,6.0], [61.1,6.0], [61.1,0.0], [57.6,0.0]],
  'C#3': [[59.775,20.0], [61.775,20.0], [61.775,6.05], [59.775,6.05], [59.775,20.0]],
  'D3': [[63.95,6.0], [63.95,20.0], [61.95,20.0], [61.95,6.0], [61.2,6.0], [61.2,0.0], [64.7,0.0], [64.7,6.0]],
  'D#3': [[66.125,20.0], [64.125,20.0], [64.125,6.05], [66.125,6.05], [66.125,20.0]],
  'E3': [[68.3,0.0], [68.3,20.0], [66.3,20.0], [66.3,6.0], [64.8,6.0], [64.8,0.0], [68.3,0.0]],
  'F3': [[68.4,0.0], [68.4,20.0], [70.4,20.0], [70.4,6.0], [71.9,6.0], [71.9,0.0], [68.4,0.0]],
  'F#3': [[70.45,20.0], [72.45,20.0], [72.45,6.05], [70.45,6.05], [70.45,20.0]],
  'G3': [[72.0,0.0], [72.0,6.0], [72.5,6.0], [72.5,20.0], [74.5,20.0], [74.5,6.0], [75.5,6.0], [75.5,0.0], [72.0,0.0]],
  'G#3': [[74.55,20.0], [76.55,20.0], [76.55,6.05], [74.55,6.05], [74.55,20.0]],
  'A3': [[79.1,0.0], [79.1,6.0], [78.6,6.0], [78.6,20.0], [76.6,20.0], [76.6,6.0], [75.6,6.0], [75.6,0.0], [79.1,0.0]],
  'A#3': [[80.65,20.0], [78.65,20.0], [78.65,6.05], [80.65,6.05], [80.65,20.0]],
  'B3': [[82.7,0.0], [82.7,20.0], [80.7,20.0], [80.7,6.0], [79.2,6.0], [79.2,0.0], [82.7,0.0]],
  'C4': [[82.8,0.0], [82.8,20.0], [84.8,20.0], [84.8,6.0], [86.3,6.0], [86.3,0.0], [82.8,0.0]],
  'C#4': [[84.975,20.0], [86.975,20.0], [86.975,6.05], [84.975,6.05], [84.975,20.0]],
  'D4': [[89.15,6.0], [89.15,20.0], [87.15,20.0], [87.15,6.0], [86.4,6.0], [86.4,0.0], [89.9,0.0], [89.9,6.0]],
  'D#4': [[91.325,20.0], [89.325,20.0], [89.325,6.05], [91.325,6.05], [91.325,20.0]],
  'E4': [[93.5,0.0], [93.5,20.0], [91.5,20.0], [91.5,6.0], [90.0,6.0], [90.0,0.0], [93.5,0.0]],
  'F4': [[93.6,0.0], [93.6,20.0], [95.6,20.0], [95.6,6.0], [97.1,6.0], [97.1,0.0], [93.6,0.0]],
  'F#4': [[95.65,20.0], [97.65,20.0], [97.65,6.05], [95.65,6.05], [95.65,20.0]],
  'G4': [[97.2,0.0], [97.2,6.0], [97.7,6.0], [97.7,20.0], [99.7,20.0], [99.7,6.0], [100.7,6.0], [100.7,0.0], [97.2,0.0]],
  'G#4': [[99.75,20.0], [101.75,20.0], [101.75,6.05], [99.75,6.05], [99.75,20.0]],
  'A4': [[104.3,0.0], [104.3,6.0], [103.8,6.0], [103.8,20.0], [101.8,20.0], [101.8,6.0], [100.8,6.0], [100.8,0.0], [104.3,0.0]],
  'A#4': [[105.85,20.0], [103.85,20.0], [103.85,6.05], [105.85,6.05], [105.85,20.0]],
  'B4': [[107.9,0.0], [107.9,20.0], [105.9,20.0], [105.9,6.0], [104.4,6.0], [104.4,0.0], [107.9,0.0]],
  'C5': [[108.0,0.0], [108.0,20.0], [110.0,20.0], [110.0,6.0], [111.5,6.0], [111.5,0.0], [108.0,0.0]],
  'C#5': [[110.175,20.0], [112.175,20.0], [112.175,6.05], [110.175,6.05], [110.175,20.0]],
  'D5': [[114.35,6.0], [114.35,20.0], [112.35,20.0], [112.35,6.0], [111.6,6.0], [111.6,0.0], [115.1,0.0], [115.1,6.0]],
  'D#5': [[116.525,20.0], [114.525,20.0], [114.525,6.05], [116.525,6.05], [116.525,20.0]],
  'E5': [[118.7,0.0], [118.7,20.0], [116.7,20.0], [116.7,6.0], [115.2,6.0], [115.2,0.0], [118.7,0.0]],
  'F5': [[118.8,0.0], [118.8,20.0], [120.8,20.0], [120.8,6.0], [122.3,6.0], [122.3,0.0], [118.8,0.0]],
  'F#5': [[120.85,20.0], [122.85,20.0], [122.85,6.05], [120.85,6.05], [120.85,20.0]],
  'G5': [[122.4,0.0], [122.4,6.0], [122.9,6.0], [122.9,20.0], [124.9,20.0], [124.9,6.0], [125.9,6.0], [125.9,0.0], [122.4,0.0]],
  'G#5': [[124.95,20.0], [126.95,20.0], [126.95,6.05], [124.95,6.05], [124.95,20.0]],
  'A5': [[129.5,0.0], [129.5,6.0], [129.0,6.0], [129.0,20.0], [127.0,20.0], [127.0,6.0], [126.0,6.0], [126.0,0.0], [129.5,0.0]],
  'A#5': [[131.05,20.0], [129.05,20.0], [129.05,6.05], [131.05,6.05], [131.05,20.0]],
  'B5': [[133.1,0.0], [133.1,20.0], [131.1,20.0], [131.1,6.0], [129.6,6.0], [129.6,0.0], [133.1,0.0]],
  'C6': [[133.2,0.0], [133.2,20.0], [135.2,20.0], [135.2,6.0], [136.7,6.0], [136.7,0.0], [133.2,0.0]],
  'C#6': [[135.375,20.0], [137.375,20.0], [137.375,6.05], [135.375,6.05], [135.375,20.0]],
  'D6': [[139.55,6.0], [139.55,20.0], [137.55,20.0], [137.55,6.0], [136.8,6.0], [136.8,0.0], [140.3,0.0], [140.3,6.0]],
  'D#6': [[141.725,20.0], [139.725,20.0], [139.725,6.05], [141.725,6.05], [141.725,20.0]],
  'E6': [[143.9,0.0], [143.9,20.0], [141.9,20.0], [141.9,6.0], [140.4,6.0], [140.4,0.0], [143.9,0.0]],
  'F6': [[144.0,0.0], [144.0,20.0], [146.0,20.0], [146.0,6.0], [147.5,6.0], [147.5,0.0], [144.0,0.0]],
  'F#6': [[146.05,20.0], [148.05,20.0], [148.05,6.05], [146.05,6.05], [146.05,20.0]],
  'G6': [[147.6,0.0], [147.6,6.0], [148.1,6.0], [148.1,20.0], [150.1,20.0], [150.1,6.0], [151.1,6.0], [151.1,0.0], [147.6,0.0]],
  'G#6': [[150.15,20.0], [152.15,20.0], [152.15,6.05], [150.15,6.05], [150.15,20.0]],
  'A6': [[154.7,0.0], [154.7,6.0], [154.2,6.0], [154.2,20.0], [152.2,20.0], [152.2,6.0], [151.2,6.0], [151.2,0.0], [154.7,0.0]],
  'A#6': [[156.25,20.0], [154.25,20.0], [154.25,6.05], [156.25,6.05], [156.25,20.0]],
  'B6': [[158.3,0.0], [158.3,20.0], [156.3,20.0], [156.3,6.0], [154.8,6.0], [154.8,0.0], [158.3,0.0]],
  'C7': [[158.4,0.0], [158.4,20.0], [160.4,20.0], [160.4,6.0], [161.9,6.0], [161.9,0.0], [158.4,0.0]],
  'C#7': [[160.575,20.0], [162.575,20.0], [162.575,6.05], [160.575,6.05], [160.575,20.0]],
  'D7': [[164.75,6.0], [164.75,20.0], [162.75,20.0], [162.75,6.0], [162.0,6.0], [162.0,0.0], [165.5,0.0], [165.5,6.0]],
  'D#7': [[166.925,20.0], [164.925,20.0], [164.925,6.05], [166.925,6.05], [166.925,20.0]],
  'E7': [[169.1,0.0], [169.1,20.0], [167.1,20.0], [167.1,6.0], [165.6,6.0], [165.6,0.0], [169.1,0.0]],
  'F7': [[169.2,0.0], [169.2,20.0], [171.2,20.0], [171.2,6.0], [172.7,6.0], [172.7,0.0], [169.2,0.0]],
  'F#7': [[171.25,20.0], [173.25,20.0], [173.25,6.05], [171.25,6.05], [171.25,20.0]],
  'G7': [[172.8,0.0], [172.8,6.0], [173.3,6.0], [173.3,20.0], [175.3,20.0], [175.3,6.0], [176.3,6.0], [176.3,0.0], [172.8,0.0]],
  'G#7': [[175.35,20.0], [177.35,20.0], [177.35,6.05], [175.35,6.05], [175.35,20.0]],
  'A7': [[179.9,0.0], [179.9,6.0], [179.4,6.0], [179.4,20.0], [177.4,20.0], [177.4,6.0], [176.4,6.0], [176.4,0.0], [179.9,0.0]],
  'A#7': [[181.45,20.0], [179.45,20.0], [179.45,6.05], [181.45,6.05], [181.45,20.0]],
  'B7': [[183.5,0.0], [183.5,20.0], [181.5,20.0], [181.5,6.0], [180.0,6.0], [180.0,0.0], [183.5,0.0]],
  'C8': [[183.6,0.0], [183.6,20.0], [187.1,20.0], [187.1,0.0], [183.6,0.0]]
};

// FUNCIÓN CRÍTICA: Transformar coordenadas Y para SVG
// En las coordenadas originales: Y=0 está abajo, Y=20 está arriba
// En SVG: Y=0 está arriba, Y=20 está abajo
// Necesitamos invertir: nueva_Y = 20 - Y_original
const transformYCoordinate = (y: number): number => {
  return SVG_CONFIG.height - y;
};

// Función para determinar si una nota es tecla blanca o negra
export const isWhiteKey = (note: NoteName): boolean => {
  const noteName = note.replace(/\d+/, '');
  return ['C', 'D', 'E', 'F', 'G', 'A', 'B'].includes(noteName);
};

export const isBlackKey = (note: NoteName): boolean => {
  return !isWhiteKey(note);
};

// Función para convertir array de coordenadas a string de polígono SVG CON TRANSFORMACIÓN Y
const coordinatesToPolygonString = (coordinates: number[][]): string => {
  return coordinates.map(([x, y]) => {
    const transformedY = transformYCoordinate(y);
    return `${x.toFixed(2)},${transformedY.toFixed(2)}`;
  }).join(' ');
};

// Interface para coordenadas de tecla
export interface KeyCoordinate {
  note: NoteName;
  index: number;
  coordinates: string;
  isWhite: boolean;
  isBlack: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Función para generar todas las coordenadas de las teclas CON TRANSFORMACIÓN Y CORRECTA
const generateAllKeyCoordinates = (): KeyCoordinate[] => {
  return PIANO_NOTES.map((note, index) => {
    const isWhite = isWhiteKey(note);
    
    // Obtener coordenadas originales para esta nota
    const originalCoords = ORIGINAL_COORDINATES[note];
    if (!originalCoords) {
      throw new Error(`No se encontraron coordenadas originales para la nota: ${note}`);
    }
    
    // APLICAR TRANSFORMACIÓN Y a las coordenadas para SVG
    const coordinates = coordinatesToPolygonString(originalCoords);
    
    // Extraer bounding box de las coordenadas TRANSFORMADAS
    const transformedCoords = originalCoords.map(([x, y]) => [x, transformYCoordinate(y)]);
    const xCoords = transformedCoords.map(([x, _]) => x);
    const yCoords = transformedCoords.map(([_, y]) => y);
    
    const x = Math.min(...xCoords);
    const y = Math.min(...yCoords);
    const width = Math.max(...xCoords) - x;
    const height = Math.max(...yCoords) - y;
    
    return {
      note,
      index,
      coordinates,
      isWhite,
      isBlack: !isWhite,
      x,
      y,
      width,
      height
    };
  });
};

// Array completo de coordenadas para las 88 teclas 
// ORDEN LÓGICO: A0 (índice 0, izquierda) → C8 (índice 87, derecha)
// COORDENADAS CON TRANSFORMACIÓN Y CORRECTA PARA SVG
export const PIANO_KEY_COORDINATES: KeyCoordinate[] = generateAllKeyCoordinates();

// Verificación de que tenemos exactamente 88 notas en orden correcto
if (PIANO_NOTES.length !== 88) {
  throw new Error(`Piano debe tener exactamente 88 notas, pero tiene ${PIANO_NOTES.length}`);
}

// Verificar que el orden es correcto
if (PIANO_NOTES[0] !== 'A0') {
  throw new Error(`Primera nota debe ser A0, pero es ${PIANO_NOTES[0]}`);
}

if (PIANO_NOTES[87] !== 'C8') {
  throw new Error(`Última nota debe ser C8, pero es ${PIANO_NOTES[87]}`);
}

// Función para obtener coordenadas por nota
export const getCoordinatesByNote = (note: NoteName): KeyCoordinate | undefined => {
  return PIANO_KEY_COORDINATES.find(coord => coord.note === note);
};

// Función para obtener coordenadas por índice
export const getCoordinatesByIndex = (index: number): KeyCoordinate | undefined => {
  return PIANO_KEY_COORDINATES[index];
};

// Función para obtener todas las teclas blancas
export const getWhiteKeyCoordinates = (): KeyCoordinate[] => {
  return PIANO_KEY_COORDINATES.filter(coord => coord.isWhite);
};

// Función para obtener todas las teclas negras
export const getBlackKeyCoordinates = (): KeyCoordinate[] => {
  return PIANO_KEY_COORDINATES.filter(coord => coord.isBlack);
};

// Función para verificar si un punto está dentro de una tecla
export const isPointInKey = (x: number, y: number, keyCoord: KeyCoordinate): boolean => {
  return x >= keyCoord.x && 
         x <= keyCoord.x + keyCoord.width && 
         y >= keyCoord.y && 
         y <= keyCoord.y + keyCoord.height;
};

// Función para encontrar qué tecla está en una posición específica
export const getKeyAtPosition = (x: number, y: number): KeyCoordinate | undefined => {
  // Primero verificar teclas negras (están encima en z-index)
  const blackKey = getBlackKeyCoordinates().find(coord => isPointInKey(x, y, coord));
  if (blackKey) return blackKey;
  
  // Si no hay tecla negra, verificar teclas blancas
  return getWhiteKeyCoordinates().find(coord => isPointInKey(x, y, coord));
};

// Estadísticas del piano
export const PIANO_STATS = {
  TOTAL_KEYS: PIANO_NOTES.length,
  WHITE_KEYS: getWhiteKeyCoordinates().length,
  BLACK_KEYS: getBlackKeyCoordinates().length,
  OCTAVES: 7.25,
  SVG_WIDTH: SVG_CONFIG.width,
  SVG_HEIGHT: SVG_CONFIG.height,
  LOWEST_NOTE: PIANO_NOTES[0], // A0
  HIGHEST_NOTE: PIANO_NOTES[PIANO_NOTES.length - 1], // C8
  MIDDLE_C_INDEX: PIANO_NOTES.indexOf('C4' as NoteName), // índice de C4
  A4_INDEX: PIANO_NOTES.indexOf('A4' as NoteName), // índice de A4 (440Hz)
  TRANSFORMATION: 'Piano Real - Con transformación Y correcta para SVG'
} as const;

// Validaciones y logging para debugging
console.log('🎹 Piano Real - Con Transformación Y Correcta:');
console.log('- Total keys:', PIANO_STATS.TOTAL_KEYS);
console.log('- Orden verificado:', PIANO_STATS.LOWEST_NOTE, '→', PIANO_STATS.HIGHEST_NOTE);
console.log('- A0 en índice 0 (izquierda x≈0):', PIANO_NOTES[0]);
console.log('- C8 en índice 87 (derecha x≈187):', PIANO_NOTES[87]);
console.log('- C4 (middle C) en índice:', PIANO_STATS.MIDDLE_C_INDEX);
console.log('- A4 (440Hz) en índice:', PIANO_STATS.A4_INDEX);
console.log('- White keys:', PIANO_STATS.WHITE_KEYS);
console.log('- Black keys:', PIANO_STATS.BLACK_KEYS);
console.log('- Suma verificación:', PIANO_STATS.WHITE_KEYS + PIANO_STATS.BLACK_KEYS === 88 ? '✅ Perfecto' : '❌ Error');
console.log('- ✅ Transformación Y aplicada correctamente para SVG');

// Verificar coordenadas de A0 y C8 para confirmar orden
const a0Coords = getCoordinatesByNote('A0');
const c8Coords = getCoordinatesByNote('C8');
if (a0Coords && c8Coords) {
  console.log('- A0 posición X:', a0Coords.x, '(debe estar cerca de 0)');
  console.log('- C8 posición X:', c8Coords.x, '(debe estar cerca de 187)');
  console.log('- Orden visual verificado:', a0Coords.x < c8Coords.x ? '✅ Correcto' : '❌ Error');
}