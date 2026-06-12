'use client';

import { SkeletonBox } from './Skeleton';

interface AiContentProps {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
  requestLabel?: string;
}

export default function AiContent({
  aiText,
  isStreaming,
  aiError,
  onRequest,
  requestLabel = '분석 요청하기',
}: AiContentProps) {
  if (aiError && !aiText) {
    return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={onRequest} className="text-xs text-muted underline">
          다시 시도
        </button>
      </div>
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

  if (aiText) {
    return (
      <>
        <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
          {aiText}
          {isStreaming && <span className="animate-pulse opacity-70">▌</span>}
        </div>
        {!isStreaming && (
          <button
            onClick={onRequest}
            className="mt-3 w-full py-2 rounded-xl bg-card-hover text-sm text-muted hover:text-primary transition-colors"
          >
            🔄 다시 분석하기
          </button>
        )}
      </>
    );
  }

  return (
    <button
      onClick={onRequest}
      className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
    >
      {requestLabel}
    </button>
  );
}
