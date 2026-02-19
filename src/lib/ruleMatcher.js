/**
 * FTIR Rule Matcher - JavaScript Version
 * 
 * Match detected peaks against FTIR rules database
 * Returns Top 5 candidates per peak with confidence scoring
 * 
 * Ported from ftir_peak_matcher.py
 * 
 * Author: WALL·E
 * Date: 2026-02-19
 */

/**
 * Check if peak position matches rule wavenumber range
 * 
 * @param {number} peakPosition - Detected peak position (cm⁻¹)
 * @param {number[]} ruleRange - [min, max] from rule (cm⁻¹)
 * @param {number} tolerance - Tolerance as percentage (0.05 = 5%)
 * @returns {boolean}
 */
function wavenumberMatch(peakPosition, ruleRange, tolerance = 0.05) {
  const [minWn, maxWn] = ruleRange
  const rangeSize = maxWn - minWn
  const tol = rangeSize * tolerance
  
  return (minWn - tol) <= peakPosition && peakPosition <= (maxWn + tol)
}

/**
 * Check if peak shape matches rule specification
 * 
 * @param {number} peakFWHM - Peak FWHM (cm⁻¹)
 * @param {string} ruleShape - Expected shape (sharp, broad, very-broad, etc.)
 * @returns {[boolean, number]} [match, confidence_bonus]
 */
function shapeMatch(peakFWHM, ruleShape) {
  const shapeSpecs = {
    'sharp': [10, 50],
    'medium': [50, 100],
    'broad': [100, 300],
    'very-broad': [300, 1200],
    'medium-broad': [80, 150]
  }

  if (!shapeSpecs[ruleShape]) {
    return [true, 0.0] // Unknown shape, pass through
  }

  const [minFwhm, maxFwhm] = shapeSpecs[ruleShape]

  if (minFwhm <= peakFWHM && peakFWHM <= maxFwhm) {
    return [true, 0.05] // Exact match
  } else if (peakFWHM < minFwhm * 0.7) {
    return [false, -0.2] // Too sharp
  } else if (peakFWHM > maxFwhm * 1.5) {
    return [false, -0.2] // Too broad
  } else {
    return [true, 0.0] // Partial match
  }
}

/**
 * Check if peak intensity is reasonable
 * 
 * @param {number} peakIntensity - Peak intensity (absorbance)
 * @param {string} ruleIntensity - Expected intensity (strong, medium, weak, etc.)
 * @param {number} spectrumMaxIntensity - Maximum intensity in spectrum
 * @returns {[boolean, number]} [pass, confidence_bonus]
 */
function intensityCheck(peakIntensity, ruleIntensity, spectrumMaxIntensity) {
  const thresholds = {
    'strong': [0.5, 1.0],
    'medium to strong': [0.4, 1.0],
    'medium': [0.2, 0.7],
    'weak to medium': [0.1, 0.6],
    'weak': [0.01, 0.3],
    'variable': [0.0, 1.0]
  }

  if (!thresholds[ruleIntensity]) {
    return [true, 0.0]
  }

  const normIntensity = spectrumMaxIntensity > 0 ? peakIntensity / spectrumMaxIntensity : 0
  const [minThresh, maxThresh] = thresholds[ruleIntensity]

  if (minThresh <= normIntensity && normIntensity <= maxThresh) {
    return [true, 0.05]
  } else {
    return [true, 0.0] // Don't disqualify on intensity alone
  }
}

/**
 * Find secondary peaks matching specifications
 * 
 * @param {number} primaryPeakIdx - Index of primary peak in peaks array
 * @param {object[]} secondarySpecs - List of secondary peak specifications
 * @param {object[]} peaks - All detected peaks
 * @param {number} maxWavenumberGap - Maximum distance to search (cm⁻¹)
 * @returns {object[]} Matched secondary peaks
 */
