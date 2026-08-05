# 工作日誌｜看不見的痛專案

---
Task ID: main
Agent: Super Z (主代理)
Task: 建立「看不見的痛｜神經痛就醫導航」完整專案——Next.js 預覽 + Apps Script 生產程式碼 + Google Sites 內容 + 完整文件

Work Log:
- 載入 fullstack-dev skill，初始化 Next.js 16 專案環境
- 設計溫暖、冷靜的視覺風格（米白底色、低飽和藍、深灰文字、大量留白）
- 建立 7 個頁面區段的 React 組件：
  - HomeSection（首頁：4 個入口 + 緊急警訊 banner）
  - WhichDeptSection（看哪一科：神經內科/復健科/家醫科說明）
  - DescribePainSection（互動症狀整理工具，純瀏覽器端）
  - SearchSection（院所搜尋器，使用模擬資料）
  - CrystalStorySection（過來人經驗故事 + 邊界聲明）
  - EmergencySection（立即就醫警訊 9 項 + 撥打 119）
  - AboutSection（資料來源、隱私、免責聲明）
- 建立互動症狀整理工具：可勾選 9 種感覺、4 種影響、自動產生摘要、複製/列印/清除
- 建立院所搜尋器：科別/縣市/行政區/院所類型/進階條件篩選、結果卡片、撥打/Maps/導航按鈕
- 使用 Agent Browser 驗證所有互動功能正常運作
- 修正症狀摘要的文法問題（「久站後時較明顯」→「久站後較明顯」）
- 建立 6 個 Apps Script 生產程式碼檔案：
  - 01_InitSheet.gs（一鍵建立 5 個工作表 + 欄位 + 格式）
  - 00_OneFilePreviewAndSync.gs（健保署資料下載/解析/合併/篩選/Upsert）
  - 03_PlacesMatch.gs（Places API 匹配 + API Key 管理 + 配額控管）
  - 04_SearchWebApp.html（可嵌入 Google Sites 的搜尋器 HTML）
  - 05_SymptomTool.html（症狀整理工具 HTML）
  - 06_Code.gs（Web App 入口 + 搜尋 API + 管理函式）
- 撰寫 7 個 Google Sites 頁面的完整文案（含 SEO title、meta description、H1/H2/H3 結構）
- 撰寫 5 份文件：README、部署指南、Crystal 必須點擊清單、SEO 檢查表、Google Cloud 設定指南

Stage Summary:
- Next.js 預覽網站已部署並可立即測試（所有功能在瀏覽器中驗證通過）
- Apps Script 生產程式碼可直接貼入 Google Apps Script 編輯器使用
- Google Sites 文案可直接複製貼入
- Crystal 需要親自操作的步驟壓縮到 5 步（登入/授權/貼 API Key/嵌入網址/發布）
- 所有交付項目位於 /home/z/my-project/download/
- Lint 檢查通過，dev server 正常運行
