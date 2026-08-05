# 看不見的痛｜神經痛就醫導航

協助使用者整理疼痛描述、理解就醫方向，並找到神經內科與復健科的就醫入口。

## 目前狀態

- Next.js 預覽介面已整理在 `src/`。
- 院所搜尋預覽目前使用 `src/lib/mockData.ts`，不代表已完成健保署資料同步或現況查證。
- Google Apps Script 生產草稿與部署文件位於 `download/`。
- 這個 repository 不應包含 `.env`、API key、患者症狀、定位資料或本機 SQLite 資料庫。

## 開發

```bash
npm install
npm run lint
npm run build
```

需要本機資料庫時，請先複製 `.env.example` 為 `.env`，並只使用本機測試值。

## 文件

- [交付與架構說明](download/docs/README.md)
- [部署指南](download/docs/deployment-guide.md)
- [Crystal 操作清單](download/docs/crystal-checklist.md)

本專案不提供醫療診斷；實際診斷、檢查與治療請由合格醫療人員評估。

---

## 匿名就醫經驗分享（anonymous-stories branch）

### 功能範圍

讓曾經歷神經痛／不明疼痛就醫過程者，匿名分享自己的經驗：
- 當時出現的感覺或症狀
- 第一站去了哪一科
- 曾被安排哪些檢查（誘發電位、肌電圖、神經傳導檢查等）
- 過程中哪個資訊幫助自己理解下一步
- 想對同樣說不清楚疼痛的人說什麼

**禁止內容**：真實姓名、電話、Email、身分證、病歷號、醫師姓名、醫院排名、藥物/保健品推薦、保證治癒說法、自我或替他人診斷。

### 路由

| 路徑 | 說明 |
|---|---|
| `/` | 首頁底部新增「原來不只我說不清楚」入口區塊 |
| `/stories` | 瀏覽所有已審核通過的匿名分享 |
| `/stories/submit` | 匿名投稿表單（含 honeypot 與簽章 cookie 限流） |
| `/stories/submit/success` | 投稿成功狀態頁（提醒「審核後才會公開」） |
| `/admin/signin` | Google 登入頁 |
| `/admin/stories` | 管理者審核介面（pending / approved / rejected / hidden 分頁） |

### 資料庫

使用 **Neon Postgres**（透過 Vercel Marketplace 連接）。

Prisma schema 位於 `prisma/schema.prisma`，新增 model `AnonymousStory` 與 enum `ModerationStatus`。

#### 建立步驟

1. 至 Vercel Dashboard → 你的專案 → Storage tab → Connect Database → 選 **Neon**
2. 建立後 Vercel 會自動把 `DATABASE_URL` 注入到 Environment Variables
3. 在本機 `.env`（不 commit）填入同樣的 `DATABASE_URL` 用於本地開發
4. 跑 schema migration：
   ```bash
   bunx prisma db push
   ```
5. 確認 `AnonymousStory` table 已建立

### 環境變數

所有變數名稱與說明見 `.env.example`。重點：

| 變數 | 用途 | 必填 |
|---|---|---|
| `DATABASE_URL` | Neon Postgres 連線字串 | ✅ |
| `AUTH_SECRET` | NextAuth + 限流 cookie 簽章密鑰 | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ |
| `ADMIN_EMAILS` | 逗號分隔的允許管理者 email | ✅ |
| `NEXT_PUBLIC_SITE_URL` | 正式網址（選填，便於 server-side fetch） | ⬜ |

**所有真實值只放 Vercel Environment Variables，絕不寫入此 repo。**

### Auth / 管理者權限

- 使用 Auth.js (NextAuth v5) + Google provider
- Session 策略：JWT（不寫入 DB session table）
- 管理者允許名單：環境變數 `ADMIN_EMAILS`（email allowlist）
- 沒有共享密碼、沒有 HTTP Basic Auth

#### 縱深防禦

| 層級 | 機制 | 檔案 |
|---|---|---|
| L1 | `src/proxy.ts`（Next.js 16）比對路徑，未登入 → 重導 `/admin/signin` | `src/proxy.ts` |
| L2 | `requireAdmin()` 在每個 `/api/admin/*` route handler 內再次驗證 session 與 allowlist | `src/lib/admin-auth.ts` |
| L3 | Auth.js `signIn` callback 拒絕非 allowlist email 完成登入 | `src/auth.ts` |

### 防灌水機制（不儲存 IP）

MVP 採三層防護，**完全不儲存任何 IP**：

1. **Honeypot 欄位**：表單內隱藏 `website` 欄位，真人看不到，機器人會填。server 端命中時回 200 假裝成功但不寫入 DB。
2. **時間檢查**：表單載入時記錄 `loadedAt`，server 端檢查 `Date.now() - loadedAt >= 4000ms`，阻擋秒填機器人。
3. **簽章 cookie 限流**：每個瀏覽器用 HttpOnly cookie 持有以 `AUTH_SECRET` 簽章的 JWT，內含最近 24h 的送出時間戳陣列。每 24h 最多 3 篇。

#### 為什麼不用 IP 限流？

- 個資合規：IP 在某些司法管轄區被視為個資，永久儲存需額外合規
- Serverless 限制：Vercel serverless instance 間不共享 in-memory state
- 代理穿透：CDN/VPN 使用者 IP 不可靠

#### 進階防護（未來可加）

- Cloudflare Turnstile（不需 IP 儲存）
- Vercel Bot Protection / WAF

### 檢舉機制

- 每篇已核准分享卡片上有「檢舉」按鈕
- 檢舉不存使用者識別，僅 `report_count + 1`
- `report_count >= 5` 自動轉為 `hidden`（管理者可手動恢復）

### 不做的事（明確邊界）

- ❌ 不碰健保署資料、Apps Script、院所搜尋邏輯
- ❌ 不 merge main、不 push 其他 branch
- ❌ 不在 repo 寫入密碼、API key、DATABASE_URL 實際值
- ❌ 不加會員系統、按讚、私訊、回覆
- ❌ 不加社群演算法、推薦系統
- ❌ 不修改現有任何 section 元件的樣式或邏輯
- ❌ 不發通知 email

### 本機開發測試

```bash
# 1. 設定 .env（複製 .env.example，填入本機或 Neon dev branch 連線）
cp .env.example .env

# 2. 安裝依賴
bun install

# 3. 建立 schema（首次或 schema 變更後）
bunx prisma db push

# 4. 啟動 dev server
bun run dev

# 5. 測試投稿流程
#    http://localhost:3000/stories/submit → 送出 → 看到 success 頁
#    http://localhost:3000/stories → 應為空（pending 不會出現）

# 6. 測試審核流程
#    http://localhost:3000/admin/signin → 用 ADMIN_EMAILS 內的 Google 帳號登入
#    http://localhost:3000/admin/stories → 找到剛才的投稿 → 核准
#    回 http://localhost:3000/stories → 應該看到該篇
```
