"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

/**
 * 投稿／瀏覽頁共用：邊界與免責聲明區塊
 * 沿用現有網站的 --alert token 與卡片樣式
 */
export function StoryDisclaimer({
  variant = "form",
}: {
  variant?: "form" | "list";
}) {
  if (variant === "list") {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-bold text-foreground">
          這裡收集真實但匿名的就醫經驗
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/80">
          每個人的身體與診療情況不同，內容只代表個人經歷，不能取代專業醫療判斷。
          如果某篇分享讓你覺得不舒服、疑似包含個資或醫療建議，請使用該卡片上的「檢舉」按鈕。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-calm/40 p-3 text-sm text-calm-foreground">
            <p className="font-medium">這裡「會」收到的內容</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>· 當時出現的感覺或症狀</li>
              <li>· 第一站去了哪一科</li>
              <li>· 曾被安排哪些檢查</li>
              <li>· 哪個資訊幫助自己理解下一步</li>
              <li>· 想對同樣說不清楚疼痛的人說的話</li>
            </ul>
          </div>
          <div className="rounded-lg bg-alert/30 p-3 text-sm text-alert-foreground">
            <p className="font-medium">這裡「不會」收到的內容</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>· 真實姓名、電話、Email、身分證、病歷號</li>
              <li>· 醫師姓名或醫院排名、公審內容</li>
              <li>· 自我診斷或替他人診斷</li>
              <li>· 藥品、保健品、偏方或療效推薦</li>
              <li>· 保證治癒或醫療效果的說法</li>
            </ul>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-xl border-2 border-alert/20 bg-alert/10 p-5">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-alert-foreground" />
        <h3 className="font-bold text-alert-foreground">
          投稿前請先閱讀
        </h3>
      </div>
      <ul className="space-y-1.5 text-sm text-alert-foreground/90">
        <li className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
          <span>
            <strong>不要填寫</strong>真實姓名、電話、Email、身分證字號、病歷號。
          </span>
        </li>
        <li className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
          <span>
            <strong>不要提及</strong>特定醫師姓名、醫院排名、或可辨識院所的公審內容。
          </span>
        </li>
        <li className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
          <span>
            <strong>不要推薦</strong>藥品、保健品、偏方，或宣稱保證治癒。
          </span>
        </li>
        <li className="flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" />
          <span>
            <strong>不要替自己或他人下診斷</strong>。分享的是經驗，不是醫療意見。
          </span>
        </li>
      </ul>
      <p className="text-xs text-alert-foreground/70">
        投稿後會顯示「已收到，審核後才會公開」。所有內容預設為 pending，只有管理者核准後才會出現在網站上。
      </p>
    </section>
  );
}
