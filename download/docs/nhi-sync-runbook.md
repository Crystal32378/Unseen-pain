# 健保署真實院所資料同步｜MVP 最短驗證流程

> MVP 唯一正式同步來源：`download/apps-script/00_OneFilePreviewAndSync.gs`（版本 1.1.0）。
> 請不要把 `02_SyncNHI.gs` 放入同一個 Apps Script 專案；它已從本 PR 移除，避免 `previewNhiSync()`、`syncNhiData()` 等同名函式衝突。

## MVP Apps Script 檔案

- `01_InitSheet.gs`：建立 Sheet 結構與 `SHEET_CONFIG`。
- `00_SetupSafe.gs`：不覆寫既有資料的安全初始化。
- `00_OneFilePreviewAndSync.gs`：唯一正式同步來源，入口只有 `previewNhiSync()` 與 `syncNhiData()`。
- `01_ReadOnlyWebApi.gs`：Vercel 使用的唯讀 FACILITIES API；它是 MVP API 專案唯一的 `doGet`。
- `00_TestNHIJson.gs`：可選的唯讀連線診斷。

`06_Code.gs`、`03_PlacesMatch.gs`、`04_SearchWebApp.html`、`05_SymptomTool.html` 屬於後續 Google Sites／Places 工作，本輪不要和 MVP API 檔案混在同一個 Web App 專案中。

## 執行順序

### 1. 安全建立工作表

執行：`setupDatabaseSafe()`

確認既有工作表與資料被保留。

### 2. 檢查資料庫結構

執行：`verifyDatabaseStructureSafe()`

成功條件：所有工作表與欄位結構正確。

### 3. 完整同步預覽（不寫入）

執行：`previewNhiSync()`

請記錄主檔院所數、科別明細數、神經／復健科數量、前 5 筆與耗時。

### 4. 正式同步

只有預覽結果合理後，才執行：`syncNhiData()`

安全機制：

- 篩選結果低於 50 筆時停止，不寫入。
- 以 `nhi_facility_code` 去重。
- 舊資料中消失的院所保留並標記為 `inactive`。
- 使用批次寫入。

### 5. 部署唯讀 API

將 `01_ReadOnlyWebApi.gs` 加入同一個綁定 Google Sheet 的 Apps Script 專案，並部署為 Web App。

執行身分：我；存取權：任何人。

確認 `?action=health` 回傳 `ok: true`，再把該 URL 設定到 Vercel 的 `FACILITY_API_URL`。

## 驗收紀錄

確認：

- `SYNC_LOG.error_count = 0`。
- `FACILITIES` 有正式院所資料。
- `active_status` 為 `active`。
- `specialty_neurology` 或 `specialty_rehabilitation` 至少一項為 TRUE。
- API 可依縣市、行政區與科別回傳結果。

未完成上述驗證前，不得宣稱正式同步已完成。