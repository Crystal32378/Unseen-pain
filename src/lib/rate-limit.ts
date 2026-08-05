import { cookies } from "next/headers";

/**
 * Serverless-friendly rate limiter — 不存任何 IP
 *
 * 策略組合：
 * 1. **Honeypot**：表單隱藏欄位 `website`，真人看不到、機器人會填。在 route handler 中檢查。
 * 2. **時間檢查**：表單載入時塞 `loadedAt` 時間戳，server 端檢查 `Date.now() - loadedAt >= MIN_FORM_TIME_MS`，
 *    阻擋秒填的機器人。
 * 3. **簽章 cookie 限流**：每個瀏覽器用 HttpOnly cookie 持有一個簽章 JWT，
 *    內含最近送出時間戳陣列。Server 端驗證簽章後檢查 24h 內送出次數。
 *    - 不存 IP（避免個資疑慮與 GDPR/Kafka 級的合規問題）
 *    - 不存瀏覽器指紋
 *    - Cookie 過期 = 視窗滑動
 *
 * 限制：
 * - 限流 cookie 的「載具」是瀏覽器；清 cookie 或換裝置可繞過。
 *   這是 MVP 階段可接受的取捨。進階防護請在 Vercel 啟用 Bot Protection / WAF，
 *   或加入 Cloudflare Turnstile（不需 IP 儲存）。
 * - Serverless instance 之間不共享 in-memory state，因此必須把狀態放在 cookie。
 *
 * 安全：
 * - Cookie 由 AUTH_SECRET 簽章，使用者無法偽造次數
 * - HttpOnly + Secure + SameSite=Strict
 */

const COOKIE_NAME = "sl_submissions";
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 小時
const MAX_SUBMISSIONS = 3; // 24h 內最多 3 篇
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天
const MIN_FORM_TIME_MS = 4_000; // 表單至少要開 4 秒才能送出（阻擋秒填機器人）

interface RateLimitResult {
  allowed: boolean;
  reason?: "too_many" | "too_fast" | "honeypot";
  remaining: number;
  resetAt: number; // ms since epoch
}

/**
 * 檢查 honeypot + 時間 + cookie 限流。
 * 通過時不會修改 cookie；通過後請呼叫 recordSubmission() 寫入。
 */
export async function checkSubmissionAllowed(input: {
  honeypotValue: string | undefined;
  loadedAt: number;
}): Promise<RateLimitResult> {
  // 1. Honeypot：非空 = 機器人
  if (input.honeypotValue && input.honeypotValue.trim() !== "") {
    return {
      allowed: false,
      reason: "honeypot",
      remaining: 0,
      resetAt: Date.now() + WINDOW_MS,
    };
  }

  // 2. 時間檢查
  const now = Date.now();
  if (now - input.loadedAt < MIN_FORM_TIME_MS) {
    return {
      allowed: false,
      reason: "too_fast",
      remaining: 0,
      resetAt: now + WINDOW_MS,
    };
  }

  // 3. Cookie 限流
  const store = await readCookieStore();
  const recent = store.filter((ts) => now - ts < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS) {
    const oldest = Math.min(...recent);
    return {
      allowed: false,
      reason: "too_many",
      remaining: 0,
      resetAt: oldest + WINDOW_MS,
    };
  }

  return {
    allowed: true,
    remaining: MAX_SUBMISSIONS - recent.length,
    resetAt: now + WINDOW_MS,
  };
}

/**
 * 通過後呼叫：把這次 submission 時間戳寫進 cookie。
 */
export async function recordSubmission(): Promise<void> {
  const now = Date.now();
  const store = await readCookieStore();
  const recent = store.filter((ts) => now - ts < WINDOW_MS);
  recent.push(now);

  // 最多保留 2x 上限的時間戳，避免 cookie 無限成長
  const trimmed = recent.slice(-MAX_SUBMISSIONS * 2);

  const signed = await signPayload(JSON.stringify(trimmed));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

// ---------- 內部 helpers ----------

async function readCookieStore(): Promise<number[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return [];
  const verified = await verifyPayload(raw);
  if (!verified) return [];
  try {
    const parsed = JSON.parse(verified);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "number" && x > 0);
  } catch {
    return [];
  }
}

/**
 * 簽章 payload using Web Crypto API（Vercel Edge / Node 18+ 原生支援）。
 * 不引入 jose 或 jsonwebtoken，保持依賴最小。
 *
 * 格式：base64url(payload).base64url(hmacSignature)
 */
async function signPayload(payload: string): Promise<string> {
  const secret = getAuthSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const data = new TextEncoder().encode(payload);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  return `${b64url(payload)}.${b64url(sig)}`;
}

async function verifyPayload(signed: string): Promise<string | null> {
  const secret = getAuthSecret();
  const [payloadB64, sigB64] = signed.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const payload = unb64url(payloadB64);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sigBuf = await (async () => {
      // base64url → Uint8Array
      const bin = atob(sigB64.replace(/-/g, "+").replace(/_/g, "/"));
      const buf = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return buf;
    })();
    const data = new TextEncoder().encode(payload);
    const ok = await crypto.subtle.verify("HMAC", key, sigBuf, data);
    return ok ? payload : null;
  } catch {
    return null;
  }
}

function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "AUTH_SECRET environment variable is required for rate limiting",
    );
  }
  return s;
}

function b64url(input: string | ArrayBuffer): string {
  let bin: string;
  if (typeof input === "string") {
    bin = input;
  } else {
    const bytes = new Uint8Array(input);
    bin = String.fromCharCode(...bytes);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function unb64url(input: string): string {
  return atob(input.replace(/-/g, "+").replace(/_/g, "/"));
}
