/**
 * PeakDetectionParameter.jsx
 * 
 * Peak detection parameter sliders
 * - Smoothing Window (3-21, default 7)
 * - Peak Height Threshold (0.005-0.05, default 0.01)
 */

import React from 'react'
import { useAppStore } from '../store/appStore'
import './PeakDetectionParameter.css'

export default function PeakDetectionParameter() {
  const {
    peakDetectionParams,
    updatePeakDetectionParams,
    detectPeaks,
    spectrum,
  } = useAppStore()

  const params = peakDetectionParams || {}

  // Handlers
  const handleSmoothingChange = (e) => {
    const val = parseInt(e.target.value)
    // Ensure odd number
    const oddVal = val % 2 === 0 ? val + 1 : val
    updatePeakDetectionParams({ smoothingWindow: oddVal })
  }

  const handleHeightChange = (e) => {
    updatePeakDetectionParams({ peakHeightThreshold: parseFloat(e.target.value) })
  }

  const handleDetectPeaks = () => {
    if (spectrum && spectrum.wavenumber && spectrum.absorbance) {
      detectPeaks()
    }
  }

  return (
    <div className="peak-detection-parameter">
      <div className="parameter-header">
        <h3>🔍 Peak Detection Parameter</h3>
        <button
          className="detect-button"
          onClick={handleDetectPeaks}
          disabled={!spectrum || !spectrum.wavenumber}
        >
          Detect Peaks
        </button>
      </div>

      <div className="sliders-container">
        {/* Smoothing Window */}
        <div className="slider-item">
          <div className="slider-label">
            <label>Smoothing Window</label>
            <span className="slider-value">{params.smoothingWindow || 7}</span>
          </div>
          <input
            type="range"
            min="3"
            max="21"
            step="2"
            value={params.smoothingWindow || 7}
            onChange={handleSmoothingChange}
            className="slider"
          />
          <p className="slider-desc">
            光譜平滑程度；更大 = 更平滑但可能模糊細節
          </p>
        </div>

        {/* Peak Height Threshold */}
        <div className="slider-item">
          <div className="slider-label">
            <label>Peak Height Threshold</label>
            <span className="slider-value">{(params.peakHeightThreshold || 0.01).toFixed(4)}</span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.005"
            value={params.peakHeightThreshold || 0.01}
            onChange={handleHeightChange}
            className="slider"
          />
          <p className="slider-desc">
            最小峰高；更低會偵測更多微弱峰
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <details className="advanced-options">
        <summary>⚙️ Advanced Options</summary>
        <div className="advanced-content">
          <p><strong>Peak Prominence:</strong> 自動計算 = 光譜最高值 × 5%</p>
          <p><strong>Secondary Peak Max Gap:</strong> 200 cm⁻¹</p>
          <p style={{ fontSize: '0.85em', color: '#888', marginTop: '10px' }}>
            ⓘ 進階參數保留預設值以提升穩定性
          </p>
        </div>
      </details>
    </div>
  )
}
