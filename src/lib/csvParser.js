/**
 * CSV Parser for FTIR Spectra
 * 
 * Parses CSV files with wavenumber and transmittance columns
 * Handles various CSV formats and validates data
 * 
 * Author: WALL·E
 * Date: 2026-02-19
 */

/**
 * Parse CSV text into structured data
 * Expects format: wavenumber, transmittance (with or without header)
 * 
 * @param {string} csvText - Raw CSV text
 * @param {object} options - Parsing options
 * @returns {object} Parsed spectrum {wavenumber, transmittance}
 * @throws {Error} If CSV is invalid
 */
export function parseCSVText(csvText, options = {}) {
  const {
    hasHeader = true,
    delimiter = ',',
    skipInvalidRows = true
  } = options

  // Split into lines and clean
  const lines = csvText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length < 2) {
    throw new Error('CSV 數據不足（至少需要 2 行）')
  }

  // Skip header if present
  let dataLines = lines
  if (hasHeader && isHeaderLine(lines[0])) {
    dataLines = lines.slice(1)
  }

  // Parse data
  const wavenumber = []
  const transmittance = []
  const errors = []

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i]

    try {
      // Try different delimiters
      let parts = line.split(delimiter).map(p => p.trim())
      if (parts.length !== 2 && delimiter !== ';') {
        parts = line.split(';').map(p => p.trim())
      }
      if (parts.length !== 2 && delimiter !== '\t') {
        parts = line.split('\t').map(p => p.trim())
      }

      if (parts.length < 2) {
        throw new Error(`第 ${i + 1} 行: 不是有效的雙列數據`)
      }

      const wn = parseFloat(parts[0])
      const tm = parseFloat(parts[1])

      if (isNaN(wn) || isNaN(tm)) {
        throw new Error(`第 ${i + 1} 行: 無法解析為數字`)
      }

      // Validate ranges
      if (wn < 100 || wn > 5000) {
        throw new Error(`第 ${i + 1} 行: 波數超出範圍 (100-5000)`)
      }

      if (tm < 0 || tm > 100) {
        throw new Error(`第 ${i + 1} 行: 傳輸率超出範圍 (0-100)`)
      }

      wavenumber.push(wn)
      transmittance.push(tm)

    } catch (error) {
      errors.push(error.message)
      if (!skipInvalidRows) {
        throw error
      }
    }
  }

  if (wavenumber.length === 0) {
    throw new Error('無法解析任何有效的數據行')
  }

  if (errors.length > 0) {
    console.warn(`警告: 跳過了 ${errors.length} 行無效數據`)
  }

  // Validate data consistency
  validateSpectrum(wavenumber, transmittance)

  return {
    wavenumber,
    transmittance,
    dataPoints: wavenumber.length,
    wavenumberRange: [Math.min(...wavenumber), Math.max(...wavenumber)],
    transmittanceRange: [Math.min(...transmittance), Math.max(...transmittance)]
  }
}

/**
 * Detect if a line is a CSV header
 * 
 * @param {string} line - First line of CSV
 * @returns {boolean}
 */
function isHeaderLine(line) {
  const lowerLine = line.toLowerCase()
  const headerKeywords = ['wavenumber', 'wavenum', 'frequency', 'cm-1', 'transmit', '%t', 'wavelength']

  for (const keyword of headerKeywords) {
    if (lowerLine.includes(keyword)) {
      return true
    }
  }

  // Check if line contains non-numeric text
  const parts = line.split(/[,;\t]/)
  for (const part of parts) {
    if (isNaN(parseFloat(part.trim()))) {
      return true
    }
  }

  return false
}

/**
 * Validate spectrum data consistency
 * 
 * @param {number[]} wavenumber - Wavenumber array
 * @param {number[]} transmittance - Transmittance array
 * @throws {Error} If validation fails
 */
function validateSpectrum(wavenumber, transmittance) {
  // Check array lengths
  if (wavenumber.length !== transmittance.length) {
    throw new Error('波數和傳輸率陣列長度不符')
  }

  // Check minimum data points
  if (wavenumber.length < 10) {
    throw new Error('數據點過少（至少需要 10 個）')
  }

  // Check for all zeros
  if (transmittance.every(v => v === 0)) {
    throw new Error('傳輸率全為 0（無效光譜）')
  }

  // Check for all ones
  if (transmittance.every(v => v === 100)) {
    throw new Error('傳輸率全為 100（無效光譜）')
  }
}

/**
 * Parse CSV file using FileReader API
 * 
 * @param {File} file - CSV file object
 * @param {object} options - Parsing options
 * @returns {Promise<object>} Parsed spectrum
 */
