'use client';

import { useMonthlyFortune } from '@/hooks/useMonthlyFortune';
import type { MonthlyFortuneInput } from '@/hooks/useMonthlyFortune';
import { YEARLY_SECTION_KEYS } from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';
import { SkeletonBox } from './Skeleton';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const SECTION_META: Record<YearlySectionKey, { emoji: string; label: string }> = {
  총운: { emoji: '✨', label: '총운' },
  직업운: { emoji: '💼', label: '직업운' },
  재물운: { emoji: '💰', label: '재물운' },
  건강운: { emoji: '🌿', label: '건강운' },
  연애운: { emoji: '💕', label: '연애운' },
};

export default function MonthlyFortune(props: MonthlyFortuneInput) {
  const {
    selectedMonth,
    setSelectedMonth,
    ruleSummary,
    sections,
    activeSection,
    isStreaming,
    aiError,
    hasCachedResult,
    requestAi,
  } = useMonthlyFortune(props);

  const hasAiContent = YEARLY_SECTION_KEYS.some((k) => sections[k]);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">📅 월별 운세</p>

      {/* 월 선택 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MONTHS.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMonth(m)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedMonth === m
                ? 'bg-primary-gradient text-white'
                : 'bg-card text-muted hover:bg-card-hover'
            }`}
          >
            {m}월
          </button>
        ))}
      </div>

      {/* 규칙 기반 요약 */}
      {ruleSummary && (
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <p className="text-xs text-muted">💫 {props.ilgan} 일간 기본 운세</p>
          <p className="text-sm text-primary leading-relaxed">{ruleSummary.summary}</p>
          <div className="flex flex-col gap-1 mt-1">
            {(Object.entries(ruleSummary.details) as [string, string][]).map(([key, value]) => (
              <p key={key} className="text-xs text-muted">
                <span className="text-primary">{key}</span> · {value}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* AI 분석 에러 */}
      {aiError && !hasAiContent && (
        <div>
          <p className="text-sm text-hwa mb-2">{aiError}</p>
          <button onClick={requestAi} className="text-xs text-muted underline">
            다시 시도
          </button>
        </div>
      )}

      {/* AI 분석 시작 버튼 */}
      {!hasAiContent && !isStreaming && (
        <button
          onClick={requestAi}
          className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
        >
          {selectedMonth}월 AI 상세 분석
        </button>
      )}

      {/* AI 섹션 */}
      {(hasAiContent || isStreaming) && (
        <div className="flex flex-col gap-3">
          {YEARLY_SECTION_KEYS.map((key) => {
            const { emoji, label } = SECTION_META[key];
            const text = sections[key];
            return (
              <div key={key} className="bg-card rounded-2xl p-4">
                <p className="text-xs text-muted mb-2">
                  {emoji} {selectedMonth}월 {label}
                </p>
                {isStreaming && !text ? (
                  <div className="flex flex-col gap-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-[80%]" />
                  </div>
                ) : (
                  <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                    {text}
                    {activeSection === key && (
                      <span className="animate-pulse opacity-70">▌</span>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          {!isStreaming && hasCachedResult && (
            <button
              onClick={requestAi}
              className="mt-1 text-xs text-muted underline text-center"
            >
              다시 요청
            </button>
          )}
        </div>
      )}
    </div>
  );
}
