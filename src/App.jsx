/**
 * App.jsx - Main Application Component
 * 
 * Layout:
 * - Header
 * - SpectrumUploader
 * - PeakDetectionParameter + RuleMatchingParameter (side by side)
 * - SpectrumChart (full width)
 * - PeakAnnotationTable (full width)
 * - PeakReviewPanel
 * - StatusBar
 */

import React from 'react'
import { useAppStore } from './store/appStore'
import ProgressBar from './components/ProgressBar'
import SpectrumUploader from './components/SpectrumUploader'
import PeakDetectionParameter from './components/PeakDetectionParameter'
import RuleMatchingParameter from './components/RuleMatchingParameter'
import SpectrumChart from './components/SpectrumChart'
import PeakAnnotationTable from './components/PeakAnnotationTable'
import PeakReviewPanel from './components/PeakReviewPanel'
import ExportPanel from './components/ExportPanel'
import './App.css'

export default function App() {
  const { ui, spectrum } = useAppStore()

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🧪 FTIR Spectrum Annotator</h1>
          <p>Automatic peak detection and vibration mode classification</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Progress Bar */}
        <section className="section progress-section">
          <ProgressBar />
        </section>

        {/* Spectrum Uploader */}
        <section className="section uploader-section">
          <SpectrumUploader />
        </section>

        {/* Parameters (2 columns) */}
        <div className="parameters-row">
          <section className="section parameter-section">
            <PeakDetectionParameter />
          </section>
          <section className="section parameter-section">
            <RuleMatchingParameter />
          </section>
        </div>

        {/* Spectrum Chart */}
        <section className="section chart-section">
          <SpectrumChart />
        </section>

        {/* Peak Annotation Table */}
        <section className="section table-section">
          <PeakAnnotationTable />
        </section>

        {/* Peak Review Panel */}
        <section className="section review-section">
          <PeakReviewPanel />
        </section>

        {/* Export Panel */}
        <section className="section export-section">
          <ExportPanel />
        </section>

        {/* Status Message */}
        {ui.message && (
          <section className="section status-section">
            <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
              <p>✅ {ui.message}</p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>FTIR Annotator v1.0 | Pure Frontend | <a href="https://github.com/ChingLo2025/ftir-annotator">GitHub</a></p>
      </footer>
    </div>
  )
}
