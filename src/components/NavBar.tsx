"use client";

import { SectionId } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

const NAV_ITEMS: { id: SectionId; label: string }[] = [
  { id: "home", label: "首頁" },
  { id: "which-dept", label: "看哪一科" },
  { id: "describe-pain", label: "描述疼痛" },
  { id: "search", label: "找院所" },
  { id: "crystal-story", label: "過來人經驗" },
  { id: "emergency", label: "緊急警訊" },
  { id: "about", label: "資料與聲明" },
];

interface NavBarProps {
  activeSection: SectionId;
  onNavigate: (section: SectionId) => void;
}

export function NavBar({ activeSection, onNavigate }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md no-print">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2 text-left transition-opacity hover:opacity-70"
            aria-label="回到首頁"
          >
            <span className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              看不見的痛
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              神經痛就醫導航
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Emergency button - always visible */}
          <button
            onClick={() => onNavigate("emergency")}
            className="flex items-center gap-1.5 rounded-md bg-alert px-3 py-1.5 text-sm font-medium text-alert-foreground transition-opacity hover:opacity-80"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">緊急警訊</span>
          </button>
        </div>

        {/* Mobile nav - horizontal scroll */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
