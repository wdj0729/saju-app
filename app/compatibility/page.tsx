'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { getPrefillA, clearPrefillA } from '@/lib/compatibility-prefill';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';

export default function CompatibilityPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [nameA, setNameA] = useState('');
  const [genderA, setGenderA] = useState<'M' | 'F'>('M');
  const [isLunarA, setIsLunarA] = useState(false);
  const [nameB, setNameB] = useState('');
  const [genderB, setGenderB] = useState<'M' | 'F'>('M');
  const [isLunarB, setIsLunarB] = useState(false);
  const [error, setError] = useState('');

  const defaultYear = new Date().getFullYear() - 30;
  const [yearA, setYearA] = useState(defaultYear);
  const [monthA, setMonthA] = useState(1);
  const [dayA, setDayA] = useState(1);
  const [hourValueA, setHourValueA] = useState<number | null>(null);
  const [yearB, setYearB] = useState(defaultYear);
  const [monthB, setMonthB] = useState(1);
  const [dayB, setDayB] = useState(1);
  const [hourValueB, setHourValueB] = useState<number | null>(null);

  useEffect(() => {
    setProfiles(loadProfiles());
    const prefill = getPrefillA();
    if (prefill) {
      clearPrefillA();
      setNameA(prefill.name);
      setYearA(prefill.year);
      setMonthA(prefill.month);
      setDayA(prefill.day);
      setHourValueA(prefill.hour);
      setIsLunarA(prefill.isLunar);
      setGenderA(prefill.gender);
    }
  }, []);

  function loadProfileA(profile: Profile) {
    setNameA(profile.name);
    setYearA(profile.year);
    setMonthA(profile.month);
    setDayA(profile.day);
    setHourValueA(profile.hour);
    setIsLunarA(profile.isLunar);
    setGenderA(profile.gender);
  }

  function loadProfileB(profile: Profile) {
    setNameB(profile.name);
    setYearB(profile.year);
    setMonthB(profile.month);
    setDayB(profile.day);
    setHourValueB(profile.hour);
    setIsLunarB(profile.isLunar);
    setGenderB(profile.gender);
  }

  const maxDayA = isLunarA ? 30 : new Date(yearA, monthA, 0).getDate();
  const maxDayB = isLunarB ? 30 : new Date(yearB, monthB, 0).getDate();
  const clampedDayA = Math.min(dayA, maxDayA);
  const clampedDayB = Math.min(dayB, maxDayB);

  function handleSubmit() {
    setError('');
    try {
      const resultA = calculateSaju({
        year: yearA,
        month: monthA,
        day: clampedDayA,
        hour: hourValueA,
        isLunar: isLunarA,
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
        personA: { name: nameA, gender: genderA, result: resultA },
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
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <PersonInputFields
          label="💑 나의 정보"
          profileChips={
            profiles.length > 0 ? (
              <div>
                <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => loadProfileA(profile)}
                      className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                    >
                      {profile.name || '이름 없음'} · {profile.ilgan}
                    </button>
                  ))}
                </div>
              </div>
            ) : undefined
          }
          name={nameA}
          onNameChange={setNameA}
          gender={genderA}
          onGenderChange={setGenderA}
          isLunar={isLunarA}
          onIsLunarChange={setIsLunarA}
          year={yearA}
          month={monthA}
          day={clampedDayA}
          maxDay={maxDayA}
          onYearChange={setYearA}
          onMonthChange={setMonthA}
          onDayChange={setDayA}
          hourValue={hourValueA}
          onHourChange={setHourValueA}
          showOptionalHints
          namePlaceholder="이름을 입력하세요"
        />

        <div className="flex items-center justify-center py-1">
          <span className="text-muted text-lg">♡</span>
        </div>

        <PersonInputFields
          label="💑 상대방 정보"
          profileChips={
            profiles.length > 0 ? (
              <div>
                <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => loadProfileB(profile)}
                      className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                    >
                      {profile.name || '이름 없음'} · {profile.ilgan}
                    </button>
                  ))}
                </div>
              </div>
            ) : undefined
          }
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
