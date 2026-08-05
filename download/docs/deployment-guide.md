# 部署指南｜看不見的痛

> 本指南帶你從零開始，完成 Google Sites + Apps Script + Sheets 的完整部署。
> Crystal 需要親自操作的步驟已壓縮到最少。
> MVP 邊界：`00_OneFilePreviewAndSync.gs` 是唯一正式同步來源；`01_ReadOnlyWebApi.gs` 是 Vercel 唯讀 API 的唯一 `doGet`。請勿把 `02_SyncNHI.gs` 或後續 Places／Google Sites Web App 檔案混入同一個 MVP API 專案。
> 本輪只執行 Sheet 同步與 Vercel 唯讀 API；Google Places、Google Sites 舊版 Web App 與匿名分享不在本 PR 執行。

---

## 部署順序總覽

```
Phase 1: 建立 Google Sheet 資料庫
   ↓
Phase 2: 部署 Apps Script（含同步程式碼）
   ↓
Phase 3: 設定 Google Cloud 與 Places API
   ↓
Phase 4: 部署搜尋器 Web App
   ↓
Phase 5: 建立 Google Sites 並嵌入
   ↓
Phase 6: 設定自動同步排程
   ↓
Phase 7: 測試與發布
```

---

## Phase 1: 建立 Google Sheet 資料庫

### 步驟 1.1：建立試算表
1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新的空白試算表
3. 命名為「神經痛就醫導航_資料庫」

### 步驟 1.2：開啟 Apps Script
1. 在試算表中點選「擴充功能 > Apps Script」
2. 這會開啟 Apps Script 編輯器

### 步驟 1.3：貼入初始化程式碼
1. 在 Apps Script 編輯器中，將預設的 `Code.gs` 內容清除
2. 打開 `download/apps-script/01_InitSheet.gs`
3. 全選複製，貼入 `Code.gs`
4. 點選「儲存」(Ctrl+S)
5. 在函式下拉選單中選擇 `setupDatabaseSafe`
6. 點選「執行」
7. 第一次執行時需要授權：
   - 點選「查看權限」
   - 選擇你的 Google 帳號
   - 點選「進階 > 前往專案（不安全）」
   - 點選「允許」
8. 執行完成後，回到試算表，確認既有資料沒有被覆寫，必要時執行 `verifyDatabaseStructureSafe()`

### 步驟 1.4：貼入 MVP Apps Script 檔案
在同一個綁定 Google Sheet 的 MVP 專案中，只加入以下檔案：
- `00_SetupSafe.gs`（安全初始化）
- `00_OneFilePreviewAndSync.gs`（唯一正式同步來源，版本 1.1.0）
- `01_ReadOnlyWebApi.gs`（Vercel 使用的唯一 `doGet`）
- `00_TestNHIJson.gs`（可選的唯讀連線診斷）

請勿加入 `02_SyncNHI.gs`、`06_Code.gs`、`03_PlacesMatch.gs`，也不要把 Google Sites HTML 檔案放進這個 MVP API 專案。每個檔案都儲存。

### 步驟 1.5：Google Sites 與 HTML（本輪延後）
`04_SearchWebApp.html`、`05_SymptomTool.html`、`06_Code.gs` 屬於舊版 Google Sites Web App。它們不在本輪 MVP API 專案中，請保留在延後範圍，待後續另立專案並重新驗證。

---

## Phase 2: 首次同步健保署資料

### 步驟 2.1：執行同步
1. 在 Apps Script 編輯器中，選擇函式 `syncNhiData`
2. 點選「執行」
3. 首次同步會下載健保署全部院所資料，可能需要 5-15 分鐘
4. 完成後查看「執行記錄」，確認：
   - 接收筆數
   - 新增筆數
   - 篩選後的神經科/復健科院所數

### 步驟 2.2：驗證資料
1. 回到 Google Sheet
2. 查看 `FACILITIES` 工作表
3. 確認有資料，且 `specialty_neurology` 或 `specialty_rehabilitation` 欄位有 true 值
4. 查看 `SYNC_LOG` 工作表，確認同步紀錄

### 步驟 2.3：檢查同步結果
1. 在 Apps Script 中查看 `previewNhiSync()` 或 `syncNhiData()` 的執行記錄
2. 確認 `FACILITIES` 筆數、神經／復健科旗標與 `SYNC_LOG.error_count`
3. 若結果合理，再部署 `01_ReadOnlyWebApi.gs`

---

## Phase 3: Google Places（本輪延後）

本輪不建立或設定 Google Places API Key，也不執行 `setPlacesApiKey()`。`PLACE_LINKS`、`VERIFIED_SERVICES` 與 Places 匹配維持原狀，待另行審查與驗證。

---

## Phase 4: 部署 Vercel 使用的唯讀 API

