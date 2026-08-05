"use client";

import { Loader2, AlertCircle, Inbox } from "lucide-react";

export function StoriesLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">載入分享中…</p>
    </div>
  );
}

export function StoriesError({
  message = "讀取失敗，請稍後再試。",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-alert/30 bg-alert/10 py-12 px-4 text-center">
      <AlertCircle className="h-6 w-6 text-alert-foreground" />
      <p className="text-sm text-alert-foreground">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md bg-alert px-4 py-1.5 text-sm font-medium text-alert-foreground transition-opacity hover:opacity-80"
        >
          重試
        </button>
      )}
    </div>
  );
}

export function StoriesEmpty({
  title = "目前還沒有已核准的分享",
  description = "等到第一篇匿名投稿通過審核後，就會出現在這裡。",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 px-4 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
