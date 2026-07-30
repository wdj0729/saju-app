'use client';

import { memo } from 'react';
import { SectionCards } from './SectionCards';
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
  onAbort?: () => void;
}

function AiSections({
  sections,
  activeSection,
  isStreaming,
  aiError,
  onRequest,
  onAbort,
}: AiSectionsProps) {
  const hasContent = SECTION_KEYS.some((k) => sections[k]);

  if (!hasContent && !isStreaming && !aiError) {
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
      {aiError && (
        <div
          className="rounded-xl px-3 py-2 flex items-center justify-between gap-2"
          style={{
            background: 'rgba(255,100,100,0.08)',
            border: '1px solid rgba(255,100,100,0.2)',
          }}
        >
          <p className="text-xs" style={{ color: '#ff6b6b' }}>
            {aiError}
          </p>
          <button
            onClick={onRequest}
            className="text-xs text-muted hover:text-primary shrink-0 transition-colors"
          >
            🔄 재시도
          </button>
        </div>
      )}
      <SectionCards
        keys={SECTION_KEYS}
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
