import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useAppStore } from '@/store/appStore'
import { parseCSVFile, cleanSpectrum } from '@/lib/csvParser'
import './SpectrumUploader.css'

/**
 * SpectrumUploader Component
 * 
 * Features:
 * - Drag-and-drop CSV upload
 * - File validation
 * - Spectrum preview
 * - Error handling
 * - Integration with Zustand store
 */
function SpectrumUploader() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)

  // Zustand store
  const spectrum = useAppStore(state => state.spectrum)
  const setSpectrum = useAppStore(state => state.setSpectrum)
  const clearSpectrum = useAppStore(state => state.clearSpectrum)
  const setUIStatus = useAppStore(state => state.setUIStatus)

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback(async (file) => {
    setIsLoading(true)
    setError(null)

    try {
      // Show loading status
      setUIStatus('loading', '正在解析光譜...')

      // Parse CSV
      let parsedSpectrum = await parseCSVFile(file)

      // Clean spectrum (remove duplicates, sort)
      parsedSpectrum = cleanSpectrum(parsedSpectrum)

      // Store in Zustand
      setSpectrum(parsedSpectrum)

      // Show preview
      setPreview({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2),
        dataPoints: parsedSpectrum.dataPoints,
        wavenumberRange: parsedSpectrum.wavenumberRange,
        transmittanceRange: parsedSpectrum.transmittanceRange,
        yAxisUnit: parsedSpectrum.yAxisUnit
      })

      // Success status
      const unitText = parsedSpectrum.yAxisUnit === 'transmittance' ? 'Transmittance' : 'Absorbance'
      setUIStatus('success', `✓ 成功載入 ${parsedSpectrum.dataPoints} 個數據點（偵測 Y 軸: ${unitText}）`)

      console.log('Spectrum loaded:', parsedSpectrum)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.message || '檔案解析失敗，請檢查 CSV 格式')
      setUIStatus('error', `上傳失敗: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }, [setSpectrum, setUIStatus])

  /**
   * Handle file drop
   */
  const onDrop = useCallback(
    acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0])
      }
    },
    [handleFileUpload]
  )

  /**
   * Handle manual file selection
   */
  const handleFileSelect = useCallback(
    e => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  /**
   * Setup dropzone
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: isLoading
  })

  /**
   * Clear spectrum and reset
   */
  const handleClear = () => {
    clearSpectrum()
    setPreview(null)
    setError(null)
    setUIStatus('idle', '')
  }

  return (
    <div className="spectrum-uploader">
      {/* Upload Zone */}
      {!spectrum ? (
        <>
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''} ${isLoading ? 'disabled' : ''}`}
          >
            <input {...getInputProps()} onChange={handleFileSelect} />

            <div className="dropzone-content">
              <div className="dropzone-icon">📁</div>
              <p className="dropzone-title">拖拽 CSV 文件或點擊上傳</p>
              <p className="dropzone-subtitle">
                {isDragActive ? '鬆開滑鼠開始上傳' : '支援格式: CSV, TXT'}
              </p>
              {isLoading && <div className="spinner"></div>}
            </div>
          </div>

          {/* Format Help */}
          <div className="format-help">
            <h4>📋 CSV 格式要求</h4>
            <ul>
              <li>第 1 列: Wavenumber (cm⁻¹)</li>
              <li>第 2 列: Transmittance (%)</li>
              <li>至少 10 個數據點</li>
              <li>波數範圍: 100-5000 cm⁻¹</li>
              <li>傳輸率範圍: 0-100%</li>
            </ul>
            <p className="example">📝 範例: <code>4000,98.5</code></p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
              <button
                className="error-close"
                onClick={() => setError(null)}
              >
                ✕
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Spectrum Preview */}
          <div className="spectrum-preview">
            <div className="preview-header">
              <div className="preview-icon">✓</div>
              <div className="preview-title">
                <h3>光譜已載入</h3>
                <p className="file-name">{preview?.fileName}</p>
              </div>
              <button
                className="btn-clear"
                onClick={handleClear}
                title="清除並重新上傳"
              >
                ↻
              </button>
            </div>

            <div className="preview-details">
              {/* Data Points */}
              <div className="detail-row">
                <span className="detail-label">📊 數據點</span>
                <span className="detail-value">{preview?.dataPoints}</span>
              </div>

              {/* File Size */}
              <div className="detail-row">
                <span className="detail-label">📦 檔案大小</span>
                <span className="detail-value">{preview?.fileSize} KB</span>
              </div>

              {/* Wavenumber Range */}
              <div className="detail-row">
                <span className="detail-label">📈 波數範圍</span>
                <span className="detail-value">
                  {preview?.wavenumberRange[0]?.toFixed(0)} - {preview?.wavenumberRange[1]?.toFixed(0)} cm⁻¹
                </span>
              </div>

              {/* Transmittance Range */}
              <div className="detail-row">
                <span className="detail-label">💧 傳輸率</span>
                <span className="detail-value">
                  {preview?.transmittanceRange[0]?.toFixed(1)} - {preview?.transmittanceRange[1]?.toFixed(1)}%
                </span>
              </div>

              {/* Detected Y Unit */}
              <div className="detail-row">
                <span className="detail-label">🧭 偵測單位</span>
                <span className="detail-value">
                  {preview?.yAxisUnit === 'absorbance' ? 'Absorbance（已轉換供顯示）' : 'Transmittance'}
                </span>
              </div>
            </div>

            {/* Statistics */}
            <div className="spectrum-stats">
              <div className="stat">
                <div className="stat-value">{preview?.dataPoints}</div>
                <div className="stat-label">數據點</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {(preview?.wavenumberRange[1] - preview?.wavenumberRange[0])?.toFixed(0)}
                </div>
                <div className="stat-label">cm⁻¹</div>
              </div>
              <div className="stat">
                <div className="stat-value">
                  {(preview?.transmittanceRange[1] - preview?.transmittanceRange[0])?.toFixed(1)}%
                </div>
                <div className="stat-label">傳輸率幅度</div>
              </div>
            </div>

            {/* Upload New Button */}
            <button className="btn-upload-new" onClick={handleClear}>
              📁 上傳新光譜
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default SpectrumUploader
