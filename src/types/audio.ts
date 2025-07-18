export interface AudioSettings {
    volume: number;
    sustain: boolean;
    attack: number;
    decay: number;
    release: number;
  }
  
  export interface SynthSettings {
    oscillator: {
      type: 'sine' | 'square' | 'sawtooth' | 'triangle';
    };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  }