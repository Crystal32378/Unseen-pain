import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoriesShell } from "@/components/stories/StoriesShell";
import { StoryForm } from "@/components/stories/StoryForm";

export default function SubmitStoryPage() {
  return (
    <StoriesShell>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Link
              href="/stories"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
              返回分享列表
            </Link>
            <p className="text-sm font-medium text-muted-foreground">
              匿名就醫經驗分享
            </p>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              分享我的就醫經驗
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-foreground/80">
              這裡不是醫療問答區，也不是診斷討論區。
              如果你曾經歷說不清楚的疼痛——麻、刺、燒、觸電感——
              並走過就醫過程，可以匿名分享你如何找到下一步。
            </p>
          </div>

          <StoryForm />
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
