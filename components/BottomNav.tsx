'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavTab = '홈' | '사주' | '운세' | '궁합';

export function getActiveTab(pathname: string): NavTab {
  if (pathname.startsWith('/saju')) return '사주';
  if (pathname.startsWith('/fortune')) return '운세';
  if (pathname.startsWith('/compatibility')) return '궁합';
  return '홈';
}

const TABS: { tab: NavTab; icon: string; href: string }[] = [
  { tab: '홈', icon: '🏠', href: '/' },
  { tab: '사주', icon: '🔮', href: '/saju' },
  { tab: '운세', icon: '💫', href: '/fortune' },
  { tab: '궁합', icon: '💑', href: '/compatibility' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      aria-label="주요 메뉴"
    >
      <div className="max-w-md mx-auto flex">
        {TABS.map(({ tab, icon, href }) => {
          const isActive = activeTab === tab;
          return (
            <Link
              key={tab}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab}
              className="flex-1 flex flex-col items-center gap-1 py-2 pb-3"
            >
              <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(to right, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }
                    : undefined
                }
              >
                {tab}
              </span>
              {isActive && (
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: 'linear-gradient(to right, #667eea, #764ba2)' }}
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
