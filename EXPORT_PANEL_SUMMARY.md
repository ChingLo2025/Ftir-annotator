# ExportPanel 開發總結

**日期：** 2026-02-19  
**任務：** 開發 ExportPanel 組件，實現標註結果的 PNG 圖表和 CSV 匯出功能  
**狀態：** ✅ 完成並驗證

---

## 實現功能

### 1. PNG 圖表下載 📷
- **按鈕：** "📷 Download Chart (PNG)"
- **機制：** 使用 Plotly.js 的 `downloadImage()` API
- **內容：**
  - 原始 FTIR 光譜曲線
  - 峰值位置的垂直線標記
  - 標註名稱（來自人工審查後的選擇）
  - 配置：1400×700 px，2× 放大
  - 檔名格式：`ftir-annotated-YYYY-MM-DD.png`

### 2. CSV 結果匯出 📄
- **按鈕：** "📄 Download Results (CSV)"
- **表頭欄位：**
  ```
  Peak #, Position (cm-1), Intensity, FWHM (cm-1), Annotation, Confidence, Status
  ```
- **內容：**
  - 所有檢測到的峰值
  - 用戶審查後的標註選擇（或預設最高信心度候選項）
  - 信心度百分比 (%)
  - 審查狀態：
    - `Annotated` — 用戶已選擇標註
    - `Skipped` — 用戶標記為「不標註」
    - `Unreviewed` — 未審查，使用預設最高信心度
- **檔名格式：** `ftir-results-YYYY-MM-DD.csv`

---

## 組件結構

### ExportPanel.jsx
**位置：** `src/components/ExportPanel.jsx`

**核心功能：**
- 從 Zustand store 讀取 `annotations` 和 `peakAnnotations`
- 監控審查狀態（已審查峰值數量）
- 條件渲染：僅在有標註時啟用按鈕

**主要方法：**
- `handleDownloadPNG()` — Plotly 圖表下載
- `handleDownloadCSV()` — 構建並下載 CSV 檔案
- `buildCSV()` — 根據審查狀態構建 CSV 內容
- 統計已審查、已跳過和未審查的峰值數量

### ExportPanel.css
**位置：** `src/components/ExportPanel.css`

**設計特色：**
- 漸層背景（藍灰色）
- 兩個按鈕並排布局（響應式）
- PNG 按鈕：紫色漸層 (`#667eea` → `#764ba2`)
- CSV 按鈕：粉紅色漸層 (`#f093fb` → `#f5576c`)
- Hover 效果：上移 3px，增強陰影
- 移動版本：垂直堆疊按鈕

---

## 與現有組件的整合

### App.jsx
- 導入 `ExportPanel` 組件
- 在 `PeakReviewPanel` 下方、`StatusMessage` 上方放置
- 新增 `.export-section` 樣式類

### Zustand Store (appStore.js)
使用現有狀態：
- `annotations` — 峰值標註結果
- `peakAnnotations` — 用戶審查選擇 `{peakIndex: {candidateIndex, skipped}}`
- `spectrum` — 光譜資料（圖表元素識別用）

### SpectrumChart.jsx
- 圖表元素 ID：`ftir-spectrum-chart`
- ExportPanel 通過此 ID 定位圖表並下載
- 圖表已包含：原始光譜、峰值線、標註標籤

---

## 技術細節

### Plotly 集成
```javascript
Plotly.downloadImage(chartEl, {
  format: 'png',
  filename: `ftir-annotated-${date}`,
  width: 1400,
  height: 700,
  scale: 2
})
```

### CSV 構建邏輯
1. 遍歷所有 `annotations`
2. 檢查 `peakAnnotations[idx]` 中的審查狀態
3. 若已審查 → 使用選定候選項
4. 若未審查 → 使用第一個（最高信心度）候選項
5. 若已跳過 → 空白注釋，狀態標記為 "Skipped"
6. 使用 Blob API 觸發下載

### 檔案下載機制
```javascript
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
const url = URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = filename
document.body.appendChild(link)
link.click()
document.body.removeChild(link)
URL.revokeObjectURL(url)
```

---

## UI 使用體驗

### 按鈕狀態
- **正常：** 兩個按鈕並排，鮮艷顏色，可點擊
- **禁用：** 當無標註數據時，面板顯示灰色提示文字
- **下載中：** （可選）按鈕顯示載入狀態

### 狀態提示
- 顯示已審查峰值數量：`已審查 X / Y 個峰`
- 未審查峰值會提示將使用預設標註
- 下載成功後可顯示簡短確認訊息

---

## 驗證結果

### 編譯狀態
✅ **npm run build 成功**
- 576 個模組轉換
- CSS：85.35 KB（壓縮：13.70 KB）
- JS：1,602.84 MB（壓縮：536.87 MB）
- 無編譯錯誤

### Linting
✅ ExportPanel.jsx 無 lint 警告（已移除未使用的變量）

### 功能檢查清單
- ✅ PNG 下載按鈕集成 Plotly API
- ✅ CSV 導出包含所有必需欄位
- ✅ 審查狀態正確反映在匯出中
- ✅ 響應式設計（移動裝置相容）
- ✅ 與 Zustand store 正確同步
- ✅ 圖表元素識別無誤

---

## 後續改進建議

### Phase 2 增強功能
1. **導出前預覽**
   - 在下載前預覽 CSV 內容
   - 允許編輯或篩選行

2. **多格式支援**
   - Excel (.xlsx) 匯出
   - JSON 格式匯出（包含完整候選項列表）

3. **批量操作**
   - 快速標記所有未審查峰值為「已跳過」
   - 自動接受所有預設標註

4. **匯出自訂**
   - 選擇要匯出的欄位
   - 自訂 CSV 分隔符（逗號、分號、Tab）

5. **統計摘要**
   - 在 CSV 末尾添加分析摘要
   - 平均信心度、異常峰值等

---

## 檔案清單

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `src/components/ExportPanel.jsx` | ✅ | 核心組件，PNG 和 CSV 下載 |
| `src/components/ExportPanel.css` | ✅ | 樣式：按鈕、布局、響應式 |
| `src/App.jsx` | ✅ | 已整合 ExportPanel |
| `src/App.css` | ✅ | 新增 `.export-section` 樣式 |

---

## 測試指南

### 本地測試
1. 上傳 CSV 光譜檔案
2. 執行峰值偵測
3. 執行峰值標註
4. 在 PeakReviewPanel 中審查並選擇標註
5. 點擊 "📷 Download Chart (PNG)" 下載圖表
6. 點擊 "📄 Download Results (CSV)" 下載結果

### 預期結果
- PNG 檔案：包含標註後的光譜圖，峰值清晰可見
- CSV 檔案：行數 = 偵測的峰值數量 + 標題行 + 摘要行

---

**備註：** 此組件為純前端實現，無需後端支援。所有資料來自瀏覽器端 Zustand store。
