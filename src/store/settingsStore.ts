/**
 * SETTINGS STORE - Configuraciones y Preferencias de Usuario
 * Gestiona metrónomo, temas, mapeo de teclado y preferencias generales
 * Fase 4: Stores y Gestión de Estado
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import type { 
  KeyboardMappingConfig, 
  PresetLayout, 
  VelocityDetectionConfig 
} from '../types/keyboard';

// ========================================================================================
// INTERFACES DEL STORE
// ========================================================================================

interface ThemeSettings {
  colorScheme: 'dark' | 'light' | 'auto';
  accentColor: 'emerald' | 'blue' | 'purple' | 'pink' | 'orange';
  keyboardStyle: 'modern' | 'classic' | 'minimal';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

interface LayoutSettings {
  pianoSize: 'small' | 'medium' | 'large';
  showKeyLabels: boolean;
  showOctaveNumbers: boolean;
  compactMode: boolean;
  panelLayout: 'horizontal' | 'vertical' | 'auto';
  sidebarPosition: 'left' | 'right' | 'hidden';
}

interface DetectionSettings {
  enabled: boolean;
  autoDetection: boolean;
  chordDetection: boolean;
  scaleDetection: boolean;
  minNotesForChord: number;
  minNotesForScale: number;
  sensitivity: number; // 0-1
  timeWindow: number; // ms para detección en tiempo real
  showSuggestions: boolean;
  highlightDetected: boolean;
}

interface AccessibilitySettings {
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  audioFeedback: boolean;
  vibration: boolean; // Para dispositivos móviles
  voiceAnnouncements: boolean;
  highContrastMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

interface PerformanceSettings {
  audioLatency: 'ultra-low' | 'low' | 'normal' | 'high';
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  animationQuality: 'low' | 'medium' | 'high';
  enableGPUAcceleration: boolean;
  maxPolyphony: number;
  sampleRate: 44100 | 48000 | 96000;
}

interface AdvancedSettings {
  debugMode: boolean;
  showPerformanceStats: boolean;
  enableAnalytics: boolean;
  autoSave: boolean;
  backupSettings: boolean;
  experimentalFeatures: boolean;
  developerMode: boolean;
}

interface SettingsState {
  // === CONFIGURACIONES PRINCIPALES ===
  theme: ThemeSettings;
  layout: LayoutSettings;
  detection: DetectionSettings;
  accessibility: AccessibilitySettings;
  performance: PerformanceSettings;
  advanced: AdvancedSettings;
  
  // === MAPEO DE TECLADO ===
  keyboardMapping: KeyboardMappingConfig;
  
  // === PREFERENCIAS DE USUARIO ===
  userPreferences: {
    defaultOctave: number;
    defaultVolume: number;
    autoPlay: boolean;
    showTooltips: boolean;
    confirmActions: boolean;
    saveWorkspace: boolean;
    lastUsedPreset: string;
    favoriteChords: string[];
    favoriteScales: string[];
    practiceMode: boolean;
    tutorialCompleted: boolean;
  };
  
  // === HISTORIAL Y ESTADÍSTICAS ===
  usage: {
    totalSessions: number;
    totalPlayTime: number; // en segundos
    totalNotesPlayed: number;
    mostUsedChords: Record<string, number>;
    mostUsedScales: Record<string, number>;
    averageSessionLength: number;
    lastActiveDate: string;
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  
  // === ESTADO DE LA CONFIGURACIÓN ===
  isLoaded: boolean;
  hasUnsavedChanges: boolean;
  lastSavedAt: number;
  version: string;
}

interface SettingsActions {
  // === ACCIONES DE TEMA ===
  setTheme: (theme: Partial<ThemeSettings>) => void;
  setColorScheme: (scheme: ThemeSettings['colorScheme']) => void;
  setAccentColor: (color: ThemeSettings['accentColor']) => void;
  toggleAnimations: () => void;
  toggleHighContrast: () => void;
  
  // === ACCIONES DE LAYOUT ===
  setLayout: (layout: Partial<LayoutSettings>) => void;
  setPianoSize: (size: LayoutSettings['pianoSize']) => void;
  toggleKeyLabels: () => void;
  toggleOctaveNumbers: () => void;
  toggleCompactMode: () => void;
  
  // === ACCIONES DE DETECCIÓN ===
  setDetection: (detection: Partial<DetectionSettings>) => void;
  toggleAutoDetection: () => void;
  toggleChordDetection: () => void;
  toggleScaleDetection: () => void;
  setSensitivity: (sensitivity: number) => void;
  
  // === ACCIONES DE ACCESIBILIDAD ===
  setAccessibility: (accessibility: Partial<AccessibilitySettings>) => void;
  toggleScreenReader: () => void;
  toggleAudioFeedback: () => void;
  setFontSize: (size: AccessibilitySettings['fontSize']) => void;
  
  // === ACCIONES DE RENDIMIENTO ===
  setPerformance: (performance: Partial<PerformanceSettings>) => void;
  setAudioLatency: (latency: PerformanceSettings['audioLatency']) => void;
  setRenderQuality: (quality: PerformanceSettings['renderQuality']) => void;
  setMaxPolyphony: (polyphony: number) => void;
  
  // === ACCIONES DE CONFIGURACIÓN AVANZADA ===
  setAdvanced: (advanced: Partial<AdvancedSettings>) => void;
  toggleDebugMode: () => void;
  togglePerformanceStats: () => void;
  toggleExperimentalFeatures: () => void;
  
  // === ACCIONES DE MAPEO DE TECLADO ===
  setKeyboardMapping: (mapping: Partial<KeyboardMappingConfig>) => void;
  setKeyboardLayout: (layout: PresetLayout) => void;
  toggleKeyboardMapping: () => void;
  setOctaveShift: (shift: number) => void;
  setTransposeShift: (shift: number) => void;
  setVelocityDetection: (config: Partial<VelocityDetectionConfig>) => void;
  
  // === ACCIONES DE PREFERENCIAS ===
  setUserPreferences: (preferences: Partial<SettingsState['userPreferences']>) => void;
  setDefaultOctave: (octave: number) => void;
  setDefaultVolume: (volume: number) => void;
  addFavoriteChord: (chord: string) => void;
  removeFavoriteChord: (chord: string) => void;
  addFavoriteScale: (scale: string) => void;
  removeFavoriteScale: (scale: string) => void;
  togglePracticeMode: () => void;
  markTutorialCompleted: () => void;
  
  // === ACCIONES DE ESTADÍSTICAS ===
  incrementSession: () => void;
  addPlayTime: (seconds: number) => void;
  incrementNotesPlayed: (count?: number) => void;
  trackChordUsage: (chord: string) => void;
  trackScaleUsage: (scale: string) => void;
  updateSkillLevel: (level: SettingsState['usage']['skillLevel']) => void;
  
  // === ACCIONES DE GESTIÓN ===
  loadSettings: () => void;
  saveSettings: () => void;
  resetSettings: () => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
  markAsChanged: () => void;
  clearUnsavedChanges: () => void;
  
  // === UTILIDADES ===
  getSettingsSummary: () => any;
  validateSettings: () => boolean;
  migrateSettings: (oldVersion: string) => void;
}

type SettingsStore = SettingsState & SettingsActions;

// ========================================================================================
// CONFIGURACIÓN INICIAL
// ========================================================================================

const initialState: SettingsState = {
  theme: {
    colorScheme: 'dark',
    accentColor: 'emerald',
    keyboardStyle: 'modern',
    animations: true,
    reducedMotion: false,
    highContrast: false
  },
  
  layout: {
    pianoSize: 'medium',
    showKeyLabels: false,
    showOctaveNumbers: true,
    compactMode: false,
    panelLayout: 'auto',
    sidebarPosition: 'right'
  },
  
  detection: {
    enabled: true,
    autoDetection: true,
    chordDetection: true,
    scaleDetection: true,
    minNotesForChord: 3,
    minNotesForScale: 5,
    sensitivity: 0.7,
    timeWindow: 500,
    showSuggestions: true,
    highlightDetected: true
  },
  
  accessibility: {
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    audioFeedback: false,
    vibration: false,
    voiceAnnouncements: false,
    highContrastMode: false,
    fontSize: 'medium'
  },
  
  performance: {
    audioLatency: 'low',
    renderQuality: 'high',
    animationQuality: 'high',
    enableGPUAcceleration: true,
    maxPolyphony: 32,
    sampleRate: 44100
  },
  
  advanced: {
    debugMode: false,
    showPerformanceStats: false,
    enableAnalytics: true,
    autoSave: true,
    backupSettings: true,
    experimentalFeatures: false,
    developerMode: false
  },
  
  keyboardMapping: {
    enabled: true,
    currentLayout: 'qwerty_piano',
    customLayouts: {},
    preventRepeat: true,
    octaveShift: 0,
    transposeShift: 0,
    velocitySensitive: true,
    velocityRange: {
      min: 0.1,
      max: 1.0
    }
  },
  
  userPreferences: {
    defaultOctave: 4,
    defaultVolume: 0.7,
    autoPlay: false,
    showTooltips: true,
    confirmActions: true,
    saveWorkspace: true,
    lastUsedPreset: 'classic_piano',
    favoriteChords: ['C Major', 'G Major', 'F Major', 'Am', 'Dm'],
    favoriteScales: ['C Major', 'A Minor', 'G Major', 'E Minor'],
    practiceMode: false,
    tutorialCompleted: false
  },
  
  usage: {
    totalSessions: 0,
    totalPlayTime: 0,
    totalNotesPlayed: 0,
    mostUsedChords: {},
    mostUsedScales: {},
    averageSessionLength: 0,
    lastActiveDate: new Date().toISOString(),
    skillLevel: 'beginner'
  },
  
  isLoaded: false,
  hasUnsavedChanges: false,
  lastSavedAt: 0,
  version: '1.0.0'
};

// ========================================================================================
// STORE PRINCIPAL CON PERSISTENCIA
// ========================================================================================

export const useSettingsStore = create<SettingsStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      // === IMPLEMENTACIÓN DE ACCIONES ===

      setTheme: (theme) => {
        set((state) => ({
          ...state,
          theme: { ...state.theme, ...theme },
          hasUnsavedChanges: true
        }));
      },

      setColorScheme: (scheme) => {
        set((state) => ({
          ...state,
          theme: { ...state.theme, colorScheme: scheme },
          hasUnsavedChanges: true
        }));
      },

      setAccentColor: (color) => {
        set((state) => ({
          ...state,
          theme: { ...state.theme, accentColor: color },
          hasUnsavedChanges: true
        }));
      },

      toggleAnimations: () => {
        set((state) => ({
          ...state,
          theme: { ...state.theme, animations: !state.theme.animations },
          hasUnsavedChanges: true
        }));
      },

      toggleHighContrast: () => {
        set((state) => ({
          ...state,
          theme: { ...state.theme, highContrast: !state.theme.highContrast },
          accessibility: { ...state.accessibility, highContrastMode: !state.theme.highContrast },
          hasUnsavedChanges: true
        }));
      },

      setLayout: (layout) => {
        set((state) => ({
          ...state,
          layout: { ...state.layout, ...layout },
          hasUnsavedChanges: true
        }));
      },

      setPianoSize: (size) => {
        set((state) => ({
          ...state,
          layout: { ...state.layout, pianoSize: size },
          hasUnsavedChanges: true
        }));
      },

      toggleKeyLabels: () => {
        set((state) => ({
          ...state,
          layout: { ...state.layout, showKeyLabels: !state.layout.showKeyLabels },
          hasUnsavedChanges: true
        }));
      },

      toggleOctaveNumbers: () => {
        set((state) => ({
          ...state,
          layout: { ...state.layout, showOctaveNumbers: !state.layout.showOctaveNumbers },
          hasUnsavedChanges: true
        }));
      },

      toggleCompactMode: () => {
        set((state) => ({
          ...state,
          layout: { ...state.layout, compactMode: !state.layout.compactMode },
          hasUnsavedChanges: true
        }));
      },

      setDetection: (detection) => {
        set((state) => ({
          ...state,
          detection: { ...state.detection, ...detection },
          hasUnsavedChanges: true
        }));
      },

      toggleAutoDetection: () => {
        set((state) => ({
          ...state,
          detection: { ...state.detection, autoDetection: !state.detection.autoDetection },
          hasUnsavedChanges: true
        }));
      },

      toggleChordDetection: () => {
        set((state) => ({
          ...state,
          detection: { ...state.detection, chordDetection: !state.detection.chordDetection },
          hasUnsavedChanges: true
        }));
      },

      toggleScaleDetection: () => {
        set((state) => ({
          ...state,
          detection: { ...state.detection, scaleDetection: !state.detection.scaleDetection },
          hasUnsavedChanges: true
        }));
      },

      setSensitivity: (sensitivity) => {
        const clampedSensitivity = Math.max(0, Math.min(1, sensitivity));
        set((state) => ({
          ...state,
          detection: { ...state.detection, sensitivity: clampedSensitivity },
          hasUnsavedChanges: true
        }));
      },

      setAccessibility: (accessibility) => {
        set((state) => ({
          ...state,
          accessibility: { ...state.accessibility, ...accessibility },
          hasUnsavedChanges: true
        }));
      },

      toggleScreenReader: () => {
        set((state) => ({
          ...state,
          accessibility: { ...state.accessibility, screenReader: !state.accessibility.screenReader },
          hasUnsavedChanges: true
        }));
      },

      toggleAudioFeedback: () => {
        set((state) => ({
          ...state,
          accessibility: { ...state.accessibility, audioFeedback: !state.accessibility.audioFeedback },
          hasUnsavedChanges: true
        }));
      },

      setFontSize: (size) => {
        set((state) => ({
          ...state,
          accessibility: { ...state.accessibility, fontSize: size },
          hasUnsavedChanges: true
        }));
      },

      setPerformance: (performance) => {
        set((state) => ({
          ...state,
          performance: { ...state.performance, ...performance },
          hasUnsavedChanges: true
        }));
      },

      setAudioLatency: (latency) => {
        set((state) => ({
          ...state,
          performance: { ...state.performance, audioLatency: latency },
          hasUnsavedChanges: true
        }));
      },

      setRenderQuality: (quality) => {
        set((state) => ({
          ...state,
          performance: { ...state.performance, renderQuality: quality },
          hasUnsavedChanges: true
        }));
      },

      setMaxPolyphony: (polyphony) => {
        const clampedPolyphony = Math.max(1, Math.min(128, polyphony));
        set((state) => ({
          ...state,
          performance: { ...state.performance, maxPolyphony: clampedPolyphony },
          hasUnsavedChanges: true
        }));
      },

      setAdvanced: (advanced) => {
        set((state) => ({
          ...state,
          advanced: { ...state.advanced, ...advanced },
          hasUnsavedChanges: true
        }));
      },

      toggleDebugMode: () => {
        set((state) => ({
          ...state,
          advanced: { ...state.advanced, debugMode: !state.advanced.debugMode },
          hasUnsavedChanges: true
        }));
      },

      togglePerformanceStats: () => {
        set((state) => ({
          ...state,
          advanced: { ...state.advanced, showPerformanceStats: !state.advanced.showPerformanceStats },
          hasUnsavedChanges: true
        }));
      },

      toggleExperimentalFeatures: () => {
        set((state) => ({
          ...state,
          advanced: { ...state.advanced, experimentalFeatures: !state.advanced.experimentalFeatures },
          hasUnsavedChanges: true
        }));
      },

      setKeyboardMapping: (mapping) => {
        set((state) => ({
          ...state,
          keyboardMapping: { ...state.keyboardMapping, ...mapping },
          hasUnsavedChanges: true
        }));
      },

      setKeyboardLayout: (layout) => {
        set((state) => ({
          ...state,
          keyboardMapping: { ...state.keyboardMapping, currentLayout: layout },
          hasUnsavedChanges: true
        }));
      },

      toggleKeyboardMapping: () => {
        set((state) => ({
          ...state,
          keyboardMapping: { ...state.keyboardMapping, enabled: !state.keyboardMapping.enabled },
          hasUnsavedChanges: true
        }));
      },

      setOctaveShift: (shift) => {
        const clampedShift = Math.max(-3, Math.min(3, shift));
        set((state) => ({
          ...state,
          keyboardMapping: { ...state.keyboardMapping, octaveShift: clampedShift },
          hasUnsavedChanges: true
        }));
      },

      setTransposeShift: (shift) => {
        const clampedShift = Math.max(-12, Math.min(12, shift));
        set((state) => ({
          ...state,
          keyboardMapping: { ...state.keyboardMapping, transposeShift: clampedShift },
          hasUnsavedChanges: true
        }));
      },

      setVelocityDetection: (config) => {
        // Esta función necesitaría ser implementada en el keyboardMapping
        console.log('Velocity detection config updated:', config);
      },

      setUserPreferences: (preferences) => {
        set((state) => ({
          ...state,
          userPreferences: { ...state.userPreferences, ...preferences },
          hasUnsavedChanges: true
        }));
      },

      setDefaultOctave: (octave) => {
        const clampedOctave = Math.max(0, Math.min(8, octave));
        set((state) => ({
          ...state,
          userPreferences: { ...state.userPreferences, defaultOctave: clampedOctave },
          hasUnsavedChanges: true
        }));
      },

      setDefaultVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set((state) => ({
          ...state,
          userPreferences: { ...state.userPreferences, defaultVolume: clampedVolume },
          hasUnsavedChanges: true
        }));
      },

      addFavoriteChord: (chord) => {
        set((state) => {
          const favorites = state.userPreferences.favoriteChords;
          if (!favorites.includes(chord)) {
            return {
              ...state,
              userPreferences: {
                ...state.userPreferences,
                favoriteChords: [...favorites, chord]
              },
              hasUnsavedChanges: true
            };
          }
          return state;
        });
      },

      removeFavoriteChord: (chord) => {
        set((state) => ({
          ...state,
          userPreferences: {
            ...state.userPreferences,
            favoriteChords: state.userPreferences.favoriteChords.filter(c => c !== chord)
          },
          hasUnsavedChanges: true
        }));
      },

      addFavoriteScale: (scale) => {
        set((state) => {
          const favorites = state.userPreferences.favoriteScales;
          if (!favorites.includes(scale)) {
            return {
              ...state,
              userPreferences: {
                ...state.userPreferences,
                favoriteScales: [...favorites, scale]
              },
              hasUnsavedChanges: true
            };
          }
          return state;
        });
      },

      removeFavoriteScale: (scale) => {
        set((state) => ({
          ...state,
          userPreferences: {
            ...state.userPreferences,
            favoriteScales: state.userPreferences.favoriteScales.filter(s => s !== scale)
          },
          hasUnsavedChanges: true
        }));
      },

      togglePracticeMode: () => {
        set((state) => ({
          ...state,
          userPreferences: { ...state.userPreferences, practiceMode: !state.userPreferences.practiceMode },
          hasUnsavedChanges: true
        }));
      },

      markTutorialCompleted: () => {
        set((state) => ({
          ...state,
          userPreferences: { ...state.userPreferences, tutorialCompleted: true },
          hasUnsavedChanges: true
        }));
      },

      incrementSession: () => {
        set((state) => ({
          ...state,
          usage: {
            ...state.usage,
            totalSessions: state.usage.totalSessions + 1,
            lastActiveDate: new Date().toISOString()
          },
          hasUnsavedChanges: true
        }));
      },

      addPlayTime: (seconds) => {
        set((state) => {
          const newTotalTime = state.usage.totalPlayTime + seconds;
          const newAverage = newTotalTime / Math.max(1, state.usage.totalSessions);
          
          return {
            ...state,
            usage: {
              ...state.usage,
              totalPlayTime: newTotalTime,
              averageSessionLength: newAverage,
              lastActiveDate: new Date().toISOString()
            },
            hasUnsavedChanges: true
          };
        });
      },

      incrementNotesPlayed: (count = 1) => {
        set((state) => ({
          ...state,
          usage: {
            ...state.usage,
            totalNotesPlayed: state.usage.totalNotesPlayed + count,
            lastActiveDate: new Date().toISOString()
          },
          hasUnsavedChanges: true
        }));
      },

      trackChordUsage: (chord) => {
        set((state) => ({
          ...state,
          usage: {
            ...state.usage,
            mostUsedChords: {
              ...state.usage.mostUsedChords,
              [chord]: (state.usage.mostUsedChords[chord] || 0) + 1
            },
            lastActiveDate: new Date().toISOString()
          },
          hasUnsavedChanges: true
        }));
      },

      trackScaleUsage: (scale) => {
        set((state) => ({
          ...state,
          usage: {
            ...state.usage,
            mostUsedScales: {
              ...state.usage.mostUsedScales,
              [scale]: (state.usage.mostUsedScales[scale] || 0) + 1
            },
            lastActiveDate: new Date().toISOString()
          },
          hasUnsavedChanges: true
        }));
      },

      updateSkillLevel: (level) => {
        set((state) => ({
          ...state,
          usage: { ...state.usage, skillLevel: level },
          hasUnsavedChanges: true
        }));
      },

      loadSettings: () => {
        set((state) => ({
          ...state,
          isLoaded: true
        }));
      },

      saveSettings: () => {
        set((state) => ({
          ...state,
          hasUnsavedChanges: false,
          lastSavedAt: Date.now()
        }));
      },

      resetSettings: () => {
        set(initialState);
      },

      resetToDefaults: () => {
        set((state) => ({
          ...initialState,
          usage: state.usage, // Mantener estadísticas
          hasUnsavedChanges: true
        }));
      },

      exportSettings: () => {
        const state = get();
        const exportData = {
          theme: state.theme,
          layout: state.layout,
          detection: state.detection,
          accessibility: state.accessibility,
          performance: state.performance,
          keyboardMapping: state.keyboardMapping,
          userPreferences: state.userPreferences,
          version: state.version
        };
        return JSON.stringify(exportData, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const importData = JSON.parse(settingsJson);
          
          set((state) => ({
            ...state,
            theme: importData.theme || state.theme,
            layout: importData.layout || state.layout,
            detection: importData.detection || state.detection,
            accessibility: importData.accessibility || state.accessibility,
            performance: importData.performance || state.performance,
            keyboardMapping: importData.keyboardMapping || state.keyboardMapping,
            userPreferences: importData.userPreferences || state.userPreferences,
            hasUnsavedChanges: true
          }));
          
          console.log('⚙️ Settings imported successfully');
          return true;
        } catch (error) {
          console.error('⚙️ Failed to import settings:', error);
          return false;
        }
      },

      markAsChanged: () => {
        set((state) => ({
          ...state,
          hasUnsavedChanges: true
        }));
      },

      clearUnsavedChanges: () => {
        set((state) => ({
          ...state,
          hasUnsavedChanges: false
        }));
      },

      getSettingsSummary: () => {
        const state = get();
        return {
          theme: `${state.theme.colorScheme} mode, ${state.theme.accentColor} accent`,
          piano: `${state.layout.pianoSize} size, ${state.layout.compactMode ? 'compact' : 'full'} layout`,
          detection: state.detection.enabled ? 'enabled' : 'disabled',
          keyboard: state.keyboardMapping.enabled ? state.keyboardMapping.currentLayout : 'disabled',
          usage: `${state.usage.totalSessions} sessions, ${Math.round(state.usage.totalPlayTime / 60)} minutes`,
          skillLevel: state.usage.skillLevel
        };
      },

      validateSettings: () => {
        const state = get();
        
        // Validaciones básicas
        const validations = [
          state.detection.sensitivity >= 0 && state.detection.sensitivity <= 1,
          state.userPreferences.defaultOctave >= 0 && state.userPreferences.defaultOctave <= 8,
          state.userPreferences.defaultVolume >= 0 && state.userPreferences.defaultVolume <= 1,
          state.performance.maxPolyphony >= 1 && state.performance.maxPolyphony <= 128,
          state.keyboardMapping.octaveShift >= -3 && state.keyboardMapping.octaveShift <= 3,
          state.keyboardMapping.transposeShift >= -12 && state.keyboardMapping.transposeShift <= 12
        ];
        
        return validations.every(Boolean);
      },

      migrateSettings: (oldVersion) => {
        console.log(`⚙️ Migrating settings from version ${oldVersion} to ${initialState.version}`);
        // Implementar lógica de migración aquí
      }
    })),
    
    // Configuración de persistencia
    {
      name: 'psanter-settings',
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        layout: state.layout,
        detection: state.detection,
        accessibility: state.accessibility,
        performance: state.performance,
        advanced: state.advanced,
        keyboardMapping: state.keyboardMapping,
        userPreferences: state.userPreferences,
        usage: state.usage,
        version: state.version
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoaded = true;
          state.hasUnsavedChanges = false;
          console.log('⚙️ Settings rehydrated from storage');
        }
      }
    }
  )
);

// ========================================================================================
// HOOKS DERIVADOS PARA OPTIMIZACIÓN
// ========================================================================================

// Hook para obtener solo el tema
export const useThemeSettings = () => {
  return useSettingsStore((state) => state.theme);
};

// Hook para obtener solo la configuración de layout
export const useLayoutSettings = () => {
  return useSettingsStore((state) => state.layout);
};

// Hook para obtener solo la configuración de detección
export const useDetectionSettings = () => {
  return useSettingsStore((state) => state.detection);
};

// Hook para obtener solo la configuración de accesibilidad
export const useAccessibilitySettings = () => {
  return useSettingsStore((state) => state.accessibility);
};

// Hook para obtener solo la configuración de mapeo de teclado
export const useKeyboardMappingSettings = () => {
  return useSettingsStore((state) => state.keyboardMapping);
};

// Hook para obtener solo las preferencias de usuario
export const useUserPreferences = () => {
  return useSettingsStore((state) => state.userPreferences);
};

// Hook para obtener solo las estadísticas de uso
export const useUsageStats = () => {
  return useSettingsStore((state) => state.usage);
};

// ========================================================================================
// UTILIDADES Y DEBUGGING
// ========================================================================================

// Función para debugging del estado
export const debugSettingsStore = () => {
  const state = useSettingsStore.getState();
  console.log('⚙️ Settings Store Debug:', {
    loaded: state.isLoaded,
    hasChanges: state.hasUnsavedChanges,
    theme: `${state.theme.colorScheme}/${state.theme.accentColor}`,
    pianoSize: state.layout.pianoSize,
    detectionEnabled: state.detection.enabled,
    keyboardEnabled: state.keyboardMapping.enabled,
    totalSessions: state.usage.totalSessions,
    skillLevel: state.usage.skillLevel,
    version: state.version
  });
};

// Función para resetear completamente el store
export const resetSettingsStore = () => {
  useSettingsStore.getState().resetSettings();
};

// ========================================================================================
// SUBSCRIPCIONES AUTOMÁTICAS
// ========================================================================================

if (process.env.NODE_ENV === 'development') {
  // Logging de cambios de tema
  useSettingsStore.subscribe(
    (state) => state.theme.colorScheme,
    (scheme) => {
      console.log(`⚙️ Color scheme changed to: ${scheme}`);
    }
  );

  // Logging de cambios en modo debug
  useSettingsStore.subscribe(
    (state) => state.advanced.debugMode,
    (debugMode) => {
      console.log(`⚙️ Debug mode ${debugMode ? 'enabled' : 'disabled'}`);
    }
  );

  // Auto-save cuando hay cambios
  useSettingsStore.subscribe(
    (state) => state.hasUnsavedChanges,
    (hasChanges) => {
      if (hasChanges && useSettingsStore.getState().advanced.autoSave) {
        setTimeout(() => {
          useSettingsStore.getState().saveSettings();
          console.log('⚙️ Settings auto-saved');
        }, 1000);
      }
    }
  );
}

// Log inicial
console.log('⚙️ Settings Store initialized successfully');

export default useSettingsStore;