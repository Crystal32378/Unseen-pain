"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { StoryDisclaimer } from "./StoryDisclaimer";
import { CITIES } from "@/lib/types";

const FORM_LOADED_AT = Date.now();

export function StoryForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // honeypot — 真人看不到，機器人會填
  const [website, setWebsite] = useState("");

  const [form, setForm] = useState({
    anonymousName: "",
    symptomDescription: "",
    firstDepartment: "",
    examinations: "",
    careJourney: "",
    helpfulInformation: "",
    messageToOthers: "",
    city: "",
  });

  const formRef = useRef<HTMLFormElement>(null);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    // 基本客戶端必填檢查
    if (!form.symptomDescription.trim()) {
      toast.error("請至少描述「當時的感覺或症狀」");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousName: form.anonymousName || undefined,
          symptomDescription: form.symptomDescription,
          firstDepartment: form.firstDepartment || undefined,
          examinations: form.examinations || undefined,
          careJourney: form.careJourney || undefined,
          helpfulInformation: form.helpfulInformation || undefined,
          messageToOthers: form.messageToOthers || undefined,
          city: form.city || undefined,
          // honeypot
          website,
          // 時間戳（用於 server-side time check）
          loadedAt: FORM_LOADED_AT,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          toast.error(data.message ?? "投稿太頻繁，請稍後再試。");
        } else if (res.status === 400 && data.issues) {
          const firstIssue = Object.values(data.issues)[0];
          toast.error(
            Array.isArray(firstIssue) ? firstIssue[0] : "輸入內容有誤",
          );
        } else {
          toast.error(data.message ?? "投稿失敗，請稍後再試。");
        }
        return;
      }

      // 成功 → 導向成功頁
      router.push("/stories/submit/success");
    } catch (err) {
      console.error(err);
      toast.error("網路問題，請稍後再試。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      <StoryDisclaimer variant="form" />

      {/* Honeypot field — 對真人隱藏，機器人會填 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      >
        <label htmlFor="website-field">個人網站（請留空）</label>
        <input
          id="website-field"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="anonymousName">
          匿名稱呼 <span className="text-muted-foreground">（選填）</span>
        </Label>
        <Input
          id="anonymousName"
          value={form.anonymousName}
          onChange={(e) => setField("anonymousName", e.target.value)}
          placeholder="例如「肩膀痛了半年的人」"
          maxLength={20}
        />
        <p className="text-xs text-muted-foreground">
          不可填寫真實姓名、電話或 Email。
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="symptomDescription">
          當時出現什麼感覺或症狀 <span className="text-alert-foreground">*</span>
        </Label>
        <Textarea
          id="symptomDescription"
          required
          value={form.symptomDescription}
          onChange={(e) => setField("symptomDescription", e.target.value)}
          placeholder="例如：右手小指和無名指外側開始出現一種持續的麻，像有細針在皮膚底下輕輕刺的感覺…"
          rows={5}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {form.symptomDescription.length}/1000
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <Label htmlFor="firstDepartment">
            第一站去了哪一科 <span className="text-muted-foreground">（選填）</span>
          </Label>
          <Input
            id="firstDepartment"
            value={form.firstDepartment}
            onChange={(e) => setField("firstDepartment", e.target.value)}
            placeholder="例如：家醫科"
            maxLength={30}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="city">
            縣市 <span className="text-muted-foreground">（選填）</span>
          </Label>
          <Select
            value={form.city || "__none__"}
            onValueChange={(v) => setField("city", v === "__none__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇縣市" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">不填寫</SelectItem>
              {CITIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="examinations">
          曾被安排哪些檢查 <span className="text-muted-foreground">（選填）</span>
        </Label>
        <Textarea
          id="examinations"
          value={form.examinations}
          onChange={(e) => setField("examinations", e.target.value)}
          placeholder="例如：神經傳導檢查、肌電圖、誘發電位…"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {form.examinations.length}/500
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="careJourney">
          過程中的就醫旅程 <span className="text-muted-foreground">（選填）</span>
        </Label>
        <Textarea
          id="careJourney"
          value={form.careJourney}
          onChange={(e) => setField("careJourney", e.target.value)}
          placeholder="例如：第一次看診沒有得到診斷，但學會了記錄症狀；後來轉到神經內科做檢查…"
          rows={5}
          maxLength={1500}
        />
        <p className="text-xs text-muted-foreground">
          {form.careJourney.length}/1500
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="helpfulInformation">
          哪個資訊幫助自己理解下一步 <span className="text-muted-foreground">（選填）</span>
        </Label>
        <Textarea
          id="helpfulInformation"
          value={form.helpfulInformation}
          onChange={(e) => setField("helpfulInformation", e.target.value)}
          placeholder="例如：醫師建議我先觀察記錄一週，看哪個姿勢會加劇，再決定要不要做下一步檢查…"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {form.helpfulInformation.length}/500
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="messageToOthers">
          想對同樣說不清楚疼痛的人說什麼 <span className="text-muted-foreground">（選填）</span>
        </Label>
        <Textarea
          id="messageToOthers"
          value={form.messageToOthers}
          onChange={(e) => setField("messageToOthers", e.target.value)}
          placeholder="例如：你不需要自己判斷這是什麼神經的問題，把感受說清楚，讓醫師做判斷就好。"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {form.messageToOthers.length}/500
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          disabled={submitting}
          className="sm:min-w-[200px]"
        >
          {submitting ? "送出中…" : "送出匿名投稿"}
          {!submitting && <Send className="ml-2 h-4 w-4" />}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        送出後不會立即公開。所有投稿預設為 pending，僅有管理者核准後才會出現在 /stories。
      </p>
    </form>
  );
}
