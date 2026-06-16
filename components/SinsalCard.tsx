'use client';

import { memo } from 'react';
import type { SajuResult } from '@/lib/saju-calculator';
import { getSinsals, SINSAL_INFO } from '@/lib/sinsal';

interface SinsalCardProps {
  saju: SajuResult;
}

function SinsalCard({ saju }: SinsalCardProps) {
  const sinsals = getSinsals(saju);

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">✨ 신살(神殺) 분석</p>
      {sinsals.length === 0 ? (
        <p className="text-sm text-muted">특별한 신살이 없는 균형 잡힌 사주예요</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sinsals.map((sinsal) => {
            const entry = SINSAL_INFO[sinsal];
            return (
              <div key={sinsal}>
                <p className="text-xs font-semibold text-primary mb-0.5">
                  {sinsal}({entry.hanja})
                </p>
                <p className="text-xs text-muted">{entry.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default memo(SinsalCard);
