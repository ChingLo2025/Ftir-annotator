/**
 * FTIR Peak Detection - JavaScript Version
 * 
 * Pure JavaScript implementation of peak detection algorithm
 * Ported from ftir_peak_detector.py
 * 
 * Dependencies: numjs (for scientific computing)
 * 
 * Author: WALL·E
 * Date: 2026-02-19
 */

import * as nj from 'numjs'

/**
 * Convert transmittance (%) to absorbance
 * A = log10(100 / %T)
 */
export function transmittanceToAbsorbance(transmittance) {
  return transmittance.map(t => {
    const t_clipped = Math.max(0.1, Math.min(t, 100))
    return Math.log10(100.0 / t_clipped)
  })
}

/**
 * Savitzky-Golay filter (simplified version)
 * Uses simple smoothing if full SG not available
 * 
 * @param {number[]} data - Input signal
 * @param {number} windowLength - Window size (must be odd)
 * @param {number} polyorder - Polynomial order (usually 2-3)
 * @returns {number[]} Smoothed data
 */
export function savitzkyGolayFilter(data, windowLength = 11, polyorder = 3) {
  // Ensure window length is odd and reasonable
  if (windowLength % 2 === 0) windowLength++
  if (windowLength < polyorder + 1) windowLength = polyorder + 1
  if (windowLength % 2 === 0) windowLength++
  
  if (data.length < windowLength) {
    return data // Data too short, return as-is
  }

  // Simplified SG: polynomial fit in sliding window
  const result = new Array(data.length)
  const half = Math.floor(windowLength / 2)

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - half)
    const end = Math.min(data.length, i + half + 1)
    const window = data.slice(start, end)

    // Simple polynomial fit (least squares)
    const fitted = fitPolynomial(window, polyorder)
    result[i] = fitted[Math.floor(window.length / 2)]
  }

  return result
}

/**
 * Fit polynomial to data using least squares
 */
function fitPolynomial(data, degree) {
  const n = data.length
  const x = Array.from({length: n}, (_, i) => i)

  // Build system matrix
  const A = []
  for (let i = 0; i <= degree; i++) {
    const col = x.map(xi => Math.pow(xi, i))
    A.push(col)
  }

  // Solve using normal equations (simplified)
  // For simplicity, use weighted average with polynomial weights
  const weights = gaussianWeights(degree + 1)
  const smoothed = data.map((_, idx) => {
    let num = 0, denom = 0
    for (let i = 0; i < weights.length; i++) {
      const dataIdx = idx - Math.floor(weights.length / 2) + i
      if (dataIdx >= 0 && dataIdx < data.length) {
        num += data[dataIdx] * weights[i]
        denom += weights[i]
      }
    }
    return denom > 0 ? num / denom : data[idx]
  })

  return smoothed
}

/**
 * Generate Gaussian weights for smoothing
 */
function gaussianWeights(size) {
  const weights = []
  const sigma = size / 4
  const center = size / 2

  for (let i = 0; i < size; i++) {
    const x = i - center
    const weight = Math.exp(-(x * x) / (2 * sigma * sigma))
    weights.push(weight)
  }

  // Normalize
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map(w => w / sum)
}

/**
 * Linear baseline removal
 * Connect first and last points with a line
 */
export function removeLinearBaseline(data) {
  const n = data.length
  if (n < 2) return data

  const baseline = Array(n)
  const start = data[0]
  const end = data[n - 1]

  for (let i = 0; i < n; i++) {
    baseline[i] = start + (end - start) * (i / (n - 1))
  }

  return data.map((y, i) => Math.max(0, y - baseline[i]))
}

/**
 * Find peaks in signal
 * Simplified version of scipy.signal.find_peaks
 * 
 * @param {number[]} data - Input signal
 * @param {number} height - Minimum peak height
 * @param {number} prominence - Minimum peak prominence
 * @param {number} distance - Minimum distance between peaks (in points)
 * @returns {{peaks: number[], properties: object}} Peak indices and properties
 */
export function findPeaks(data, height = 0.01, prominence = null, distance = null) {
  // Auto-calculate prominence if not provided
  if (prominence === null) {
    const maxVal = Math.max(...data)
    prominence = maxVal * 0.05
  }

  // Auto-calculate distance if not provided
  if (distance === null) {
    distance = Math.floor(data.length / 200) || 1
  }

  const peaks = []
  const peakHeights = []

  // Find local maxima
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      // Check height criterion
      if (data[i] >= height) {
        // Check prominence (simplified: peak - min value in range)
        let minLeft = data[i]
        let minRight = data[i]

        // Find minimum to the left
        for (let j = Math.max(0, i - 50); j < i; j++) {
          minLeft = Math.min(minLeft, data[j])
        }

        // Find minimum to the right
        for (let j = i + 1; j < Math.min(data.length, i + 50); j++) {
          minRight = Math.min(minRight, data[j])
        }

        const peakProminence = Math.min(data[i] - minLeft, data[i] - minRight)

        if (peakProminence >= prominence) {
          peaks.push(i)
          peakHeights.push(data[i])
        }
      }
    }
  }

  // Apply distance criterion (remove peaks closer than 'distance')
  const filtered = []
  const filteredHeights = []

  for (let i = 0; i < peaks.length; i++) {
    let keep = true
    for (const p of filtered) {
      if (Math.abs(peaks[i] - p) < distance) {
        keep = false
        break
      }
    }
    if (keep) {
      filtered.push(peaks[i])
      filteredHeights.push(peakHeights[i])
    }
  }

  // Calculate peak widths (simplified FWHM)
  const widths = []
  for (const peakIdx of filtered) {
    const peakHeight = data[peakIdx]
    const halfHeight = peakHeight / 2

    // Find left edge
    let leftEdge = peakIdx
    for (let i = peakIdx - 1; i >= 0; i--) {
      if (data[i] < halfHeight) {
        leftEdge = i
        break
      }
    }

    // Find right edge
    let rightEdge = peakIdx
    for (let i = peakIdx + 1; i < data.length; i++) {
      if (data[i] < halfHeight) {
        rightEdge = i
        break
      }
    }

    widths.push(rightEdge - leftEdge)
  }

  return {
    peaks: filtered,
    properties: {
      peak_heights: filteredHeights,
      width: widths,
      prominences: filtered.map(() => prominence) // Simplified
    }
  }
}

