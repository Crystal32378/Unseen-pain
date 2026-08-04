"use client";

import { SectionId } from "@/lib/types";
import { ArrowRight, Stethoscope, Activity, HeartPulse, Home } from "lucide-react";

interface WhichDeptSectionProps {
  onNavigate: (section: SectionId) => void;
}

export function WhichDeptSection({ onNavigate }: WhichDeptSectionProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">看哪一科</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          神經痛該看神經內科、復健科還是骨科？
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          很多人第一次遇到麻、刺、燒、觸電感的疼痛時，會卡在不知道該掛哪一科。這裡不是要替你判斷疾病，而是說明不同科別可能扮演的角色，讓你有一個可以開始的入口。
        </p>
      </header>

      {/* Department cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <DeptCard
          icon={<Activity className="h-6 w-6" />}
          title="神經內科"
          role="第一站角色"
          description="如果你主要的困擾是麻、刺、無力、感覺異常，或疼痛伴隨神經分佈區域的症狀，神經內科可能是評估神經是否受損的第一站。醫師可能安排神經傳導檢查或肌電圖，進一步了解神經的功能狀態。"
          canDo={["評估神經功能", "安排神經傳導檢查、肌電圖", "判讀神經受損程度與位置"]}
        />
        <DeptCard
          icon={<HeartPulse className="h-6 w-6" />}
          title="復健科"
          role="第一站角色"
          description="如果你的疼痛跟姿勢、活動、重複動作有關，或已經有初步診斷但需要後續復健與物理治療，復健科可能是一個合適的入口。復健科醫師可以評估是否需要物理治療、電療或其他復健計畫。"
          canDo={["評估姿勢與動作相關疼痛", "安排物理治療、電療", "擬定復健計畫"]}
        />
        <DeptCard
          icon={<Home className="h-6 w-6" />}
          title="家醫科"
          role="不確定時的入口"
          description="如果你完全不確定該看哪一科，或症狀還很模糊，家醫科可以作為初步評估的入口，必要時再轉介至神經內科或復健科。這不是「退而求其次」，而是一個合理的開始。"
          canDo={["初步評估模糊症狀", "協助判斷是否需轉介", "處理共病症狀"]}
        />
      </section>

      {/* Important note */}
      <section className="rounded-xl border border-border bg-calm p-6">
        <h2 className="mb-3 text-lg font-bold text-calm-foreground">
          關於「第一科」的重要觀念
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-calm-foreground/90">
          <p>
            <strong>第一科不是最後一科。</strong>很多人在第一科沒有立刻得到答案，這不代表掛錯了。神經痛的評估有時需要時間，也可能需要跨科別合作。
          </p>
          <p>
            <strong>掛錯科不等於浪費時間。</strong>即使最後發現應該看另一科，第一次看診的記錄、初步檢查結果，對後續醫師都是有價值的資訊。帶著你整理好的症狀描述去看診，不管掛哪一科都有幫助。
          </p>
          <p>
            <strong>不確定時，先選方便持續回診的科別。</strong>神經痛的追蹤通常需要不只一次看診。如果距離、時間是考量，選一個你方便持續回去的神經內科、復健科或家醫科，比一次「最正確」的掛號更重要。
          </p>
        </div>
      </section>

      {/* What this page doesn't do */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-bold text-foreground">
          這一頁不會做的事
        </h2>
        <ul className="space-y-3 text-sm text-foreground/80">
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-alert-foreground">✗</span>
            <span>不會宣稱某種症狀「一定」屬於某一科。症狀與科別的對應需要醫師臨床判斷，不是網頁能替代的。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-alert-foreground">✗</span>
            <span>不會替你判斷你的疼痛是不是神經痛。有些非神經痛的問題也會出現類似症狀。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold text-alert-foreground">✗</span>
            <span>不會貶低任何一科。骨科、神經外科、疼痛科、身心科都可能在某些階段扮演重要角色。</span>
          </li>
        </ul>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onNavigate("describe-pain")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          先整理我的症狀
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onNavigate("search")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
        >
          <Stethoscope className="h-4 w-4" />
          搜尋附近院所
        </button>
      </section>
    </div>
  );
}

interface DeptCardProps {
  icon: React.ReactNode;
  title: string;
  role: string;
  description: string;
  canDo: string[];
}

function DeptCard({ icon, title, role, description, canDo }: DeptCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground/80">{description}</p>
      <div className="mt-auto space-y-1.5 pt-2">
        {canDo.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-foreground/70">
            <span className="text-primary">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
