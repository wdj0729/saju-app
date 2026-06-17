'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeInvite } from '@/lib/invite';
import type { InvitePayload } from '@/lib/invite';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';

export default function InviteLoader() {
  const router = useRouter();
  const params = useSearchParams();
  const [personA, setPersonA] = useState<InvitePayload | null>(null);
  const [invalid, setInvalid] = useState(false);

  const defaultYear = new Date().getFullYear() - 30;
  const [nameB, setNameB] = useState('');
  const [genderB, setGenderB] = useState<'M' | 'F'>('M');
  const [isLunarB, setIsLunarB] = useState(false);
  const [yearB, setYearB] = useState(defaultYear);
  const [monthB, setMonthB] = useState(1);
  const [dayB, setDayB] = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const from = params.get('from');
    if (!from) {
      setInvalid(true);
      return;
    }
    const payload = decodeInvite(from);
    if (!payload) {
      setInvalid(true);
      return;
    }
    setPersonA(payload);
  }, [params]);

  if (invalid) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted text-center">올바르지 않은 초대 링크입니다.</p>
        <button
          onClick={() => router.push('/compatibility')}
          className="py-3 px-6 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          궁합 직접 보기
        </button>
      </div>
    );
  }

  if (!personA) return null;

  const maxDayB = isLunarB ? 30 : new Date(yearB, monthB, 0).getDate();
  const clampedDayB = Math.min(dayB, maxDayB);

  function handleSubmit() {
    if (!personA) return;
    setError('');
    try {
      const resultA = calculateSaju({
        year: personA.year,
        month: personA.month,
        day: personA.day,
        hour: personA.hour,
        isLunar: personA.isLunar,
      });
      const resultB = calculateSaju({
        year: yearB,
        month: monthB,
        day: clampedDayB,
        hour: hourValueB,
        isLunar: isLunarB,
      });
      const compatibility = calcCompatibility(resultA, resultB);
      saveCompatSession({
        personA: { name: personA.name, gender: personA.gender, result: resultA },
        personB: { name: nameB, gender: genderB, result: resultB },
        compatibility,
      });
      router.push('/compatibility/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/compatibility" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 초대</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* A 정보 — read-only */}
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-1">
          <p className="text-xs text-muted">궁합을 요청한 사람</p>
          <p className="text-sm font-semibold text-primary">
            {personA.name || '이름 없음'} ({personA.gender === 'M' ? '남' : '여'})
          </p>
          <p className="text-xs text-muted">
            {personA.year}년 {personA.month}월 {personA.day}일
            {personA.hour !== null ? ` ${personA.hour}시` : ''}
            {personA.isLunar ? ' (음력)' : ''}
          </p>
        </div>

        {/* B 정보 입력 */}
        <PersonInputFields
          label="💑 내 정보"
          name={nameB}
          onNameChange={setNameB}
          gender={genderB}
          onGenderChange={setGenderB}
          isLunar={isLunarB}
          onIsLunarChange={setIsLunarB}
          year={yearB}
          month={monthB}
          day={clampedDayB}
          maxDay={maxDayB}
          onYearChange={setYearB}
          onMonthChange={setMonthB}
          onDayChange={setDayB}
          hourValue={hourValueB}
          onHourChange={setHourValueB}
          showOptionalHints
          namePlaceholder="이름을 입력하세요"
        />

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          궁합 분석하기
        </button>
      </div>
    </div>
  );
}
