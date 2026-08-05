import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { StoriesShell } from "@/components/stories/StoriesShell";
import { StoriesEntrySection } from "@/components/stories/StoriesEntrySection";
import { StoryCard } from "@/components/stories/StoryCard";
import { db } from "@/lib/db";
import type { ModerationStatus } from "@/lib/stories";

// 動態渲染（每次請求都重新查 DB）
export const dynamic = "force-dynamic";

interface PublicStory {
  id: string;
  anonymousName: string | null;
  symptomDescription: string;
  firstDepartment: string | null;
  examinations: string | null;
  careJourney: string | null;
  helpfulInformation: string | null;
  messageToOthers: string | null;
  city: string | null;
  createdAt: string;
}

async function getApprovedStories(): Promise<{
  items: PublicStory[];
  error?: boolean;
}> {
  try {
    const rows = await db.anonymousStory.findMany({
      where: { moderationStatus: "approved" as ModerationStatus },
      orderBy: { approvedAt: "desc" },
      take: 50,
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
    });
    return {
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (err) {
    console.error("[/stories] fetch failed", err);
    return { items: [], error: true };
  }
}

export default async function StoriesPage() {
  const { items, error } = await getApprovedStories();

  return (
    <StoriesShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="space-y-8">
          <header className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              匿名就醫經驗分享
            </p>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              原來不只我說不清楚
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-foreground/80">
              這裡收集真實但匿名的就醫經驗。每個人的身體與診療情況不同，
              內容只代表個人經歷，不能取代專業醫療判斷。
            </p>
          </header>

          <div className="flex justify-end">
            <Link
              href="/stories/submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              分享我的經驗
            </Link>
          </div>

          <section className="rounded-xl border border-border bg-calm/20 p-5">
            <p className="text-sm leading-relaxed text-calm-foreground">
              <strong className="font-medium">閱讀提醒：</strong>
              這些分享僅代表個人經歷，不是醫療建議。如果你的症狀與文中類似，
              請尋求合格醫療人員評估，不要依據他人的經驗自行判斷或處置。
              如發現內容疑似違反規範，請使用卡片上的「檢舉」按鈕。
            </p>
          </section>

          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-alert/30 bg-alert/10 py-12 px-4 text-center">
              <p className="text-sm text-alert-foreground">
                讀取分享時發生問題，請稍後再試。
              </p>
              <Link
                href="/stories"
                className="rounded-md bg-alert px-4 py-1.5 text-sm font-medium text-alert-foreground"
              >
                重試
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 px-4 text-center">
              <p className="font-medium text-foreground">
                目前還沒有已核准的分享
              </p>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                等到第一篇匿名投稿通過審核後，就會出現在這裡。
                如果你有自己的經驗願意分享，也歡迎投稿。
              </p>
              <Link
                href="/stories/submit"
                className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
              >
                成為第一位分享者
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}

          <StoriesEntrySection />
        </div>
      </main>

      <footer className="border-t border-border bg-card no-print">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 看不見的痛。本網站不提供醫療診斷。
          </p>
        </div>
      </footer>
    </StoriesShell>
  );
}
