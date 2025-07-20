/**
 * ARCHIVO NUEVO: src/utils/optimizedDetection.ts
 * Sistema de detección musical optimizado - Capa de optimización sobre sistemas existentes
 */

import type { NoteName } from '../types/piano';
import { 
  CHORD_PATTERNS, 
  SCALE_PATTERNS,
  CHORD_NAMES,
  SCALE_NAMES,
  CHROMATIC_NOTES
} from '../data/musicalData';

// Importar sistemas existentes
import { 
  detectChords as originalDetectChords,
  type DetectedChord,
  type ChordDetectionResult 
} from './chordDetection';

import {
  detectScales as originalDetectScales,
  type DetectedScale,
  type ScaleDetectionResult
} from './scaleDetection';

// ========================================================================================
// TIPOS OPTIMIZADOS
// ========================================================================================

export interface OptimizedChordResult {
  chord: DetectedChord;
  confidence: number;
  alternatives: DetectedChord[];
  reasoning: string;
  certainty: 'high' | 'medium' | 'low';
}

export interface OptimizedScaleResult {
  scale: DetectedScale;
  confidence: number;
  alternatives: DetectedScale[];
  reasoning: string;
  certainty: 'high' | 'medium' | 'low';
}

interface MusicalContext {
  recentChords: DetectedChord[];
  recentScales: DetectedScale[];
  establishedKey: string | null;
  progressionHistory: string[];
}

// ========================================================================================
// CONFIGURACIÓN
// ========================================================================================

const OPTIMIZATION_CONFIG = {
  weights: {
    noteMatch: 0.35,
    contextualFit: 0.25,
    commonality: 0.20,
    temporalConsistency: 0.15,
    harmonicStability: 0.05
  },
  
  thresholds: {
    highCertainty: 0.85,
    mediumCertainty: 0.65,
    minimumAcceptable: 0.40
  },
  
  precedenceRules: {
    // Casos idénticos - preferir nombres más comunes
    identicalScales: new Map([
      ['IONIAN', 'MAJOR'],
      ['AEOLIAN', 'NATURAL_MINOR'],
      ['SUPER_PHRYGIAN', 'HARMONIC_MINOR']
    ]),
    
    // Preferir acordes extendidos si están completas
    preferExtended: true
  }
};

// ========================================================================================
// MEMORIA MUSICAL
// ========================================================================================

class MusicalMemory {
  private context: MusicalContext = {
    recentChords: [],
    recentScales: [],
    establishedKey: null,
    progressionHistory: []
  };

  updateChord(chord: DetectedChord): void {
    this.context.recentChords.push(chord);
    if (this.context.recentChords.length > 8) {
      this.context.recentChords.shift();
    }
    this.context.progressionHistory.push(chord.name);
  }

  updateScale(scale: DetectedScale): void {
    this.context.recentScales.push(scale);
    if (this.context.recentScales.length > 5) {
      this.context.recentScales.shift();
    }
    this.updateEstablishedKey();
  }

