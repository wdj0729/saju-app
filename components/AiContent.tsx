'use client';

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
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="animate-pulse">●</span>
        <span>분석 중...</span>
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
          <button onClick={onRequest} className="mt-3 text-xs text-muted underline">
            다시 요청
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
