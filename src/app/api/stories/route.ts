import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  storySubmitSchema,
  type PublicStory,
  getContentWarnings,
} from "@/lib/stories";
import {
  checkSubmissionAllowed,
  recordSubmission,
} from "@/lib/rate-limit";
import type { ModerationStatus } from "@/lib/stories";

/**
 * GET /api/stories
 * 公開瀏覽已核准的匿名分享，分頁回傳，最新在前。
 *
 * Query:
 * - page: 1-based，預設 1
 * - pageSize: 預設 10，上限 30
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    30,
    Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "10", 10)),
  );

  try {
    const [items, total] = await Promise.all([
      db.anonymousStory.findMany({
        where: { moderationStatus: "approved" as ModerationStatus },
        orderBy: { approvedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          anonymousName: true,
          symptomDescription: true,
          firstDepartment: true,
          examinations: true,
          careJourney: true,
          helpfulInformation: true,
          messageToOthers: true,
          city: true,
          createdAt: true,
        },
      }),
      db.anonymousStory.count({
        where: { moderationStatus: "approved" as ModerationStatus },
      }),
    ]);

    return NextResponse.json({
      items: items as PublicStory[],
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("[stories] GET failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "讀取分享失敗" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/stories
 * 匿名投稿。
 *
 * 流程：
 * 1. Zod 驗證 input
 * 2. Honeypot + 時間 + cookie 限流
 * 3. 內容 PII 警告（不擋下，由管理者審核時看到）
 * 4. 寫入 DB，狀態 = pending
 * 5. recordSubmission() 更新 cookie
 * 6. 回傳 { id, status: "pending" }
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "請求格式錯誤" },
      { status: 400 },
    );
  }

  const parsed = storySubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_error",
        message: "輸入內容有誤",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // 限流檢查
  const limit = await checkSubmissionAllowed({
    honeypotValue: data.website,
    loadedAt: data.loadedAt,
  });
  if (!limit.allowed) {
    const message =
      limit.reason === "too_many"
        ? `24 小時內已達投稿上限。請稍後再試。`
        : limit.reason === "too_fast"
          ? "送出太快了，請稍候再試一次。"
          : "偵測到異常提交。";

    // honeypot 命中時回 200 OK 假裝成功（讓機器人不知道被擋），但不寫入 DB
    if (limit.reason === "honeypot") {
      return NextResponse.json(
        { ok: true, status: "pending", id: null, fake: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "rate_limited", message, resetAt: limit.resetAt },
      { status: 429 },
    );
  }

  // 計算 PII 警告（不擋下，但會寫入內部欄位供管理者參考）
  const allText = [
    data.anonymousName,
    data.symptomDescription,
    data.firstDepartment,
    data.examinations,
    data.careJourney,
    data.helpfulInformation,
    data.messageToOthers,
    data.city,
  ]
    .filter(Boolean)
    .join("\n");
  const warnings = getContentWarnings(allText);

  try {
    const created = await db.anonymousStory.create({
      data: {
        anonymousName: data.anonymousName ?? null,
        symptomDescription: data.symptomDescription,
        firstDepartment: data.firstDepartment ?? null,
        examinations: data.examinations ?? null,
        careJourney: data.careJourney ?? null,
        helpfulInformation: data.helpfulInformation ?? null,
        messageToOthers: data.messageToOthers ?? null,
        city: data.city ?? null,
        moderationStatus: "pending",
      },
      select: { id: true },
    });

    await recordSubmission();

    // 內部 log（不暴露給 client）
    if (warnings.pii.length > 0 || warnings.forbidden.length > 0) {
      console.warn(
        `[stories] submission ${created.id} flagged:`,
        warnings,
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id: created.id,
        status: "pending",
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[stories] POST failed", err);
    return NextResponse.json(
      { error: "internal_error", message: "投稿失敗，請稍後再試" },
      { status: 500 },
    );
  }
}
