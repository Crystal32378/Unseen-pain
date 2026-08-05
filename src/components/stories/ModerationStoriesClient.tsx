"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  Trash2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MODERATION_STATUS_LABELS,
  type AdminStory,
  type ModerationStatus,
} from "@/lib/stories";

interface ModerationStoriesClientProps {
  initialStories: AdminStory[];
  counts: Record<ModerationStatus, number>;
}

const STATUS_TABS: { key: ModerationStatus | "all"; label: string }[] = [
  { key: "pending", label: "待審核" },
  { key: "approved", label: "已核准" },
  { key: "rejected", label: "已拒絕" },
  { key: "hidden", label: "已隱藏" },
  { key: "all", label: "全部" },
];

export function ModerationStoriesClient({
  initialStories,
  counts: initialCounts,
}: ModerationStoriesClientProps) {
  const [stories, setStories] = useState(initialStories);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<ModerationStatus | "all">(
    "pending",
  );
  const [pending, startTransition] = useTransition();

  const filtered =
    activeTab === "all"
      ? stories
      : stories.filter((s) => s.moderationStatus === activeTab);

  function updateStatus(id: string, status: ModerationStatus) {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stories/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moderationStatus: status }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "更新失敗");
        }
        setStories((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  moderationStatus: status,
                  approvedAt:
                    status === "approved" && !s.approvedAt
                      ? new Date().toISOString()
                      : s.approvedAt,
                }
              : s,
          ),
        );
        setCounts((prev) => {
          const next = { ...prev };
          const old = stories.find((s) => s.id === id)?.moderationStatus;
          if (old) next[old] = Math.max(0, next[old] - 1);
          next[status] += 1;
          return next;
        });
        toast.success(`已標記為「${MODERATION_STATUS_LABELS[status].label}」`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "更新失敗");
      }
    });
  }

  function deleteStory(id: string) {
    if (!confirm("確定要永久刪除？此操作無法復原。")) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/stories/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("刪除失敗");
        setStories((prev) => prev.filter((s) => s.id !== id));
        toast.success("已刪除");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "刪除失敗");
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">
          匿名分享審核
        </h1>
        <p className="text-sm text-muted-foreground">
          共 {stories.length} 篇投稿。所有內容預設為 pending，
          僅 approved 會出現在 /stories。hidden 可手動隱藏但不刪除。
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? stories.length
              : counts[tab.key as ModerationStatus] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <p className="font-medium text-foreground">
            這個狀態下沒有投稿
          </p>
          <p className="text-sm text-muted-foreground">
            切到其他狀態分頁看看。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((story) => (
            <ModerationCard
              key={story.id}
              story={story}
              onStatusChange={updateStatus}
              onDelete={deleteStory}
              disabled={pending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ModerationCardProps {
  story: AdminStory;
  onStatusChange: (id: string, status: ModerationStatus) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

function ModerationCard({
  story,
  onStatusChange,
  onDelete,
  disabled,
}: ModerationCardProps) {
  const status = story.moderationStatus;
  const statusLabel = MODERATION_STATUS_LABELS[status];
  const isFlagged = story.reportCount > 0;

  return (
    <article className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                status === "approved"
                  ? "bg-calm text-calm-foreground"
                  : status === "pending"
                    ? "bg-warm text-warm-foreground"
                    : status === "rejected"
                      ? "bg-alert text-alert-foreground"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {statusLabel.label}
            </span>
            {isFlagged && (
              <span className="inline-flex items-center gap-1 rounded-full bg-alert/30 px-2 py-0.5 text-xs text-alert-foreground">
                <AlertTriangle className="h-3 w-3" />
                {story.reportCount} 次檢舉
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ID: <code className="font-mono">{story.id}</code>
            <span className="mx-2">·</span>
            <Clock className="mr-1 inline h-3 w-3" />
            {new Date(story.createdAt).toLocaleString("zh-TW")}
            {story.approvedAt && (
              <>
                <span className="mx-2">·</span>
                核准於 {new Date(story.approvedAt).toLocaleString("zh-TW")}
              </>
            )}
          </p>
        </div>
      </header>

      <ModerationField
        label="匿名稱呼"
        value={story.anonymousName}
      />
      <ModerationField
        label="當時的感覺或症狀"
        value={story.symptomDescription}
        required
      />
      <ModerationField
        label="第一站去了哪一科"
        value={story.firstDepartment}
      />
      <ModerationField
        label="曾被安排的檢查"
        value={story.examinations}
      />
      <ModerationField
        label="過程中的旅程"
        value={story.careJourney}
      />
      <ModerationField
        label="哪個資訊幫助理解下一步"
        value={story.helpfulInformation}
      />
      <ModerationField
        label="想對同樣說不清楚疼痛的人說"
        value={story.messageToOthers}
      />
      <ModerationField label="縣市" value={story.city} />

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant={status === "approved" ? "default" : "outline"}
          onClick={() => onStatusChange(story.id, "approved")}
          disabled={disabled || status === "approved"}
          className="gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          核准
        </Button>
        <Button
          size="sm"
          variant={status === "rejected" ? "default" : "outline"}
          onClick={() => onStatusChange(story.id, "rejected")}
          disabled={disabled || status === "rejected"}
          className="gap-1"
        >
          <XCircle className="h-3.5 w-3.5" />
          拒絕
        </Button>
        <Button
          size="sm"
          variant={status === "hidden" ? "default" : "outline"}
          onClick={() => onStatusChange(story.id, "hidden")}
          disabled={disabled || status === "hidden"}
          className="gap-1"
        >
          {status === "hidden" ? (
            <>
              <Eye className="h-3.5 w-3.5" />
              已隱藏
            </>
          ) : (
            <>
              <EyeOff className="h-3.5 w-3.5" />
              隱藏
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onStatusChange(story.id, "pending")}
          disabled={disabled || status === "pending"}
          className="gap-1"
        >
          <Clock className="h-3.5 w-3.5" />
          重置為待審
        </Button>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(story.id)}
            disabled={disabled}
            className="gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            永久刪除
          </Button>
        </div>
      </div>
    </article>
  );
}

function ModerationField({
  label,
  value,
  required = false,
}: {
  label: string;
  value: string | null | undefined;
  required?: boolean;
}) {
  if (!value) {
    return null;
  }
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-alert-foreground">*</span>}
      </p>
      <Textarea
        readOnly
        value={value}
        rows={Math.min(8, Math.max(2, Math.ceil(value.length / 60)))}
        className="bg-background font-normal text-foreground/90"
      />
    </div>
  );
}
