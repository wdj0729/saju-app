'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { ILJU_TEXT } from '@/lib/ilju-text';
import { GAN_OHAENG, JI_OHAENG } from '@/lib/saju-data';
import { OHAENG_TEXT } from '@/lib/constants';
import { getYearPillar } from '@/lib/saju-calculator';
import type { Ohaeng } from '@/lib/saju-data';
import { saveProfile, isProfileSaved } from '@/lib/profiles';
import { calculateDaewoon, calcMadeAge } from '@/lib/daewoon';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import SajuGrid from '@/components/SajuGrid';
import OhaengChart from '@/components/OhaengChart';
import DaewoonChart from '@/components/DaewoonChart';
import ShareCard from '@/components/ShareCard';
import ShareButton from '@/components/ShareButton';
import { SkeletonBox } from '@/components/Skeleton';

const SEUN_RELATION: Record<string, { label: string; desc: string }> = {
  same:    { label: '비겁(比劫)', desc: '동등한 기운이 만나는 해 — 경쟁·협력·독립의 기운이 강합니다.' },
  gen_me:  { label: '인성(印星)', desc: '세운이 나를 생(生)하는 해 — 학습·귀인·지원의 기운이 따릅니다.' },
  i_gen:   { label: '식상(食傷)', desc: '내가 세운을 생(生)하는 해 — 표현·창작·발산의 기운이 강합니다.' },
  ctrl_me: { label: '관성(官星)', desc: '세운이 나를 극(剋)하는 해 — 책임·규율·도전의 기운이 따릅니다.' },
  i_ctrl:  { label: '재성(財星)', desc: '내가 세운을 극(剋)하는 해 — 재물·성취·활동의 기운이 강합니다.' },
};

const OHAENG_GENERATES: Record<Ohaeng, Ohaeng> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const OHAENG_CONTROLS:  Record<Ohaeng, Ohaeng> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };

function getSeunRelation(ilganEl: Ohaeng, ganEl: Ohaeng) {
  if (ganEl === ilganEl)                 return SEUN_RELATION.same;
  if (OHAENG_GENERATES[ganEl] === ilganEl) return SEUN_RELATION.gen_me;
  if (OHAENG_GENERATES[ilganEl] === ganEl) return SEUN_RELATION.i_gen;
  if (OHAENG_CONTROLS[ganEl] === ilganEl)  return SEUN_RELATION.ctrl_me;
  return SEUN_RELATION.i_ctrl;
}

function SeunSection({ ilganElement }: { ilganElement: Ohaeng }) {
  const today = new Date();
  const thisYear = today.getFullYear();
  const seun = getYearPillar(thisYear, today.getMonth() + 1, today.getDate());
  const relation = getSeunRelation(ilganElement, GAN_OHAENG[seun.gan]);

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">세운 (歲運) · {thisYear}년</p>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className={`font-serif text-3xl font-bold leading-none ${OHAENG_TEXT[GAN_OHAENG[seun.gan]]}`}>
            {seun.gan}
          </div>
          <div className={`font-serif text-3xl font-bold leading-none mt-1 ${OHAENG_TEXT[JI_OHAENG[seun.ji]]}`}>
            {seun.ji}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-primary mb-0.5">{relation.label}</p>
          <p className="text-xs text-muted leading-relaxed">{relation.desc}</p>
        </div>
      </div>
    </div>
  );
}

function SajuResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonBox className="h-10 w-full" />
              <SkeletonBox className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-32 w-full" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-24 w-full" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

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

  if (!session) return <SajuResultSkeleton />;

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
          <p className="text-xs text-muted mb-1">
            일주 {result.day.gan}{result.day.ji} · 기질
          </p>
          <p className="text-sm text-primary leading-relaxed">
            {ILJU_TEXT[result.day.gan + result.day.ji] ?? '일주 정보를 불러올 수 없습니다.'}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        <SeunSection ilganElement={GAN_OHAENG[result.ilgan]} />

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
