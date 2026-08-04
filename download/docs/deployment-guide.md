# 部署指南｜看不見的痛

> 本指南帶你從零開始，完成 Google Sites + Apps Script + Sheets 的完整部署。
> Crystal 需要親自操作的步驟已壓縮到最少。

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
5. 在函式下拉選單中選擇 `setupDatabase`
6. 點選「執行」
7. 第一次執行時需要授權：
   - 點選「查看權限」
   - 選擇你的 Google 帳號
   - 點選「進階 > 前往專案（不安全）」
   - 點選「允許」
8. 執行完成後，回到試算表，你會看到 5 個工作表已自動建立

### 步驟 1.4：貼入其他 .gs 檔案
1. 在 Apps Script 編輯器左側，點選「+」新增指令碼檔案
2. 依序新增並貼入：
   - `02_SyncNHI.gs`（同步健保署資料）
   - `03_PlacesMatch.gs`（Places API 匹配）
   - `06_Code.gs`（Web App 入口）
3. 每個檔案都儲存

### 步驟 1.5：貼入 HTML 檔案
1. 點選「+」>「HTML」新增 HTML 檔案
2. 依序新增並貼入：
   - `04_SearchWebApp.html`（搜尋器介面）
   - `05_SymptomTool.html`（症狀工具介面）
3. 檔案名稱必須完全一致（不含副檔名時）

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

### 步驟 2.3：顯示儀表板
1. 在 Apps Script 中執行 `showDashboard`
2. 查看記錄中的統計資訊

---

## Phase 3: 設定 Google Cloud 與 Places API

> 詳細步驟請見 `google-cloud-setup.md`

### 簡要步驟：
1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案「unseen-pain-nav」
3. 啟用 Places API (New)
4. 建立 API Key
5. 設定 API 限制（只啟用 Places API）
6. 設定應用限制（HTTP 參照網址或 IP）
7. 設定每日配額上限（建議 200 次/日）
8. 回到 Apps Script，執行 `setPlacesApiKey("你的API_KEY")`

---

## Phase 4: 部署搜尋器 Web App

### 步驟 4.1：首次部署
1. 在 Apps Script 編輯器中，點選「部署 > 新增部署」
2. 選擇類型「網頁應用程式」
3. 設定：
   - 說明：`院所搜尋器 v1`
   - 執行身分：`我`
   - 存取權限：`任何人`（如果要嵌入 Google Sites，需要此設定）
4. 點選「部署」
5. 授權存取權限
6. 複製「網頁應用程式」網址

### 步驟 4.2：測試搜尋器
1. 在瀏覽器中開啟部署網址
2. 測試搜尋功能：
   - 選擇科別
   - 選擇縣市
   - 點選搜尋
   - 確認結果卡片顯示正確
3. 測試手機版（可用瀏覽器開發者工具切換裝置）

### 步驟 4.3：取得症狀工具網址
在搜尋器網址後加上 `?page=symptom`，即為症狀工具的網址。
例如：`https://script.google.com/macros/s/XXX/exec?page=symptom`

---

## Phase 5: 建立 Google Sites

### 步驟 5.1：建立網站
1. 前往 [Google Sites](https://sites.google.com)
2. 點選「建立 > 空白網站」
3. 命名為「看不見的痛｜神經痛就醫導航」

### 步驟 5.2：建立頁面
依序建立 7 個頁面：
1. 首頁（路徑：home）
2. 看哪一科（路徑：which-department）
3. 描述疼痛（路徑：describe-pain）
4. 找院所（路徑：search）
5. 過來人經驗（路徑：crystal-story）
6. 緊急警訊（路徑：emergency）
7. 資料與聲明（路徑：about）

### 步驟 5.3：貼入文案
1. 打開 `download/content/google-sites-content.md`
2. 對每個頁面：
   - 在 Google Sites 中新增「文字方塊」
   - 將對應頁面的文案貼入
   - 依 Markdown 中的標題層級設定樣式（H1/H2/H3）

### 步驟 5.4：嵌入搜尋器
1. 在「找院所」頁面中
2. 點選「插入 > 內嵌 > 依據網址」
3. 貼入搜尋器 Web App 網址
4. 調整大小（建議寬度：全寬，高度：800px）

### 步驟 5.5：嵌入症狀工具
1. 在「描述疼痛」頁面中
2. 點選「插入 > 內嵌 > 依據網址」
3. 貼入症狀工具網址（加 `?page=symptom`）
4. 調整大小（建議寬度：全寬，高度：1200px）

### 步驟 5.6：設定導覽
1. 在「主題」中選擇簡潔的主題
2. 將 7 個頁面加入頂部導覽列
3. 將「緊急警訊」設為醒目顏色

### 步驟 5.7：設定 SEO
1. 在每個頁面的「設定」中：
   - 設定頁面標題（SEO title）
   - 設定頁面說明（meta description）
2. 在網站設定中：
   - 設定網站名稱
   - 設定 favicon（可選）

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
