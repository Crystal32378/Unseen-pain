import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { moderationUpdateSchema } from "@/lib/stories";
import type { ModerationStatus } from "@/lib/stories";

/**
 * PATCH /api/admin/stories/[id]
 * 更新單篇投稿的審核狀態。
 *
 * 行為：
 * - status → approved：自動寫入 approvedAt = now()
 * - status 從 approved 變其他：approvedAt 保留（供歷史查詢）
 * - status → hidden：可手動隱藏（不影響 report_count）
 *
 * 必須登入且 email 在 ADMIN_EMAILS allowlist。
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return authCheck.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "bad_request", message: "缺少 story id" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "請求格式錯誤" },
      { status: 400 },
    );
  }

  const parsed = moderationUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "狀態格式錯誤",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const existing = await db.anonymousStory.findUnique({
      where: { id },
      select: { moderationStatus: true, approvedAt: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "not_found", message: "找不到此分享" },
        { status: 404 },
      );
    }

    const newStatus = parsed.data.moderationStatus as ModerationStatus;
    const wasApproved = existing.moderationStatus === "approved";
    const willApprove = newStatus === "approved";

    const updated = await db.anonymousStory.update({
      where: { id },
      data: {
        moderationStatus: newStatus,
        // 首次核准才寫 approvedAt；重複 approve 不更新時間
        approvedAt:
          willApprove && !wasApproved && !existing.approvedAt
            ? new Date()
            : existing.approvedAt,
      },
    });

    return NextResponse.json({ ok: true, story: updated });
  } catch (err) {
    console.error("[admin/stories/[id]] PATCH failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "更新失敗" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/stories/[id]
 * 永久刪除（軟刪除建議用 hidden；delete 僅供明確需要時使用）
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return authCheck.response;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "bad_request", message: "缺少 story id" },
      { status: 400 },
    );
  }

  try {
    await db.anonymousStory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/stories/[id]] DELETE failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "刪除失敗" },
      { status: 500 },
    );
  }
}