1. 在綁定 Google Sheet 的 MVP Apps Script 專案中，確認 `01_ReadOnlyWebApi.gs` 是唯一的 `doGet`。
2. 部署為網頁應用程式：執行身分選「我」，存取權限選「任何人」。
3. 先開啟 `?action=health`，確認回傳 `ok: true`。
4. 把 Web App URL 設定到 Vercel 的伺服器環境變數 `FACILITY_API_URL`；不要使用 `NEXT_PUBLIC_` 前綴，也不要把網址硬編碼進 route。
5. 前台搜尋介面使用 Vercel Preview／部署版本；本輪不部署舊版 Apps Script 搜尋器 HTML。

---

## Phase 5: Google Sites（本輪延後）

Google Sites 文案與舊版 HTML 嵌入維持延後，不在本輪 MVP API 驗證範圍。請不要把 `06_Code.gs`、`04_SearchWebApp.html` 或 `05_SymptomTool.html` 加回 MVP API 專案。

---

## Phase 6: 設定自動同步排程

### 步驟 6.1：建立觸發器
1. 在 Apps Script 編輯器中
2. 點選左側「鬧鐘」圖示（觸發條件）
3. 點選「新增觸發條件」
4. 設定：
   - 選擇要執行的函式：`runWeeklySync`
   - 活動來源：`時間驅動`
   - 頻率：`週計時器`
   - 星期幾：`星期一`
   - 時段：`凌晨 3 點至 4 點`
5. 儲存

或者直接執行 `setupWeeklyTrigger()` 函式自動建立。

### 步驟 6.2：驗證觸發器
1. 確認觸發器已出現在清單中
2. 下週一凌晨後檢查 `SYNC_LOG`，確認自動同步成功

---

## Phase 7: 測試與發布

### 步驟 7.1：功能測試
使用以下三個案例測試：

**案例 1：手肘到小指麻刺**
- 從首頁點選「我的痛該怎麼描述？」
- 填入症狀（右手肘外側到小指、麻、刺、觸電感）
- 複製摘要
- 前往「找院所」搜尋台北市神經內科
- 確認可撥打電話、開啟導航

**案例 2：大腿外側灼熱與麻感**
- 從首頁點選「我應該先看哪一科？」
- 閱讀科別說明
- 前往症狀整理工具
- 填入症狀（左大腿外側、灼熱、麻、久站後較明顯）
- 確認摘要正確

**案例 3：臀部或薦骨附近奇怪疼痛**
- 從首頁查看緊急警訊（確認「會陰或臀部附近新出現麻木」在列表中）
- 前往 Crystal 的故事閱讀
- 確認「不能推廣到所有人」的聲明清楚可見

### 步驟 7.2：手機測試
1. 在手機瀏覽器開啟網站
2. 測試所有頁面的手機排版
3. 測試搜尋器的觸控操作
4. 測試「撥打電話」按鈕（會開啟撥號器）
5. 測試「導航」按鈕（會開啟 Google Maps）

### 步驟 7.3：SEO 檢查
對照 `seo-checklist.md` 逐項檢查。

### 步驟 7.4：發布
1. 在 Google Sites 點選「發布」
2. 設定網址（建議使用自訂網域）
3. 確認「允許搜尋引擎建立索引」已啟用
4. 點選「發布」

### 步驟 7.5：提交到 Google Search Console
1. 前往 [Google Search Console](https://search.google.com/search-console)
2. 新增網站
3. 驗證所有權
4. 提交 Sitemap

---

## 疑難排解

### 同步失敗
- 檢查 `SYNC_LOG` 中的錯誤訊息
- 確認健保署 API 網址是否有效（可能需要更新）
- 執行 `createBackup()` 建立備份後再重試

### 搜尋器空白
- 確認 FACILITIES 工作表有資料
- 確認 `active_status` 欄位值為 `active`
- 在 Apps Script 中執行 `testSearch()` 測試

### Places API 錯誤
- 確認 API Key 已設定：執行 `getApiKey()` 檢查
- 確認 Google Cloud 專案已啟用 Places API
- 確認配額未超限：執行 `getTodayApiCallCount()` 檢查

### 嵌入 Google Sites 後無法顯示
- 確認 Web App 部署時「存取權限」設為「任何人」
- 嘗試使用 `?embed=true` 參數
- 確認瀏覽器未阻擋 iframe

---

## 更新程式碼後重新部署

當你修改了 Apps Script 程式碼後：
1. 點選「部署 > 管理部署」
2. 選擇現有部署
3. 點選「編輯」>「建立新版本」
4. 更新說明（例如「v1.1 修正搜尋排序」）
5. 點選「部署」
6. 網址不會改變，Google Sites 中的嵌入不需要更新
