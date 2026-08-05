"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Copy,
  Printer,
  RotateCcw,
  Check,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface SymptomState {
  painLocation: string;
  side: string;
  // Sensation types
  numbness: boolean;
  tingling: boolean;
  burning: boolean;
  electric: boolean;
  throbbing: boolean;
  crawling: boolean;
  allodynia: boolean;
  sensationLoss: boolean;
  weakness: boolean;
  // Timeline
  startTime: string;
  pattern: string;
  triggerPosture: string;
  // Impact
  impactSleep: boolean;
  impactWork: boolean;
  impactWalking: boolean;
  impactGrip: boolean;
  // History
  previousExams: string;
  // Notes
  otherNotes: string;
}

const INITIAL_STATE: SymptomState = {
  painLocation: "",
  side: "",
  numbness: false,
  tingling: false,
  burning: false,
  electric: false,
  throbbing: false,
  crawling: false,
  allodynia: false,
  sensationLoss: false,
  weakness: false,
  startTime: "",
  pattern: "",
  triggerPosture: "",
  impactSleep: false,
  impactWork: false,
  impactWalking: false,
  impactGrip: false,
  previousExams: "",
  otherNotes: "",
};

const SENSATIONS = [
  { key: "numbness", label: "麻", desc: "麻木、感覺鈍鈍的" },
  { key: "tingling", label: "刺", desc: "針刺感、像被針扎" },
  { key: "burning", label: "灼熱", desc: "燒灼感、像火燒" },
  { key: "electric", label: "觸電", desc: "電流通過的感覺" },
  { key: "throbbing", label: "抽痛", desc: "一陣一陣的抽痛" },
  { key: "crawling", label: "螞蟻爬", desc: "皮膚上有東西在爬" },
  { key: "allodynia", label: "輕碰就痛", desc: "正常不痛的觸摸也會痛" },
  { key: "sensationLoss", label: "感覺下降", desc: "摸東西感覺變鈍" },
  { key: "weakness", label: "無力", desc: "使不上力" },
] as const;

const SIDES = ["左側", "右側", "雙側", "不清楚"];
const PATTERNS = ["持續", "間歇性", "一陣一陣", "不確定"];

