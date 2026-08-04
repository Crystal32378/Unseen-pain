# Google Cloud 與 Places API 設定指南

> 本指南說明如何在 Google Cloud Console 中設定 Places API (New) 並保護 API Key。

---

## 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 登入你的 Google 帳號（建議與 Apps Script 同一個帳號）
3. 點選頂部的專案下拉選單
4. 點選「新增專案」
5. 專案名稱：`unseen-pain-nav`
6. 點選「建立」

---

## 步驟 2：啟用 Places API (New)

1. 在左側選單中點選「API 和服務 > 媒體庫」
2. 搜尋「Places API」
3. 選擇 **Places API (New)**（注意：不是舊版的 Places API）
4. 點選「啟用」

> ⚠️ 重要：必須使用 **Places API (New)**，舊版已即將淘汰。
> Places API (New) 採按使用量計費，需綁定帳單。

---

## 步驟 3：建立 API Key

1. 在左側選單中點選「API 和服務 > 憑證」
2. 點選「+ 建立憑證 > API 金鑰」
3. 系統會產生一個 API Key
4. 複製這個 Key（稍後要貼入 Apps Script）
5. 點選「限制金鑰」進行安全設定

---

## 步驟 4：設定 API 限制

在 API Key 編輯頁面中：

### 4.1 API 限制
1. 選擇「限制金鑰」
2. 勾選「Places API (New)」
3. 這確保你的 Key 只能用於 Places API，不能被盜用去呼叫其他 Google API

### 4.2 應用限制
有兩種選擇：

**選項 A：HTTP 參照網址（推薦）**
1. 選擇「HTTP 參照網址」
2. 新增以下網址：
   - `https://script.google.com/*`（Apps Script Web App）
   - `https://sites.google.com/*`（Google Sites，如適用）
   - 你的自訂網域（如有）

**選項 B：IP 位址**
1. 選擇「IP 位址」
2. 新增 Apps Script 的出口 IP（可由 Apps Script 執行 `UrlFetchApp.fetch('https://api.ipify.org').getContentText()` 取得）
3. 注意：Apps Script 的 IP 可能會變動，HTTP 參照網址更穩定

---

## 步驟 5：設定配額與預算

### 5.1 每日配額
1. 在左側選單中點選「API 和服務 > Places API (New)」
2. 點選「配額」標籤
3. 設定「每日要求數」上限：
   - 建議第一版設定：200 次/日
   - 這與 Apps Script 中的 `DAILY_QUOTA_LIMIT` 一致

### 5.2 預算提醒
1. 在左側選單中點選「帳單 > 預算與快訊」
2. 點選「建立預算」
3. 設定月預算（建議：NT$ 300-500，視使用量而定）
4. 設定通知規則（50%、90%、100% 時通知）

---

## 步驟 6：在 Apps Script 中設定 API Key

1. 回到 Apps Script 編輯器
2. 在函式下拉選單中選擇 `setPlacesApiKey`
3. 將程式碼中的參數改為你的 API Key：
   ```javascript
   function setPlacesApiKey(key) {
     // 改為：
     setPlacesApiKey('AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
   }
   ```
   或者直接在執行時傳入參數
4. 執行函式
5. 確認記錄顯示「✓ API Key 已設定」

---

## 步驟 7：驗證設定

### 7.1 確認 API Key 已儲存
執行 `getApiKey()`，確認回傳非空值。

### 7.2 測試 Places API 呼叫
1. 先確認 FACILITIES 工作表有資料
2. 執行 `matchPendingPlaces()`
3. 檢查記錄：
   - 處理筆數
   - 匹配成功數
   - 錯誤數
4. 前往 Google Cloud Console > Places API > 指標，確認有 API 呼叫記錄

### 7.3 確認配額追蹤
執行 `getTodayApiCallCount()`，確認計數正常。

---

## 費用估算

Places API (New) 的計費方式（以 Google 公告為準）：

| API 呼叫類型 | 預估單價 |
|-------------|---------|
| Text Search | ~$0.032 USD/次 |
| Place Details | ~$0.040 USD/次 |
| Nearby Search | ~$0.032 USD/次 |

### 每月預估費用
- 假設每天 200 次 API 呼叫（上限）
- 每月 6,000 次
- 預估費用：~$200 USD/月（上限）
- 實際費用取決於使用量，通常遠低於上限

### 降低費用的策略
1. **使用 Field Mask**：已在程式碼中設定，只取必要欄位
2. **快取 Place ID**：已存在 `PLACE_LINKS` 工作表，避免重複搜尋
3. **即時呼叫 Details**：只在使用者查看時才呼叫 Place Details
4. **設定每日配額**：已在程式碼中設定上限
5. **第一版不顯示評分**：如需進一步降低費用，可移除 rating 與 userRatingCount 欄位

---

## 安全檢查清單

- [ ] API Key 已設定 API 限制（只允許 Places API）
- [ ] API Key 已設定應用限制（HTTP 參照或 IP）
- [ ] API Key 未寫入前端 HTML/JavaScript
- [ ] API Key 未寫入 GitHub 或版本控制
- [ ] API Key 存於 Apps Script PropertiesService
- [ ] 已設定每日配額上限
- [ ] 已設定預算提醒
- [ ] 已測試 API 呼叫正常運作

---

## 疑難排解

### API 呼叫回傳 403
- 確認 API Key 已啟用 Places API
- 確認應用限制允許 `script.google.com`
- 確認帳單已啟用

### API 呼叫回傳 429
- 已達配額上限
- 等待隔日重設，或調高配額

### API 呼叫回傳 400
- 檢查請求格式是否正確
- 確認使用的是 Places API (New) 的端點（`places.googleapis.com/v1/`）
- 確認 Field Mask 格式正確

### 配額追蹤不準確
- Apps Script 中的計數是獨立的，可能與 Google Cloud Console 有時差
- 以 Google Cloud Console 的數據為準

---

## 更新 API Key

如果需要更換 API Key：
1. 在 Google Cloud Console 建立新的 API Key
2. 在 Apps Script 中執行 `setPlacesApiKey("新的API_KEY")`
3. 舊的 API Key 會被覆蓋
4. 建議在 Cloud Console 中刪除舊的 API Key

## 刪除 API Key

如果不再使用：
1. 在 Apps Script 中執行 `deletePlacesApiKey()`
2. 在 Google Cloud Console 中刪除 API Key
3. 停用 Places API（如完全不再使用）
