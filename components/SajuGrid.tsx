import { memo } from 'react';
import type { Pillar } from '@/lib/saju-calculator';
import type { Ohaeng } from '@/lib/saju-data';
import { OHAENG_TEXT } from '@/lib/constants';

interface SajuGridProps {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}

const OHAENG_BG: Record<Ohaeng, string> = {
  목: 'bg-mok/10',
  화: 'bg-hwa/10',
  토: 'bg-to/10',
  금: 'bg-geum/10',
  수: 'bg-su/10',
};

function SajuGrid({ year, month, day, hour }: SajuGridProps) {
  const data = [
    { label: '시', pillar: hour },
    { label: '일', pillar: day },
    { label: '월', pillar: month },
    { label: '년', pillar: year },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {data.map(({ label, pillar }) => (
        <div
          key={label}
          className={`flex flex-col items-center rounded-xl p-3 ${
            pillar ? OHAENG_BG[pillar.jiElement] : 'bg-card'
          }`}
        >
          <span className="text-xs text-muted mb-2">{label}</span>
          {pillar ? (
            <>
              <span
                className={`font-serif text-3xl font-bold leading-none mb-1 ${OHAENG_TEXT[pillar.ganElement]}`}
              >
                {pillar.gan}
              </span>
              <span
                className={`font-serif text-3xl font-bold leading-none ${OHAENG_TEXT[pillar.jiElement]}`}
              >
                {pillar.ji}
              </span>
            </>
          ) : (
            <>
              <span className="text-3xl font-bold text-muted leading-none mb-1">?</span>
              <span className="text-3xl font-bold text-muted leading-none">?</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default memo(SajuGrid);
