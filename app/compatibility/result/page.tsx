'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadCompatSession } from '@/lib/compatibility';
import type { CompatibilitySession } from '@/lib/compatibility';
import type { Ohaeng } from '@/lib/saju-data';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';

const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];
const OHAENG_LABEL: Record<Ohaeng, string> = { 목:'木', 화:'火', 토:'土', 금:'金', 수:'水' };
const OHAENG_BAR:   Record<Ohaeng, string> = { 목:'bg-mok', 화:'bg-hwa', 토:'bg-to', 금:'bg-geum', 수:'bg-su' };

export default function CompatibilityResultPage() {
  const router = useRouter();
  const [session] = useState<CompatibilitySession | null>(() => loadCompatSession());
  const [aiText, setAiText]           = useState('');
  const [isStreaming, setIsStreaming]  = useState(false);
  const [aiError, setAiError]         = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) router.replace('/compatibility');
  }, [session, router]);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  if (!session) return null;

  const { personA, personB, compatibility } = session;
  const { score, grade, gradeLabel, summary, ohaengA, ohaengB } = compatibility;

  const nameA = personA.name || '나';
  const nameB = personB.name || '상대';

  const maxA = Math.max(...Object.values(ohaengA), 1);
  const maxB = Math.max(...Object.values(ohaengB), 1);

  async function requestAiAnalysis() {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    try {
      const res = await fetch('/api/compatibility-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          personA: { name: personA.name, ilgan: personA.result.ilgan, ohaeng: ohaengA },
          personB: { name: personB.name, ilgan: personB.result.ilgan, ohaeng: ohaengB },
          score,
          grade,
        }),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했습니다.');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiText((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setAiText((prev) => prev + decoder.decode());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAiText('');
      setAiError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsStreaming(false);
    }
  }

  function renderAiContent() {
    if (aiError && !aiText) return (
      <div>
        <p className="text-sm text-hwa mb-2">{aiError}</p>
        <button onClick={requestAiAnalysis} className="text-xs text-muted underline">다시 시도</button>
      </div>
    );
    if (isStreaming && !aiText) return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="animate-pulse">●</span>
        <span>분석 중...</span>
      </div>
    );
    if (aiText) return (
      <>
        <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
          {aiText}
          {isStreaming && <span className="animate-pulse opacity-70">▌</span>}
        </div>
        {!isStreaming && (
          <button onClick={requestAiAnalysis} className="mt-3 text-xs text-muted underline">다시 요청</button>
        )}
      </>
    );
    return (
      <button
        onClick={requestAiAnalysis}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        AI 궁합 분석 요청하기
      </button>
    );
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
        {/* 점수 카드 */}
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-2">
          <p className="text-sm text-muted">{nameA} ♡ {nameB}</p>
          <p
            className="text-6xl font-bold"
            style={{ background: 'linear-gradient(to right, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {score}
          </p>
          <p className="text-sm font-semibold text-primary">{grade} · {gradeLabel}</p>
        </div>

        {/* 오행 비교 카드 */}
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
              <span className="text-xs text-muted w-4 text-center shrink-0">{OHAENG_LABEL[key]}</span>
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

        {/* 해석 텍스트 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-2">💫 궁합 해석</p>
          <p className="text-sm text-primary leading-relaxed">{summary}</p>
        </div>

        {/* AI 심층 분석 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          {renderAiContent()}
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          다시 분석하기
        </button>
        <ShareButton
          cardRef={cardRef}
          filename="compatibility-result.png"
          shareTitle="궁합 결과"
        />
      </div>
    </div>
  );
}
