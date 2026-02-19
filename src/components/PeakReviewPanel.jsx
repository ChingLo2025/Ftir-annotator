/**
 * PeakReviewPanel.jsx
 * 
 * Peak-by-peak review interface
 * - Expandable peak cards with Top 5 candidates
 * - Direct selection for annotation
 * - Skip/Don't Annotate option
 */

import React, { useState } from 'react'
import { useAppStore } from '../store/appStore'
import './PeakReviewPanel.css'

export default function PeakReviewPanel() {
  const {
    annotations,
    peakAnnotations,
    selectAnnotation,
    skipAnnotation
  } = useAppStore()

  const [expandedPeaks, setExpandedPeaks] = useState({})

  if (!annotations || annotations.length === 0) {
    return (
      <div className="peak-review-panel">
        <div className="no-peaks">
          <p>No peaks to review. Run detection and annotation first.</p>
        </div>
      </div>
    )
  }

  const toggleExpand = (peakIndex) => {
    setExpandedPeaks(prev => ({
      ...prev,
      [peakIndex]: !prev[peakIndex]
    }))
  }

  const handleSelectCandidate = (peakIndex, candidateIndex) => {
    selectAnnotation(peakIndex, candidateIndex)
  }

  const handleSkip = (peakIndex) => {
    skipAnnotation(peakIndex)
  }

  // Count reviewed peaks
  const reviewedCount = Object.values(peakAnnotations || {}).filter(
    status => status && (status.candidateIndex !== null || status.skipped)
  ).length

  return (
    <div className="peak-review-panel">
      <div className="panel-header">
        <h3>📋 Peak Review & Annotation</h3>
        <span className="review-count">
          {reviewedCount} / {annotations.length} reviewed
        </span>
      </div>

      <div className="peaks-list">
        {annotations.map((annotation, peakIdx) => {
          const candidates = annotation.topFiveCandidates || []
          const status = peakAnnotations?.[peakIdx] || {}
          const isExpanded = expandedPeaks[peakIdx]
          const isAnnotated = status.candidateIndex !== null
          const isSkipped = status.skipped

          return (
            <div
              key={peakIdx}
              className={`peak-card ${isAnnotated ? 'annotated' : isSkipped ? 'skipped' : ''}`}
            >
              {/* Peak Header */}
              <div
                className="peak-header"
                onClick={() => toggleExpand(peakIdx)}
              >
                <div className="peak-info">
                  <span className="peak-number">#{peakIdx + 1}</span>
                  <span className="peak-position">{annotation.peakPosition} cm⁻¹</span>
                  <span className="peak-intensity">
                    Intensity: {(annotation.peakIntensity || 0).toFixed(3)}
                  </span>
                </div>

                <div className="peak-status">
                  {isAnnotated && (
                    <span className="status-badge annotated">
                      ✓ {candidates[status.candidateIndex]?.vibrationMode}
                    </span>
                  )}
                  {isSkipped && (
                    <span className="status-badge skipped">✗ Not Annotated</span>
                  )}
                </div>

                <button
                  className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(peakIdx)
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              {/* Peak Content (Expanded) */}
              {isExpanded && (
                <div className="peak-content">
                  <div className="candidates-list">
                    <p className="candidates-title">Top 5 Candidates:</p>
                    {candidates.length > 0 ? (
                      candidates.map((candidate, candIdx) => (
                        <div
                          key={candIdx}
                          className={`candidate-item ${
                            isAnnotated && status.candidateIndex === candIdx
                              ? 'selected'
                              : ''
                          }`}
                        >
                          <div className="candidate-header">
                            <span className="candidate-rank">#{candIdx + 1}</span>
                            <span className="candidate-mode">
                              {candidate.vibrationMode}
                            </span>
                            <span className="candidate-confidence">
                              {(candidate.confidence * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div className="candidate-details">
                            <span className="source">{candidate.source}</span>
                            {candidate.notes && (
                              <span className="notes">{candidate.notes}</span>
                            )}
                          </div>

                          <button
                            className="select-button"
                            onClick={() =>
                              handleSelectCandidate(peakIdx, candIdx)
                            }
                          >
                            {isAnnotated && status.candidateIndex === candIdx
                              ? '✓ Selected'
                              : 'Select'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="no-candidates">No candidates found</p>
                    )}
                  </div>

                  {/* Skip Button */}
                  <div className="peak-actions">
                    <button
                      className="skip-button"
                      onClick={() => handleSkip(peakIdx)}
                    >
                      {isSkipped ? '✗ Not Annotated' : '✗ Don\'t Annotate'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="review-summary">
        <div className="summary-stat">
          <span className="label">Total Peaks:</span>
          <span className="value">{annotations.length}</span>
        </div>
        <div className="summary-stat">
          <span className="label">Annotated:</span>
          <span className="value">
            {Object.values(peakAnnotations || {}).filter(
              s => s && s.candidateIndex !== null
            ).length}
          </span>
        </div>
        <div className="summary-stat">
          <span className="label">Skipped:</span>
          <span className="value">
            {Object.values(peakAnnotations || {}).filter(
              s => s && s.skipped
            ).length}
          </span>
        </div>
      </div>
    </div>
  )
}
