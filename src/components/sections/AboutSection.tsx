"use client";

import { ShieldCheck, Database, MapPin, FileText, Lock, Mail } from "lucide-react";
import { MOCK_STATS } from "@/lib/mockData";

export function AboutSection() {
  return (
    <div className="space-y-8">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">資料與聲明</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          資料來源、隱私說明與免責聲明
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          這個網站的目標是提供可信的就醫入口，不是取代醫療專業。以下是我們使用的資料來源、隱私處理方式與責任邊界。
        </p>
      </header>

      {/* Data sources */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">官方資料來源</h2>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80">
            本網站的院所資料主要來自衛生福利部中央健康保險署（健保署）的公開資料，包括：
          </p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>健保特約醫事機構資料（診所、醫院）</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>醫療院所診療科別明細</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>醫學中心、區域醫院、地區醫院名單</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>診療科別代碼對照檔</span>
            </li>
          </ul>
          <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>官方資料最後同步時間：{MOCK_STATS.lastSyncedAt}</p>
            <p>目前收錄院所總數：{MOCK_STATS.totalFacilities.toLocaleString()}</p>
            <p>其中神經科相關：{MOCK_STATS.neurologyCount} 間／復健科相關：{MOCK_STATS.rehabilitationCount} 間</p>
          </div>
        </div>
      </section>

      {/* Google data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Google Maps 資訊說明</h2>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80">
            本網站使用 Google Places API 補充部分院所的地圖位置、官方網站、營業資訊與導航連結。這些資訊僅作為便利性補充，不作為官方醫療資格或科別判斷依據。
          </p>
          <div className="space-y-2 text-sm text-foreground/80">
            <p><strong>Google 資料負責補充：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• Google Place ID（用於開啟地圖）</li>
              <li>• 地圖位置與導航連結</li>
              <li>• 官方網站連結（如有）</li>
              <li>• 營業資訊（如有）</li>
            </ul>
          </div>
          <div className="space-y-2 text-sm text-foreground/80">
            <p><strong>Google 資料不作為：</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 醫療品質判斷依據</li>
              <li>• 「最佳醫師」或「推薦第一名」的標示</li>
              <li>• 科別或服務是否存在的可靠證據</li>
            </ul>
          </div>
          <div className="mt-3 rounded-lg bg-warm p-3 text-xs text-warm-foreground">
            部分地圖、網站與營業資訊由 Google Maps 提供。實際科別、門診、檢查與復健服務，請於前往前向院所確認。
          </div>
        </div>
      </section>

      {/* Service verification */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">服務查證說明</h2>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80">
            本網站的進階服務資訊（如肌電圖、神經傳導檢查、物理治療、電療、是否需預約）不會由科別自動推論。例如：
          </p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>有復健科<strong>不代表</strong>一定可以當天電療</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>有神經科<strong>不代表</strong>一定有肌電圖設備</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>醫院有設備<strong>不代表</strong>該門診可直接安排</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>Google 評論<strong>不能</strong>當作服務存在的可靠證據</span>
            </li>
          </ul>
          <p className="mt-3 text-sm text-foreground/80">
            查證狀態分為以下層級：
          </p>
          <div className="space-y-1.5 text-xs">
            <VerificationLevel label="未確認" desc="目前沒有可靠資訊，不代表沒有該服務" color="bg-muted text-muted-foreground" />
            <VerificationLevel label="官方網站公開標示" desc="院所官方網站有明確標示" color="bg-calm text-calm-foreground" />
            <VerificationLevel label="院所電話確認" desc="已透過電話向院所確認" color="bg-calm text-calm-foreground" />
            <VerificationLevel label="院所人員書面確認" desc="院所提供書面資料確認" color="bg-calm text-calm-foreground" />
            <VerificationLevel label="使用者回報待確認" desc="使用者回報但尚未查證" color="bg-warm text-warm-foreground" />
            <VerificationLevel label="已失效" desc="原查證資訊已過時或不再適用" color="bg-alert text-alert-foreground" />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            服務資訊最後查證時間：2026-07-28
          </p>
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">隱私說明</h2>
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80">
            第一版不蒐集任何患者醫療資料。
          </p>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>症狀整理工具只在你使用的瀏覽器中運作，輸入內容不會送到伺服器、不會儲存。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>不要求姓名、電話、Email 或任何個人識別資訊。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>使用「目前位置」時，定位只在你的裝置上處理，不會永久儲存精確位置。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>不使用將症狀內容寫入網址的追蹤方式。</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">•</span>
              <span>不將症狀輸入傳給任何第三方。</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Medical disclaimer */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">醫療免責聲明</h2>
        </div>
        <div className="space-y-3 rounded-xl border-2 border-alert/20 bg-alert/5 p-6">
          <ul className="space-y-2.5 text-sm text-foreground/80">
            <li>本網站不提供醫療診斷、不推薦治療方案、不保證治癒。</li>
            <li>本網站上的所有內容（包括文字、工具、院所資訊）僅供參考，不構成醫療建議。</li>
            <li>實際診斷與治療請由合格醫療人員評估。</li>
            <li>如有緊急情況，請立即撥打 119 或前往急診，不要依賴本網站。</li>
            <li>個人經驗分享（如 Crystal 的故事）僅為個人經歷，不能推廣為通用療程或預期結果。</li>
            <li>本網站不推薦任何保健品、品牌或特定醫師。</li>
          </ul>
        </div>
      </section>

      {/* Personal experience statement */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">個人經驗聲明</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm leading-relaxed text-foreground/80">
            本網站由一位曾經歷尺神經痛與薦骨附近神經性疼痛的人發起。故事內容均為發起人親身經歷，已盡力區分「個人發生的事」「個人感受到的改善」「醫師當時提供的建議」以及「不能被推廣到所有患者的結論」。
          </p>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">
            個人經驗不等於醫療建議。你的身體狀況、症狀成因、適合的處理方式都與發起人不同，請以你的醫師評估為準。
          </p>
        </div>
      </section>

      {/* Correction channel */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">更正資訊方式</h2>
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-sm text-foreground/80">
            如果你是院所人員或使用者，發現本網站的院所資訊有誤（例如科別、地址、電話、服務查證狀態需要更新），第一版暫不開放公開回報表單。
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-foreground/80">
            <Mail className="h-4 w-4 text-muted-foreground" />
            可來信至：<a href="mailto:corrections@unseen-pain.example" className="text-primary underline">corrections@unseen-pain.example</a>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            公開的資訊更正管道即將開放。
          </p>
        </div>
      </section>
    </div>
  );
}

interface VerificationLevelProps {
  label: string;
  desc: string;
  color: string;
}

function VerificationLevel({ label, desc, color }: VerificationLevelProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
        {label}
      </span>
      <span className="text-foreground/70">{desc}</span>
    </div>
  );
}
