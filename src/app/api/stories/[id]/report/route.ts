import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/stories";
import type { ModerationStatus } from "@/lib/stories";

/**
 * POST /api/stories/[id]/report
 * 檢舉某篇已核准的分享。每篇 +1 report_count。
 * 不需登入、不存 IP、不存使用者識別。
 *
 * 防濫用：
 * - 每個 story id 限制檢舉次數（自然由 report_count 上限吸收）
 * - 進階可加 Turnstile；MVP 暫不加
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "bad_request", message: "缺少 story id" },
      { status: 400 },
    );
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // 允許空 body
  }
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "檢舉理由格式錯誤",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    // 只能檢舉已核准的分享（避免檢舉 pending/rejected 內容）
    const story = await db.anonymousStory.findUnique({
      where: { id },
      select: { moderationStatus: true, reportCount: true },
    });

    if (!story) {
      return NextResponse.json(
        { error: "not_found", message: "找不到此分享" },
        { status: 404 },
      );
    }

    if (story.moderationStatus !== ("approved" as ModerationStatus)) {
      return NextResponse.json(
        { error: "not_reportable", message: "此分享無法被檢舉" },
        { status: 400 },
      );
    }

    // 自動隱藏門檻：report_count 達 5 自動轉 hidden（管理者仍可手動恢復）
    const newCount = story.reportCount + 1;
    const shouldAutoHide = newCount >= 5;

    await db.anonymousStory.update({
      where: { id },
      data: {
        reportCount: { increment: 1 },
        ...(shouldAutoHide
          ? { moderationStatus: "hidden" as ModerationStatus }
          : {}),
      },
    });

    return NextResponse.json({
      ok: true,
      reportCount: newCount,
      autoHidden: shouldAutoHide,
    });
  } catch (err) {
    console.error("[stories/report] POST failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "檢舉失敗" },
      { status: 500 },
    );
  }
}
