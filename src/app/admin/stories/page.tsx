import Link from "next/link";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ModerationStoriesClient } from "@/components/stories/ModerationStoriesClient";
import type { ModerationStatus } from "@/lib/stories";

export const dynamic = "force-dynamic";

export default async function AdminStoriesPage() {
  const session = await auth();

  if (!session?.user || !(session.user as { isAdmin?: boolean }).isAdmin) {
    redirect("/admin/signin");
  }

  // 直接從 DB 取所有 stories（不走 API，省一層 fetch）
  const stories = await db.anonymousStory.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const counts: Record<ModerationStatus, number> = {
    pending: 0,
    approved: 0,
    rejected: 0,
    hidden: 0,
  };
  for (const s of stories) {
    counts[s.moderationStatus as ModerationStatus]++;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur no-print">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  審核後台
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm text-foreground/70 transition-colors hover:bg-accent"
              >
                <ArrowLeft className="h-3 w-3" />
                <span className="hidden sm:inline">回網站</span>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/signin" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90"
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden sm:inline">登出</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <ModerationStoriesClient initialStories={stories} counts={counts} />
      </main>
    </div>
  );
}
