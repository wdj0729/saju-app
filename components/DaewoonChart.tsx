import type { DaewoonResult } from '@/lib/daewoon';
import { OHAENG_TEXT, OHAENG_LABEL } from '@/lib/constants';

interface DaewoonChartProps {
  result: DaewoonResult;
  currentAge: number;
}

export default function DaewoonChart({ result, currentAge }: DaewoonChartProps) {
  const { pillars, daewoonSu, direction } = result;

  // 현재 대운 인덱스 (대운 시작 전이면 -1)
  const currentIdx = pillars.findIndex((p) => currentAge >= p.startAge && currentAge <= p.endAge);

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-4">
        대운 (大運) · {direction} · 대운수 {daewoonSu}세
      </p>
      <div className="flex flex-col gap-2">
        {pillars.map((pillar, i) => {
          const isCurrent = i === currentIdx;
          const isPast = currentIdx !== -1 ? i < currentIdx : false;
          // 미래 대운: currentIdx 이후부터 점차 투명
          const futureSteps = currentIdx === -1 ? i : i - currentIdx;
          const opacity = isPast ? 0.35 : isCurrent ? 1 : Math.max(0.45, 1 - futureSteps * 0.1);

          return (
            <div
              key={pillar.gan + pillar.ji}
              className={`rounded-xl p-3 flex items-center gap-3 ${
                isCurrent ? 'border' : 'bg-card-hover'
              }`}
              style={
                isCurrent
                  ? {
                      background:
                        'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))',
                      borderColor: 'rgba(102,126,234,0.5)',
                      opacity,
                    }
                  : { opacity }
              }
            >
              {/* 간지 */}
              <div className="text-center min-w-[28px]">
                <div className={`text-xl font-bold leading-none ${OHAENG_TEXT[pillar.ganElement]}`}>{pillar.gan}</div>
                <div className={`text-xl font-bold leading-none mt-0.5 ${OHAENG_TEXT[pillar.jiElement]}`}>
                  {pillar.ji}
                </div>
              </div>

              {/* 나이 + 오행 */}
              <div className="flex-1">
                <div className="text-sm font-medium text-primary">
                  {pillar.startAge} ~ {pillar.endAge}세
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {pillar.ganElement}({OHAENG_LABEL[pillar.ganElement]}) · {pillar.jiElement}(
                  {OHAENG_LABEL[pillar.jiElement]})
                </div>
              </div>

              {/* 현재 배지 */}
              {isCurrent && (
                <span
                  className="text-xs rounded-md px-2 py-0.5 font-medium"
                  style={{ color: '#a0a0ff', background: 'rgba(102,126,234,0.2)' }}
                >
                  현재
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
