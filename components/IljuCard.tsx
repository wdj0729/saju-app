'use client';

import { useState } from 'react';
import { ILJU_TEXT } from '@/lib/ilju-text';
import { ILJU_DETAIL } from '@/lib/ilju-detail';
import type { IljuDetail } from '@/lib/ilju-detail';

interface IljuCardProps {
  gan: string;
  ji: string;
}

const SECTIONS: { key: keyof IljuDetail; label: string; icon: string }[] = [
  { key: 'personality', label: '성격', icon: '🧭' },
  { key: 'love', label: '연애', icon: '💕' },
  { key: 'career', label: '직업', icon: '💼' },
  { key: 'relationship', label: '인간관계', icon: '🤝' },
];

export default function IljuCard({ gan, ji }: IljuCardProps) {
  const [expanded, setExpanded] = useState(false);
  const key = gan + ji;
  const detail = ILJU_DETAIL[key];

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-1">
        일주 {gan}
        {ji} · 기질
      </p>
      <p className="text-sm text-primary leading-relaxed">
        {ILJU_TEXT[key] ?? '일주 정보를 불러올 수 없어요.'}
      </p>

      {detail && (
        <>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="mt-3 text-xs text-muted hover:text-primary transition-colors flex items-center gap-1"
          >
            일주론 더 보기
            <span aria-hidden="true">{expanded ? '∧' : '∨'}</span>
          </button>

          {expanded && (
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
              {SECTIONS.map(({ key: sectionKey, label, icon }) => (
                <div key={sectionKey}>
                  <p className="text-xs font-semibold text-primary mb-1">
                    <span aria-hidden="true">{icon}</span> {label}
                  </p>
                  <p className="text-sm text-muted leading-relaxed">{detail[sectionKey]}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
