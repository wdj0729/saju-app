'use client';

import { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { loadCompatSession } from '@/lib/compatibility';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
import AiContent from '@/components/AiContent';
import { useAiStream } from '@/hooks/useAiStream';
import { OHAENG_ORDER, OHAENG_LABEL, OHAENG_BAR } from '@/lib/constants';

export default function CompatibilityResultContent() {
  const router = useRouter();
  const session = useSessionOrRedirect(loadCompatSession, '/compatibility');
  const { aiText, isStreaming, aiError, request } = useAiStream();
  const cardRef = useRef<HTMLDivElement>(null);

  const maxA = useMemo(
    () => (session ? Math.max(...Object.values(session.compatibility.ohaengA), 1) : 1),
    [session]
  );
  const maxB = useMemo(
    () => (session ? Math.max(...Object.values(session.compatibility.ohaengB), 1) : 1),
    [session]
  );

  if (!session) return null;

  const { personA, personB, compatibility } = session;
  const { score, grade, gradeLabel, summary, ohaengA, ohaengB } = compatibility;

  const nameA = personA.name || '나';
  const nameB = personB.name || '상대';

  function handleAiRequest() {
    request('/api/compatibility-analysis', {
      personA: { name: nameA, ilgan: personA.result.ilgan, ohaeng: ohaengA },
      personB: { name: nameB, ilgan: personB.result.ilgan, ohaeng: ohaengB },
      score,
      grade,
    });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ShareCard
        ref={cardRef}
        type="compatibility"
        nameA={nameA}
        nameB={nameB}
        score={score}
        grade={grade}
        gradeLabel={gradeLabel}
        summary={summary}
      />
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/compatibility')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 다시 입력
        </button>
        <h1 className="text-sm font-semibold text-primary">궁합 결과</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-2">
          <p className="text-sm text-muted">
            {nameA} ♡ {nameB}
          </p>
          <p
            className="text-6xl font-bold"
            style={{
              background: 'linear-gradient(to right, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {score}
          </p>
          <p className="text-sm font-semibold text-primary">
            {grade} · {gradeLabel}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">오행 비교</p>
          <div className="flex justify-between text-xs text-muted mb-2 px-6">
            <span>{nameA}</span>
            <span>{nameB}</span>
          </div>
          {OHAENG_ORDER.map((key) => (
            <div key={key} className="flex items-center gap-2 mb-2">
              <div className="flex-1 flex justify-end">
                <div className="w-full bg-border rounded-full h-3 overflow-hidden flex flex-row-reverse">
                  <div
                    className={`h-full rounded-full ${OHAENG_BAR[key]}`}
                    style={{ width: `${(ohaengA[key] / maxA) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted w-4 text-center shrink-0">
                {OHAENG_LABEL[key]}
              </span>
              <div className="flex-1">
                <div className="w-full bg-border rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full opacity-70 ${OHAENG_BAR[key]}`}
                    style={{ width: `${(ohaengB[key] / maxB) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-2">💫 궁합 해석</p>
          <p className="text-sm text-primary leading-relaxed">{summary}</p>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          <AiContent
            aiText={aiText}
            isStreaming={isStreaming}
            aiError={aiError}
            onRequest={handleAiRequest}
            requestLabel="AI 궁합 분석 요청하기"
          />
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          다시 분석하기
        </button>
        <ShareButton cardRef={cardRef} filename="compatibility-result.png" shareTitle="궁합 결과" />
      </div>
    </div>
  );
}
