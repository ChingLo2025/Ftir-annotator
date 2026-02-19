# FTIR Annotator - 項目檢查清單

## ✅ 已完成

- [x] Vite React 項目創建
- [x] 依賴安裝（基礎）
- [x] 額外套件安裝中...
- [x] vite.config.js 配置 (base + alias)
- [x] package.json 配置 (deploy script)
- [x] 項目結構創建
- [x] 核心模塊複製
  - [x] peakDetector.js
  - [x] ruleMatcher.js
  - [x] csvParser.js
  - [x] appStore.js
  - [x] ftir-rules-database.json
- [x] 文檔編寫
  - [x] QUICK_START.md
  - [x] PROJECT_CHECKLIST.md

## 🚀 立即可做

- [ ] `npm run dev` - 啟動開發伺服器
- [ ] 測試模塊載入
- [ ] 修改 App.jsx 開始開發元件

## 📝 Phase 1: React 元件開發 (4 週)

### Week 1: 基礎 UI (3-5 天)

- [ ] **SpectrumUploader.jsx**
  - CSV 拖拽上傳
  - 檔案驗證
  - 上傳預覽
  - 狀態反饋

- [ ] **StatusBar.jsx**
  - 統計信息 (數據點、峰數、標註數)
  - 狀態指示
  - 警告信息

- [ ] **CSS 基本樣式**
  - 佈局 (Grid/Flexbox)
  - 配色方案
  - 響應式設計

### Week 2: 峰檢測 + 可視化 (5-7 天)

- [ ] **PeakDetectionPanel.jsx**
  - 參數調整滑塊
  - 執行按鈕
  - 進度指示
  - 參數預設

- [ ] **SpectrumChart.jsx**
  - Plotly 整合
  - 光譜繪製
  - 峰標記
  - 互動功能 (hover, click)

### Week 3: 規則匹配 + 結果 (5-7 天)

- [ ] **RuleMatchingPanel.jsx**
  - 匹配設置
  - 執行按鈕
  - 進度指示

- [ ] **PeakTable.jsx**
  - 虛擬化表格 (if > 100 peaks)
  - 列：位置、強度、FWHM、Top Match、信心度
  - 排序功能
  - 篩選功能

- [ ] **Peak Details Panel**
  - 展開詳細信息
  - Top 5 候選展示
  - 信心度分解圖表

### Week 4: 歧義審查 + 導出 (3-5 天)

- [ ] **AmbiguityPanel.jsx**
  - 歧義峰列表
  - 對比檢查 (Top 2 候選)
  - 相鄰峰信息
  - 手動決定功能

- [ ] **ExportPanel.jsx**
  - 導出格式選擇 (JSON/CSV)
  - 下載按鈕
  - 導出確認

- [ ] **最終優化**
  - 性能優化
  - UI 拋光
  - 錯誤處理完善

## 🧪 測試檢查清單

### 單元測試

- [ ] peakDetector.js
  - [ ] 平滑算法
  - [ ] 基線移除
  - [ ] 峰檢測
  - [ ] FWHM 計算

- [ ] ruleMatcher.js
  - [ ] 波數匹配
  - [ ] 形狀匹配
  - [ ] 信心度計分
  - [ ] 歧義偵測

- [ ] csvParser.js
  - [ ] CSV 解析
  - [ ] 數據驗證
  - [ ] 導出格式

### 集成測試

- [ ] CSV 上傳 → 峰檢測
- [ ] 峰檢測 → 規則匹配
- [ ] 規則匹配 → 結果展示
- [ ] 結果 → 導出

### E2E 測試

- [ ] 完整工作流程
  - [ ] 上傳 example_ethanol.csv
  - [ ] 檢測峰
  - [ ] 匹配規則
  - [ ] 審查結果
  - [ ] 導出檔案

### 性能測試

- [ ] CSV 解析 < 100ms
- [ ] 峰檢測 < 200ms
- [ ] 規則匹配 < 100ms
- [ ] 圖表渲染 < 500ms

## 🚀 部署檢查清單

- [ ] Git 初始化
- [ ] GitHub repo 創建
- [ ] GitHub Pages 配置
- [ ] npm run build 成功
- [ ] npm run preview 正常
- [ ] npm run deploy 成功
- [ ] GitHub Pages URL 訪問正常
- [ ] 功能驗證

## 📊 文檔檢查清單

- [x] QUICK_START.md
- [x] PROJECT_CHECKLIST.md
- [ ] API 文檔 (各模塊)
- [ ] 元件文檔 (使用說明)
- [ ] 部署指南
- [ ] 常見問題

## 🎯 可選改進 (Phase 2+)

- [ ] 批量上傳
- [ ] 標註歷史
- [ ] 自訂規則庫
- [ ] 主題切換 (亮/暗)
- [ ] 國際化 (中英)
- [ ] 暗黑模式
- [ ] 鍵盤快捷鍵
- [ ] 撤銷/重做
- [ ] 標註導入/匯出
- [ ] 數據庫存儲 (localStorage)

## 📈 進度追蹤

```
Week 1: ████░░░░░░░░░░░░░░  20%
Week 2: ░░░░░░░░░░░░░░░░░░░  0%
Week 3: ░░░░░░░░░░░░░░░░░░░  0%
Week 4: ░░░░░░░░░░░░░░░░░░░  0%

總進度: ████░░░░░░░░░░░░░░░░  20%
```

## 🔗 相關檔案

- QUICK_START.md - 快速開始
- IMPLEMENTATION_GUIDE.md - 完整集成指南
- FRONTEND_SETUP.md - Vite 設置
- PROFESSIONAL_WORKFLOW.md - 專業工作流程

---

**準備開始？** `npm run dev` 🚀
