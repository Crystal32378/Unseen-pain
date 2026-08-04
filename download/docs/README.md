# 看不見的痛｜神經痛就醫導航
## 專案 README

> 一個給正在經歷奇怪疼痛、卻不知道如何描述、該看哪一科、或去哪裡求助的人的網站。

---

## 專案概覽

本專案協助神經痛患者完成三件事：
1. **相信並接住**一個無法清楚描述疼痛的人
2. **協助患者**把身體感受整理成可帶進診間的語言
3. **提供可信、可執行**的第一個就醫入口

網站不販售產品、不推薦保健品、不收診所廣告、不替醫師排名，也不提供 AI 診斷。

---

## 交付項目清單

本專案交付以下內容，全部位於 `/home/z/my-project/download/` 目錄：

### 1. Next.js 預覽網站（可立即測試）
- **路徑**：已部署為運行中的 Next.js 應用
- **用途**：可直接在瀏覽器中測試所有功能與手機排版
- **內容**：7 個頁面區段、症狀整理工具、院所搜尋器（使用模擬資料）

### 2. Google Apps Script 生產程式碼
- **路徑**：`download/apps-script/`
- **檔案**：
  | 檔案 | 功能 |
  |------|------|
  | `01_InitSheet.gs` | 一鍵建立 Google Sheet 資料庫結構（5 個工作表 + 欄位 + 格式） |
  | `02_SyncNHI.gs` | 匯入健保署公開資料、篩選神經科與復健科、去重、Upsert |
  | `03_PlacesMatch.gs` | Google Places API 匹配、API Key 管理、配額控管 |
  | `04_SearchWebApp.html` | 可嵌入 Google Sites 的院所搜尋器介面 |
  | `05_SymptomTool.html` | 症狀整理工具介面（純瀏覽器端） |
  | `06_Code.gs` | Web App 入口、搜尋 API、管理函式 |

### 3. Google Sites 完整文案
- **路徑**：`download/content/google-sites-content.md`
- **內容**：7 個頁面的完整文案，含 H1/H2/H3 結構、SEO title、meta description

### 4. 部署與維護文件
- **路徑**：`download/docs/`
  | 檔案 | 內容 |
  |------|------|
  | `deployment-guide.md` | 完整部署步驟（Google Sheet → Apps Script → Google Sites） |
  | `crystal-checklist.md` | Crystal 必須親自點擊的最短清單（5 步驟） |
  | `seo-checklist.md` | SEO 檢查表 |
  | `google-cloud-setup.md` | Google Cloud Console 與 Places API 設定步驟 |

---

## 技術架構

```
┌─────────────────────────────────────────────────────────┐
│                     Google Sites                         │
│  （公開內容入口：首頁、看哪科、Crystal故事、警訊等）        │
│                                                         │
│  嵌入 ──→ Apps Script Web App                           │
│           ├─ 院所搜尋器 (04_SearchWebApp.html)          │
│           └─ 症狀工具   (05_SymptomTool.html)           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                 Google Apps Script                       │
│  ├─ 06_Code.gs       (Web App 入口 + 搜尋 API)          │
│  ├─ 02_SyncNHI.gs    (健保署資料同步)                   │
│  ├─ 03_PlacesMatch.gs (Places API 匹配)                │
│  └─ 01_InitSheet.gs  (資料庫初始化)                     │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐
│   Google Sheets      │    │  Google Places API  │
│  ├─ FACILITIES       │    │  (地圖、導航、網站)  │
│  ├─ PLACE_LINKS      │    │  API Key 存於       │
│  ├─ VERIFIED_SERVICES│    │  PropertiesService  │
│  ├─ SYNC_LOG         │    │  (不寫入前端)        │
│  └─ CONTENT_CONFIG   │    └─────────────────────┘
└─────────────────────┘
           ▲
           │
┌─────────────────────┐
│  健保署公開資料       │
│  data.nhi.gov.tw    │
│  (每週自動同步)      │
└─────────────────────┘
```

---

