"use client";

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

/**
 * 首頁入口區塊：「原來不只我說不清楚」
 * 沿用現有 EntryCard 風格與色彩 token
 */
export function StoriesEntrySection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          匿名就醫經驗分享
        </p>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">
          原來不只我說不清楚
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-foreground/70">
          這裡收集真實但匿名的就醫經驗。每個人的身體與診療情況不同，
          內容只代表個人經歷，不能取代專業醫療判斷。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/stories"
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-foreground">
              看看其他人的經驗
            </h3>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-foreground/70">
            閱讀已通過審核的匿名分享——他們當時出現什麼感覺、第一站去了哪一科、哪個資訊幫助他們找到下一步。
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
            瀏覽分享
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link
          href="/stories/submit"
          className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warm text-warm-foreground">
              <ArrowRight className="h-4 w-4" />
            </span>
            <h3 className="text-lg font-bold text-foreground">
              分享我的經驗
            </h3>
          </div>
          <p className="flex-1 text-sm leading-relaxed text-foreground/70">
            如果你曾經歷說不清楚的疼痛、麻木、刺痛或灼熱感，並走過就醫過程，
            可以匿名分享你的旅程。投稿後需經審核才會公開。
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
            匿名投稿
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}
