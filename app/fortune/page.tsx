'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { FORTUNE_TEXT } from '@/lib/fortune-text';
import type { SajuSession } from '@/lib/session';

type Period = '오늘' | '이달' | '올해';

const PERIODS: Period[] = ['오늘', '이달', '올해'];

const PERIOD_LABEL: Record<Period, string> = {
  오늘: '오늘의 운세',
  이달: '이달의 운세',
  올해: '올해의 운세',
};

export default function FortunePage() {
  const router = useRouter();
  const [session] = useState<SajuSession | null>(() =>
    typeof window !== 'undefined' ? loadSession() : null
  );
  const [activeTab, setActiveTab] = useState<Period>('오늘');
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!session) router.replace('/saju');
  }, [session, router]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  if (!session) return null;

  const { ilgan } = session.result;
  const fortune = FORTUNE_TEXT[ilgan] ?? FORTUNE_TEXT['甲'];
  const currentPeriod = fortune[activeTab];

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setIsExpanded(false);
  }

  async function requestAiAnalysis() {
    if (!session) return;
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          ilgan,
          ohaeng: session.result.ohaeng,
          pillars: {
            year: { gan: session.result.year.gan, ji: session.result.year.ji },
            month: { gan: session.result.month.gan, ji: session.result.month.ji },
            day: { gan: session.result.day.gan, ji: session.result.day.ji },
            hour: session.result.hour
              ? { gan: session.result.hour.gan, ji: session.result.hour.ji }
              : null,
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

  return (
    <div className="flex flex-col min-h-screen">
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
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
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
              💫 {PERIOD_LABEL[activeTab]} · {ilgan} 일간
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

          {!aiText && !isStreaming && !aiError && (
            <button
              onClick={requestAiAnalysis}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium"
            >
              분석 요청하기
            </button>
          )}

          {isStreaming && !aiText && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="animate-pulse">●</span>
              <span>분석 중...</span>
            </div>
          )}

          {aiText && (
            <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
              {aiText}
              {isStreaming && (
                <span className="animate-pulse opacity-70">▌</span>
              )}
            </div>
          )}

          {aiError && !aiText && (
            <div>
              <p className="text-sm text-hwa mb-2">{aiError}</p>
              <button
                onClick={requestAiAnalysis}
                className="text-xs text-muted underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {aiText && !isStreaming && (
            <button
              onClick={requestAiAnalysis}
              className="mt-3 text-xs text-muted underline"
            >
              다시 요청
            </button>
          )}
        </div>
      </div>

      {/* 하단 궁합 버튼 */}
      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="w-full py-3 rounded-2xl bg-card text-primary text-sm font-medium"
        >
          💑 궁합 보러 가기
        </button>
      </div>
    </div>
  );
}
