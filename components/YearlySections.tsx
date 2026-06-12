'use client';

import { SkeletonBox } from './Skeleton';
import { YEARLY_SECTION_KEYS } from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';

const SECTION_META: Record<YearlySectionKey, { emoji: string; title: string }> = {
  총운: { emoji: '✨', title: '2026년 총운' },
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
}

export default function YearlySections({
  sections,
  activeSection,
  isStreaming,
  aiError,
  onRequest,
}: YearlySectionsProps) {
  const hasContent = YEARLY_SECTION_KEYS.some((k) => sections[k]);

  if (aiError && !hasContent) {
    return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={onRequest} className="text-xs text-muted underline">
          다시 시도
        </button>
      </div>
    );
  }

  if (!hasContent && !isStreaming) {
    return (
      <button
        onClick={onRequest}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        2026 신년운세 분석하기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {YEARLY_SECTION_KEYS.map((key) => {
        const { emoji, title } = SECTION_META[key];
        const text = sections[key];

        return (
          <div key={key} className="bg-card rounded-2xl p-4">
            <p className="text-xs text-muted mb-2">
              {emoji} {title}
            </p>
            {isStreaming && !text ? (
              <div className="flex flex-col gap-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-[80%]" />
                <SkeletonBox className="h-4 w-[60%]" />
              </div>
            ) : (
              <p className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
                {text}
                {activeSection === key && <span className="animate-pulse opacity-70">▌</span>}
              </p>
            )}
          </div>
        );
      })}
      {!isStreaming && hasContent && (
        <button onClick={onRequest} className="mt-1 text-xs text-muted underline text-center">
          다시 요청
        </button>
      )}
    </div>
  );
}