function findSecondaryPeaks(primaryPeakIdx, secondarySpecs, peaks, maxWavenumberGap = 200) {
  const matches = []
  const primaryPosition = peaks[primaryPeakIdx].position

  for (const spec of secondarySpecs) {
    const specRange = spec.wavenumber || [0, 10000]
    const specRequired = spec.required || false

    let found = false

    for (let peakIdx = 0; peakIdx < peaks.length; peakIdx++) {
      const peak = peaks[peakIdx]

      if (wavenumberMatch(peak.position, specRange, 0.1)) {
        const distance = Math.abs(peak.position - primaryPosition)

        if (distance <= maxWavenumberGap) {
          matches.push({peakIdx, spec})
          found = true
          break
        }
      }
    }

    // If required secondary peak not found, return empty
    if (!found && specRequired) {
      return []
    }
  }

  return matches
}

/**
 * Find all candidate matches for a single peak
 * Returns TOP 5 candidates sorted by confidence
 * 
 * @param {number} peakIdx - Index of peak to match
 * @param {object} peak - Peak object with position, intensity, fwhm
 * @param {object} rulesDb - Rules database (JSON)
 * @param {object[]} allPeaks - All detected peaks (for secondary matching)
 * @returns {object[]} Top 5 candidate matches
 */
function matchPeakCandidates(peakIdx, peak, rulesDb, allPeaks) {
  const candidates = []
  const maxIntensity = Math.max(...allPeaks.map(p => p.intensity))

  // Iterate through all vibration modes in rules database
  for (const [modeKey, mode] of Object.entries(rulesDb.vibrationModes || {})) {
    const modeName = mode.name || modeKey

    for (const subtype of mode.subTypes || []) {
      const primary = subtype.primaryPeak || {}
      const primaryRange = primary.wavenumber || [0, 10000]
      const primaryShape = primary.shape || 'sharp'
      const ruleIntensity = primary.intensity || 'medium'

      // Check primary peak match
      if (!wavenumberMatch(peak.position, primaryRange)) {
        continue
      }

      // Check shape match
      const [shapeOk, shapeBonus] = shapeMatch(peak.fwhm, primaryShape)
      if (!shapeOk) {
        continue
      }

      // Check intensity
      const [intensityOk, intensityBonus] = intensityCheck(
        peak.intensity,
        ruleIntensity,
        maxIntensity
      )

      // Calculate confidence
      let baseConfidence = subtype.confidence || 0.7
      let adjustedConfidence = baseConfidence + shapeBonus + intensityBonus
      adjustedConfidence = Math.max(0, Math.min(adjustedConfidence, 1.0))

      // Check secondary peaks
      const secondaryPeaks = subtype.secondaryPeaks || []
      const secondaryMatches = findSecondaryPeaks(peakIdx, secondaryPeaks, allPeaks)

      // Penalty for missing required secondary peaks
      const requiredMissing = secondaryPeaks.filter(spec => spec.required).length > 0 && secondaryMatches.length === 0

      let secondaryBonus = 0.1 * secondaryMatches.length

      if (requiredMissing) {
        adjustedConfidence *= 0.5
      } else {
        adjustedConfidence += secondaryBonus
        adjustedConfidence = Math.max(0, Math.min(adjustedConfidence, 1.0))
      }

      // Build candidate object
      const matchDict = {
        vibrationMode: modeName,
        source: subtype.source || 'unknown',
        confidence: parseFloat(adjustedConfidence.toFixed(3)),
        peakIndex: peakIdx,
        ruleKey: modeKey,
        ruleSubtype: subtype.id || '?',
        secondaryPeaksFound: secondaryMatches.length,
        notes: subtype.notes || '',
        scoring: {
          baseConfidence: parseFloat(baseConfidence.toFixed(3)),
          shapeBonus: parseFloat(shapeBonus.toFixed(3)),
          intensityBonus: parseFloat(intensityBonus.toFixed(3)),
          secondaryBonus: parseFloat(secondaryBonus.toFixed(3)),
          wavenumberMatch: true,
          shapeMatch: shapeOk,
          intensityMatch: intensityOk,
          secondaryMatch: secondaryMatches.length > 0 || secondaryPeaks.length === 0
        }
      }

      candidates.push(matchDict)
    }
  }

  // Sort by confidence (highest first)
  candidates.sort((a, b) => b.confidence - a.confidence)

  // Return top 5
  return candidates.slice(0, 5)
}

