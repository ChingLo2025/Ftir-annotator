/**
 * ExportPanel.jsx
 * 
 * Export annotated results:
 * - Download PNG chart (via Plotly)
 * - Download CSV table (reviewed results)
 */

import React from 'react'
import Plotly from 'plotly.js/lib/core'
import { useAppStore } from '../store/appStore'
import './ExportPanel.css'

const CHART_ID = 'ftir-spectrum-chart'

export default function ExportPanel() {
  const annotations = useAppStore(state => state.annotations)
  const peakAnnotations = useAppStore(state => state.peakAnnotations)

  const hasData = annotations && annotations.length > 0

  /**
   * Download annotated chart as PNG
   */
  const handleDownloadPNG = () => {
    const chartEl = document.getElementById(CHART_ID)
    if (!chartEl) {
      alert('Chart not found. Please ensure spectrum is loaded.')
      return
    }

    Plotly.downloadImage(chartEl, {
      format: 'png',
      filename: `ftir-annotated-${new Date().toISOString().slice(0, 10)}`,
      width: 1400,
      height: 700,
      scale: 2
    })
  }

  /**
   * Build CSV content from reviewed annotations
   */
  const buildCSV = () => {
    const headers = [
      'Peak #',
      'Position (cm-1)',
      'Intensity',
      'FWHM (cm-1)',
      'Annotation',
      'Confidence',
      'Status'
    ]

    const rows = annotations.map((ann, idx) => {
      const reviewStatus = peakAnnotations?.[idx]
      const candidates = ann.topFiveCandidates || []

      let annotationText = ''
      let confidence = ''
      let status = 'Unreviewed'

      if (reviewStatus && reviewStatus.skipped) {
        annotationText = ''
        status = 'Skipped'
      } else if (reviewStatus && reviewStatus.candidateIndex !== null) {
        const cand = candidates[reviewStatus.candidateIndex]
        if (cand) {
          annotationText = cand.vibrationMode
          confidence = `${(cand.confidence * 100).toFixed(1)}%`
        }
        status = 'Annotated'
      } else if (candidates.length > 0) {
        annotationText = candidates[0].vibrationMode
        confidence = `${(candidates[0].confidence * 100).toFixed(1)}%`
        status = 'Unreviewed'
      }

      return [
        idx + 1,
        ann.peakPosition.toFixed(1),
        (ann.peakIntensity || 0).toFixed(4),
        (ann.peakFwhm || 0).toFixed(1),
        `"${annotationText}"`,
        confidence,
        status
      ]
    })

    const csvLines = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ]

    return csvLines.join('\n')
  }

  /**
   * Download CSV file
   */
  const handleDownloadCSV = () => {
    const csv = buildCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ftir-results-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Count review stats
  const totalPeaks = annotations?.length || 0
  const annotatedCount = Object.values(peakAnnotations || {}).filter(
    s => s && s.candidateIndex !== null
  ).length
  const skippedCount = Object.values(peakAnnotations || {}).filter(
    s => s && s.skipped
  ).length
  const unreviewedCount = totalPeaks - annotatedCount - skippedCount

  return (
    <div className="export-panel">
      <h3>📥 Export Results</h3>

      {hasData ? (
        <>
          <p className="export-desc">
            下載標註/審查後的結果。已審查 {annotatedCount + skippedCount} / {totalPeaks} 個峰
            {unreviewedCount > 0 && `（${unreviewedCount} 個尚未審查，將使用預設最高信心度）`}
          </p>

          <div className="export-buttons">
            <button className="export-btn png-btn" onClick={handleDownloadPNG}>
              📷 Download Chart (PNG)
            </button>
            <button className="export-btn csv-btn" onClick={handleDownloadCSV}>
              📄 Download Results (CSV)
            </button>
          </div>
        </>
      ) : (
        <p className="export-disabled">
          完成峰值偵測和標註後即可匯出結果
        </p>
      )}
    </div>
  )
}