## 資料庫結構

Google Sheet 包含 5 個工作表：

### Sheet 1: FACILITIES（主要院所資料）
院所基本資料，來自健保署。包含：facility_id, nhi_facility_code, facility_name, facility_type, specialty_neurology, specialty_rehabilitation, city, district, address, phone, active_status 等 21 個欄位。

### Sheet 2: PLACE_LINKS（Google Places 對照）
院所與 Google Place ID 的對照。包含：nhi_facility_code, google_place_id, match_status, match_confidence, manually_reviewed 等 9 個欄位。

### Sheet 3: VERIFIED_SERVICES（服務查證）
需另外查證的進階服務。包含：has_emg, has_nerve_conduction_study, has_physical_therapy, has_electrotherapy, appointment_required, verification_status 等 13 個欄位。

### Sheet 4: SYNC_LOG（同步紀錄）
每次資料同步的記錄。包含：run_id, started_at, completed_at, records_received, records_created, records_updated, records_deactivated, error_count 等 11 個欄位。

### Sheet 5: CONTENT_CONFIG（網站文字設定）
可由管理者修改的網站文字。包含：homepage_intro, medical_disclaimer, emergency_notice, data_source_notice, google_attribution_notice 等。

---

## 維護指南

### 每週自動同步
已設定時間觸發器，每週一凌晨 3 點自動同步健保署資料。
- 同步前自動保留上一版資料（標記 inactive，不刪除）
- 同步失敗時寫入 SYNC_LOG，不會清空資料
- 可在 Apps Script 編輯器中手動執行 `runWeeklySync()`

### 手動操作（管理介面）
在 Apps Script 編輯器中可執行：
- `setupDatabase()` — 重新建立資料庫結構
- `syncNhiData()` — 手動同步健保署資料
- `matchPendingPlaces()` — 批次匹配 Google Place ID
- `showDashboard()` — 顯示管理儀表板
- `getAdminDashboard()` — 取得儀表板資料（程式化）
- `updateVerifiedService()` — 更新服務查證狀態
- `deactivateFacility()` — 停用錯誤院所
- `exportBackup()` — 匯出備份 CSV
- `createBackup()` — 建立試算表備份

### API Key 安全
- Places API Key 存於 `PropertiesService`，不寫入前端程式碼
- 設定方式：執行 `setPlacesApiKey("你的API_KEY")`
- 已設定每日配額上限（預設 200 次/日）
- 使用 Field Mask 只取必要欄位，降低費用

### 新增院所查證資料
1. 在 VERIFIED_SERVICES 工作表新增一列
2. 填入 nhi_facility_code 與查證欄位
3. 設定 verification_status（建議用 `phone_confirmed` 或 `official_website`）
4. 填入 verified_at 與 verified_by

---

## 品質控管

### 醫療內容安全規則
所有內容遵守以下規則：
1. 使用「可能」「有些人」「值得評估」等準確措辭
2. 不以單一症狀確診疾病
3. 不替使用者選擇治療
4. 不提供藥物或營養品劑量
5. 不保證恢復時間
6. 不把情緒壓力當成疼痛是假的
7. 不暗示檢查正常就代表沒有疼痛
8. 不貶低任何醫療專業
9. 不把患者描述成被所有醫師打發
10. 所有緊急警訊需獨立審核

### 驗收標準
詳見專案 briefing 中的「十六、驗收標準」章節。主要驗收項目：
- 資料可成功匯入、正確辨認科別、排除歇業院所、不重複
- 搜尋可依縣市/行政區/科別/類型/位置搜尋，手機操作正常
- API Key 不在前端、有 attribution、有錯誤處理
- 內容不診斷、不保證治癒、不推薦保健品、緊急警訊醒目
- 使用者可在 30 秒內完成至少一件事

---

## 聯絡與更正

- 資訊更正 Email：corrections@unseen-pain.example
- 公開回報表單：第一版暫不開放，即將推出

---

*本專案不販售產品、不收診所廣告、不替醫師排名。*
