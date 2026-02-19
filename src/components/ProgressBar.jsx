/**
 * ProgressBar.jsx
 * 
 * Progress indicator showing current workflow stage
 * Stages: Upload → Detect → Annotate → Review
 */

import React from 'react'
import { useAppStore } from '../store/appStore'
import './ProgressBar.css'

export default function ProgressBar() {
  const { spectrum, peaks, annotations, ui } = useAppStore()

  // Determine current stage
  const stages = [
    { name: 'Upload', completed: !!spectrum },
    { name: 'Detect', completed: !!peaks },
    { name: 'Annotate', completed: !!annotations },
    { name: 'Review', completed: false } // Set during review phase
  ]

  // Find current stage index
  let currentStage = 0
  for (let i = 0; i < stages.length; i++) {
    if (stages[i].completed) {
      currentStage = i + 1
    } else {
      break
    }
  }

  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        {stages.map((stage, index) => (
          <div key={index} className="stage-group">
            <div
              className={`stage-circle ${
                index < currentStage ? 'completed' : index === currentStage ? 'active' : 'pending'
              }`}
            >
              <span className="stage-number">{index + 1}</span>
            </div>
            <div className="stage-name">{stage.name}</div>

            {index < stages.length - 1 && (
              <div
                className={`stage-line ${index < currentStage ? 'completed' : 'pending'}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="progress-status">
        {currentStage === 1 && <span>⏳ Waiting for spectrum upload...</span>}
        {currentStage === 2 && peaks && <span>✅ Loaded {peaks.length} peaks — Ready to annotate</span>}
        {currentStage === 3 && annotations && <span>✅ Annotated {annotations.length} peaks — Ready for review</span>}
        {currentStage === 4 && <span>✏️ Reviewing peaks...</span>}
      </div>
    </div>
  )
}
