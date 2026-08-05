import { z } from "zod";

/**
 * 匿名就醫經驗分享 — 共用類型、Zod schema 與常數
 */

export const MODERATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "hidden",
] as const;
export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

export const MODERATION_STATUS_LABELS: Record<
  ModerationStatus,
  { label: string; description: string }
> = {
  pending: {
    label: "待審核",
    description: "尚未公開，僅管理者可見",
  },
  approved: {
    label: "已核准",
    description: "已公開於 /stories",
  },
  rejected: {
    label: "已拒絕",
    description: "未通過審核，不會公開",
  },
  hidden: {
    label: "已隱藏",
    description: "曾被公開但因檢舉或其他原因隱藏",
  },
};

// PII 阻擋用正則：電話（含國際、市話、手機）、Email、身分證字號、病歷號格式
// 注意：這只是第一道防線，不是完整 PII 偵測。最終仍由人工審核把關。
const PHONE_RE =
  /(\+?886[-\s.]?0?9\d{2}[-\s.]?\d{3}[-\s.]?\d{3})|(0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{3,4})/;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

const ID_NUMBER_RE = /[A-Z][0-9]{9}/;

const MEDICAL_RECORD_RE = /(病歷號|病歷編號|chart\s*no)[^\d]{0,5}\d{4,}/i;

const FORBIDDEN_KEYWORDS = [
  // 藥品／保健品／偏方類關鍵字（粗略）
  "推薦用藥",
  "保證治癒",
  "根治",
  "特效藥",
];

function detectPii(text: string): string[] {
  const hits: string[] = [];
  if (PHONE_RE.test(text)) hits.push("疑似電話號碼");
  if (EMAIL_RE.test(text)) hits.push("疑似 Email");
  if (ID_NUMBER_RE.test(text)) hits.push("疑似身分證字號");
  if (MEDICAL_RECORD_RE.test(text)) hits.push("疑似病歷號");
  return hits;
}

function detectForbiddenContent(text: string): string[] {
  const hits: string[] = [];
  const lower = text.toLowerCase();
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (text.includes(kw)) hits.push(kw);
  }
  return hits;
}

// 用於「不可包含的內容」警示（僅警告，不擋下送出，由管理者最終判斷）
export function getContentWarnings(text: string): {
  pii: string[];
  forbidden: string[];
} {
  return {
    pii: detectPii(text),
    forbidden: detectForbiddenContent(text),
  };
}

const textField = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "此欄位不可空白")
    .max(max, `字數超過上限（最多 ${max} 字）`);

const optionalTextField = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `字數超過上限（最多 ${max} 字）`)
    .optional()
    .or(z.literal("").transform(() => undefined));

/**
 * 投稿 schema
 * - anonymous_name: 選填，最多 20 字
 * - symptom_description: 必填，最多 1000 字
 * - first_department: 選填，最多 30 字
 * - examinations: 選填，最多 500 字
 * - care_journey: 選填，最多 1500 字
 * - helpful_information: 選填，最多 500 字
 * - message_to_others: 選填，最多 500 字
 * - city: 選填，必須是 CITIES 其中之一（或留空）
 * - honeypot: 必須為空（機器人偵測）
 * - loaded_at: 表單載入時間（用於 server-side time check）
 */
export const storySubmitSchema = z.object({
  anonymousName: optionalTextField(20),
  symptomDescription: textField(1000),
  firstDepartment: optionalTextField(30),
  examinations: optionalTextField(500),
  careJourney: optionalTextField(1500),
  helpfulInformation: optionalTextField(500),
  messageToOthers: optionalTextField(500),
  city: z
    .string()
    .optional()
    .refine(
      (val) => !val || CITIES.includes(val),
      "請選擇有效縣市，或留空",
    ),
  // honeypot — 機器人會填，真人看不到
  // Zod 允許任何值；server 端在 rate-limit 階段檢查，
  // 命中時靜默回 200 OK 但不寫入 DB（讓機器人以為成功）
  website: z.string().optional().default(""),
  // 表單載入時間（ms since epoch）— server 端會檢查送出間隔
  loadedAt: z.number().int().positive(),
});

export type StorySubmitInput = z.infer<typeof storySubmitSchema>;

/**
 * 管理者更新審核狀態 schema
 */
export const moderationUpdateSchema = z.object({
  moderationStatus: z.enum(MODERATION_STATUSES),
});

export type ModerationUpdateInput = z.infer<typeof moderationUpdateSchema>;

/**
 * 檢舉 schema — 不強制要求理由，但若有則限制長度
 */
export const reportSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(300, "檢舉理由最多 300 字")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type ReportInput = z.infer<typeof reportSchema>;

/**
 * 公開回傳的 story shape（剔除任何敏感欄位）
 */
export interface PublicStory {
  id: string;
  anonymousName: string | null;
  symptomDescription: string;
  firstDepartment: string | null;
  examinations: string | null;
  careJourney: string | null;
  helpfulInformation: string | null;
  messageToOthers: string | null;
  city: string | null;
  createdAt: string; // ISO string
}

/**
 * 管理者可見的 story shape（含審核欄位）
 */
export interface AdminStory extends PublicStory {
  moderationStatus: ModerationStatus;
  reportCount: number;
  approvedAt: string | null;
}

// 從 lib/types.ts 重匯出 CITIES 以避免循環依賴
import { CITIES } from "@/lib/types";
export { CITIES };
