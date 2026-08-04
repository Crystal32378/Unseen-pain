# Crystal 必須點擊清單

> 這是 Crystal 需要親自操作的最短清單。
> 其他所有建立、匯入、產生、更新的工作都已由程式完成。

---

## 你只需要做這 5 件事

### ① 登入 Google 帳號
- 使用你的 Google 帳號登入
- 建議使用專門用於此專案的帳號（避免與個人帳號混淆）

---

### ② 授權 Apps Script
- 第一次執行 Apps Script 時會跳出授權畫面
- 點選「查看權限」> 選擇你的帳號
- 點選「進階 > 前往專案（不安全）」
- 點選「允許」
- **只需做一次**，之後的執行不會再問

---

### ③ 啟用 Places API 並貼入 API Key
- 前往 [Google Cloud Console](https://console.cloud.google.com)
- 建立新專案
- 啟用「Places API (New)」
- 建立 API Key
- 設定限制（API 限制 + 應用限制）— 詳見 `google-cloud-setup.md`
- 回到 Apps Script，執行 `setPlacesApiKey("你的API_KEY")`
- 完成後 API Key 會安全儲存，不會出現在前端

---

### ④ 在 Google Sites 貼入嵌入網址
- 取得 Apps Script Web App 部署網址（2 個）：
  - 搜尋器網址
  - 症狀工具網址（加 `?page=symptom`）
- 在 Google Sites 對應頁面中：
  - 點選「插入 > 內嵌 > 依據網址」
  - 貼入網址
  - 調整大小

---

### ⑤ 按下發布
- 在 Google Sites 編輯器右上角
- 點選「發布」
- 確認「允許搜尋引擎建立索引」已啟用
- 完成後網站即上線

---

## 你「不需要」做的事

以下事情都由程式自動完成，你不需要手動處理：

- ❌ ~~填寫 Google Form~~
- ❌ ~~逐筆整理診所資料~~
- ❌ ~~手動建立 Google Sheet 欄位~~
- ❌ ~~手動匯入健保署資料~~
- ❌ ~~手動篩選神經科與復健科~~
- ❌ ~~手動比對 Google Place ID~~
- ❌ ~~逐筆輸入院所地址與電話~~
- ❌ ~~手動設定每週同步排程~~

---

## 完整步驟對照

如果需要更詳細的操作指引，請參考：

| 步驟 | 詳細指南 |
|------|---------|
| 建立 Sheet 與 Apps Script | `deployment-guide.md` Phase 1 |
| 同步健保署資料 | `deployment-guide.md` Phase 2（只需點「執行」） |
| 設定 Places API | `google-cloud-setup.md` |
| 部署 Web App | `deployment-guide.md` Phase 4（只需點「部署」） |
| 建立 Google Sites | `deployment-guide.md` Phase 5（貼入文案 + 嵌入網址） |
| 設定自動同步 | `deployment-guide.md` Phase 6（執行 `setupWeeklyTrigger()`） |

---

## 一句話總結

> **你登入、授權、貼 API Key、貼嵌入網址、按下發布。**
> **其他全部交給程式。**
