'use client';

import { memo, useState } from 'react';
import type { DaewoonResult } from '@/lib/daewoon';
import type { Ohaeng } from '@/lib/saju-data';
import { getDaewoonInterpretation } from '@/lib/daewoon-text';
import { OHAENG_TEXT, OHAENG_LABEL } from '@/lib/constants';

interface DaewoonChartProps {
  result: DaewoonResult;
  currentAge: number;
  ilganElement: Ohaeng;
}

function DaewoonChart({ result, currentAge, ilganElement }: DaewoonChartProps) {
  const { pillars, daewoonSu, direction } = result;

  const currentIdx = pillars.findIndex(
    (p) => currentAge >= p.startAge && currentAge <= p.endAge
  );
  const defaultIdx = currentIdx === -1 ? 0 : currentIdx;
  const [selectedIdx, setSelectedIdx] = useState(defaultIdx);

  const selected = pillars[selectedIdx];
  const interpretation = getDaewoonInterpretation(
    ilganElement,
    selected.ganElement,
    selected.jiElement
  );

  const isCurrentSelected = selectedIdx === currentIdx;
  const isPastSelected = currentIdx !== -1 && selectedIdx < currentIdx;

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-4">
        대운 (大運) · {direction} · 대운수 {daewoonSu}세
      </p>

      {/* 가로 스크롤 카드 행 */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {pillars.map((pillar, i) => {
          const isCurrent = i === currentIdx;
          const isPast = currentIdx !== -1 && i < currentIdx;
          const isSelected = i === selectedIdx;
          const futureSteps = currentIdx === -1 ? i : i - currentIdx;
          const opacity = isPast
            ? 0.35
            : isCurrent
              ? 1
              : Math.max(0.45, 1 - futureSteps * 0.1);

          return (
            <button
              key={pillar.gan + pillar.ji}
              onClick={() => setSelectedIdx(i)}
              className="flex-shrink-0 rounded-xl p-2.5 text-center transition-all"
              style={{
                minWidth: '58px',
                opacity,
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(102,126,234,0.25), rgba(118,75,162,0.25))'
                  : 'var(--color-card-hover)',
                border: `1px solid ${isSelected ? 'rgba(102,126,234,0.7)' : 'transparent'}`,
              }}
            >
              {isCurrent && (
                <div
                  className="text-center mb-1 leading-none"
                  style={{ fontSize: '8px', color: '#a0a0ff' }}
                >
                  현재
                </div>
              )}
              <div className={`text-lg font-bold leading-none ${OHAENG_TEXT[pillar.ganElement]}`}>
                {pillar.gan}
              </div>
              <div
                className={`text-lg font-bold leading-none mt-0.5 ${OHAENG_TEXT[pillar.jiElement]}`}
              >
                {pillar.ji}
              </div>
              <div className="text-muted mt-1.5" style={{ fontSize: '9px' }}>
                {pillar.startAge}~{pillar.endAge}
              </div>
            </button>
          );
        })}
      </div>

      {/* 상세 패널 */}
      <div
        className="rounded-xl p-4 mt-3"
        style={{
          background: isCurrentSelected
            ? 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))'
            : isPastSelected
              ? 'rgba(255,255,255,0.03)'
              : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isCurrentSelected ? 'rgba(102,126,234,0.3)' : 'var(--color-border)'}`,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold leading-none ${OHAENG_TEXT[selected.ganElement]}`}>
              {selected.gan}
            </div>
            <div
              className={`text-3xl font-bold leading-none mt-1 ${OHAENG_TEXT[selected.jiElement]}`}
            >
              {selected.ji}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-primary mb-0.5">{interpretation.label}</p>
            <p className="text-xs text-muted">
              {selected.startAge} ~ {selected.endAge}세
            </p>
            <p className="text-xs text-muted mt-0.5">
              {selected.ganElement}({OHAENG_LABEL[selected.ganElement]}) ·{' '}
              {selected.jiElement}({OHAENG_LABEL[selected.jiElement]})
            </p>
          </div>
        </div>
        <p className="text-xs text-muted leading-relaxed mt-3">{interpretation.desc}</p>
      </div>
    </div>
  );
}

export default memo(DaewoonChart);
