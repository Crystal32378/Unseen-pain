"use client";

import { SectionId } from "@/lib/types";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface HomeSectionProps {
  onNavigate: (section: SectionId) => void;
}

export function HomeSection({ onNavigate }: HomeSectionProps) {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-6 pt-8">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            看不見的痛｜神經痛就醫導航
          </p>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            神經痛看哪科？
            <br />
            麻、刺、燒、觸電感的
            <br className="hidden sm:block" />
            就醫第一站
          </h1>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-base leading-relaxed text-foreground/80">
            有些痛看不見傷口，也很難說清楚。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            它可能像針刺、火燒、觸電、螞蟻爬，也可能同時麻木又疼痛。當你不知道這算不算神經痛，也不知道該掛哪一科時，這裡可以幫你整理感受、找到就醫方向與附近院所。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            這個網站不能替你診斷，但可以幫你找到第一個求援入口。
          </p>
        </div>
      </section>

      {/* Emergency banner */}
      <button
        onClick={() => onNavigate("emergency")}
        className="flex w-full items-center gap-3 rounded-xl border-2 border-alert/30 bg-alert/40 p-4 text-left transition-colors hover:bg-alert/60"
      >
        <AlertTriangle className="h-6 w-6 shrink-0 text-alert-foreground" />
        <div className="flex-1">
          <p className="font-semibold text-alert-foreground">
            出現這些情況，請立即就醫
          </p>
          <p className="text-sm text-alert-foreground/80">
            突然無力、臉歪、說話困難、大小便控制異常等——不要繼續只在網路上搜尋
          </p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-alert-foreground" />
      </button>

      {/* Four entry points */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">
          你現在可以從這裡開始
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <EntryCard
            number="1"
            title="我的痛該怎麼描述？"
            description="把說不清楚的麻、刺、燒、觸電感，整理成可以帶進診間的一句話。只在你的瀏覽器中處理，不會儲存任何資料。"
            actionLabel="開始整理"
            onClick={() => onNavigate("describe-pain")}
          />
          <EntryCard
            number="2"
            title="我應該先看哪一科？"
            description="神經內科、復健科、家醫科——不同科別可能扮演不同的第一站角色。第一科不是最後一科，也不代表掛錯。"
            actionLabel="了解科別"
            onClick={() => onNavigate("which-dept")}
          />
          <EntryCard
            number="3"
            title="找附近的神經科與復健科"
            description="依縣市與行政區搜尋具正式神經科或復健科的健保特約醫院。資料來自健保署公開資料，可撥打電話、開啟導航；目前位置排序尚未開放。"
            actionLabel="搜尋院所"
            onClick={() => onNavigate("search")}
          />
          <EntryCard
            number="4"
            title="一位過來人的真實經驗"
            description="Crystal 曾經歷尺神經痛與薦骨附近神經性疼痛。這裡記錄她真實發生的事，以及哪些經驗不能被推廣到所有人。"
            actionLabel="閱讀故事"
            onClick={() => onNavigate("crystal-story")}
          />
        </div>
      </section>

      {/* Trust statement */}
      <section className="rounded-xl bg-warm p-6">
        <p className="text-center text-lg font-medium text-warm-foreground">
          「有人認得這種痛，你可以從這裡開始。」
        </p>
      </section>

      {/* What this site is / is not */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <h3 className="font-bold text-foreground">這個網站會做</h3>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>相信並接住一個無法清楚描述疼痛的人</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>協助你把身體感受整理成可帶進診間的語言</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>提供可信、可執行的第一個就醫入口</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span>標示官方資料來源與查證狀態</span>
            </li>
          </ul>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <h3 className="font-bold text-foreground">這個網站不做</h3>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-alert-foreground">✗</span>
              <span>不替你診斷疾病</span>
            </li>
            <li className="flex gap-2">
              <span className="text-alert-foreground">✗</span>
              <span>不推薦保健品或特定品牌</span>
            </li>
            <li className="flex gap-2">
              <span className="text-alert-foreground">✗</span>
              <span>不收診所廣告，不替醫師排名</span>
            </li>
            <li className="flex gap-2">
              <span className="text-alert-foreground">✗</span>
              <span>不蒐集你的姓名、電話或醫療資料</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

interface EntryCardProps {
  number: string;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

function EntryCard({ number, title, description, actionLabel, onClick }: EntryCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {number}
        </span>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-foreground/70">
        {description}
      </p>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </span>
    </button>
  );
}
