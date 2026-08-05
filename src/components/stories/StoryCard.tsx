"use client";

import { useState } from "react";
import { Flag, MapPin, Stethoscope, Microscope, Heart, MessageSquareQuote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { PublicStory } from "@/lib/stories";

interface StoryCardProps {
  story: PublicStory;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function StoryCard({ story }: StoryCardProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  async function submitReport() {
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${story.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "檢舉失敗");
      }
      toast.success("已收到檢舉，我們會再人工審視。");
      setReportOpen(false);
      setReportReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "檢舉失敗");
    } finally {
      setReportSubmitting(false);
    }
  }

  const displayName = story.anonymousName?.trim() || "匿名分享者";

  return (
    <article className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(story.createdAt)}
            {story.city ? ` · ${story.city}` : ""}
          </p>
        </div>
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label="檢舉此分享"
            >
              <Flag className="h-3 w-3" />
              檢舉
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>檢舉這篇分享</DialogTitle>
              <DialogDescription>
                如果你認為這篇內容違反規範（例如包含個資、醫療建議、藥物推薦或人身攻擊），請告訴我們。
                我們不會知道你是誰，檢舉送出後會由管理者人工審視。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                檢舉理由（選填）
              </label>
              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="例如：疑似包含真實姓名與電話"
                rows={4}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {reportReason.length}/300
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReportOpen(false)}
                disabled={reportSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={submitReport}
                disabled={reportSubmitting}
                variant="destructive"
              >
                {reportSubmitting ? "送出中…" : "送出檢舉"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="space-y-4">
        <StoryField
          icon={<Heart className="h-4 w-4" />}
          label="當時的感覺或症狀"
          content={story.symptomDescription}
        />
        {story.firstDepartment && (
          <StoryField
            icon={<Stethoscope className="h-4 w-4" />}
            label="第一站去了哪一科"
            content={story.firstDepartment}
          />
        )}
        {story.examinations && (
          <StoryField
            icon={<Microscope className="h-4 w-4" />}
            label="曾被安排的檢查"
            content={story.examinations}
          />
        )}
        {story.careJourney && (
          <StoryField
            icon={<MapPin className="h-4 w-4" />}
            label="過程中的旅程"
            content={story.careJourney}
          />
        )}
        {story.helpfulInformation && (
          <StoryField
            icon={<MessageSquareQuote className="h-4 w-4" />}
            label="哪個資訊幫我理解下一步"
            content={story.helpfulInformation}
          />
        )}
        {story.messageToOthers && (
          <StoryField
            icon={<MessageSquareQuote className="h-4 w-4" />}
            label="想對同樣說不清楚疼痛的人說"
            content={story.messageToOthers}
            highlight
          />
        )}
      </div>
    </article>
  );
}

function StoryField({
  icon,
  label,
  content,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  content: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "rounded-lg bg-warm/50 p-4" : ""}>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
        {content}
      </p>
    </div>
  );
}