export function parseCSVFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.includes('text') && !file.name.endsWith('.csv')) {
      reject(new Error('請上傳有效的 CSV 文件'))
      return
    }

    // Read file
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvText = e.target.result
        const spectrum = parseCSVText(csvText, options)
        resolve(spectrum)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('文件讀取失敗'))
    }

    reader.readAsText(file)
  })
}

/**
 * Format spectrum data for display
 * 
 * @param {object} spectrum - Parsed spectrum
 * @returns {string} Formatted summary
 */
export function formatSpectrumInfo(spectrum) {
  const [minWn, maxWn] = spectrum.wavenumberRange
  const [minTm, maxTm] = spectrum.transmittanceRange

  return `
光譜信息:
  數據點: ${spectrum.dataPoints}
  波數範圍: ${minWn.toFixed(1)} - ${maxWn.toFixed(1)} cm⁻¹
  傳輸率範圍: ${minTm.toFixed(1)} - ${maxTm.toFixed(1)} %
  `.trim()
}

/**
 * Validate and clean spectrum data
 * Remove duplicates, sort by wavenumber
 * 
 * @param {object} spectrum - Parsed spectrum
 * @returns {object} Cleaned spectrum
 */
export function cleanSpectrum(spectrum) {
  const pairs = spectrum.wavenumber.map((wn, i) => ({
    wavenumber: wn,
    transmittance: spectrum.transmittance[i]
  }))

  // Sort by wavenumber (ascending)
  pairs.sort((a, b) => a.wavenumber - b.wavenumber)

  // Remove near-duplicates (same wavenumber)
  const cleaned = []
  let lastWn = null

  for (const pair of pairs) {
    if (lastWn === null || Math.abs(pair.wavenumber - lastWn) > 0.01) {
      cleaned.push(pair)
      lastWn = pair.wavenumber
    }
  }

  return {
    wavenumber: cleaned.map(p => p.wavenumber),
    transmittance: cleaned.map(p => p.transmittance),
    dataPoints: cleaned.length,
    wavenumberRange: [cleaned[0].wavenumber, cleaned[cleaned.length - 1].wavenumber],
    transmittanceRange: [
      Math.min(...cleaned.map(p => p.transmittance)),
      Math.max(...cleaned.map(p => p.transmittance))
    ]
  }
}

/**
 * Export spectrum as JSON
 * 
 * @param {object} spectrum - Spectrum data
 * @param {object} peaks - Optional peaks data
 * @param {object} annotations - Optional annotations
 * @returns {string} JSON string
 */
export function exportAsJSON(spectrum, peaks = null, annotations = null) {
  const data = {
    spectrum,
    peaks: peaks || null,
    annotations: annotations || null,
    exportedAt: new Date().toISOString()
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Export peaks as CSV
 * 
 * @param {object[]} peaks - Array of peak objects
 * @returns {string} CSV string
 */
export function exportPeaksAsCSV(peaks) {
  if (!peaks || peaks.length === 0) {
    return ''
  }

  const headers = ['Position (cm-1)', 'Intensity', 'FWHM (cm-1)', 'Height', 'SNR']
  const rows = peaks.map(p => [
    p.position.toFixed(2),
    p.intensity.toFixed(4),
    p.fwhm.toFixed(2),
    p.height.toFixed(4),
    p.snr.toFixed(2)
  ])

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ]

  return csvLines.join('\n')
}

/**
 * Export annotations as CSV
 * 
 * @param {object[]} annotations - Array of annotation objects
 * @returns {string} CSV string
 */
export function exportAnnotationsAsCSV(annotations) {
  if (!annotations || annotations.length === 0) {
    return ''
  }

  const headers = [
    'Position (cm-1)',
    'Intensity',
    'FWHM (cm-1)',
    'Top Match',
    'Source',
    'Confidence',
    'Ambiguous',
    'All Candidates'
  ]

  const rows = annotations.map(a => [
    a.peakPosition.toFixed(2),
    a.peakIntensity.toFixed(4),
    a.peakFwhm.toFixed(2),
    a.primaryMatch.vibrationMode,
    a.primaryMatch.source,
    (a.primaryMatch.confidence * 100).toFixed(1) + '%',
    a.isAmbiguous ? 'Yes' : 'No',
    a.topFiveCandidates.map(c => `${c.source}(${(c.confidence * 100).toFixed(0)}%)`).join(' | ')
  ])

  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ]

  return csvLines.join('\n')
}

/**
 * Export all for testing
 */
export const csvParserFunctions = {
  parseCSVText,
  parseCSVFile,
  formatSpectrumInfo,
  cleanSpectrum,
  exportAsJSON,
  exportPeaksAsCSV,
  exportAnnotationsAsCSV
}
