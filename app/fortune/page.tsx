'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { FORTUNE_TEXT } from '@/lib/fortune-text';
import type { SajuSession } from '@/lib/session';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';

type Period = '오늘' | '이달' | '올해';

const PERIODS: Period[] = ['오늘', '이달', '올해'];

export default function FortunePage() {
  const router = useRouter();
  const [session] = useState<SajuSession | null>(() => loadSession());
  const [activeTab, setActiveTab] = useState<Period>('오늘');
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) router.replace('/saju');
  }, [session, router]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!session) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const { ilgan } = session.result;
  const fortune = FORTUNE_TEXT[ilgan] ?? FORTUNE_TEXT['甲'];
  const currentPeriod = fortune[activeTab];

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setIsExpanded(false);
  }

  async function requestAiAnalysis() {
    if (!session) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ilgan,
          ohaeng: session.result.ohaeng,
          pillars: {
            year:  session.result.year,
            month: session.result.month,
            day:   session.result.day,
            hour:  session.result.hour ?? null,
          },
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
        <button onClick={requestAiAnalysis} className="text-xs text-muted underline">
          다시 시도
        </button>
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
          <button onClick={requestAiAnalysis} className="mt-3 text-xs text-muted underline">
            다시 요청
          </button>
        )}
      </>
    );
    return (
      <button
        onClick={requestAiAnalysis}
        className="w-full py-3 rounded-xl bg-primary-gradient text-white text-sm font-medium"
      >
        분석 요청하기
      </button>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ShareCard
        ref={cardRef}
        type="fortune"
        name={session.input.name}
        ilgan={ilgan}
        period={activeTab}
        summary={currentPeriod.summary}
        date={dateStr}
      />
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/saju/result')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 내 사주
        </button>
        <h1 className="text-sm font-semibold text-primary">
          {session.input.name ? `${session.input.name} · ${ilgan} 일간` : `${ilgan} 일간`}
        </h1>
      </header>

      {/* 탭 바 */}
      <div className="flex border-b border-border">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => handleTabChange(period)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === period ? 'text-primary' : 'text-muted'
            }`}
          >
            {period}
            {activeTab === period && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gradient" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* 운세 카드 */}
        <div className="bg-card rounded-2xl overflow-hidden">
          {/* 요약 */}
          <div className="p-4">
            <p className="text-xs text-muted mb-2">
              💫 {activeTab}의 운세 · {ilgan} 일간
            </p>
            <p className="text-sm text-primary leading-relaxed">
              {currentPeriod.summary}
            </p>
          </div>

          {/* 아코디언 토글 */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full px-4 py-2.5 flex items-center justify-between border-t border-border text-xs text-muted hover:text-primary transition-colors"
          >
            <span>영역별 상세</span>
            <span>{isExpanded ? '∧ 접기' : '∨ 자세히'}</span>
          </button>

          {/* 상세 내용 */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
              {(
                Object.entries(currentPeriod.details) as [string, string][]
              ).map(([key, value]) => (
                <div key={key}>
                  <span className="text-xs text-muted font-medium">{key}</span>
                  <p className="text-sm text-primary leading-relaxed mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI 심층 분석 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          {renderAiContent()}
        </div>
      </div>

      {/* 하단 궁합 버튼 */}
      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          💑 궁합 보러 가기
        </button>
        <ShareButton
          cardRef={cardRef}
          filename="fortune.png"
          shareTitle={`${activeTab} 운세`}
        />
      </div>
    </div>
  );
}
