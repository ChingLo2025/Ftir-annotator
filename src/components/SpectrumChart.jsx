/**
 * SpectrumChart.jsx
 * 
 * Interactive FTIR spectrum chart using Plotly.js
 * - Original spectrum curve
 * - Vertical peak markers with position labels
 * - Real-time updates from PeakReviewPanel
 */

import React, { useEffect, useRef } from 'react'
import Plotly from 'plotly.js/lib/core'
import { useAppStore } from '../store/appStore'
import './SpectrumChart.css'

// Register only scatter trace type to reduce bundle size
import Scatter from 'plotly.js/lib/scatter'
Plotly.register([Scatter])

const CHART_ID = 'ftir-spectrum-chart'

export default function SpectrumChart() {
  const chartRef = useRef(null)
  const spectrum = useAppStore(state => state.spectrum)
  const peaks = useAppStore(state => state.peaks)
  const annotations = useAppStore(state => state.annotations)
  const peakAnnotations = useAppStore(state => state.peakAnnotations)

  useEffect(() => {
    if (!spectrum || !spectrum.wavenumber) return

    const wn = spectrum.wavenumber
    const tm = spectrum.transmittance || spectrum.absorbance

    // --- Traces ---
    const traces = []

    // 1. Original spectrum
    traces.push({
      x: wn,
      y: tm,
      type: 'scatter',
      mode: 'lines',
      name: 'Spectrum',
      line: { color: '#1976D2', width: 1.5 },
      hovertemplate: '%{x:.1f} cm⁻¹<br>%{y:.2f}<extra></extra>'
    })

    // 2. Peak markers (vertical lines via scatter)
    if (peaks && peaks.length > 0) {
      // Find y-range for vertical lines
      const yMin = Math.min(...tm)
      const yMax = Math.max(...tm)

      peaks.forEach((peak, idx) => {
        // Determine annotation label
        let label = `${peak.position.toFixed(0)}`
        let lineColor = '#999'

        const reviewStatus = peakAnnotations?.[idx]
        if (reviewStatus && reviewStatus.candidateIndex !== null && annotations?.[idx]) {
          // Annotated: show vibration mode name
          const cand = annotations[idx].topFiveCandidates?.[reviewStatus.candidateIndex]
          if (cand) {
            label = `${peak.position.toFixed(0)}\n${cand.vibrationMode}`
            lineColor = '#4CAF50'
          }
        } else if (reviewStatus && reviewStatus.skipped) {
          lineColor = '#f44336'
        } else if (annotations?.[idx]) {
          // Default: show top candidate
          const topCand = annotations[idx].topFiveCandidates?.[0]
          if (topCand) {
            label = `${peak.position.toFixed(0)}\n${topCand.vibrationMode}`
            lineColor = '#FF9800'
          }
        }

        // Vertical line as a trace with 2 points
        traces.push({
          x: [peak.position, peak.position],
          y: [yMin, peak.intensity !== undefined ? (tm[peak.index] || yMax) : yMax],
          type: 'scatter',
          mode: 'lines',
          line: { color: lineColor, width: 1, dash: 'dot' },
          showlegend: false,
          hoverinfo: 'skip'
        })
      })
    }

    // --- Layout ---
    const layout = {
      xaxis: {
        title: 'Wavenumber (cm⁻¹)',
        autorange: 'reversed', // FTIR convention: high → low
        gridcolor: '#f0f0f0',
        zeroline: false
      },
      yaxis: {
        title: spectrum.transmittance ? 'Transmittance (%)' : 'Absorbance',
        gridcolor: '#f0f0f0',
        zeroline: false
      },
      margin: { t: 30, r: 30, b: 60, l: 60 },
      hovermode: 'closest',
      dragmode: 'zoom',
      plot_bgcolor: '#fff',
      paper_bgcolor: '#f9f9f9',
      font: { family: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', size: 12 },
      showlegend: false,
      // Peak annotations as text labels
      annotations: buildPeakAnnotations(peaks, annotations, peakAnnotations, tm)
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
      displaylogo: false,
      toImageButtonOptions: {
        format: 'png',
        filename: 'ftir-spectrum-annotated',
        width: 1200,
        height: 600,
        scale: 2
      }
    }

    // Render
    Plotly.react(CHART_ID, traces, layout, config)

    return () => {
      if (document.getElementById(CHART_ID)) {
        Plotly.purge(CHART_ID)
      }
    }
  }, [spectrum, peaks, annotations, peakAnnotations])

  if (!spectrum) {
    return (
      <div className="spectrum-chart-placeholder">
        <p>📊 Upload a spectrum to view the chart</p>
      </div>
    )
  }

  return (
    <div className="spectrum-chart-wrapper">
      <h3>📊 Spectrum Chart</h3>
      <div id={CHART_ID} ref={chartRef} className="spectrum-chart" />
    </div>
  )
}

/**
 * Build Plotly annotation objects for peak labels
 */
function buildPeakAnnotations(peaks, annotations, peakAnnotations, yData) {
  if (!peaks || peaks.length === 0) return []

  const yMin = Math.min(...yData)

  return peaks.map((peak, idx) => {
    let text = `${peak.position.toFixed(0)}`
    let fontColor = '#999'

    const reviewStatus = peakAnnotations?.[idx]
    if (reviewStatus && reviewStatus.candidateIndex !== null && annotations?.[idx]) {
      const cand = annotations[idx].topFiveCandidates?.[reviewStatus.candidateIndex]
      if (cand) {
        text = `${peak.position.toFixed(0)}<br><i>${cand.vibrationMode}</i>`
        fontColor = '#4CAF50'
      }
    } else if (reviewStatus && reviewStatus.skipped) {
      fontColor = '#f44336'
    } else if (annotations?.[idx]) {
      const topCand = annotations[idx].topFiveCandidates?.[0]
      if (topCand) {
        text = `${peak.position.toFixed(0)}<br><i>${topCand.vibrationMode}</i>`
        fontColor = '#FF9800'
      }
    }

    return {
      x: peak.position,
      y: yMin,
      xref: 'x',
      yref: 'y',
      text,
      showarrow: false,
      font: { size: 10, color: fontColor },
      textangle: -45,
      yshift: -15
    }
  })
}
