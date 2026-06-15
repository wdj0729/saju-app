'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { FORTUNE_TEXT, getDayVariantIndex } from '@/lib/fortune-text';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import ShareButton from '@/components/ShareButton';
import BackButton from '@/components/BackButton';
import AiContent from '@/components/AiContent';
import { useAiStream } from '@/hooks/useAiStream';
import { SkeletonBox } from '@/components/Skeleton';
import SessionExpiredPage from '@/components/SessionExpiredPage';
import { getDayPillar } from '@/lib/saju-calculator';
import { OHAENG_LABEL } from '@/lib/constants';

type Period = '오늘' | '이달' | '올해';

const PERIODS: Period[] = ['오늘', '이달', '올해'];

function FortuneSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-28" />
      </header>
      <div className="flex border-b border-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <SkeletonBox className="h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-3/4" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

export default function FortuneContent() {
  const router = useRouter();
  const session = useSessionOrRedirect(loadSession, null);
  const [activeTab, setActiveTab] = useState<Period>('오늘');
  const [isExpanded, setIsExpanded] = useState(false);
  const { aiText, isStreaming, aiError, request } = useAiStream();

  const [todayDate] = useState(() => new Date());
  const todayDateStr = `${todayDate.getFullYear()}년 ${todayDate.getMonth() + 1}월 ${todayDate.getDate()}일`;

  const todayIljin = useMemo(() => {
    const pillar = getDayPillar(
      todayDate.getFullYear(),
      todayDate.getMonth() + 1,
      todayDate.getDate()
    );
    return `${pillar.gan}${pillar.ji}일 (${OHAENG_LABEL[pillar.ganElement]})`;
  }, [todayDate]);

  const handleAiRequest = useCallback(() => {
    if (!session || session === 'not-found') return;
    const { ilgan, ohaeng, year, month, day, hour } = session.result;
    request('/api/ai-analysis', {
      ilgan,
      ohaeng,
      pillars: { year, month, day, hour: hour ?? null },
    });
  }, [request, session]);

  useEffect(() => {
    if (!session || session === 'not-found') return;
    const name = session.input.name ? `${session.input.name}의 ` : '';
    document.title = `${name}${activeTab} 운세 · ${session.result.ilgan} 일간 — 사주팔자`;
    return () => {
      document.title = '사주팔자';
    };
  }, [session, activeTab]);

  if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
  if (!session) return <FortuneSkeleton />;

  const { ilgan, ohaeng, year, month, day, hour } = session.result;
  const fortune = FORTUNE_TEXT[ilgan] ?? FORTUNE_TEXT['甲'];
  const currentPeriod =
    activeTab === '오늘' ? fortune.오늘[getDayVariantIndex(todayDate)] : fortune[activeTab];

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setIsExpanded(false);
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/saju/result" label="내 사주" />
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
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted">
                💫 {activeTab}의 운세 · {ilgan} 일간
              </p>
              {activeTab === '오늘' && <p className="text-xs text-muted">일진 {todayIljin}</p>}
            </div>
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
          💑 궁합 보기
        </button>
        <ShareButton
          cardProps={{
            type: 'fortune',
            name: session.input.name,
            ilgan,
            period: activeTab,
            summary: currentPeriod.summary,
            date: todayDateStr,
          }}
          filename="fortune.png"
          shareTitle={`${activeTab} 운세`}
        />
      </div>
    </div>
  );
}
