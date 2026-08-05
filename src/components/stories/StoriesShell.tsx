"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { SectionId } from "@/lib/types";

/**
 * 給獨立路由頁面（/stories, /stories/submit 等）用的 layout shell。
 *
 * 原本的 NavBar 期望由 parent 傳入 onNavigate callback，
 * 但這些獨立頁面是 server component（為了直接打內部 fetch 並做 SEO），
 * 無法傳 function 給 client component。
 *
 * 此 wrapper 在 client 端用 next/navigation 處理回首頁的邏輯，
 * 同時維持 NavBar 在桌面/手機的捲動行為一致。
 */
export function StoriesShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleNavigate = (section: SectionId) => {
    if (section === "home") {
      router.push("/");
      return;
    }
    // 其他 section 都在首頁的 state-based 頁面中，回到首頁即可
    router.push("/");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar activeSection="home" onNavigate={handleNavigate} />
      {children}
    </div>
  );
}