  private updateEstablishedKey(): void {
    if (this.context.recentScales.length < 2) return;
    
    const recentTonics = this.context.recentScales.slice(-3).map(s => s.tonic);
    const tonicCounts = recentTonics.reduce((acc, tonic) => {
      acc[tonic] = (acc[tonic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantTonic = Object.entries(tonicCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (dominantTonic && dominantTonic[1] >= 2) {
      this.context.establishedKey = dominantTonic[0];
    }
  }

  getContext(): MusicalContext {
    return { ...this.context };
  }

  reset(): void {
    this.context = {
      recentChords: [],
      recentScales: [],
      establishedKey: null,
      progressionHistory: []
    };
  }
}

// Instancia global
const globalMemory = new MusicalMemory();

// ========================================================================================
// ALGORITMOS DE OPTIMIZACIÓN
// ========================================================================================

/**
 * Resuelve casos idénticos aplicando reglas de precedencia
 */
function resolveIdenticalCases<T extends DetectedChord | DetectedScale>(
  candidates: T[]
): T[] {
  if (candidates.length <= 1) return candidates;

  const { identicalScales } = OPTIMIZATION_CONFIG.precedenceRules;
  
  return candidates.filter(candidate => {
    const conflicting = candidates.find(other => 
      other !== candidate && 
      Math.abs(other.confidence - candidate.confidence) < 0.01
    );
    
    if (conflicting) {
      // Aplicar reglas de precedencia para escalas
      if ('mode' in candidate) {
        const preferred = identicalScales.get(candidate.type);
        const conflictingPreferred = identicalScales.get(conflicting.type);
        
        if (preferred === conflicting.type) return false; // Eliminar este
        if (conflictingPreferred === candidate.type) return true; // Mantener este
      }
    }
    
    return true;
  });
}

/**
 * Calcula scoring contextual
 */
function calculateContextualScore<T extends DetectedChord | DetectedScale>(
  candidate: T,
  context: MusicalContext
): number {
  let score = 0;
  
  // 1. Compatibilidad con acordes recientes
  if (context.recentChords.length > 0) {
    const isCompatible = isHarmonicallyCompatible(candidate, context);
    score += isCompatible ? 0.3 : -0.1;
  }
  
  // 2. Coherencia con tonalidad establecida
  if (context.establishedKey) {
    const candidateRoot = 'root' in candidate ? candidate.root : candidate.tonic;
    if (candidateRoot === context.establishedKey) {
      score += 0.4;
    }
  }
  
  // 3. Peso por tipo común
  const commonTypes = ['MAJOR', 'MINOR', 'DOMINANT_7', 'NATURAL_MINOR'];
  if (commonTypes.includes(candidate.type)) {
    score += 0.2;
  }
  
  return Math.max(0, Math.min(1, score));
}

function isHarmonicallyCompatible<T extends DetectedChord | DetectedScale>(
  candidate: T,
  context: MusicalContext
): boolean {
  if (context.recentChords.length === 0) return true;
  
  const lastChord = context.recentChords[context.recentChords.length - 1];
  const candidateRoot = 'root' in candidate ? candidate.root : candidate.tonic;
  
  // Intervalos armónicos comunes (4ª, 5ª, 3ª)
  const rootDistance = getIntervalDistance(lastChord.root, candidateRoot);
  const harmonicIntervals = [5, 7, 3, 4, 8, 9]; // 4ª, 5ª, 3ª mayor/menor, 6ª
  
  return harmonicIntervals.includes(rootDistance);
}

function getIntervalDistance(note1: string, note2: string): number {
  const index1 = CHROMATIC_NOTES.indexOf(note1 as any);
  const index2 = CHROMATIC_NOTES.indexOf(note2 as any);
  
  if (index1 === -1 || index2 === -1) return 0;
  return (index2 - index1 + 12) % 12;
}

/**
 * Calcula scoring combinado final
 */
function calculateFinalScore<T extends DetectedChord | DetectedScale>(
  candidate: T & { contextScore: number }
): number {
  const weights = OPTIMIZATION_CONFIG.weights;
  
  return (
    candidate.confidence * weights.noteMatch +
    candidate.contextScore * weights.contextualFit +
    getCommonalityScore(candidate) * weights.commonality +
    getTemporalScore(candidate) * weights.temporalConsistency +
    getStabilityScore(candidate) * weights.harmonicStability
  );
}

function getCommonalityScore<T extends DetectedChord | DetectedScale>(candidate: T): number {
  const commonTypes = ['MAJOR', 'MINOR', 'DOMINANT_7', 'MAJOR_7', 'NATURAL_MINOR', 'DORIAN'];
  return commonTypes.includes(candidate.type) ? 0.8 : 0.5;
}

function getTemporalScore<T extends DetectedChord | DetectedScale>(candidate: T): number {
  const context = globalMemory.getContext();
  const recentTypes = [
    ...context.recentChords.map(c => c.type),
    ...context.recentScales.map(s => s.type)
  ];
  
  return recentTypes.includes(candidate.type) ? 0.7 : 0.4;
}

function getStabilityScore<T extends DetectedChord | DetectedScale>(candidate: T): number {
  const stableTypes = ['MAJOR', 'MINOR', 'NATURAL_MINOR'];
  return stableTypes.includes(candidate.type) ? 0.8 : 0.6;
}

/**
 * Determina nivel de certeza
 */
function determineCertainty(
  winnerScore: number,
  allScores: number[]
): 'high' | 'medium' | 'low' {
  const { highCertainty, mediumCertainty } = OPTIMIZATION_CONFIG.thresholds;
  
  if (winnerScore >= highCertainty) {
    const secondBest = Math.max(...allScores.filter(s => s < winnerScore));
    const margin = winnerScore - secondBest;
    
    return margin >= 0.15 ? 'high' : 'medium';
  }
  
  return winnerScore >= mediumCertainty ? 'medium' : 'low';
}

/**
 * Genera explicación del resultado
 */
function generateReasoning<T extends DetectedChord | DetectedScale>(
  winner: T,
  alternatives: T[],
  type: 'chord' | 'scale'
): string {
  const reasons = [];
  
  if (winner.confidence >= 0.9) {
    reasons.push('coincidencia perfecta de notas');
  } else if (winner.confidence >= 0.7) {
    reasons.push('buena coincidencia de notas');
  }
  
  if (alternatives.length === 0) {
    reasons.push('único candidato viable');
  } else {
    reasons.push(`superó ${alternatives.length} alternativas`);
  }
  
  const commonTypes = ['MAJOR', 'MINOR', 'NATURAL_MINOR'];
  if (commonTypes.includes(winner.type)) {
    reasons.push('patrón musical común');
  }
  
  return `Seleccionado por: ${reasons.join(', ')}`;
}

// ========================================================================================
// FUNCIONES PRINCIPALES OPTIMIZADAS
// ========================================================================================

/**
 * FUNCIÓN PRINCIPAL PARA ACORDES - Usa tu sistema existente y lo optimiza
 */
export function detectOptimalChord(notes: NoteName[]): OptimizedChordResult | null {
  // 1. Usar tu sistema existente para obtener candidatos
  const originalResult: ChordDetectionResult = originalDetectChords(notes);
  
  // 2. Recopilar todos los candidatos
  const allCandidates = [
    ...(originalResult.primaryChord ? [originalResult.primaryChord] : []),
    ...originalResult.alternativeChords
  ];
  
  if (allCandidates.length === 0) return null;
  
  // 3. Filtrar candidatos viables
  const viableCandidates = allCandidates.filter(c => 
    c.confidence >= OPTIMIZATION_CONFIG.thresholds.minimumAcceptable &&
    c.quality !== 'weak'
  );
  
  if (viableCandidates.length === 0) {
    return {
      chord: allCandidates[0],
      confidence: allCandidates[0].confidence,
      alternatives: [],
      reasoning: 'Único candidato disponible (baja confianza)',
      certainty: 'low'
    };
  }
  
  if (viableCandidates.length === 1) {
    const winner = viableCandidates[0];
    globalMemory.updateChord(winner);
    
    return {
      chord: winner,
      confidence: winner.confidence,
      alternatives: [],
      reasoning: 'Único candidato viable',
      certainty: winner.confidence >= OPTIMIZATION_CONFIG.thresholds.highCertainty ? 'high' : 'medium'
    };
  }
  
  // 4. Optimización avanzada para múltiples candidatos
  const resolved = resolveIdenticalCases(viableCandidates);
  const context = globalMemory.getContext();
  
  // 5. Calcular scores contextuales
  const withContext = resolved.map(candidate => ({
    ...candidate,
    contextScore: calculateContextualScore(candidate, context)
  }));
  
  // 6. Calcular scores finales
  const withFinalScores = withContext.map(candidate => ({
    ...candidate,
    finalScore: calculateFinalScore(candidate)
  }));
  
  // 7. Seleccionar ganador
  const winner = withFinalScores.reduce((best, current) => 
    current.finalScore > best.finalScore ? current : best
  );
  
  // 8. Preparar alternativas
  const alternatives = withFinalScores
    .filter(c => c !== winner)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3)
    .map(({ contextScore, finalScore, ...chord }) => chord);
  
  // 9. Actualizar memoria y devolver resultado
  globalMemory.updateChord(winner);
  
  const allFinalScores = withFinalScores.map(c => c.finalScore);
  
  return {
    chord: winner,
    confidence: winner.finalScore,
    alternatives,
    reasoning: generateReasoning(winner, alternatives, 'chord'),
    certainty: determineCertainty(winner.finalScore, allFinalScores)
  };
}

/**
 * FUNCIÓN PRINCIPAL PARA ESCALAS - Usa tu sistema existente y lo optimiza
 */
export function detectOptimalScale(notes: NoteName[]): OptimizedScaleResult | null {
  // 1. Usar tu sistema existente para obtener candidatos
  const originalResult: ScaleDetectionResult = originalDetectScales(notes);
  
  // 2. Recopilar todos los candidatos
  const allCandidates = [
    ...(originalResult.primaryScale ? [originalResult.primaryScale] : []),
    ...originalResult.alternativeScales
  ];
  
  if (allCandidates.length === 0) return null;
  
  // 3. Filtrar candidatos viables
  const viableCandidates = allCandidates.filter(c => 
    c.confidence >= OPTIMIZATION_CONFIG.thresholds.minimumAcceptable &&
    c.quality !== 'weak'
  );
  
  if (viableCandidates.length === 0) {
    return {
      scale: allCandidates[0],
      confidence: allCandidates[0].confidence,
      alternatives: [],
      reasoning: 'Único candidato disponible (baja confianza)',
      certainty: 'low'
    };
  }
  
  if (viableCandidates.length === 1) {
    const winner = viableCandidates[0];
    globalMemory.updateScale(winner);
    
    return {
      scale: winner,
      confidence: winner.confidence,
      alternatives: [],
      reasoning: 'Único candidato viable',
      certainty: winner.confidence >= OPTIMIZATION_CONFIG.thresholds.highCertainty ? 'high' : 'medium'
    };
  }
  
  // 4. Optimización avanzada para múltiples candidatos
  const resolved = resolveIdenticalCases(viableCandidates);
  const context = globalMemory.getContext();
  
  // 5. Calcular scores contextuales
  const withContext = resolved.map(candidate => ({
    ...candidate,
    contextScore: calculateContextualScore(candidate, context)
  }));
  
  // 6. Calcular scores finales
  const withFinalScores = withContext.map(candidate => ({
    ...candidate,
    finalScore: calculateFinalScore(candidate)
  }));
  
  // 7. Seleccionar ganador
  const winner = withFinalScores.reduce((best, current) => 
    current.finalScore > best.finalScore ? current : best
  );
  
  // 8. Preparar alternativas
  const alternatives = withFinalScores
    .filter(c => c !== winner)
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 3)
    .map(({ contextScore, finalScore, ...scale }) => scale);
  
  // 9. Actualizar memoria y devolver resultado
  globalMemory.updateScale(winner);
  
  const allFinalScores = withFinalScores.map(c => c.finalScore);
  
  return {
    scale: winner,
    confidence: winner.finalScore,
    alternatives,
    reasoning: generateReasoning(winner, alternatives, 'scale'),
    certainty: determineCertainty(winner.finalScore, allFinalScores)
  };
}

// ========================================================================================
// API PÚBLICA Y UTILIDADES
// ========================================================================================

/**
 * Reinicia la memoria musical (útil para testing o cambio de contexto)
 */
export function resetMusicalContext(): void {
  globalMemory.reset();
}

/**
 * Obtiene estadísticas del sistema optimizado
 */
export function getOptimizationStats() {
  const context = globalMemory.getContext();
  return {
    recentChords: context.recentChords.length,
    recentScales: context.recentScales.length,
    establishedKey: context.establishedKey,
    progressionLength: context.progressionHistory.length,
    lastProgression: context.progressionHistory.slice(-5)
  };
}

/**
 * Compatibilidad: envuelve el resultado optimizado en el formato original
 */
export function detectChordsOptimized(notes: NoteName[]): ChordDetectionResult {
  const optimized = detectOptimalChord(notes);
  
  if (!optimized) {
    return {
      primaryChord: null,
      alternativeChords: [],
      timestamp: Date.now(),
      inputNotes: notes
    };
  }
  
  return {
    primaryChord: optimized.chord,
    alternativeChords: optimized.alternatives,
    timestamp: Date.now(),
    inputNotes: notes
  };
}

/**
 * Compatibilidad: envuelve el resultado optimizado en el formato original
 */
export function detectScalesOptimized(notes: NoteName[]): ScaleDetectionResult {
  const optimized = detectOptimalScale(notes);
  
  if (!optimized) {
    return {
      primaryScale: null,
      alternativeScales: [],
      suggestedKey: null,
      modalInterchange: [],
      timestamp: Date.now(),
      inputNotes: notes,
      analysis: {
        tonalCenter: null,
        modality: 'unknown',
        stabilityScore: 0,
        chromaticism: 0,
        suggestions: []
      }
    };
  }
  
  return {
    primaryScale: optimized.scale,
    alternativeScales: optimized.alternatives,
    suggestedKey: optimized.scale.tonic,
    modalInterchange: [],
    timestamp: Date.now(),
    inputNotes: notes,
    analysis: {
      tonalCenter: optimized.scale.tonic,
      modality: optimized.scale.type.includes('MAJOR') ? 'major' : 
                optimized.scale.type.includes('MINOR') ? 'minor' : 'modal',
      stabilityScore: optimized.confidence,
      chromaticism: 0,
      suggestions: [optimized.reasoning]
    }
  };
}

console.log('🎯 Sistema de detección optimizado cargado');
console.log('✅ Integración con sistemas existentes completa');
console.log('🧠 Memoria musical contextual activa');