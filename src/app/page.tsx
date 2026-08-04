"use client";

import { useState, useEffect, useCallback } from "react";
import { NavBar } from "@/components/NavBar";
import { HomeSection } from "@/components/sections/HomeSection";
import { WhichDeptSection } from "@/components/sections/WhichDeptSection";
import { DescribePainSection } from "@/components/sections/DescribePainSection";
import { SearchSection } from "@/components/sections/SearchSection";
import { CrystalStorySection } from "@/components/sections/CrystalStorySection";
import { EmergencySection } from "@/components/sections/EmergencySection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SectionId } from "@/lib/types";

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("home");

  const handleNavigate = useCallback((section: SectionId) => {
    setActiveSection(section);
    // Scroll to top on section change
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Update document title based on section
  useEffect(() => {
    const titles: Record<SectionId, string> = {
      home: "看不見的痛｜神經痛就醫導航 — 麻、刺、燒、觸電感的就醫第一站",
      "which-dept": "神經痛看哪一科？神經內科、復健科還是骨科？｜看不見的痛",
      "describe-pain": "神經痛怎麼跟醫生說？看診前症狀整理工具｜看不見的痛",
      search: "全台神經科與復健科院所搜尋｜看不見的痛",
      "crystal-story": "我不是一開始就知道，那是神經痛｜Crystal 的經驗",
      emergency: "立即就醫警訊 — 什麼情況不能繼續等？｜看不見的痛",
      about: "資料來源、隱私說明與免責聲明｜看不見的痛",
    };
    document.title = titles[activeSection];
  }, [activeSection]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar activeSection={activeSection} onNavigate={handleNavigate} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {activeSection === "home" && <HomeSection onNavigate={handleNavigate} />}
        {activeSection === "which-dept" && (
          <WhichDeptSection onNavigate={handleNavigate} />
        )}
        {activeSection === "describe-pain" && <DescribePainSection />}
        {activeSection === "search" && <SearchSection />}
        {activeSection === "crystal-story" && (
          <CrystalStorySection onNavigate={handleNavigate} />
        )}
        {activeSection === "emergency" && (
          <EmergencySection onNavigate={handleNavigate} />
        )}
        {activeSection === "about" && <AboutSection />}
      </main>

      <footer className="border-t border-border bg-card no-print">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-bold text-foreground">看不見的痛｜神經痛就醫導航</span>
            </div>
            <p className="leading-relaxed">
              這個網站不提供醫療診斷，僅協助整理症狀描述與提供就醫入口。
              實際診斷與治療請由合格醫療人員評估。如有緊急情況，請撥打 119。
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>院所資料來源：衛福部健保署公開資料</span>
              <span>部分地圖資訊由 Google Maps 提供</span>
            </div>
            <p className="text-xs">
              © {new Date().getFullYear()} 看不見的痛。本網站不販售產品、不收診所廣告、不替醫師排名。
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
