import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Next.js 16 proxy.ts (replaces deprecated middleware.ts).
 *
 * 保護範圍：
 * - /admin/*          → 必須登入且 email 在 ADMIN_EMAILS allowlist
 * - /api/admin/*      → 同上（API route 內仍會再次驗證，不依賴 proxy）
 *
 * 不保護：
 * - /api/auth/*       → NextAuth 自己處理
 * - /stories, /stories/submit → 公開頁面
 * - 所有其他路由       → 維持原狀
 *
 * 注意：proxy 是第一道閘，但不是唯一一道。
 * /api/admin/* 內每個 route handler 都會呼叫 requireAdmin() 再次驗證 session，
 * 以防 proxy 被繞過或設定錯誤。
 */
export default auth(async (req) => {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // 登入頁本身不需要驗證，否則會無限 redirect 到自己
  if (pathname === "/admin/signin") {
    return NextResponse.next();
  }

  const session = await auth();

  // 未登入：導向登入頁（保留原 URL 作為 callbackUrl）
  if (!session?.user) {
    if (isAdminApi) {
      // API 呼叫不導向，直接回 401
      return NextResponse.json(
        { error: "unauthorized", message: "請先登入" },
        { status: 401 },
      );
    }
    const signInUrl = new URL("/admin/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    if (req.nextUrl.searchParams.get("error")) {
      signInUrl.searchParams.set(
        "error",
        req.nextUrl.searchParams.get("error") ?? "",
      );
    }
    return NextResponse.redirect(signInUrl);
  }

  // 已登入但非 allowlist email：登出並導向錯誤頁
  // （正常情況下 signIn callback 已擋下，這裡是防禦性檢查）
  const email = session.user.email;
  const isAdmin = (session.user as { isAdmin?: boolean }).isAdmin === true;
  if (!isAdmin || !email) {
    if (isAdminApi) {
      return NextResponse.json(
        { error: "forbidden", message: "此帳號無管理者權限" },
        { status: 403 },
      );
    }
    const errorUrl = new URL("/admin/signin", req.url);
    errorUrl.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.next();
});

export const config = {
  // 只在 admin 路徑觸發 proxy；其他路徑不影響效能
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
