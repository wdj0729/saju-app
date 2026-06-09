import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "사주팔자",
  description: "생년월일시로 보는 사주팔자 분석",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e1e2e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-base min-h-screen text-primary">
        <div className="max-w-md mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
