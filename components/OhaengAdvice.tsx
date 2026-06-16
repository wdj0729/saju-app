'use client';

import { memo } from 'react';
import type { Ohaeng } from '@/lib/saju-data';
import { getMostLackingOhaeng, OHAENG_ADVICE } from '@/lib/ohaeng-advice';

interface OhaengAdviceProps {
  ohaeng: Record<Ohaeng, number>;
}

const TIPS = [
  { key: 'color' as const, emoji: '🎨' },
  { key: 'direction' as const, emoji: '🧭' },
  { key: 'food' as const, emoji: '🥘' },
  { key: 'activity' as const, emoji: '🏃' },
];

function OhaengAdvice({ ohaeng }: OhaengAdviceProps) {
  const lacking = getMostLackingOhaeng(ohaeng);
  if (!lacking) return null;

  const entry = OHAENG_ADVICE[lacking];
  const suffix = ohaeng[lacking] === 0 ? '이 없어요' : '이 부족해요';
  const displaySuffix = entry.particle === '가' ? suffix.replace('이 ', '가 ') : suffix;

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">🌿 오행 균형 조언</p>
      <p className="text-sm font-semibold text-primary mb-3">
        {lacking}({entry.hanja}){displaySuffix}. 아래로 보완해 보세요.
      </p>
      <div className="flex flex-col gap-2.5">
        {TIPS.map(({ key, emoji }) => (
          <div key={key} className="flex items-start gap-2.5">
            <span className="text-sm leading-relaxed">{emoji}</span>
            <div>
              <span className="text-xs font-semibold text-primary">{entry[key].label}&nbsp;</span>
              <span className="text-xs text-muted">{entry[key].tip}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(OhaengAdvice);
