'use client';

import { memo } from 'react';
import { SkeletonBox } from './Skeleton';

interface AiContentProps {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  requestLabel?: string;
}

function AiContent({
  aiText,
  isStreaming,
  aiError,
  onRequest,
  requestLabel = '분석 요청하기',
}: AiContentProps) {
  if (!aiText && !isStreaming && !aiError) {
    return (
      <button
        onClick={onRequest}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        {requestLabel}
      </button>
    );
  }

  if (isStreaming && !aiText) {
    return (
      <div className="flex flex-col gap-2">
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-4 w-[85%]" />
        <SkeletonBox className="h-4 w-[60%]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
      {aiText && (
        <>
          <div
            className="text-sm text-primary leading-relaxed whitespace-pre-wrap"
            aria-live="polite"
            aria-atomic="false"
            aria-busy={isStreaming}
          >
            {aiText}
            {isStreaming && (
              <span className="animate-pulse opacity-70" aria-hidden="true">
                ▌
              </span>
            )}
          </div>
          {!isStreaming && !aiError && (
            <button
              onClick={onRequest}
              className="w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
            >
              🔄 다시 분석하기
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default memo(AiContent);
