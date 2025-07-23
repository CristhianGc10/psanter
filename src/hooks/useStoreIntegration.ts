// src/hooks/useStoreIntegration.ts
/**
 * Hook principal para integrar todos los stores
 * Previene memory leaks y maneja subscripciones correctamente
 */

import { useEffect, useRef } from 'react';
import { usePianoStore } from '../store/pianoStore';
import { useAudioStore } from '../store/audioStore';
import { useSettingsStore } from '../store/settingsStore';
import { useDetectionStore } from '../store/detectionStore';

export const useStoreIntegration = () => {
  const initialized = useRef(false);
  const cleanupFunctions = useRef<(() => void)[]>([]);

  // Estados de los stores
  const pianoStore = usePianoStore();
  const audioStore = useAudioStore();
  const settingsStore = useSettingsStore();
  const detectionStore = useDetectionStore();

  useEffect(() => {
    if (initialized.current) return;

    const initializeStores = async () => {
      try {
        // 1. Inicializar piano store
        pianoStore.initialize();
        
        // 2. Inicializar audio store
        await audioStore.initializeAudio();
        
        // 3. Cargar configuraciones
        settingsStore.loadSettings();
        
        // 4. Habilitar detección
        detectionStore.enable();

        console.log('🎯 All stores initialized successfully');
        initialized.current = true;

      } catch (error) {
        console.error('❌ Store initialization failed:', error);
      }
    };

    initializeStores();

    // Cleanup function
    return () => {
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, []); // Dependencias vacías - solo ejecutar una vez

  // Sincronización entre stores - con dependencias estables
  useEffect(() => {
    // Solo ejecutar si ya está inicializado
    if (!initialized.current) return;

    // Sincronizar teclas presionadas con detección
    const unsubscribePiano = usePianoStore.subscribe(
      (state) => state.activeNotes,
      (activeNotes) => {
        const settings = useSettingsStore.getState();
        if (settings.detection.autoDetection) {
          const detection = useDetectionStore.getState();
          detection.analyzeNotes(Array.from(activeNotes));
        }
      }
    );

    // Sincronizar volumen entre piano y audio
    const unsubscribeVolume = usePianoStore.subscribe(
      (state) => state.masterVolume,
      (volume) => {
        const audio = useAudioStore.getState();
        audio.setMasterVolume(volume);
      }
    );

    // Guardar funciones de cleanup
    cleanupFunctions.current.push(unsubscribePiano, unsubscribeVolume);

    return () => {
      unsubscribePiano();
      unsubscribeVolume();
    };
  }, [initialized.current]); // Dependencia estable

  return {
    isReady: initialized.current && 
             pianoStore.isInitialized && 
             audioStore.isInitialized,
    stores: {
      piano: pianoStore,
      audio: audioStore,
      settings: settingsStore,
      detection: detectionStore
    }
  };
};