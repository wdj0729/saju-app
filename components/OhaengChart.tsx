import { memo } from 'react';
import type { Ohaeng } from '@/lib/saju-data';
import { OHAENG_ORDER, OHAENG_LABEL, OHAENG_BAR } from '@/lib/constants';

interface OhaengChartProps {
  ohaeng: Record<Ohaeng, number>;
}

function OhaengChart({ ohaeng }: OhaengChartProps) {
  const max = Math.max(...Object.values(ohaeng), 1);
  const total = Object.values(ohaeng).reduce((s, v) => s + v, 0);

  const summary = OHAENG_ORDER.map((key) => {
    const pct = total > 0 ? Math.round((ohaeng[key] / total) * 100) : 0;
    return `${OHAENG_LABEL[key]}${pct}%`;
  }).join(', ');

  return (
    <div
      className="flex flex-col gap-2 w-full"
      role="img"
      aria-label={`오행 분포: ${summary}`}
    >
      {OHAENG_ORDER.map((key) => {
        const pct = total > 0 ? Math.round((ohaeng[key] / total) * 100) : 0;
        return (
          <div key={key} className="flex items-center gap-2" aria-hidden="true">
            <span className="text-sm text-muted w-4 shrink-0">{OHAENG_LABEL[key]}</span>
            <div className="flex-1 bg-card rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${OHAENG_BAR[key]}`}
                style={{ width: `${(ohaeng[key] / max) * 100}%` }}
              />
            </div>
            <span className="text-xs text-muted w-8 text-right shrink-0">
              {pct > 0 ? `${pct}%` : '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default memo(OhaengChart);
