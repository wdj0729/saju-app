'use client';

import { memo } from 'react';
import { SkeletonBox } from './Skeleton';
import { SECTION_KEYS } from '@/lib/saju-sections';
import type { SectionKey } from '@/lib/saju-sections';

const SECTION_META: Record<SectionKey, { emoji: string; title: string }> = {
  성격분석: { emoji: '🔮', title: '성격 분석' },
  재물운: { emoji: '💰', title: '재물운' },
  건강운: { emoji: '🌿', title: '건강운' },
  연애운: { emoji: '💕', title: '연애운' },
  직업운: { emoji: '💼', title: '직업운' },
};

interface AiSectionsProps {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
}

function AiSections({ sections, activeSection, isStreaming, aiError, onRequest }: AiSectionsProps) {
  const hasContent = SECTION_KEYS.some((k) => sections[k]);

  if (aiError && !hasContent) {
    return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button
          onClick={onRequest}
          className="mt-1 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
        >
          🔄 다시 분석하기
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
        분석 요청하기
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {SECTION_KEYS.map((key) => {
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
        <button
          onClick={onRequest}
          className="mt-1 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
        >
          🔄 다시 분석하기
        </button>
      )}
    </div>
  );
}

export default memo(AiSections);
