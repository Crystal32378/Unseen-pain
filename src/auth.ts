import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Auth.js (NextAuth v5) 設定
 *
 * 設計重點：
 * 1. 僅使用 Google OAuth provider，不開放註冊
 * 2. JWT session strategy（不寫入資料庫 session，避免額外 table 維護）
 * 3. 管理者權限由 ADMIN_EMAILS 環境變數決定（email allowlist）
 * 4. 不使用 Prisma adapter — 帳號資訊只存在 JWT 中，降低資料庫寫入面
 * 5. 只用於 /admin/* 與 /api/admin/* 保護，前台完全匿名
 *
 * 安全邊界：
 * - proxy.ts 會把未登入使用者擋在 /admin/* 與 /api/admin/* 之外
 * - 每個 admin API route 仍會呼叫 requireAdmin() 再次驗證（不依賴 proxy）
 */

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

const config = {
  providers: [Google],
  session: {
    strategy: "jwt",
    // Session JWT 預設 30 天過期；管理者用完即關瀏覽器即可
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    // 自訂登入頁，沿用網站既有風格
    signIn: "/admin/signin",
    error: "/admin/signin",
  },
  callbacks: {
    // 登入時：只有 allowlist 內的 email 才允許完成登入
    async signIn({ user }) {
      if (!isAdminEmail(user.email)) {
        // 非 allowlist email 直接拒絕；使用者會被導向 /admin/signin?error=unauthorized
        return false;
      }
      return true;
    },
    // JWT：把 admin 標記塞進 token
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdminEmail(user.email);
      }
      return token;
    },
    // Session：把 admin 標記暴露給 client
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        // 自訂欄位：client 可讀取但無法偽造（JWT 簽章保護）
        (session.user as { isAdmin?: boolean }).isAdmin =
          token.isAdmin === true;
      }
      return session;
    },
    // 預設允許所有 redirect；signIn callback 已經是第一道閘
    async redirect({ url, baseUrl }) {
      // 只允許同源 redirect，避免 open redirect
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return baseUrl;
    },
  },
  // secret 強制由環境變數提供
  secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;

export const { auth, handlers, signIn, signOut } = NextAuth(config);
