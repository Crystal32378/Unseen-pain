import { auth } from "@/auth";
import { isAdminEmail } from "@/auth";

/**
 * Server-side admin 權限檢查 helper
 *
 * 重要：即使 proxy.ts 已經擋住未授權請求，每個 admin API route
 * 仍必須呼叫此函式再次驗證。原因：
 * 1. proxy 可能因 matcher 設定錯誤被繞過
 * 2. 直接從 server component 呼叫 API 時不會經過 proxy
 * 3. 縱深防禪（defense in depth）
 *
 * 回傳：
 * - { ok: true, email } 通過
 * - { ok: false, response } 未通過，直接回傳此 NextResponse 即可
 */
export async function requireAdmin(): Promise<
  | { ok: true; email: string }
  | { ok: false; response: Response }
> {
  const session = await auth();

  if (!session?.user?.email) {
    return {
      ok: false,
      response: Response.json(
        { error: "unauthorized", message: "請先登入" },
        { status: 401 },
      ),
    };
  }

  // 再次檢查 email 是否仍在 allowlist（允許管理者即時移除權限）
  if (!isAdminEmail(session.user.email)) {
    return {
      ok: false,
      response: Response.json(
        { error: "forbidden", message: "此帳號無管理者權限" },
        { status: 403 },
      ),
    };
  }

  // 同時驗證 JWT 中的 isAdmin 標記
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true;
  if (!isAdmin) {
    return {
      ok: false,
      response: Response.json(
        { error: "forbidden", message: "此帳號無管理者權限" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, email: session.user.email };
}
