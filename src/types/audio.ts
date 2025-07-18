// Tipos para configuración y manejo de audio

import type { NoteName } from './piano';

// Configuración general de audio
export interface AudioSettings {
  masterVolume: number; // 0-1
  sampleRate: number; // Hz (ej: 44100)
  bufferSize: number; // Tamaño del buffer de audio
  latency: number; // Latencia en ms
  initialized: boolean; // Si el contexto de audio está activo
}

// Parámetros ADSR para síntesis
export interface ADSRSettings {
  attack: number; // Tiempo de ataque en segundos
  decay: number; // Tiempo de decay en segundos
  sustain: number; // Nivel de sustain (0-1)
  release: number; // Tiempo de release en segundos
}

// Configuración del sintetizador
export interface SynthSettings {
  oscillator: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle';
    harmonicity: number; // Relación armónica
    modulationType: 'sine' | 'square' | 'sawtooth' | 'triangle';
    modulationIndex: number;
  };
  envelope: ADSRSettings;
  filter: {
    type: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
    frequency: number; // Frecuencia de corte en Hz
    Q: number; // Factor Q del filtro
    gain: number; // Ganancia en dB
  };
  effects: {
    reverb: {
      enabled: boolean;
      roomSize: number; // 0-1
      dampening: number; // 0-1
      wet: number; // Mezcla wet/dry (0-1)
    };
    delay: {
      enabled: boolean;
      delayTime: number; // Tiempo en segundos
      feedback: number; // 0-1
      wet: number; // Mezcla wet/dry (0-1)
    };
    chorus: {
      enabled: boolean;
      frequency: number; // Frecuencia de modulación
      depth: number; // Profundidad de modulación
      wet: number; // Mezcla wet/dry (0-1)
    };
  };
}

// Presets de sonido predefinidos
export type SynthPreset = 
  | 'classic_piano' 
  | 'bright_piano' 
  | 'mellow_piano'
  | 'electric_piano'
  | 'organ'
  | 'strings'
  | 'pad'
  | 'lead'
  | 'custom';

export interface SynthPresetConfig {
  name: string;
  description: string;
  settings: SynthSettings;
}

// Configuración del metrónomo
export interface MetronomeSettings {
  enabled: boolean;
  bpm: number; // Beats por minuto (30-300)
  volume: number; // 0-1
  subdivision: 1 | 2 | 4 | 8 | 16; // Subdivisiones por beat
  accentFirstBeat: boolean; // Acentuar primer tiempo
  sound: {
    accent: 'click' | 'beep' | 'wood' | 'cowbell';
    normal: 'click' | 'beep' | 'wood' | 'tick';
  };
  visualIndicator: boolean; // Mostrar indicador visual
}

// Estado del metrónomo
export interface MetronomeState {
  isPlaying: boolean;
  currentBeat: number;
  currentSubdivision: number;
  lastBeatTime: number;
  nextBeatTime: number;
}

// Configuración de MIDI (para futuras expansiones)
export interface MIDISettings {
  enabled: boolean;
  inputDevice: string | null;
  outputDevice: string | null;
  channel: number; // 1-16
  velocity: {
    min: number; // Velocidad mínima (0-127)
    max: number; // Velocidad máxima (0-127)
    curve: 'linear' | 'exponential' | 'logarithmic';
  };
}

// Evento de nota para el sistema de audio
export interface NoteEvent {
  note: NoteName;
  velocity: number; // 0-1
  duration?: number; // Duración en segundos (opcional)
  timestamp: number;
  source: 'keyboard' | 'mouse' | 'midi';
}

// Eventos de audio
export type AudioEventType = 'noteOn' | 'noteOff' | 'sustainOn' | 'sustainOff' | 'volumeChange';

export interface AudioEvent {
  type: AudioEventType;
  data: any;
  timestamp: number;
}

// Estado global del sistema de audio
export interface AudioState {
  settings: AudioSettings;
  synthSettings: SynthSettings;
  metronome: MetronomeSettings & MetronomeState;
  midi: MIDISettings;
  activeNotes: Map<NoteName, {
    startTime: number;
    velocity: number;
    sustained: boolean;
  }>;
  currentPreset: SynthPreset;
  customPresets: Record<string, SynthPresetConfig>;
}

// Configuración de análisis de espectro (para visualizaciones futuras)
export interface SpectrumAnalyzerSettings {
  enabled: boolean;
  fftSize: 256 | 512 | 1024 | 2048 | 4096;
  smoothingTimeConstant: number; // 0-1
  minDecibels: number;
  maxDecibels: number;
  frequencyBins: number;
}

// Configuración de grabación (para futuras expansiones)
export interface RecordingSettings {
  enabled: boolean;
  format: 'wav' | 'mp3' | 'ogg';
  quality: 'low' | 'medium' | 'high';
  bitRate: number;
  sampleRate: number;
  channels: 1 | 2; // Mono o estéreo
}

export default {};