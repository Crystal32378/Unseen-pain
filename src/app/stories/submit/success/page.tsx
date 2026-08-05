import Link from "next/link";
import { CheckCircle2, ArrowRight, Home } from "lucide-react";
import { StoriesShell } from "@/components/stories/StoriesShell";

export default function SubmitSuccessPage() {
  return (
    <StoriesShell>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 sm:px-6">
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-calm">
              <CheckCircle2 className="h-8 w-8 text-calm-foreground" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                已收到，審核後才會公開
              </h1>
              <p className="max-w-md text-base leading-relaxed text-foreground/80">
                謝謝你願意把這段經驗留下來。
                你的投稿目前狀態是「待審核」，管理者會閱讀內容並決定是否公開。
                通過審核後，就會出現在「原來不只我說不清楚」頁面。
              </p>
            </div>
          </div>

          <section className="rounded-xl border border-border bg-calm/20 p-5">
            <p className="text-sm leading-relaxed text-calm-foreground">
              <strong className="font-medium">關於審核：</strong>
              我們會檢查內容是否包含姓名、電話、病歷號、醫師姓名、藥物推薦等不應公開的資訊。
              如果有，管理者可能會編輯後再公開，或直接拒絕。
              審核時間沒有保證，也不會通知你（因為我們不知道你是誰）。
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/stories"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              看看其他人的經驗
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
            >
              回首頁
              <Home className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card no-print">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 看不見的痛。本網站不提供醫療診斷。
          </p>
        </div>
      </footer>
    </StoriesShell>
  );
}
