# FTIR Annotator - 快速開始指南

## ✅ 項目已建立！

### 📁 項目結構

```
ftir-annotator/
├── src/
│   ├── components/          # React 元件（待開發）
│   ├── lib/
│   │   ├── peakDetector.js     ✓ 峰檢測
│   │   ├── ruleMatcher.js      ✓ 規則匹配
│   │   └── csvParser.js        ✓ CSV 解析
│   ├── store/
│   │   └── appStore.js         ✓ 狀態管理
│   ├── data/
│   │   └── ftir-rules-database.json ✓ 規則庫
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── index.html
├── vite.config.js           ✓ 已配置
├── package.json             ✓ 已配置
└── .gitignore
```

### 📦 已安裝的套件

```
React 19.2
Vite 7.3
plotly.js       - 圖表可視化
numjs           - 科學計算
papaparse       - CSV 解析
react-dropzone  - 拖拽上傳
zustand         - 狀態管理
gh-pages        - GitHub Pages 部署
```

### 🚀 本地開發

```bash
cd ftir-annotator
npm run dev
```

然後訪問: http://localhost:5173/ftir-annotator/

### 🚀 部署到 GitHub Pages

1. **初始化 Git**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用戶名/ftir-annotator.git
git push -u origin main
```

2. **設置 GitHub Pages**
   - 進入 Repository Settings
   - Pages → Source 選擇 "Deploy from a branch"
   - Branch 選擇 "gh-pages"

3. **部署**
```bash
npm run deploy
```

完成！查看 https://你的用戶名.github.io/ftir-annotator/

---

## 🧪 核心模塊測試

### 測試峰檢測

```javascript
import { detectPeaks } from './src/lib/peakDetector'

const wavenumber = [4000, 3999, ..., 400]
const transmittance = [98.5, 98.4, ..., 15.3]

const peaks = detectPeaks(wavenumber, transmittance)
console.log(peaks)
```

### 測試規則匹配

```javascript
import { annotatePeaks } from './src/lib/ruleMatcher'
import rulesDb from './src/data/ftir-rules-database.json'

const result = annotatePeaks(peaks, rulesDb)
console.log(result.annotations)
console.log(result.ambiguities)
```

### 測試 CSV 解析

```javascript
import { parseCSVFile } from './src/lib/csvParser'

const file = /* File from input */
const spectrum = await parseCSVFile(file)
console.log(spectrum)
```

---

## 📝 下一步

### Phase 1: 開發 React 元件

1. **SpectrumUploader.jsx** - CSV 拖拽上傳
2. **PeakDetectionPanel.jsx** - 峰檢測控制
3. **RuleMatchingPanel.jsx** - 規則匹配控制
4. **SpectrumChart.jsx** - Plotly 圖表
5. **PeakTable.jsx** - 結果表格
6. **AmbiguityPanel.jsx** - 歧義審查
7. **ExportPanel.jsx** - 導出功能
8. **StatusBar.jsx** - 統計信息

### Phase 2: UI/UX 優化

- 響應式設計
- 主題設定 (亮/暗)
- 國際化 (中英)

---

## 🐛 除錯提示

### 開發時常見問題

1. **模塊找不到**
   ```javascript
   // 使用別名 @
   import { detectPeaks } from '@/lib/peakDetector'
   ```

2. **CSV 解析失敗**
   - 檢查 CSV 格式 (wavenumber, transmittance)
   - 數據點至少 10 個
   - 波數範圍 100-5000 cm⁻¹

3. **規則庫未載入**
   - 確保 `src/data/ftir-rules-database.json` 存在
   - 檢查 JSON 語法

---

## 📊 性能目標

| 任務 | 目標 |
|------|------|
| CSV 解析 | < 100ms |
| 峰檢測 (1000 點) | < 200ms |
| 規則匹配 | < 100ms |
| 圖表渲染 | < 500ms |

---

## 📚 資源

- Vite 文檔: https://vitejs.dev/
- React 文檔: https://react.dev/
- Plotly.js: https://plotly.com/javascript/
- Zustand: https://github.com/pmndrs/zustand

---

## ✨ 準備好了！

現在可以開始開發 React 元件了。

**建議從 App.jsx 開始修改：**

```javascript
import { useState } from 'react'
import useAppStore from './store/appStore'

function App() {
  const spectrum = useAppStore(state => state.spectrum)
  const setSpectrum = useAppStore(state => state.setSpectrum)

  return (
    <div className="app">
      <h1>FTIR Spectrum Annotator</h1>
      <p>核心模塊已準備好！</p>
      <p>開始開發元件吧 🚀</p>
    </div>
  )
}

export default App
```

---

祝你開發順利！需要幫助隨時問 ✨
