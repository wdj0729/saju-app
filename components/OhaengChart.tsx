import type { Ohaeng } from '@/lib/saju-data';

interface OhaengChartProps {
  ohaeng: Record<Ohaeng, number>;
}

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];

const OHAENG_BAR: Record<Ohaeng, string> = {
  목: 'bg-mok',
  화: 'bg-hwa',
  토: 'bg-to',
  금: 'bg-geum',
  수: 'bg-su',
};

const OHAENG_LABEL: Record<Ohaeng, string> = {
  목: '木',
  화: '火',
  토: '土',
  금: '金',
  수: '水',
};

export default function OhaengChart({ ohaeng }: OhaengChartProps) {
  const max = Math.max(...Object.values(ohaeng), 1);

  return (
    <div className="flex flex-col gap-2 w-full">
      {OHAENG_ORDER.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <span className="text-sm text-muted w-4 shrink-0">{OHAENG_LABEL[key]}</span>
          <div className="flex-1 bg-card rounded-full h-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${OHAENG_BAR[key]}`}
              style={{ width: `${(ohaeng[key] / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted w-8 text-right shrink-0">
            {ohaeng[key].toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}
