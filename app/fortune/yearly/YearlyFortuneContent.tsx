'use client';

import { useCallback, useMemo } from 'react';
import { loadSession } from '@/lib/session';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useYearlySections } from '@/hooks/useYearlySections';
import YearlySections from '@/components/YearlySections';
import MonthlyFortune from '@/components/MonthlyFortune';
import BackButton from '@/components/BackButton';
import { SkeletonBox } from '@/components/Skeleton';
import SessionExpiredPage from '@/components/SessionExpiredPage';
import { getFortuneYear, getFortuneGanjee } from '@/lib/constants';

function YearlyFortuneSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-32" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-2xl p-4 flex flex-col gap-2">
            <SkeletonBox className="h-3 w-24" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-[80%]" />
            <SkeletonBox className="h-4 w-[60%]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function YearlyFortuneContent() {
  const session = useSessionOrRedirect(loadSession, null);
  const { sections, activeSection, isStreaming, aiError, request, abort } = useYearlySections();
  const pillars = useMemo(
    () =>
      session && session !== 'not-found'
        ? {
            year: session.result.year,
            month: session.result.month,
            day: session.result.day,
            hour: session.result.hour ?? null,
          }
        : null,
    [session]
  );
  const fortuneYear = getFortuneYear();
  const fortuneGanjee = getFortuneGanjee(fortuneYear);

  const handleRequest = useCallback(() => {
    if (!session || session === 'not-found') return;
    const { input, result } = session;
    request('/api/yearly-fortune', {
      ilgan: result.ilgan,
      ohaeng: result.ohaeng,
      pillars: {
        year: result.year,
        month: result.month,
        day: result.day,
        hour: result.hour ?? null,
      },
      name: input.name || undefined,
      gender: input.gender,
    });
  }, [request, session]);

  const docTitle =
    session && session !== 'not-found'
      ? `${session.input.name ? `${session.input.name}의 ` : ''}${fortuneYear} 신년운세 · ${session.result.ilgan} 일간 — 사주팔자`
      : undefined;
  useDocumentTitle(docTitle);

  if (session === 'not-found') return <SessionExpiredPage redirectPath="/saju" />;
  if (!session) return <YearlyFortuneSkeleton />;

  const { input, result } = session;

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/saju/result" label="내 사주" />
        <h1 className="text-sm font-semibold text-primary">
          {input.name ? `${input.name} · ${fortuneYear} 신년운세` : `${fortuneYear} 신년운세`}
        </h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">
            ✨ {fortuneYear}년 {fortuneGanjee}
          </p>
          <p className="text-xs text-primary">{result.ilgan} 일간 · AI 신년운세 분석</p>
        </div>

        <YearlySections
          sections={sections}
          activeSection={activeSection}
          isStreaming={isStreaming}
          aiError={aiError}
          onRequest={handleRequest}
          onAbort={abort}
        />

        <div className="border-t border-border pt-4">
          <MonthlyFortune
            ilgan={result.ilgan}
            ohaeng={result.ohaeng}
            pillars={pillars!}
            name={input.name || undefined}
            gender={input.gender}
          />
        </div>
      </div>
    </div>
  );
}
