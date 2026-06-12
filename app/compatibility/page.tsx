'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcCompatibility, saveCompatSession } from '@/lib/compatibility';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { SIJIN, YEARS, MONTHS, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import BackButton from '@/components/BackButton';

interface PersonFormProps {
  label: string;
  profiles: Profile[];
  onProfileSelect: (profile: Profile) => void;
  name: string;
  setName: (v: string) => void;
  gender: 'M' | 'F';
  setGender: (v: 'M' | 'F') => void;
  isLunar: boolean;
  setIsLunar: (v: boolean) => void;
  year: number;
  setYear: (v: number) => void;
  month: number;
  setMonth: (v: number) => void;
  setDay: (v: number) => void;
  clampedDay: number;
  hourValue: number | null;
  setHourValue: (v: number | null) => void;
}

function PersonForm({
  label,
  profiles,
  onProfileSelect,
  name,
  setName,
  gender,
  setGender,
  isLunar,
  setIsLunar,
  year,
  setYear,
  month,
  setMonth,
  setDay,
  clampedDay,
  hourValue,
  setHourValue,
}: PersonFormProps) {
  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();

  return (
    <div className="bg-card rounded-2xl px-4 py-4 flex flex-col gap-4">
      <p className="text-xs font-semibold text-primary">{label}</p>

      {profiles.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onProfileSelect(profile)}
                className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
              >
                {profile.name || '이름 없음'} · {profile.ilgan}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>이름 (선택)</label>
        <input
          type="text"
          placeholder="이름을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className={LABEL_CLASS}>성별</label>
        <div className="flex gap-2">
          {(['M', 'F'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGender(g)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                gender === g ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {g === 'M' ? '남성' : '여성'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>양력 / 음력</label>
        <div className="flex gap-2">
          {([false, true] as const).map((lunar) => (
            <button
              key={String(lunar)}
              onClick={() => setIsLunar(lunar)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={LABEL_CLASS}>생년</label>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>생월</label>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>생일</label>
        <select
          value={clampedDay}
          onChange={(e) => setDay(Number(e.target.value))}
          className={INPUT_CLASS}
        >
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <option key={d} value={d}>
              {d}일
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL_CLASS}>태어난 시 (선택)</label>
        <select
          value={hourValue ?? ''}
          onChange={(e) => setHourValue(e.target.value === '' ? null : Number(e.target.value))}
          className={INPUT_CLASS}
        >
          <option value="">모름</option>
          {SIJIN.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

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
  }, []);

  function loadProfileA(profile: Profile) {
    setNameA(profile.name);
    setYearA(profile.year);
    setMonthA(profile.month);
    setDayA(profile.day);
    setHourValueA(profile.hour);
    setIsLunarA(profile.isLunar);
    setGenderA(profile.gender ?? 'M');
  }

  function loadProfileB(profile: Profile) {
    setNameB(profile.name);
    setYearB(profile.year);
    setMonthB(profile.month);
    setDayB(profile.day);
    setHourValueB(profile.hour);
    setIsLunarB(profile.isLunar);
    setGenderB(profile.gender ?? 'M');
  }

  const clampedDayA = Math.min(dayA, isLunarA ? 30 : new Date(yearA, monthA, 0).getDate());
  const clampedDayB = Math.min(dayB, isLunarB ? 30 : new Date(yearB, monthB, 0).getDate());

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
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">궁합 보기</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <PersonForm
          label="💑 나의 정보"
          profiles={profiles}
          onProfileSelect={loadProfileA}
          name={nameA}
          setName={setNameA}
          gender={genderA}
          setGender={setGenderA}
          isLunar={isLunarA}
          setIsLunar={setIsLunarA}
          year={yearA}
          setYear={setYearA}
          month={monthA}
          setMonth={setMonthA}
          setDay={setDayA}
          clampedDay={clampedDayA}
          hourValue={hourValueA}
          setHourValue={setHourValueA}
        />

        <div className="flex items-center justify-center py-1">
          <span className="text-muted text-lg">♡</span>
        </div>

        <PersonForm
          label="💑 상대방 정보"
          profiles={profiles}
          onProfileSelect={loadProfileB}
          name={nameB}
          setName={setNameB}
          gender={genderB}
          setGender={setGenderB}
          isLunar={isLunarB}
          setIsLunar={setIsLunarB}
          year={yearB}
          setYear={setYearB}
          month={monthB}
          setMonth={setMonthB}
          setDay={setDayB}
          clampedDay={clampedDayB}
          hourValue={hourValueB}
          setHourValue={setHourValueB}
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
