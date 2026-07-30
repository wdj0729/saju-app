'use client';

import { memo } from 'react';
import { SectionCards } from './SectionCards';
import { YEARLY_SECTION_KEYS } from '@/lib/yearly-sections';
import type { YearlySectionKey } from '@/lib/yearly-sections';
import { getFortuneYear } from '@/lib/constants';

const fortuneYear = getFortuneYear();

const SECTION_META: Record<YearlySectionKey, { emoji: string; title: string }> = {
  총운: { emoji: '✨', title: `${fortuneYear}년 총운` },
  직업운: { emoji: '💼', title: '직업운' },
  재물운: { emoji: '💰', title: '재물운' },
  건강운: { emoji: '🌿', title: '건강운' },
  연애운: { emoji: '💕', title: '연애운' },
};

interface YearlySectionsProps {
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  onAbort?: () => void;
}

function YearlySections({
  sections,
  activeSection,
  isStreaming,
  aiError,
  onRequest,
  onAbort,
}: YearlySectionsProps) {
  const hasContent = YEARLY_SECTION_KEYS.some((k) => sections[k]);

  if (!hasContent && !isStreaming && !aiError) {
    return (
      <button
        onClick={onRequest}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        {fortuneYear} 신년운세 분석하기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {aiError && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-hwa">{aiError}</p>
          <button onClick={onRequest} className="text-xs text-muted underline shrink-0">
            다시 시도
          </button>
        </div>
      )}
      <SectionCards
        keys={YEARLY_SECTION_KEYS}
        meta={SECTION_META}
        sections={sections}
        activeSection={activeSection}
        isStreaming={isStreaming}
      />
      {isStreaming && onAbort && (
        <button
          onClick={onAbort}
          className="mt-1 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
        >
          ✕ 분석 중단
        </button>
      )}
      {!isStreaming && !aiError && hasContent && (
        <button onClick={onRequest} className="mt-1 text-xs text-muted underline text-center">
          다시 요청
        </button>
      )}
    </div>
  );
}

export default memo(YearlySections);
