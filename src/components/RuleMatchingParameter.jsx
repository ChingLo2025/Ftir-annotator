/**
 * RuleMatchingParameter.jsx
 * 
 * Rule matching parameter sliders
 * - Wavenumber Tolerance (1-15%, default 5%)
 * - Ambiguity Threshold (1-20%, default 10%)
 */

import React from 'react'
import { useAppStore } from '../store/appStore'
import './RuleMatchingParameter.css'

export default function RuleMatchingParameter() {
  const {
    ruleMatchingParams,
    updateRuleMatchingParams,
    annotatePeaks,
    peaks,
  } = useAppStore()

  const params = ruleMatchingParams || {}

  // Handlers
  const handleToleranceChange = (e) => {
    updateRuleMatchingParams({ wavenumberTolerance: parseInt(e.target.value) })
  }

  const handleAmbiguityChange = (e) => {
    updateRuleMatchingParams({ ambiguityThreshold: parseInt(e.target.value) })
  }

  const handleAnnotatePeaks = () => {
    if (peaks && peaks.length > 0) {
      annotatePeaks()
    }
  }

  return (
    <div className="rule-matching-parameter">
      <div className="parameter-header">
        <h3>🎯 Rule Matching Parameter</h3>
        <button
          className="annotate-button"
          onClick={handleAnnotatePeaks}
          disabled={!peaks || peaks.length === 0}
        >
          Annotate Peaks
        </button>
      </div>

      <div className="sliders-container">
        {/* Wavenumber Tolerance */}
        <div className="slider-item">
          <div className="slider-label">
            <label>Wavenumber Tolerance</label>
            <span className="slider-value">{params.wavenumberTolerance || 5}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            step="1"
            value={params.wavenumberTolerance || 5}
            onChange={handleToleranceChange}
            className="slider"
          />
          <p className="slider-desc">
            峰位置允許偏差；更寬鬆會增加誤配合
          </p>
        </div>

        {/* Ambiguity Threshold */}
        <div className="slider-item">
          <div className="slider-label">
            <label>Ambiguity Threshold</label>
            <span className="slider-value">{params.ambiguityThreshold || 10}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={params.ambiguityThreshold || 10}
            onChange={handleAmbiguityChange}
            className="slider"
          />
          <p className="slider-desc">
            Top 2 候選項信心度差；更小會標記更多模糊峰
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <details className="advanced-options">
        <summary>⚙️ Advanced Options</summary>
        <div className="advanced-content">
          <p><strong>Secondary Peak Max Gap:</strong> 200 cm⁻¹</p>
          <p style={{ fontSize: '0.85em', color: '#888', marginTop: '10px' }}>
            ⓘ 進階參數保留預設值以提升穩定性
          </p>
        </div>
      </details>
    </div>
  )
}
