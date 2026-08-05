import Link from "next/link";
import { ArrowLeft, LogIn, ShieldCheck } from "lucide-react";
import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";

interface SearchParams {
  callbackUrl?: string;
  error?: string;
}

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const session = await auth();

  // 已登入且為管理者 → 直接導向審核頁
  if (session?.user && (session.user as { isAdmin?: boolean }).isAdmin) {
    redirect("/admin/stories");
  }

  const errorMap: Record<string, string> = {
    unauthorized: "你登入的 Google 帳號不在管理者允許名單中。",
    OAuthSignin: "無法啟動 Google 登入流程，請稍後再試。",
    OAuthCallback: "Google 登入回呼失敗，請稍後再試。",
    Configuration: "伺服器 Auth 設定有誤，請聯絡管理員。",
    default: "登入失敗，請稍後再試。",
  };
  const errorMessage = sp.error ? errorMap[sp.error] ?? errorMap.default : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <div className="space-y-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            回首頁
          </Link>

          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              管理者登入
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              此區域僅供「看不見的痛」網站管理者進入。
              請使用已授權的 Google 帳號登入。
            </p>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-alert/30 bg-alert/10 p-4 text-sm text-alert-foreground">
              {errorMessage}
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("google", {
                callbackUrl: sp.callbackUrl ?? "/admin/stories",
                redirectTo: sp.callbackUrl ?? "/admin/stories",
              });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              使用 Google 帳號登入
            </button>
          </form>

          <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-2 font-medium text-foreground">隱私說明</p>
            <ul className="space-y-1">
              <li>· 登入僅用於驗證你的 email 是否在授權清單中。</li>
              <li>· 我們不會在你的瀏覽器以外的任何地方儲存密碼。</li>
              <li>· 登入後請在使用完畢時登出，避免共用裝置風險。</li>
              <li>· 若你認為自己應有權限但無法登入，請聯絡網站擁有者。</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
