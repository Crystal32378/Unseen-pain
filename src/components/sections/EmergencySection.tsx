"use client";

import { AlertTriangle, Phone, ArrowRight } from "lucide-react";
import { SectionId } from "@/lib/types";

interface EmergencySectionProps {
  onNavigate?: (section: SectionId) => void;
}

export function EmergencySection({ onNavigate }: EmergencySectionProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4 pt-8">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-alert-foreground" />
          <p className="text-sm font-bold text-alert-foreground">立即就醫警訊</p>
        </div>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          什麼情況不能繼續等？
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          大多數的神經痛不會立即危及生命，但有些情況需要盡快、甚至立即尋求專業醫療協助。如果你或身邊的人出現以下情況，請不要繼續只在網路上搜尋——直接就醫或撥打 119。
        </p>
      </header>

      {/* Emergency list */}
      <section className="space-y-3">
        <div className="space-y-2">
          <EmergencyItem
            title="突然出現或快速惡化的無力"
            desc="例如：本來正常的手腳突然使不上力、拿不住東西、走路會跌。"
          />
          <EmergencyItem
            title="臉部歪斜"
            desc="例如：照鏡子發現嘴角不對稱、一側眼睛無法閉合。"
          />
          <EmergencyItem
            title="說話困難"
            desc="例如：突然口齒不清、聽不懂別人說的話、或想說的話說不出來。"
          />
          <EmergencyItem
            title="單側肢體突然異常"
            desc="例如：一隻手或一隻腳突然出現明顯的無力、麻木或失去協調。"
          />
          <EmergencyItem
            title="新出現的大小便控制問題"
            desc="例如：突然無法控制排尿或排便，或解不出來。"
          />
          <EmergencyItem
            title="會陰或臀部附近新出現麻木"
            desc="例如：騎車區域（馬鞍區）出現感覺喪失或異常。這可能是神經壓迫的警訊。"
          />
          <EmergencyItem
            title="嚴重外傷後出現麻木或無力"
            desc="例如：車禍、跌倒、撞擊後出現新的神經症狀，即使外觀沒有明顯傷口。"
          />
          <EmergencyItem
            title="症狀快速擴大"
            desc="例如：麻木或疼痛的範圍在幾小時或幾天內明顯擴大。"
          />
          <EmergencyItem
            title="其他明顯急性異常"
            desc="例如：突發劇烈頭痛、意識改變、視力突然喪失等。相信你的直覺——如果覺得不對勁，就醫檢查。"
          />
        </div>
      </section>

      {/* Action box */}
      <section className="rounded-xl border-2 border-alert/30 bg-alert/20 p-6">
        <h2 className="mb-4 text-lg font-bold text-alert-foreground">
          如果你出現上述情況
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alert-foreground text-sm font-bold text-background">
              1
            </span>
            <p className="text-sm text-alert-foreground/90">
              如果症狀嚴重、突然、或伴隨意識變化，<strong>立即撥打 119</strong>或前往最近的急診。
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alert-foreground text-sm font-bold text-background">
              2
            </span>
            <p className="text-sm text-alert-foreground/90">
              如果症狀新出現但還不到急診程度，<strong>今天就聯絡神經內科或急診門診</strong>，不要拖到下週。
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-alert-foreground text-sm font-bold text-background">
              3
            </span>
            <p className="text-sm text-alert-foreground/90">
              前往就醫時，帶著你整理的症狀描述。<strong>具體的觀察比你的結論更有幫助。</strong>
            </p>
          </div>
        </div>

        <a
          href="tel:119"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-alert-foreground px-6 py-3 font-bold text-background transition-opacity hover:opacity-90"
        >
          <Phone className="h-5 w-5" />
          撥打 119
        </a>
      </section>

      {/* Reassurance */}
      <section className="rounded-xl bg-calm p-6">
        <p className="text-sm leading-relaxed text-calm-foreground">
          <strong>如果你沒有出現上述情況：</strong>這不代表你的痛不重要。多數神經痛確實不需要急診，但仍然值得被好好評估。你可以繼續使用這個網站整理症狀、找院所，安排一次常規門診。
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate("describe-pain")}
            className="mt-3 flex items-center gap-1 text-sm font-medium text-primary"
          >
            回到症狀整理工具
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </section>
    </div>
  );
}

interface EmergencyItemProps {
  title: string;
  desc: string;
}

function EmergencyItem({ title, desc }: EmergencyItemProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-alert/20 bg-card p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-alert-foreground" />
      <div className="flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-foreground/70">{desc}</p>
      </div>
    </div>
  );
}