export function DescribePainSection() {
  const [state, setState] = useState<SymptomState>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);

  const update = useCallback(<K extends keyof SymptomState>(key: K, value: SymptomState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const summary = useMemo(() => generateSummary(state), [state]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = summary;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [summary]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleClear = useCallback(() => {
    if (confirm("確定要清除所有已填寫的內容嗎？")) {
      setState(INITIAL_STATE);
    }
  }, []);

  const selectedSensations = SENSATIONS.filter((s) => state[s.key as keyof SymptomState]);

  return (
    <div className="space-y-8">
      <header className="space-y-4 pt-8">
        <p className="text-sm font-medium text-muted-foreground">描述疼痛</p>
        <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
          神經痛怎麼跟醫生說？看診前先記錄這些事
        </h1>
        <p className="text-base leading-relaxed text-foreground/80">
          很多人在診間裡會突然不知道怎麼描述自己的痛。這個工具幫你把感受整理成一段話，看診時可以直接給醫師看，或自己參考。
        </p>
      </header>

      {/* Privacy notice */}
      <div className="flex items-start gap-3 rounded-xl bg-calm p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-calm-foreground" />
        <div className="text-sm text-calm-foreground">
          <p className="font-medium">這個工具只在你的瀏覽器中運作</p>
          <p className="mt-1 text-calm-foreground/80">
            你輸入的內容不會被儲存、不會送到伺服器、不會要求你的姓名或 Email。關閉頁面後內容即消失。
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Pain location */}
        <FormSection title="疼痛位置" step="1">
          <div className="space-y-3">
            <input
              type="text"
              value={state.painLocation}
              onChange={(e) => update("painLocation", e.target.value)}
              placeholder="例如：右手肘外側到小指、左大腿外側、臀部下方"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex flex-wrap gap-2">
              {SIDES.map((side) => (
                <Chip
                  key={side}
                  label={side}
                  selected={state.side === side}
                  onClick={() => update("side", state.side === side ? "" : side)}
                />
              ))}
            </div>
          </div>
        </FormSection>

        {/* Sensation types */}
        <FormSection title="疼痛的感覺" step="2" hint="可以複選">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SENSATIONS.map((s) => {
              const isSelected = state[s.key as keyof SymptomState] as boolean;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => update(s.key as keyof SymptomState, !isSelected as SymptomState[keyof SymptomState])}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-input"
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{s.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Timeline */}
        <FormSection title="時間與模式" step="3">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                大約什麼時候開始？
              </label>
              <input
                type="text"
                value={state.startTime}
                onChange={(e) => update("startTime", e.target.value)}
                placeholder="例如：五天前、三個月前、去年冬天"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                疼痛的模式
              </label>
              <div className="flex flex-wrap gap-2">
                {PATTERNS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={state.pattern === p}
                    onClick={() => update("pattern", state.pattern === p ? "" : p)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                什麼情況下會更明顯？（可選）
              </label>
              <input
                type="text"
                value={state.triggerPosture}
                onChange={(e) => update("triggerPosture", e.target.value)}
                placeholder="例如：久站後、彎腰時、晚上睡覺時、走路的時候"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </FormSection>

        {/* Impact */}
        <FormSection title="對生活的影響" step="4" hint="可以複選">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { key: "impactSleep", label: "影響睡眠" },
              { key: "impactWork", label: "影響工作" },
              { key: "impactWalking", label: "影響走路" },
              { key: "impactGrip", label: "影響握力" },
            ].map((item) => {
              const isSelected = state[item.key as keyof SymptomState] as boolean;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => update(item.key as keyof SymptomState, !isSelected as SymptomState[keyof SymptomState])}
                  className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground/70 hover:bg-accent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Previous exams */}
        <FormSection title="曾做過的檢查與治療" step="5" hint="可選">
          <textarea
            value={state.previousExams}
            onChange={(e) => update("previousExams", e.target.value)}
            placeholder="例如：做過頸部 X 光、吃過止痛藥、做過物理治療三次..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormSection>

        {/* Other notes */}
        <FormSection title="其他想補充的" step="6" hint="可選">
          <textarea
            value={state.otherNotes}
            onChange={(e) => update("otherNotes", e.target.value)}
            placeholder="任何你覺得醫師應該知道的事，例如最近有受傷、有慢性病、正在吃的藥..."
            rows={3}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </FormSection>
      </div>

      {/* Summary preview */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">看診用的摘要</h2>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {summary || "填寫上面的欄位後，這裡會自動產生一段可以帶進診間的描述。"}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 no-print">
          <button
            onClick={handleCopy}
            disabled={!summary}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "已複製" : "複製文字"}
          </button>
          <button
            onClick={handlePrint}
            disabled={!summary}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            列印
          </button>
          <button
            onClick={handleClear}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            清除
          </button>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="rounded-xl bg-warm p-4 text-sm text-warm-foreground no-print">
        <p>
          <strong>提醒：</strong>這個工具只幫你整理描述，不會判斷你的症狀是不是神經痛，也不會推薦治療方式。實際診斷與治療請由醫師評估。
        </p>
      </div>
    </div>
  );
}

function generateSummary(s: SymptomState): string {
  if (!s.painLocation && !s.startTime && selectedSensationsList(s).length === 0) {
    return "";
  }

  const parts: string[] = [];

  // Location + side
  if (s.painLocation) {
    let loc = s.painLocation;
    if (s.side && s.side !== "不清楚") {
      loc = `${s.side}的${loc}`;
    }
    parts.push(`我的${loc}`);
  }

  // Start time
  if (s.startTime) {
    parts[parts.length - 1] = parts[parts.length - 1]
      ? `${parts[parts.length - 1]}自${s.startTime}開始出現`
      : `自${s.startTime}開始出現`;
  }

  // Sensations
  const sensations = selectedSensationsList(s);
  if (sensations.length > 0) {
    const sensationStr = sensations.join("與");
    const pattern = s.pattern && s.pattern !== "不確定" ? `${s.pattern}的` : "";
    parts.push(`有${pattern}${sensationStr}的感覺`);
  }

  // Trigger
  if (s.triggerPosture) {
    const trigger = s.triggerPosture.trim();
    if (trigger.endsWith("後") || trigger.endsWith("時")) {
      parts.push(`${trigger}較明顯`);
    } else {
      parts.push(`${trigger}時較明顯`);
    }
  }

  // Impacts
  const impacts: string[] = [];
  if (s.impactSleep) impacts.push("睡眠");
  if (s.impactWork) impacts.push("工作");
  if (s.impactWalking) impacts.push("走路");
  if (s.impactGrip) impacts.push("握力");
  if (impacts.length > 0) {
    parts.push(`會影響${impacts.join("、")}`);
  }

  // Previous exams
  if (s.previousExams) {
    parts.push(`曾做過：${s.previousExams}`);
  }

  // Other notes
  if (s.otherNotes) {
    parts.push(`補充：${s.otherNotes}`);
  }

  let result = parts.join("，");
  if (result && !result.endsWith("。")) {
    result += "。";
  }

  return result;
}

function selectedSensationsList(s: SymptomState): string[] {
  const result: string[] = [];
  if (s.numbness) result.push("麻");
  if (s.tingling) result.push("刺");
  if (s.burning) result.push("灼熱");
  if (s.electric) result.push("觸電感");
  if (s.throbbing) result.push("抽痛");
  if (s.crawling) result.push("螞蟻爬感");
  if (s.allodynia) result.push("輕觸異常疼痛");
  if (s.sensationLoss) result.push("感覺下降");
  if (s.weakness) result.push("無力");
  return result;
}

interface FormSectionProps {
  title: string;
  step: string;
  hint?: string;
  children: React.ReactNode;
}

function FormSection({ title, step, hint, children }: FormSectionProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {step}
        </span>
        <h2 className="font-bold text-foreground">{title}</h2>
        {hint && (
          <span className="text-xs text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground/70 hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );
}
