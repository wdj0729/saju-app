'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { ILGAN_TEXT } from '@/lib/ilgan-text';
import { saveProfile, isProfileSaved } from '@/lib/profiles';
import { calculateDaewoon, calcMadeAge } from '@/lib/daewoon';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import SajuGrid from '@/components/SajuGrid';
import OhaengChart from '@/components/OhaengChart';
import DaewoonChart from '@/components/DaewoonChart';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';

export default function SajuResultContent() {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const session = useSessionOrRedirect(
    loadSession,
    '/saju',
    (s) => setIsSaved(isProfileSaved(s.input))
  );

  const daewoon = useMemo(() => {
    if (!session?.input.gender) return null;
    return calculateDaewoon(
      {
        year: session.input.year,
        month: session.input.month,
        day: session.input.day,
        hour: session.input.hour,
        isLunar: session.input.isLunar,
      },
      session.input.gender,
      session.result.year,
      session.result.month
    );
  }, [session]);

  if (!session) return null;

  const { input, result } = session;
  const displayName = input.name ? `${input.name}의 사주` : '사주 결과';
  const currentAge = calcMadeAge(input.year, input.month, input.day);

  function handleSave() {
    try {
      saveProfile(input, result.ilgan);
      setIsSaved(true);
    } catch {
      // localStorage unavailable or quota exceeded — ignore silently
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <ShareCard
        ref={cardRef}
        type="saju"
        name={input.name}
        ilgan={result.ilgan}
        pillars={{
          year: result.year.gan + result.year.ji,
          month: result.month.gan + result.month.ji,
          day: result.day.gan + result.day.ji,
          hour: result.hour ? result.hour.gan + result.hour.ji : undefined,
        }}
        ohaeng={result.ohaeng}
      />
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/saju')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 다시 입력
        </button>
        <h1 className="text-sm font-semibold text-primary">{displayName}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <SajuGrid year={result.year} month={result.month} day={result.day} hour={result.hour} />

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">일간 {result.ilgan} · 기질</p>
          <p className="text-sm text-primary leading-relaxed">
            {ILGAN_TEXT[result.ilgan] ?? '기질 정보를 불러올 수 없습니다.'}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        {daewoon && <DaewoonChart result={daewoon} currentAge={currentAge} />}
      </div>

      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/fortune')}
          className="flex-1 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-medium"
        >
          운세 보기
        </button>
        <button
          onClick={() => router.push('/compatibility')}
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          궁합 보기
        </button>
        <button
          onClick={handleSave}
          disabled={isSaved}
          className="bg-card text-muted py-3 px-4 rounded-2xl hover:bg-card-hover transition-colors disabled:opacity-50"
          aria-label="프로필 저장"
        >
          {isSaved ? '✓' : '💾'}
        </button>
        <ShareButton cardRef={cardRef} filename="saju-result.png" shareTitle="내 사주 결과" />
      </div>
    </div>
  );
}