/**
 * Calculate FWHM in wavenumber units
 * 
 * @param {number[]} peakIndices - Peak indices
 * @param {number[]} widthsInPoints - Peak widths in points
 * @param {number[]} wavenumber - Wavenumber array
 * @returns {number[]} FWHM values in cm⁻¹
 */
export function calculateFWHMWavenumber(peakIndices, widthsInPoints, wavenumber) {
  // Calculate average wavenumber spacing
  const spacing = []
  for (let i = 1; i < wavenumber.length; i++) {
    spacing.push(Math.abs(wavenumber[i] - wavenumber[i - 1]))
  }
  const avgSpacing = spacing.reduce((a, b) => a + b, 0) / spacing.length

  // Convert widths from points to cm⁻¹
  return widthsInPoints.map(w => w * avgSpacing)
}

/**
 * Calculate SNR (Signal-to-Noise Ratio)
 * 
 * @param {number[]} peakHeights - Heights of peaks
 * @param {number[]} data - Full spectrum data
 * @returns {number[]} SNR values
 */
export function calculateSNR(peakHeights, data) {
  // Estimate noise from low-intensity regions
  const sorted = [...data].sort((a, b) => a - b)
  const lowIntensityRegion = sorted.slice(0, Math.floor(sorted.length * 0.1))
  const noiseEstimate = lowIntensityRegion.reduce((a, b) => a + b, 0) / lowIntensityRegion.length
  const noiseStd = Math.sqrt(
    lowIntensityRegion.reduce((sum, v) => sum + Math.pow(v - noiseEstimate, 2), 0) / lowIntensityRegion.length
  )

  return peakHeights.map(h => h / (noiseStd || 1))
}

/**
 * Main peak detection function
 * 
 * @param {number[]} wavenumber - Wavenumber values (cm⁻¹)
 * @param {number[]} transmittance - Transmittance values (%)
 * @param {object} options - Detection options
 * @returns {object} Peak list with detailed information
 */
export function detectPeaks(wavenumber, transmittance, options = {}) {
  const {
    smoothWindowLength = 11,
    smoothPolyorder = 3,
    baselineMethod = 'linear',
    minHeight = 0.005,
    prominencePercent = 5,
    distancePercent = 2
  } = options

  // Ensure wavenumber ordering
  let wn = [...wavenumber]
  let tm = [...transmittance]
  
  if (wn[0] > wn[wn.length - 1]) {
    wn = wn.reverse()
    tm = tm.reverse()
  }

  // Convert to absorbance
  let absorbance = transmittanceToAbsorbance(tm)

  // Smooth spectrum
  absorbance = savitzkyGolayFilter(absorbance, smoothWindowLength, smoothPolyorder)

  // Remove baseline
  if (baselineMethod === 'linear') {
    absorbance = removeLinearBaseline(absorbance)
  }

  // Auto-calculate parameters
  const maxAbs = Math.max(...absorbance)
  const height = Math.max(minHeight, maxAbs * 0.01)
  const prominence = maxAbs * (prominencePercent / 100)
  const distance = Math.max(1, Math.floor(wn.length * (distancePercent / 100)))

  // Detect peaks
  const result = findPeaks(absorbance, height, prominence, distance)
  const peaks = result.peaks
  const properties = result.properties

  // Calculate FWHM
  const fwhmWavenumber = calculateFWHMWavenumber(peaks, properties.width, wn)

  // Calculate SNR
  const snr = calculateSNR(properties.peak_heights, absorbance)

  // Build peak list
  const peakList = peaks.map((peakIdx, i) => ({
    position: parseFloat(wn[peakIdx].toFixed(2)),
    intensity: parseFloat(absorbance[peakIdx].toFixed(4)),
    fwhm: parseFloat(fwhmWavenumber[i].toFixed(2)),
    height: parseFloat(properties.peak_heights[i].toFixed(4)),
    prominence: parseFloat(properties.prominences[i].toFixed(4)),
    snr: parseFloat(snr[i].toFixed(2)),
    index: peakIdx
  }))

  // Sort by position (descending wavenumber)
  peakList.sort((a, b) => b.position - a.position)

  return peakList
}

/**
 * Export for testing and visualization
 */
export const peakDetectorFunctions = {
  transmittanceToAbsorbance,
  savitzkyGolayFilter,
  removeLinearBaseline,
  findPeaks,
  calculateFWHMWavenumber,
  calculateSNR,
  detectPeaks
}
