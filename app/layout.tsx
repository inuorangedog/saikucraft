import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./_components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://saikucraft.com'

export const metadata: Metadata = {
  title: {
    default: 'SaikuCraft - 手描きクリエイターと安心して繋がれるコミッションサービス',
    template: '%s | SaikuCraft',
  },
  description:
    'SaikuCraftは、手描きクリエイターと依頼者を安心して繋ぐ同人特化のコミッションサービスです。エスクロー決済・AI不使用ポリシーで安全な取引を実現します。',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'SaikuCraft',
    title: 'SaikuCraft - 手描きクリエイターと安心して繋がれるコミッションサービス',
    description: '手描きクリエイターと依頼者を安心して繋ぐ同人特化のコミッションサービス。エスクロー決済・AI不使用ポリシーで安全な取引。',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaikuCraft',
    description: '手描きクリエイターと安心して繋がれるコミッションサービス',
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
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
