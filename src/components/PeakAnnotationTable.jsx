/**
 * PeakAnnotationTable.jsx
 * 
 * Table showing all detected peaks with annotation results
 * - Default: highest confidence candidate
 * - Updates in real-time during review phase
 * - Sortable columns
 */

import React, { useState, useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import './PeakAnnotationTable.css'

export default function PeakAnnotationTable() {
  const annotations = useAppStore(state => state.annotations)
  const peaks = useAppStore(state => state.peaks)
  const peakAnnotations = useAppStore(state => state.peakAnnotations)

  const [sortColumn, setSortColumn] = useState('position')
  const [sortDirection, setSortDirection] = useState('desc')

  // Build table rows from annotations + review status
  const rows = useMemo(() => {
    if (!annotations || annotations.length === 0) return []

    return annotations.map((ann, idx) => {
      const reviewStatus = peakAnnotations?.[idx]
      const candidates = ann.topFiveCandidates || []

      let annotationText = '—'
      let confidence = 0
      let status = 'unreviewed'

      if (reviewStatus && reviewStatus.skipped) {
        annotationText = '— (Skipped)'
        status = 'skipped'
      } else if (reviewStatus && reviewStatus.candidateIndex !== null) {
        const cand = candidates[reviewStatus.candidateIndex]
        if (cand) {
          annotationText = cand.vibrationMode
          confidence = cand.confidence
        }
        status = 'annotated'
      } else if (candidates.length > 0) {
        // Default: top candidate
        annotationText = candidates[0].vibrationMode
        confidence = candidates[0].confidence
        status = 'unreviewed'
      }

      return {
        index: idx + 1,
        position: ann.peakPosition,
        intensity: ann.peakIntensity || 0,
        fwhm: ann.peakFwhm || 0,
        annotation: annotationText,
        confidence,
        status
      }
    })
  }, [annotations, peakAnnotations])

  // Sort rows
  const sortedRows = useMemo(() => {
    if (rows.length === 0) return []

    const sorted = [...rows].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })

    return sorted
  }, [rows, sortColumn, sortDirection])

  // Handle sort click
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortIcon = (column) => {
    if (sortColumn !== column) return ' ↕'
    return sortDirection === 'asc' ? ' ↑' : ' ↓'
  }

  if (!annotations || annotations.length === 0) {
    return (
      <div className="peak-table-placeholder">
        <p>📋 Run detection and annotation to view results</p>
      </div>
    )
  }

  return (
    <div className="peak-annotation-table-wrapper">
      <h3>📋 Peak Annotation Table</h3>
      <div className="table-scroll">
        <table className="peak-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('index')}>
                Peak #{sortIcon('index')}
              </th>
              <th onClick={() => handleSort('position')}>
                Position (cm⁻¹){sortIcon('position')}
              </th>
              <th onClick={() => handleSort('intensity')}>
                Intensity{sortIcon('intensity')}
              </th>
              <th onClick={() => handleSort('fwhm')}>
                FWHM{sortIcon('fwhm')}
              </th>
              <th onClick={() => handleSort('annotation')}>
                Annotation{sortIcon('annotation')}
              </th>
              <th onClick={() => handleSort('confidence')}>
                Confidence{sortIcon('confidence')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status{sortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row) => (
              <tr key={row.index} className={`row-${row.status}`}>
                <td className="cell-index">{row.index}</td>
                <td className="cell-position">{row.position.toFixed(1)}</td>
                <td className="cell-intensity">{row.intensity.toFixed(4)}</td>
                <td className="cell-fwhm">{row.fwhm.toFixed(1)}</td>
                <td className="cell-annotation">{row.annotation}</td>
                <td className="cell-confidence">
                  {row.confidence > 0 ? `${(row.confidence * 100).toFixed(0)}%` : '—'}
                </td>
                <td className="cell-status">
                  <span className={`status-tag ${row.status}`}>
                    {row.status === 'annotated' && '✓ Annotated'}
                    {row.status === 'skipped' && '✗ Skipped'}
                    {row.status === 'unreviewed' && '○ Unreviewed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
