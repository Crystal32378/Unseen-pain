"use client";

import { SectionId } from "@/lib/types";
import { ArrowRight, Quote } from "lucide-react";

interface CrystalStorySectionProps {
  onNavigate: (section: SectionId) => void;
}

export function CrystalStorySection({ onNavigate }: CrystalStorySectionProps) {
  return (
    <div className="space-y-8">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">過來人經驗</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          我不是一開始就知道，那是神經痛
        </h1>
      </header>

      {/* Story body */}
      <article className="space-y-6">
        <section className="space-y-3">
          <p className="text-base leading-relaxed text-foreground/80">
            那段時間，我的右手小指和無名指外側開始出現一種奇怪的麻。不是睡姿壓到的那種麻，而是一種持續的、像有細針在皮膚底下輕輕刺的感覺。有時候會變成觸電感，從手肘內側一路延伸到指尖。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            一開始我以為是滑鼠用太多，手腕累了。我換了滑鼠墊、調整了椅子高度、買了護腕。但那種麻沒有消失，反而慢慢變得明顯，尤其是在手肘撐在桌上的時候。晚上睡覺時，有時候會被那種刺麻感弄醒。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">第一次看診：我不知道該怎麼說</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            我掛了家醫科，因為我根本不確定這算什麼問題。在診間裡，醫師問我「哪裡不舒服」，我突然發現自己很難把那種感覺說清楚。我說「手會麻」，但醫師追問「什麼樣的麻」「什麼時候開始」「做什麼動作會更明顯」時，我才意識到——我其實沒有好好觀察過自己的痛。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            醫師幫我做了基本的神經學檢查，敲了敲手肘內側（後來我知道那叫 Tinel's sign），建議我轉到神經內科進一步評估。那一次看診沒有得到診斷，但我開始學會記錄自己的症狀。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">神經內科：尺神經痛</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            在神經內科，醫師安排了神經傳導檢查。那是一種會在手臂上用微弱電流刺激神經的檢查，不算舒服，但可以客觀地看到神經傳導的速度是否正常。結果顯示我的尺神經在肘部區段的傳導速度變慢，醫師說這符合「肘隧道症候群」的表現。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            醫師當時的建議是：先調整日常習慣，避免長時間手肘屈曲或撐在硬桌面上；如果一段時間後沒有改善，再考慮後續處理。他沒有立刻要我開刀，也沒有說吃藥就會好，而是給了我一個觀察的方向。
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">後來出現的另一種痛</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            手肘的問題還在觀察時，我開始出現另一種不舒服——在薦骨附近、臀部下方一帶，有一種很難定位的鈍痛和灼熱感。不是肌肉痠痛那種，而是更深層的、像神經被壓到的感覺。有時候久坐會更明顯，有時候又覺得是某個姿勢突然觸發的。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            這一次我學聰明了。我先用手機記錄了幾天：什麼時候開始、痛的位置、什麼姿勢會加劇、會不會往下延伸到腿。帶著這些記錄去看診，醫師比較容易判斷需要排除哪些可能性。
          </p>
        </section>

        <Quote className="h-8 w-8 text-primary/30" />

        <section className="space-y-3 rounded-xl border-l-4 border-primary bg-calm/30 p-6">
          <p className="text-base italic leading-relaxed text-calm-foreground">
            「我後來明白，看診的時候，醫師需要的是具體的觀察，不是我的結論。我不需要自己判斷這是什麼神經的問題，我只需要把感受說清楚，讓醫師去做他的專業判斷。」
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-foreground">我自己感受到的改善</h2>
          <p className="text-base leading-relaxed text-foreground/80">
            手肘的部分，在調整桌面高度、減少手肘撐桌、配合醫師建議的伸展後，那種刺麻感有比較緩解。薦骨附近的問題，經過一段時間的觀察和復健，也慢慢穩定下來。但這是我的經驗，不是一個標準答案。
          </p>
          <p className="text-base leading-relaxed text-foreground/80">
            我沒有吃特定的保健品，也沒有做什麼神奇的治療。對我來說，最大的改變是：我學會了把自己的感受整理成可以溝通的語言，而不是在診間裡支支吾吾。
          </p>
        </section>
      </article>

      {/* Important boundaries */}
      <section className="space-y-4 rounded-xl border-2 border-alert/20 bg-alert/10 p-6">
        <h2 className="text-lg font-bold text-alert-foreground">
          這些經驗不能被推廣到所有人
        </h2>
        <ul className="space-y-2.5 text-sm text-alert-foreground/90">
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不保證半年會好。</strong>每個人的狀況不同，恢復時間取決於神經受損程度、持續時間、個人身體狀況等諸多因素。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不宣稱 B 群治本。</strong>我沒有靠特定營養品解決問題。維生素 B 群是否適合你，請由醫師評估。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不推薦特定品牌。</strong>這個網站不推薦任何保健品或品牌。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不宣稱電療修復神經。</strong>物理治療和電療對我來說是輔助，但「修復神經」這個說法太簡化了。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不把壓力直接診斷為身心症。</strong>壓力可能影響疼痛感受，但這不代表痛是「想像出來的」，也不該被用來打發患者。</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 font-bold">✗</span>
            <span><strong>不把個人經驗寫成通用療程。</strong>我的經驗只是我的經驗，不是處方。</span>
          </li>
        </ul>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => onNavigate("describe-pain")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          我也來整理我的症狀
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => onNavigate("search")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
        >
          找一間院所開始
        </button>
      </section>
    </div>
  );
}
