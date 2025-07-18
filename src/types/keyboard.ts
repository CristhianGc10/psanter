import type { NoteName } from "./piano";

export interface KeyboardMapping {
    physicalKey: string;
    pianNote: NoteName;
    row: number;
    position: number;
  }
  
  export interface KeyboardLayout {
    row1: string[]; // F1-F12, etc.
    row2: string[]; // 1-9, 0, -, =
    row3: string[]; // Q-P, [, ]
    row4: string[]; // A-L, ;, '
    row5: string[]; // Z-M, ,, ., /
    modifiers: string[]; // Space, Shift, Ctrl, etc.
  }