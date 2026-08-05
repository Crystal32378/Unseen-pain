# 健保署真實院所資料同步｜最短驗證流程

> 本流程採「先讀取、再預覽、最後才寫入」。前三個測試步驟不會修改院所資料。

## 使用檔案

將下列檔案放在同一個 Google Apps Script 專案：

- `01_InitSheet.gs`
- `00_SetupSafe.gs`
- `02_SyncNHI.gs`
- `03_PlacesMatch.gs`
- `04_SearchWebApp.html`
- `05_SymptomTool.html`
- `06_Code.gs`

## 執行順序

### 1. 官方資源連線測試（不寫入）

執行：`testNhiResources()`

成功條件：

- 四個資源均顯示 HTTP 200
- 必要欄位全部存在
- 最後顯示「四個官方資源皆可讀取」

### 2. 安全建立工作表

執行：`setupDatabaseSafe()`

此函式只建立缺少的工作表及欄位，不會清除既有院所資料，也不會覆寫既有 `CONTENT_CONFIG`。

### 3. 檢查資料庫結構（不寫入院所）

執行：`verifyDatabaseStructureSafe()`

成功條件：顯示「所有工作表與欄位結構正確」。

### 4. 完整同步預覽（不寫入）

執行：`previewNhiSync()`

請保留下列紀錄：

- 主檔院所數
- 診所補充資料數
- 科別明細數
- 科別代碼數
- 神經科／復健科活躍院所總數
- 神經科院所數
- 復健科院所數
- 同時具有兩科的院所數
- 前 5 筆資料

### 5. 正式同步

只有前四步皆成功後，才執行：`syncNhiData()`

安全機制：

- 篩選結果低於 50 筆時自動停止，不寫入 Sheet
- 以 `nhi_facility_code` 作為唯一鍵
- 診所資料只補充服務項目與看診時段，不會和院所主檔重複新增
- 舊資料中已消失的院所保留並標記為 `inactive`
- 使用批次寫入，避免逐列 `appendRow()` 造成逾時

### 6. 驗收

確認：

- `SYNC_LOG.error_count = 0`
- `FACILITIES` 有真實院所資料
- `active_status` 為 `active`
- `specialty_neurology` 或 `specialty_rehabilitation` 至少一項為 TRUE
- 搜尋器可依縣市、行政區和科別回傳結果

## 目前狀態

程式碼已完成靜態語法檢查與純函式測試；仍需在 Crystal 的 Google Apps Script 帳號中完成實際連線、資料量與執行時間驗證。未完成實際執行前，不得聲稱正式同步已完成。
