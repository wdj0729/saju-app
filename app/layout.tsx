import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import BottomNav from '@/components/BottomNav';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const defaultDescription =
  '생년월일시 입력만으로 AI가 분석하는 사주팔자. 오늘 운세·신년운세·궁합까지.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '사주팔자',
    template: '%s — 사주팔자',
  },
  description: defaultDescription,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '사주팔자',
  },
  icons: {
    apple: '/icon-192.png',
  },
  openGraph: {
    type: 'website',
    siteName: '사주팔자',
    locale: 'ko_KR',
    title: {
      default: '사주팔자',
      template: '%s — 사주팔자',
    },
    description: defaultDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: {
      default: '사주팔자',
      template: '%s — 사주팔자',
    },
    description: defaultDescription,
  },
};

export const viewport: Viewport = {
  themeColor: '#1e1e2e',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geistSans.variable} h-full antialiased`}>
      <body className="bg-base min-h-screen text-primary">
        <ServiceWorkerRegistrar />
        <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
