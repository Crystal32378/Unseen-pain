import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "看不見的痛｜神經痛就醫導航 — 麻、刺、燒、觸電感的就醫第一站",
  description:
    "神經痛看哪科？這裡幫你把說不清楚的麻、刺、燒、觸電感整理成看診語言，找到附近的神經科與復健科院所。不診斷、不推銷，只給你一個可信的就醫入口。",
  keywords: [
    "神經痛看哪科",
    "神經痛怎麼辦",
    "麻刺痛看哪科",
    "手肘到小指麻看哪科",
    "大腿外側麻刺看哪科",
    "神經內科還是復健科",
    "神經痛怎麼跟醫生說",
    "神經痛就醫導航",
  ],
  authors: [{ name: "看不見的痛" }],
  openGraph: {
    title: "看不見的痛｜神經痛就醫導航",
    description:
      "麻、刺、燒、觸電感——當你不知道該看哪一科時，這裡可以幫你整理感受、找到就醫方向與附近院所。",
    type: "website",
    locale: "zh_TW",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body
        className={`${notoSansTC.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
