/**
 * Application State Management with Zustand
 * 
 * Centralized state management for FTIR Annotator
 * 
 * Author: WALL·E
 * Date: 2026-02-19
 */

import { create } from 'zustand'
import { detectPeaks as performPeakDetection } from '../lib/peakDetector'
import { matchAllPeaks } from '../lib/ruleMatcher'
import rulesDb from '../data/ftir-rules-database.json'

/**
 * Main application store
 * 
 * State structure:
 * - spectrum: Raw spectrum data
 * - peaks: Detected peaks
 * - annotations: Rule matching results
 * - ui: UI state (loading, errors, selected peak, etc.)
 * - settings: Detection and matching settings
 */
export const useAppStore = create((set, get) => ({
  // ==================== Spectrum Data ====================
  spectrum: null,
  
  setSpectrum: (spectrum) => set({ spectrum }),
  
  clearSpectrum: () => set({
    spectrum: null,
    peaks: null,
    annotations: null,
    ambiguities: null,
    ui: {
      ...get().ui,
      status: 'idle',
      message: ''
    }
  }),

  // ==================== Peak Detection ====================
  peaks: null,
  
  setPeaks: (peaks) => set({ peaks }),
  
  // ==================== Annotations ====================
  annotations: null,
  ambiguities: null,
  peakAnnotations: {}, // {peakIndex: {candidateIndex: N, skipped: bool}}
  
  setAnnotations: (annotations) => set({ annotations }),
  
  setAmbiguities: (ambiguities) => set({ ambiguities }),
  
  setAnnotationResults: (results) => set({
    annotations: results.annotations,
    ambiguities: results.ambiguities,
    peakAnnotations: {} // Reset review state when new annotations arrive
  }),

  /**
   * Select a candidate for a specific peak
   */
  selectAnnotation: (peakIndex, candidateIndex) => {
    set(state => ({
      peakAnnotations: {
        ...state.peakAnnotations,
        [peakIndex]: {
          candidateIndex,
          skipped: false
        }
      }
    }))
  },

  /**
   * Mark a peak as "Don't Annotate"
   */
  skipAnnotation: (peakIndex) => {
    set(state => ({
      peakAnnotations: {
        ...state.peakAnnotations,
        [peakIndex]: {
          candidateIndex: null,
          skipped: true
        }
      }
    }))
  },

  // ==================== UI State ====================
  ui: {
    status: 'idle', // 'idle', 'loading', 'success', 'error'
    message: '',
    selectedPeakIndex: null,
    selectedCandidateIndex: 0,
    showAmbiguitiesOnly: false,
    showPlotlyInfo: false,
    exportFormat: 'json' // 'json', 'csv'
  },

  setUIStatus: (status, message = '') => set({
    ui: {
      ...get().ui,
      status,
      message
    }
  }),

  setSelectedPeak: (index) => set({
    ui: {
      ...get().ui,
      selectedPeakIndex: index,
      selectedCandidateIndex: 0
    }
  }),

  setSelectedCandidate: (index) => set({
    ui: {
      ...get().ui,
      selectedCandidateIndex: index
    }
  }),

  toggleAmbiguitiesOnly: () => set({
    ui: {
      ...get().ui,
      showAmbiguitiesOnly: !get().ui.showAmbiguitiesOnly
    }
  }),

  setExportFormat: (format) => set({
    ui: {
      ...get().ui,
      exportFormat: format
    }
  }),

  // ==================== Peak Detection Parameters ====================
  peakDetectionParams: {
    smoothingWindow: 7,        // Default 7 (3-21, odd)
    peakHeightThreshold: 0.01, // Default 0.01 (0.005-0.05)
  },

  updatePeakDetectionParams: (params) => set({
    peakDetectionParams: {
      ...get().peakDetectionParams,
      ...params
    }
  }),

  resetPeakDetectionParams: () => set({
    peakDetectionParams: {
      smoothingWindow: 7,
      peakHeightThreshold: 0.01,
    }
  }),

  // ==================== Rule Matching Parameters ====================
  ruleMatchingParams: {
    wavenumberTolerance: 5,   // Default 5% (1-15%)
    ambiguityThreshold: 10,   // Default 10% (1-20%)
  },

  updateRuleMatchingParams: (params) => set({
    ruleMatchingParams: {
      ...get().ruleMatchingParams,
      ...params
    }
  }),

  resetRuleMatchingParams: () => set({
    ruleMatchingParams: {
      wavenumberTolerance: 5,
      ambiguityThreshold: 10,
    }
  }),

  // ==================== Detection & Matching Actions ====================
  
  /**
   * Detect peaks from spectrum using current parameters
   */
  detectPeaks: () => {
    const state = get()
    const { spectrum, peakDetectionParams } = state

    if (!spectrum || !spectrum.wavenumber || !spectrum.absorbance) {
      set(state => ({
        ui: {
          ...state.ui,
          status: 'error',
          message: 'No spectrum data available'
        }
      }))
      return
    }

    try {
      set(state => ({
        ui: { ...state.ui, status: 'loading', message: 'Detecting peaks...' }
      }))

      // Call peak detection algorithm
      // Note: peakDetector expects (wavenumber, transmittance, options)
      // If spectrum is already in absorbance, we need to convert back
      // For now, assume spectrum contains wavenumber and transmittance
      const detectedPeaks = performPeakDetection(
        spectrum.wavenumber,
        spectrum.transmittance || spectrum.absorbance, // Support both
        {
          minHeight: peakDetectionParams.peakHeightThreshold || 0.01,
          smoothWindowLength: peakDetectionParams.smoothingWindow || 7,
          prominencePercent: 5, // Auto 5%
          distancePercent: 2
        }
      )

      set(state => {
        const newState = {
          peaks: detectedPeaks,
          annotations: null,
          ambiguities: null,
          ui: {
            ...state.ui,
            status: 'success',
            message: `Detected ${detectedPeaks.length} peaks`
          }
        }
        return newState
      })

      // Add to history
      get().addToHistory({
        action: 'detectPeaks',
        count: detectedPeaks.length,
        params: peakDetectionParams
      })
    } catch (error) {
      set(state => ({
        ui: {
          ...state.ui,
          status: 'error',
          message: `Peak detection error: ${error.message}`
        }
      }))
    }
  },

  /**
   * Annotate peaks using rule matching
   */
  annotatePeaks: () => {
    const state = get()
    const { peaks, ruleMatchingParams } = state

    if (!peaks || peaks.length === 0) {
      set(state => ({
        ui: {
          ...state.ui,
          status: 'error',
          message: 'No peaks to annotate'
        }
      }))
      return
    }

    try {
      set(state => ({
        ui: { ...state.ui, status: 'loading', message: 'Matching peaks...' }
      }))

      // Call rule matching algorithm
      const annotations = matchAllPeaks(peaks, rulesDb)

      // Detect ambiguities based on threshold
      const ambiguities = annotations.filter(ann => {
        const candidates = ann.topFiveCandidates || []
        if (candidates.length < 2) return false

        const conf1 = candidates[0].confidence
        const conf2 = candidates[1].confidence
        const diffPercent = (conf1 - conf2) * 100

        return diffPercent < (ruleMatchingParams.ambiguityThreshold || 10)
      })

      set(state => ({
        annotations,
        ambiguities,
        ui: {
          ...state.ui,
          status: 'success',
          message: `Annotated ${annotations.length} peaks (${ambiguities.length} ambiguous)`
        }
      }))

      // Add to history
      get().addToHistory({
        action: 'annotatePeaks',
        count: annotations.length,
        ambiguousCount: ambiguities.length,
        params: ruleMatchingParams
      })
    } catch (error) {
      set(state => ({
        ui: {
          ...state.ui,
          status: 'error',
          message: `Annotation error: ${error.message}`
        }
      }))
    }
  },

  // ==================== Legacy Settings (for compatibility) ====================
  detectionSettings: {
    smoothWindowLength: 11,
    smoothPolyorder: 3,
    baselineMethod: 'linear',
    minHeight: 0.005,
    prominencePercent: 5,
    distancePercent: 2,
    autoDetect: true
  },

  updateDetectionSettings: (settings) => set({
    detectionSettings: {
      ...get().detectionSettings,
      ...settings
    }
  }),

  resetDetectionSettings: () => set({
    detectionSettings: {
      smoothWindowLength: 11,
      smoothPolyorder: 3,
      baselineMethod: 'linear',
      minHeight: 0.005,
      prominencePercent: 5,
      distancePercent: 2,
      autoDetect: true
    }
  }),

  // ==================== Matching Settings ====================
  matchingSettings: {
    ambiguityThreshold: 0.05,
    minConfidence: 0.5
  },

  updateMatchingSettings: (settings) => set({
    matchingSettings: {
      ...get().matchingSettings,
      ...settings
    }
  }),

  // ==================== Filtered Results ====================
  
  /**
   * Get filtered annotations based on UI settings
   */
  getFilteredAnnotations: () => {
    const state = get()
    const { annotations, ambiguities, ui } = state

    if (!annotations) return []

    if (ui.showAmbiguitiesOnly && ambiguities) {
      // Return only ambiguous peaks
      const ambiguousIndices = new Set(ambiguities.map(a => a.peakIndex))
      return annotations.filter(a => ambiguousIndices.has(a.peakIndex))
    }

    return annotations
  },

  /**
   * Get selected peak details
   */
  getSelectedPeakDetails: () => {
    const state = get()
    const { annotations, ui } = state

    if (!annotations || ui.selectedPeakIndex === null) {
      return null
    }

    const annotation = annotations[ui.selectedPeakIndex]
    if (!annotation) return null

    return {
      annotation,
      selectedCandidate: annotation.topFiveCandidates[ui.selectedCandidateIndex]
    }
  },

  /**
   * Get summary statistics
   */
  getSummary: () => {
    const state = get()
    const { spectrum, peaks, annotations, ambiguities } = state

    if (!spectrum || !peaks || !annotations) {
      return {
        spectrumDataPoints: 0,
        detectedPeaks: 0,
        annotatedPeaks: 0,
        ambiguousPeaks: 0,
        averageConfidence: 0
      }
    }

    const avgConfidence = annotations.length > 0
      ? annotations.reduce((sum, a) => sum + a.primaryMatch.confidence, 0) / annotations.length
      : 0

    return {
      spectrumDataPoints: spectrum.dataPoints,
      detectedPeaks: peaks.length,
      annotatedPeaks: annotations.length,
      ambiguousPeaks: ambiguities ? ambiguities.length : 0,
      averageConfidence: parseFloat(avgConfidence.toFixed(3))
    }
  },

  // ==================== History (Optional) ====================
  history: [],

  addToHistory: (entry) => {
    const state = get()
    const newHistory = [
      {
        timestamp: new Date().toISOString(),
        ...entry
      },
      ...state.history
    ].slice(0, 50) // Keep only last 50 entries

    set({ history: newHistory })
  },

  clearHistory: () => set({ history: [] }),

  // ==================== Utilities ====================
  
  /**
   * Check if analysis is complete
   */
  isAnalysisComplete: () => {
    const state = get()
    return !!(state.spectrum && state.peaks && state.annotations)
  },

  /**
   * Reset entire store
   */
  reset: () => set({
    spectrum: null,
    peaks: null,
    annotations: null,
    ambiguities: null,
    ui: {
      status: 'idle',
      message: '',
      selectedPeakIndex: null,
      selectedCandidateIndex: 0,
      showAmbiguitiesOnly: false,
      showPlotlyInfo: false,
      exportFormat: 'json'
    },
    history: []
  })
}))

/**
 * Export store for testing
 */
export default useAppStore
