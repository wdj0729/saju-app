'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    label: '1:1 궁합',
    icon: '💑',
    href: '/compatibility',
    match: ['/compatibility', '/compatibility/result'],
  },
  {
    label: '모임 궁합',
    icon: '👥',
    href: '/compatibility/group',
    match: ['/compatibility/group', '/compatibility/group/result'],
  },
] as const;

export default function CompatibilityTabs() {
  const pathname = usePathname();

  // Pick the longest matching pattern across all tabs so that a more specific
  // route (e.g. '/compatibility/group') wins over a shorter prefix that also
  // matches it (e.g. '/compatibility'), regardless of tab order.
  const activeHref =
    TABS.reduce<{ href: string; len: number } | null>((best, t) => {
      for (const m of t.match) {
        if ((pathname === m || pathname.startsWith(m + '/')) && (!best || m.length > best.len)) {
          best = { href: t.href, len: m.length };
        }
      }
      return best;
    }, null)?.href ?? '/compatibility';

  return (
    <div className="flex border-b border-border" role="tablist" aria-label="궁합 유형 선택">
      {TABS.map(({ label, icon, href }) => {
        const isActive = activeHref === href;
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative flex items-center justify-center gap-1.5 ${
              isActive ? 'text-primary' : 'text-muted'
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gradient"
                aria-hidden="true"
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
