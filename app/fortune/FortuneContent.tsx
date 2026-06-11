'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { FORTUNE_TEXT } from '@/lib/fortune-text';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
import AiContent from '@/components/AiContent';
import { useAiStream } from '@/hooks/useAiStream';

type Period = '오늘' | '이달' | '올해';

const PERIODS: Period[] = ['오늘', '이달', '올해'];

export default function FortuneContent() {
  const router = useRouter();
  const session = useSessionOrRedirect(loadSession, '/saju');
  const [activeTab, setActiveTab] = useState<Period>('오늘');
  const [isExpanded, setIsExpanded] = useState(false);
  const { aiText, isStreaming, aiError, request } = useAiStream();
  const cardRef = useRef<HTMLDivElement>(null);

  if (!session) return null;

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const { ilgan, ohaeng, year, month, day, hour } = session.result;
  const fortune = FORTUNE_TEXT[ilgan] ?? FORTUNE_TEXT['甲'];
  const currentPeriod = fortune[activeTab];

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setIsExpanded(false);
  }

  function handleAiRequest() {
    request('/api/ai-analysis', {
      ilgan,
      ohaeng,
      pillars: { year, month, day, hour: hour ?? null },
    });
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
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 내 사주
        </button>
        <h1 className="text-sm font-semibold text-primary">
          {session.input.name ? `${session.input.name} · ${ilgan} 일간` : `${ilgan} 일간`}
        </h1>
      </header>

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
        <div className="bg-card rounded-2xl overflow-hidden">
          <div className="p-4">
            <p className="text-xs text-muted mb-2">
              💫 {activeTab}의 운세 · {ilgan} 일간
            </p>
            <p className="text-sm text-primary leading-relaxed">{currentPeriod.summary}</p>
          </div>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full px-4 py-2.5 flex items-center justify-between border-t border-border text-xs text-muted hover:text-primary transition-colors"
          >
            <span>영역별 상세</span>
            <span>{isExpanded ? '∧ 접기' : '∨ 자세히'}</span>
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 pt-3 flex flex-col gap-3">
              {(Object.entries(currentPeriod.details) as [string, string][]).map(([key, value]) => (
                <div key={key}>
                  <span className="text-xs text-muted font-medium">{key}</span>
                  <p className="text-sm text-primary leading-relaxed mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          <AiContent
            aiText={aiText}
            isStreaming={isStreaming}
            aiError={aiError}
            onRequest={handleAiRequest}
          />
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          💑 궁합 보러 가기
        </button>
        <ShareButton cardRef={cardRef} filename="fortune.png" shareTitle={`${activeTab} 운세`} />
      </div>
    </div>
  );
}
