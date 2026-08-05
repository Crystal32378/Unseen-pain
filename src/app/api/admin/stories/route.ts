import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import type { AdminStory, ModerationStatus } from "@/lib/stories";

/**
 * GET /api/admin/stories
 * 列出所有投稿（含 pending/rejected/hidden），供管理者審核。
 *
 * Query:
 * - status: pending | approved | rejected | hidden | all（預設 pending）
 * - page, pageSize
 *
 * 必須登入且 email 在 ADMIN_EMAILS allowlist。
 * proxy.ts 已擋未登入；此 route 仍會再次 requireAdmin()。
 */
export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) return authCheck.response;

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "pending";
  const status =
    statusParam === "all"
      ? undefined
      : (statusParam as ModerationStatus | null);

  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10)),
  );

  try {
    const where = status ? { moderationStatus: status } : {};
    const [items, counts, total] = await Promise.all([
      db.anonymousStory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.anonymousStory.groupBy({
        by: ["moderationStatus"],
        _count: true,
      }),
      db.anonymousStory.count({ where }),
    ]);

    const countMap = counts.reduce(
      (acc, c) => {
        acc[c.moderationStatus] = c._count;
        return acc;
      },
      {} as Record<ModerationStatus, number>,
    );

    return NextResponse.json({
      items: items as AdminStory[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      counts: countMap,
    });
  } catch (err) {
    console.error("[admin/stories] GET failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "讀取失敗" },
      { status: 500 },
    );
  }
}
