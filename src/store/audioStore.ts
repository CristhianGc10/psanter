/**
 * AUDIO STORE - Configuración del Sintetizador Tone.js
 * Gestiona configuración ADSR, efectos y estado de inicialización
 * Fase 4: Stores y Gestión de Estado
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  AudioSettings, 
  SynthSettings, 
  SynthPreset, 
  SynthPresetConfig,
  MetronomeSettings,
  MetronomeState,
  SpectrumAnalyzerSettings
} from '../types/audio';

// ========================================================================================
// INTERFACES DEL STORE
// ========================================================================================

interface AudioState {
  // Estado de inicialización
  isInitialized: boolean;
  isAudioContextStarted: boolean;
  audioContextState: 'suspended' | 'running' | 'closed';
  
  // Configuración general de audio
  settings: AudioSettings;
  
  // Configuración del sintetizador
  synthSettings: SynthSettings;
  
  // Preset actual y presets personalizados
  currentPreset: SynthPreset;
  customPresets: Record<string, SynthPresetConfig>;
  
  // Configuración del metrónomo
  metronome: MetronomeSettings & MetronomeState;
  
  // Analizador de espectro
  spectrumAnalyzer: SpectrumAnalyzerSettings;
  
  // Estado de los efectos globales
  globalEffects: {
    masterReverb: { enabled: boolean; wet: number; roomSize: number; };
    masterCompressor: { enabled: boolean; threshold: number; ratio: number; };
    masterEQ: { enabled: boolean; low: number; mid: number; high: number; };
  };
  
  // Información de rendimiento
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    activeVoices: number;
    latency: number;
    sampleRate: number;
  };
  
  // Errores de audio
  lastError: string | null;
  errorCount: number;
}

interface AudioActions {
  // === INICIALIZACIÓN ===
  initializeAudio: () => Promise<boolean>;
  startAudioContext: () => Promise<boolean>;
  suspendAudioContext: () => Promise<void>;
  
  // === CONFIGURACIÓN GENERAL ===
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  setMasterVolume: (volume: number) => void;
  setLatency: (latency: number) => void;
  
  // === CONFIGURACIÓN DEL SINTETIZADOR ===
  updateSynthSettings: (settings: Partial<SynthSettings>) => void;
  setOscillatorType: (type: 'sine' | 'square' | 'sawtooth' | 'triangle') => void;
  setADSREnvelope: (envelope: Partial<SynthSettings['envelope']>) => void;
  setFilter: (filter: Partial<SynthSettings['filter']>) => void;
  setEffects: (effects: Partial<SynthSettings['effects']>) => void;
  
  // === PRESETS ===
  setPreset: (preset: SynthPreset) => void;
  saveCustomPreset: (name: string, config: SynthPresetConfig) => void;
  loadCustomPreset: (name: string) => boolean;
  deleteCustomPreset: (name: string) => void;
  getPresetConfig: (preset: SynthPreset) => SynthPresetConfig | null;
  
  // === METRÓNOMO ===
  updateMetronomeSettings: (settings: Partial<MetronomeSettings>) => void;
  startMetronome: () => void;
  stopMetronome: () => void;
  toggleMetronome: () => void;
  setBPM: (bpm: number) => void;
  tapTempo: () => void;
  
  // === EFECTOS GLOBALES ===
  updateGlobalEffects: (effects: Partial<AudioState['globalEffects']>) => void;
  toggleGlobalReverb: () => void;
  toggleGlobalCompressor: () => void;
  toggleGlobalEQ: () => void;
  
  // === ANALIZADOR DE ESPECTRO ===
  updateSpectrumAnalyzer: (settings: Partial<SpectrumAnalyzerSettings>) => void;
  enableSpectrumAnalyzer: () => void;
  disableSpectrumAnalyzer: () => void;
  
  // === RENDIMIENTO ===
  updatePerformanceStats: (stats: Partial<AudioState['performance']>) => void;
  getPerformanceInfo: () => AudioState['performance'];
  
  // === MANEJO DE ERRORES ===
  setError: (error: string) => void;
  clearError: () => void;
  
  // === UTILIDADES ===
  isReady: () => boolean;
  canPlayAudio: () => boolean;
  getCurrentConfig: () => SynthSettings;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

type AudioStore = AudioState & AudioActions;

// ========================================================================================
// PRESETS PREDEFINIDOS
// ========================================================================================

const PRESET_CONFIGS: Record<SynthPreset, SynthPresetConfig> = {
  classic_piano: {
    name: 'Classic Piano',
    description: 'Sonido de piano acústico tradicional',
    settings: {
      oscillator: {
        type: 'sine',
        harmonicity: 2,
        modulationType: 'sine',
        modulationIndex: 0.3
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2
      },
      filter: {
        type: 'lowpass',
        frequency: 8000,
        Q: 1,
        gain: 0
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.3, dampening: 0.4, wet: 0.2 },
        delay: { enabled: false, delayTime: 0.1, feedback: 0.3, wet: 0.1 },
        chorus: { enabled: false, frequency: 3, depth: 0.5, wet: 0.2 }
      }
    }
  },
  bright_piano: {
    name: 'Bright Piano',
    description: 'Piano brillante y cristalino',
    settings: {
      oscillator: {
        type: 'sine',
        harmonicity: 3,
        modulationType: 'square',
        modulationIndex: 0.5
      },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.6,
        release: 0.8
      },
      filter: {
        type: 'lowpass',
        frequency: 12000,
        Q: 1.5,
        gain: 2
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.2, dampening: 0.2, wet: 0.15 },
        delay: { enabled: false, delayTime: 0.1, feedback: 0.2, wet: 0.1 },
        chorus: { enabled: true, frequency: 4, depth: 0.3, wet: 0.15 }
      }
    }
  },
  mellow_piano: {
    name: 'Mellow Piano',
    description: 'Piano suave y cálido',
    settings: {
      oscillator: {
        type: 'triangle',
        harmonicity: 1.5,
        modulationType: 'sine',
        modulationIndex: 0.2
      },
      envelope: {
        attack: 0.05,
        decay: 0.5,
        sustain: 0.3,
        release: 1.5
      },
      filter: {
        type: 'lowpass',
        frequency: 6000,
        Q: 0.8,
        gain: -1
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.5, dampening: 0.6, wet: 0.3 },
        delay: { enabled: false, delayTime: 0.15, feedback: 0.4, wet: 0.1 },
        chorus: { enabled: false, frequency: 2, depth: 0.4, wet: 0.1 }
      }
    }
  },
  electric_piano: {
    name: 'Electric Piano',
    description: 'Piano eléctrico tipo Rhodes',
    settings: {
      oscillator: {
        type: 'square',
        harmonicity: 1,
        modulationType: 'triangle',
        modulationIndex: 0.7
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.8,
        release: 0.5
      },
      filter: {
        type: 'lowpass',
        frequency: 7000,
        Q: 2,
        gain: 1
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.4, dampening: 0.3, wet: 0.25 },
        delay: { enabled: true, delayTime: 0.12, feedback: 0.3, wet: 0.15 },
        chorus: { enabled: true, frequency: 5, depth: 0.6, wet: 0.2 }
      }
    }
  },
  organ: {
    name: 'Organ',
    description: 'Órgano Hammond clásico',
    settings: {
      oscillator: {
        type: 'sawtooth',
        harmonicity: 0.5,
        modulationType: 'square',
        modulationIndex: 1
      },
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0.9,
        release: 0.1
      },
      filter: {
        type: 'lowpass',
        frequency: 9000,
        Q: 1.2,
        gain: 0
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.6, dampening: 0.4, wet: 0.3 },
        delay: { enabled: false, delayTime: 0.1, feedback: 0.2, wet: 0.1 },
        chorus: { enabled: true, frequency: 6, depth: 0.7, wet: 0.25 }
      }
    }
  },
  strings: {
    name: 'Strings',
    description: 'Cuerdas sinfónicas',
    settings: {
      oscillator: {
        type: 'sawtooth',
        harmonicity: 2,
        modulationType: 'sine',
        modulationIndex: 0.4
      },
      envelope: {
        attack: 0.3,
        decay: 0.2,
        sustain: 0.8,
        release: 2
      },
      filter: {
        type: 'lowpass',
        frequency: 5000,
        Q: 1,
        gain: -2
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.8, dampening: 0.5, wet: 0.4 },
        delay: { enabled: true, delayTime: 0.2, feedback: 0.5, wet: 0.2 },
        chorus: { enabled: true, frequency: 3, depth: 0.8, wet: 0.3 }
      }
    }
  },
  pad: {
    name: 'Pad',
    description: 'Pad atmosférico y envolvente',
    settings: {
      oscillator: {
        type: 'triangle',
        harmonicity: 4,
        modulationType: 'sine',
        modulationIndex: 0.6
      },
      envelope: {
        attack: 1,
        decay: 0.5,
        sustain: 0.7,
        release: 3
      },
      filter: {
        type: 'lowpass',
        frequency: 4000,
        Q: 0.5,
        gain: -3
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.9, dampening: 0.7, wet: 0.5 },
        delay: { enabled: true, delayTime: 0.25, feedback: 0.6, wet: 0.3 },
        chorus: { enabled: true, frequency: 2, depth: 0.9, wet: 0.4 }
      }
    }
  },
  lead: {
    name: 'Lead',
    description: 'Sonido lead para solos',
    settings: {
      oscillator: {
        type: 'square',
        harmonicity: 1,
        modulationType: 'sawtooth',
        modulationIndex: 0.8
      },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.9,
        release: 0.3
      },
      filter: {
        type: 'lowpass',
        frequency: 10000,
        Q: 3,
        gain: 3
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.4, dampening: 0.3, wet: 0.2 },
        delay: { enabled: true, delayTime: 0.15, feedback: 0.4, wet: 0.25 },
        chorus: { enabled: false, frequency: 7, depth: 0.5, wet: 0.15 }
      }
    }
  },
  custom: {
    name: 'Custom',
    description: 'Configuración personalizada',
    settings: {
      oscillator: {
        type: 'sine',
        harmonicity: 1,
        modulationType: 'sine',
        modulationIndex: 0.5
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.5,
        release: 1
      },
      filter: {
        type: 'lowpass',
        frequency: 8000,
        Q: 1,
        gain: 0
      },
      effects: {
        reverb: { enabled: true, roomSize: 0.3, dampening: 0.4, wet: 0.2 },
        delay: { enabled: false, delayTime: 0.1, feedback: 0.3, wet: 0.1 },
        chorus: { enabled: false, frequency: 3, depth: 0.5, wet: 0.2 }
      }
    }
  }
};

// ========================================================================================
// ESTADO INICIAL
// ========================================================================================

const initialState: AudioState = {
  isInitialized: false,
  isAudioContextStarted: false,
  audioContextState: 'suspended',
  
  settings: {
    masterVolume: 0.7,
    sampleRate: 44100,
    bufferSize: 256,
    latency: 10,
    initialized: false
  },
  
  synthSettings: PRESET_CONFIGS.classic_piano.settings,
  
  currentPreset: 'classic_piano',
  customPresets: {},
  
  metronome: {
    enabled: false,
    bpm: 120,
    volume: 0.5,
    subdivision: 4,
    accentFirstBeat: true,
    sound: {
      accent: 'click',
      normal: 'tick'
    },
    visualIndicator: true,
    isPlaying: false,
    currentBeat: 0,
    currentSubdivision: 0,
    lastBeatTime: 0,
    nextBeatTime: 0
  },
  
  spectrumAnalyzer: {
    enabled: false,
    fftSize: 1024,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -30,
    frequencyBins: 512
  },
  
  globalEffects: {
    masterReverb: { enabled: false, wet: 0.2, roomSize: 0.3 },
    masterCompressor: { enabled: false, threshold: -24, ratio: 4 },
    masterEQ: { enabled: false, low: 0, mid: 0, high: 0 }
  },
  
  performance: {
    cpuUsage: 0,
    memoryUsage: 0,
    activeVoices: 0,
    latency: 10,
    sampleRate: 44100
  },
  
  lastError: null,
  errorCount: 0
};

// ========================================================================================
// STORE PRINCIPAL
// ========================================================================================

export const useAudioStore = create<AudioStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // === IMPLEMENTACIÓN DE ACCIONES ===

    initializeAudio: async () => {
      try {
        // Simular inicialización del contexto de audio
        // En implementación real, aquí iría la configuración de Tone.js
        
        set((state) => ({
          ...state,
          isInitialized: true,
          settings: {
            ...state.settings,
            initialized: true
          }
        }));

        console.log('🎵 Audio system initialized successfully');
        return true;
      } catch (error) {
        get().setError(`Failed to initialize audio: ${error}`);
        return false;
      }
    },

    startAudioContext: async () => {
      try {
        // En implementación real: await Tone.start()
        
        set((state) => ({
          ...state,
          isAudioContextStarted: true,
          audioContextState: 'running'
        }));

        console.log('🎵 Audio context started');
        return true;
      } catch (error) {
        get().setError(`Failed to start audio context: ${error}`);
        return false;
      }
    },

    suspendAudioContext: async () => {
      try {
        // En implementación real: await Tone.context.suspend()
        
        set((state) => ({
          ...state,
          isAudioContextStarted: false,
          audioContextState: 'suspended'
        }));

        console.log('🎵 Audio context suspended');
      } catch (error) {
        get().setError(`Failed to suspend audio context: ${error}`);
      }
    },

    updateAudioSettings: (newSettings) => {
      set((state) => ({
        ...state,
        settings: {
          ...state.settings,
          ...newSettings
        }
      }));
    },

    setMasterVolume: (volume) => {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      set((state) => ({
        ...state,
        settings: {
          ...state.settings,
          masterVolume: clampedVolume
        }
      }));
    },

    setLatency: (latency) => {
      const clampedLatency = Math.max(1, Math.min(1000, latency));
      set((state) => ({
        ...state,
        settings: {
          ...state.settings,
          latency: clampedLatency
        },
        performance: {
          ...state.performance,
          latency: clampedLatency
        }
      }));
    },

    updateSynthSettings: (newSettings) => {
      set((state) => ({
        ...state,
        synthSettings: {
          ...state.synthSettings,
          ...newSettings
        }
      }));
    },

    setOscillatorType: (type) => {
      set((state) => ({
        ...state,
        synthSettings: {
          ...state.synthSettings,
          oscillator: {
            ...state.synthSettings.oscillator,
            type
          }
        }
      }));
    },

    setADSREnvelope: (envelope) => {
      set((state) => ({
        ...state,
        synthSettings: {
          ...state.synthSettings,
          envelope: {
            ...state.synthSettings.envelope,
            ...envelope
          }
        }
      }));
    },

    setFilter: (filter) => {
      set((state) => ({
        ...state,
        synthSettings: {
          ...state.synthSettings,
          filter: {
            ...state.synthSettings.filter,
            ...filter
          }
        }
      }));
    },

    setEffects: (effects) => {
      set((state) => ({
        ...state,
        synthSettings: {
          ...state.synthSettings,
          effects: {
            ...state.synthSettings.effects,
            ...effects
          }
        }
      }));
    },

    setPreset: (preset) => {
      const presetConfig = PRESET_CONFIGS[preset];
      if (presetConfig) {
        set((state) => ({
          ...state,
          currentPreset: preset,
          synthSettings: presetConfig.settings
        }));
        console.log(`🎵 Preset changed to: ${presetConfig.name}`);
      }
    },

    saveCustomPreset: (name, config) => {
      set((state) => ({
        ...state,
        customPresets: {
          ...state.customPresets,
          [name]: config
        }
      }));
      console.log(`🎵 Custom preset saved: ${name}`);
    },

    loadCustomPreset: (name) => {
      const state = get();
      const preset = state.customPresets[name];
      if (preset) {
        set((prevState) => ({
          ...prevState,
          currentPreset: 'custom',
          synthSettings: preset.settings
        }));
        console.log(`🎵 Custom preset loaded: ${name}`);
        return true;
      }
      console.warn(`🎵 Custom preset not found: ${name}`);
      return false;
    },

    deleteCustomPreset: (name) => {
      set((state) => {
        const newCustomPresets = { ...state.customPresets };
        delete newCustomPresets[name];
        return {
          ...state,
          customPresets: newCustomPresets
        };
      });
      console.log(`🎵 Custom preset deleted: ${name}`);
    },

    getPresetConfig: (preset) => {
      if (preset === 'custom') {
        return {
          name: 'Custom',
          description: 'Current custom configuration',
          settings: get().synthSettings
        };
      }
      return PRESET_CONFIGS[preset] || null;
    },

    updateMetronomeSettings: (newSettings) => {
      set((state) => ({
        ...state,
        metronome: {
          ...state.metronome,
          ...newSettings
        }
      }));
    },

    startMetronome: () => {
      set((state) => ({
        ...state,
        metronome: {
          ...state.metronome,
          isPlaying: true,
          lastBeatTime: Date.now()
        }
      }));
      console.log('🎵 Metronome started');
    },

    stopMetronome: () => {
      set((state) => ({
        ...state,
        metronome: {
          ...state.metronome,
          isPlaying: false,
          currentBeat: 0,
          currentSubdivision: 0
        }
      }));
      console.log('🎵 Metronome stopped');
    },

    toggleMetronome: () => {
      const state = get();
      if (state.metronome.isPlaying) {
        get().stopMetronome();
      } else {
        get().startMetronome();
      }
    },

    setBPM: (bpm) => {
      const clampedBPM = Math.max(30, Math.min(300, bpm));
      set((state) => ({
        ...state,
        metronome: {
          ...state.metronome,
          bpm: clampedBPM
        }
      }));
    },

    tapTempo: () => {
      // Implementación básica de tap tempo
      const now = Date.now();
      const state = get();
      const timeDiff = now - state.metronome.lastBeatTime;
      
      if (timeDiff > 300 && timeDiff < 3000) { // Entre 20 y 200 BPM
        const newBPM = Math.round(60000 / timeDiff);
        get().setBPM(newBPM);
      }
      
      set((prevState) => ({
        ...prevState,
        metronome: {
          ...prevState.metronome,
          lastBeatTime: now
        }
      }));
    },

    updateGlobalEffects: (effects) => {
      set((state) => ({
        ...state,
        globalEffects: {
          ...state.globalEffects,
          ...effects
        }
      }));
    },

    toggleGlobalReverb: () => {
      set((state) => ({
        ...state,
        globalEffects: {
          ...state.globalEffects,
          masterReverb: {
            ...state.globalEffects.masterReverb,
            enabled: !state.globalEffects.masterReverb.enabled
          }
        }
      }));
    },

    toggleGlobalCompressor: () => {
      set((state) => ({
        ...state,
        globalEffects: {
          ...state.globalEffects,
          masterCompressor: {
            ...state.globalEffects.masterCompressor,
            enabled: !state.globalEffects.masterCompressor.enabled
          }
        }
      }));
    },

    toggleGlobalEQ: () => {
      set((state) => ({
        ...state,
        globalEffects: {
          ...state.globalEffects,
          masterEQ: {
            ...state.globalEffects.masterEQ,
            enabled: !state.globalEffects.masterEQ.enabled
          }
        }
      }));
    },

    updateSpectrumAnalyzer: (newSettings) => {
      set((state) => ({
        ...state,
        spectrumAnalyzer: {
          ...state.spectrumAnalyzer,
          ...newSettings
        }
      }));
    },

    enableSpectrumAnalyzer: () => {
      set((state) => ({
        ...state,
        spectrumAnalyzer: {
          ...state.spectrumAnalyzer,
          enabled: true
        }
      }));
    },

    disableSpectrumAnalyzer: () => {
      set((state) => ({
        ...state,
        spectrumAnalyzer: {
          ...state.spectrumAnalyzer,
          enabled: false
        }
      }));
    },

    updatePerformanceStats: (stats) => {
      set((state) => ({
        ...state,
        performance: {
          ...state.performance,
          ...stats
        }
      }));
    },

    getPerformanceInfo: () => {
      return get().performance;
    },

    setError: (error) => {
      set((state) => ({
        ...state,
        lastError: error,
        errorCount: state.errorCount + 1
      }));
      console.error('🎵 Audio error:', error);
    },

    clearError: () => {
      set((state) => ({
        ...state,
        lastError: null
      }));
    },

    isReady: () => {
      const state = get();
      return state.isInitialized && state.isAudioContextStarted;
    },

    canPlayAudio: () => {
      const state = get();
      return state.isInitialized && 
             state.audioContextState === 'running' && 
             !state.lastError;
    },

    getCurrentConfig: () => {
      return get().synthSettings;
    },

    exportSettings: () => {
      const state = get();
      const exportData = {
        synthSettings: state.synthSettings,
        currentPreset: state.currentPreset,
        customPresets: state.customPresets,
        metronome: state.metronome,
        globalEffects: state.globalEffects,
        audioSettings: state.settings
      };
      return JSON.stringify(exportData, null, 2);
    },

    importSettings: (settingsJson) => {
      try {
        const importData = JSON.parse(settingsJson);
        
        set((state) => ({
          ...state,
          synthSettings: importData.synthSettings || state.synthSettings,
          currentPreset: importData.currentPreset || state.currentPreset,
          customPresets: importData.customPresets || state.customPresets,
          metronome: { ...state.metronome, ...importData.metronome },
          globalEffects: { ...state.globalEffects, ...importData.globalEffects },
          settings: { ...state.settings, ...importData.audioSettings }
        }));
        
        console.log('🎵 Settings imported successfully');
        return true;
      } catch (error) {
        get().setError(`Failed to import settings: ${error}`);
        return false;
      }
    }
  }))
);

// ========================================================================================
// HOOKS DERIVADOS PARA OPTIMIZACIÓN
// ========================================================================================

// Hook para obtener solo el preset actual
export const useCurrentPreset = () => {
  return useAudioStore((state) => ({
    preset: state.currentPreset,
    config: state.currentPreset === 'custom' 
      ? { name: 'Custom', description: 'Custom configuration', settings: state.synthSettings }
      : PRESET_CONFIGS[state.currentPreset]
  }));
};

// Hook para obtener solo el estado del metrónomo
export const useMetronomeState = () => {
  return useAudioStore((state) => ({
    isPlaying: state.metronome.isPlaying,
    bpm: state.metronome.bpm,
    currentBeat: state.metronome.currentBeat,
    volume: state.metronome.volume
  }));
};

// Hook para obtener solo el estado de inicialización
export const useAudioInitState = () => {
  return useAudioStore((state) => ({
    isInitialized: state.isInitialized,
    isStarted: state.isAudioContextStarted,
    canPlay: state.isInitialized && state.audioContextState === 'running'
  }));
};

// Hook para obtener solo las estadísticas de rendimiento
export const usePerformanceStats = () => {
  return useAudioStore((state) => state.performance);
};

// ========================================================================================
// UTILIDADES Y DEBUGGING
// ========================================================================================

// Función para debugging del estado
export const debugAudioStore = () => {
  const state = useAudioStore.getState();
  console.log('🎵 Audio Store Debug:', {
    initialized: state.isInitialized,
    audioStarted: state.isAudioContextStarted,
    preset: state.currentPreset,
    metronome: state.metronome.isPlaying ? `${state.metronome.bpm} BPM` : 'stopped',
    masterVolume: state.settings.masterVolume,
    performance: state.performance,
    customPresets: Object.keys(state.customPresets)
  });
};

// Función para resetear completamente el store
export const resetAudioStore = () => {
  useAudioStore.setState(initialState);
};

// ========================================================================================
// SUBSCRIPCIONES AUTOMÁTICAS
// ========================================================================================

if (process.env.NODE_ENV === 'development') {
  // Logging de cambios de preset
  useAudioStore.subscribe(
    (state) => state.currentPreset,
    (preset) => {
      const config = PRESET_CONFIGS[preset];
      console.log(`🎵 Preset changed: ${config?.name || preset}`);
    }
  );

  // Logging de errores
  useAudioStore.subscribe(
    (state) => state.lastError,
    (error) => {
      if (error) {
        console.error(`🎵 Audio error: ${error}`);
      }
    }
  );
}

// Log inicial
console.log('🎵 Audio Store initialized successfully');

export default useAudioStore;