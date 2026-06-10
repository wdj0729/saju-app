'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { ILGAN_TEXT } from '@/lib/ilgan-text';
import { saveProfile, isProfileSaved } from '@/lib/profiles';
import { calculateDaewoon, calcMadeAge } from '@/lib/daewoon';
import SajuGrid from '@/components/SajuGrid';
import OhaengChart from '@/components/OhaengChart';
import DaewoonChart from '@/components/DaewoonChart';
import type { SajuSession } from '@/lib/session';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';

export default function SajuResultPage() {
  const router = useRouter();
  const [session] = useState<SajuSession | null>(() => loadSession());

  useEffect(() => {
    if (!session) {
      router.replace('/saju');
    }
  }, [session, router]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isSaved, setIsSaved] = useState(() => {
    return session ? isProfileSaved(session.input) : false;
  });

  if (!session) return null;

  const { input, result } = session;
  const displayName = input.name ? `${input.name}의 사주` : '사주 결과';

  const daewoon = input.gender
    ? calculateDaewoon(
        {
          year: input.year,
          month: input.month,
          day: input.day,
          hour: input.hour,
          isLunar: input.isLunar,
        },
        input.gender,
        result.year,
        result.month
      )
    : null;
  const currentAge = calcMadeAge(input.year, input.month, input.day);

  function handleSave() {
    saveProfile(input, result.ilgan);
    setIsSaved(true);
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
        {/* 사주 4기둥 그리드 */}
        <SajuGrid year={result.year} month={result.month} day={result.day} hour={result.hour} />

        {/* 일간 기질 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">일간 {result.ilgan} · 기질</p>
          <p className="text-sm text-primary leading-relaxed">
            {ILGAN_TEXT[result.ilgan] ?? '기질 정보를 불러올 수 없습니다.'}
          </p>
        </div>

        {/* 오행 분포 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        {/* 대운 */}
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