/**
 * Match all peaks against rules database
 * 
 * @param {object[]} peaks - Array of detected peaks
 * @param {object} rulesDb - Rules database (JSON)
 * @returns {object[]} Annotations with Top 5 candidates per peak
 */
export function matchAllPeaks(peaks, rulesDb) {
  const annotations = []

  for (let peakIdx = 0; peakIdx < peaks.length; peakIdx++) {
    const peak = peaks[peakIdx]

    const candidates = matchPeakCandidates(peakIdx, peak, rulesDb, peaks)

    if (candidates.length > 0) {
      const annotation = {
        peakIndex: peakIdx,
        peakPosition: parseFloat(peak.position.toFixed(2)),
        peakIntensity: parseFloat(peak.intensity.toFixed(4)),
        peakFwhm: parseFloat(peak.fwhm.toFixed(2)),
        peakSNR: parseFloat(peak.snr.toFixed(2)),
        primaryMatch: candidates[0],
        topFiveCandidates: candidates,
        numCandidates: candidates.length,
        confidenceRange: candidates.map(c => c.confidence),
        isAmbiguous: candidates.length > 1 && (candidates[0].confidence - candidates[1].confidence) < 0.05
      }

      annotations.push(annotation)
    }
  }

  return annotations
}

/**
 * Detect ambiguous peaks (multiple plausible matches)
 * 
 * @param {object[]} annotations - Annotations from matchAllPeaks
 * @param {number} confidenceGapThreshold - Mark ambiguous if gap <= this (default 0.05)
 * @returns {object[]} Ambiguous peak records
 */
export function detectAmbiguities(annotations, confidenceGapThreshold = 0.05) {
  const ambiguities = []

  for (const annotation of annotations) {
    const candidates = annotation.topFiveCandidates

    if (candidates.length >= 2) {
      const conf1 = candidates[0].confidence
      const conf2 = candidates[1].confidence
      const gap = conf1 - conf2

      if (gap <= confidenceGapThreshold) {
        ambiguities.push({
          peakIndex: annotation.peakIndex,
          peakPosition: annotation.peakPosition,
          peakIntensity: annotation.peakIntensity,
          peakFwhm: annotation.peakFwhm,
          topConfidence: parseFloat(conf1.toFixed(3)),
          secondConfidence: parseFloat(conf2.toFixed(3)),
          confidenceGap: parseFloat(gap.toFixed(3)),
          topCandidates: candidates.slice(0, 2),
          allCandidates: candidates,
          note: 'Multiple plausible explanations - expert review recommended'
        })
      }
    }
  }

  return ambiguities
}

/**
 * Main annotation function
 * Combines peak matching and ambiguity detection
 * 
 * @param {object[]} peaks - Detected peaks
 * @param {object} rulesDb - Rules database
 * @param {number} ambiguityThreshold - Confidence gap threshold for ambiguity detection
 * @returns {object} Results object with annotations and ambiguities
 */
export function annotatePeaks(peaks, rulesDb, ambiguityThreshold = 0.05) {
  // Match all peaks
  const annotations = matchAllPeaks(peaks, rulesDb)

  // Detect ambiguities
  const ambiguities = detectAmbiguities(annotations, ambiguityThreshold)

  return {
    annotations,
    ambiguities,
    summary: {
      totalPeaks: peaks.length,
      annotatedPeaks: annotations.length,
      ambiguousPeaks: ambiguities.length
    }
  }
}

/**
 * Export for testing
 */
export const ruleMatcherFunctions = {
  wavenumberMatch,
  shapeMatch,
  intensityCheck,
  findSecondaryPeaks,
  matchPeakCandidates,
  matchAllPeaks,
  detectAmbiguities,
  annotatePeaks
}
