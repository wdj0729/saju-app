'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useAiSections } from '@/hooks/useAiSections';
import SajuGrid from '@/components/SajuGrid';
import OhaengChart from '@/components/OhaengChart';
import DaewoonChart from '@/components/DaewoonChart';
import AiSections from '@/components/AiSections';
import ShareButton from '@/components/ShareButton';
import BackButton from '@/components/BackButton';
import { SkeletonBox } from '@/components/Skeleton';

const SEUN_RELATION: Record<string, { label: string; desc: string }> = {
  same:    { label: '경쟁·협력의 해', desc: '나와 비슷한 성격의 기운이 들어오는 해예요. 경쟁이 생기기도 하지만 협력과 독립의 기회도 함께 찾아와요.' },
  gen_me:  { label: '배움·귀인의 해', desc: '나를 도와주는 기운이 들어오는 해예요. 공부, 자격증, 귀인의 도움처럼 나를 성장시키는 일들이 잘 풀려요.' },
  i_gen:   { label: '표현·창작의 해', desc: '내가 에너지를 밖으로 내보내는 해예요. 창작, 표현, 새로운 시도처럼 자신을 드러내는 활동이 활발해져요.' },
  ctrl_me: { label: '책임·도전의 해', desc: '나를 단단하게 만드는 긴장감이 들어오는 해예요. 책임이 늘거나 도전적인 상황이 생기지만, 이겨내면 성장의 발판이 돼요.' },
  i_ctrl:  { label: '재물·성취의 해', desc: '내가 통제하고 성과를 내는 기운이 강한 해예요. 재물이 들어오고 목표를 향해 움직이는 활동이 잘 풀려요.' },
};

const OHAENG_GENERATES: Record<Ohaeng, Ohaeng> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
const OHAENG_CONTROLS:  Record<Ohaeng, Ohaeng> = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' };

const _today = new Date();
const TODAY_YEAR  = _today.getFullYear();
const TODAY_MONTH = _today.getMonth() + 1;
const TODAY_DATE  = _today.getDate();

function getSeunRelation(ilganEl: Ohaeng, ganEl: Ohaeng) {
  if (ganEl === ilganEl)                 return SEUN_RELATION.same;
  if (OHAENG_GENERATES[ganEl] === ilganEl) return SEUN_RELATION.gen_me;
  if (OHAENG_GENERATES[ilganEl] === ganEl) return SEUN_RELATION.i_gen;
  if (OHAENG_CONTROLS[ganEl] === ilganEl)  return SEUN_RELATION.ctrl_me;
  return SEUN_RELATION.i_ctrl;
}

function SeunSection({ ilganElement }: { ilganElement: Ohaeng }) {
  const seun = getYearPillar(TODAY_YEAR, TODAY_MONTH, TODAY_DATE);
  const relation = getSeunRelation(ilganElement, GAN_OHAENG[seun.gan]);

  return (
    <div className="bg-card rounded-2xl p-4">
      <p className="text-xs text-muted mb-3">세운 (歲運) · {TODAY_YEAR}년</p>
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
  const { sections, activeSection, isStreaming, aiError, request } = useAiSections();
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

  useEffect(() => {
    if (!session) return;
    const name = session.input.name ? `${session.input.name}의 사주` : '사주 결과';
    document.title = `${name} · ${session.result.ilgan} 일간 — 사주팔자`;
    return () => { document.title = '사주팔자'; };
  }, [session]);

  if (!session) return <SajuResultSkeleton />;

  const { input, result } = session;
  const displayName = input.name ? `${input.name}의 사주` : '사주 결과';
  const currentAge = calcMadeAge(input.year, input.month, input.day);
  const currentDaewoon = daewoon?.pillars.find(
    (p) => p.startAge <= currentAge && currentAge <= p.endAge
  );

  function handleAiRequest() {
    request('/api/saju-analysis', {
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
      birthYear: input.year,
      currentAge,
      currentDaewoon: currentDaewoon
        ? {
            gan: currentDaewoon.gan,
            ji: currentDaewoon.ji,
            startAge: currentDaewoon.startAge,
            endAge: currentDaewoon.endAge,
          }
        : undefined,
    });
  }

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
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/saju" label="다시 입력하기" />
        <h1 className="text-sm font-semibold text-primary">{displayName}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <SajuGrid year={result.year} month={result.month} day={result.day} hour={result.hour} />

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">
            일주 {result.day.gan}{result.day.ji} · 기질
          </p>
          <p className="text-sm text-primary leading-relaxed">
            {ILJU_TEXT[result.day.gan + result.day.ji] ?? '일주 정보를 불러올 수 없어요.'}
          </p>
        </div>

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>

        <SeunSection ilganElement={GAN_OHAENG[result.ilgan]} />

        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>
          <AiSections
            sections={sections}
            activeSection={activeSection}
            isStreaming={isStreaming}
            aiError={aiError}
            onRequest={handleAiRequest}
          />
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
        <ShareButton
          cardProps={{
            type: 'saju',
            name: input.name,
            ilgan: result.ilgan,
            pillars: {
              year: result.year.gan + result.year.ji,
              month: result.month.gan + result.month.ji,
              day: result.day.gan + result.day.ji,
              hour: result.hour ? result.hour.gan + result.hour.ji : undefined,
            },
            ohaeng: result.ohaeng,
          }}
          filename="saju-result.png"
          shareTitle="내 사주 결과"
        />
      </div>
    </div>
  );
}
