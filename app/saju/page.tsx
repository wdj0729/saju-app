'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { SIJIN, YEARS, MONTHS, INPUT_CLASS, LABEL_CLASS } from '@/lib/constants';
import BackButton from '@/components/BackButton';

export default function SajuInputPage() {
  const router = useRouter();
  const [profiles] = useState<Profile[]>(() => loadProfiles());
  const [name, setName] = useState('');
  const [isLunar, setIsLunar] = useState(false);
  const [year, setYear] = useState(() => new Date().getFullYear() - 30);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hourValue, setHourValue] = useState<number | null>(null);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [error, setError] = useState('');

  function loadFromProfile(profile: Profile) {
    setName(profile.name);
    setYear(profile.year);
    setMonth(profile.month);
    setDay(profile.day);
    setHourValue(profile.hour);
    setIsLunar(profile.isLunar);
    setGender(profile.gender ?? 'M');
  }

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSubmit() {
    setError('');
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      saveSession({
        input: { name, year, month, day: clampedDay, hour: hourValue, isLunar, gender },
        result,
      });
      router.push('/saju/result');
    } catch {
      setError('입력한 날짜를 확인해주세요.');
    }
  }


  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">생년월일시 입력</h1>
      </header>

      <div className="flex flex-col gap-5 px-4 py-6 flex-1">
        {profiles.length > 0 && (
          <div className="bg-card rounded-2xl px-4 py-3">
            <p className="text-xs text-muted mb-2 font-medium">저장된 프로필 불러오기</p>
            <div className="flex flex-col gap-2">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex justify-between items-center bg-card-hover rounded-xl px-3 py-2"
                >
                  <div className="min-w-0 truncate">
                    <span className="text-sm text-primary font-medium">
                      {profile.name || '이름 없음'}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {profile.year}.{String(profile.month).padStart(2, '0')}.
                      {String(profile.day).padStart(2, '0')}
                      {' · '}
                      {profile.isLunar ? '음력' : '양력'}
                      {' · '}
                      {profile.ilgan}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadFromProfile(profile)}
                    className="text-xs text-primary hover:opacity-70 transition-opacity ml-3 flex-shrink-0"
                    aria-label={`${profile.name || '이름 없음'} 선택`}
                  >
                    선택
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-3 text-center">또는 새로 입력하기 ↓</p>
          </div>
        )}

        {/* 이름 */}
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

        {/* 성별 */}
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

        {/* 양력/음력 토글 */}
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

        {/* 생년 */}
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

        {/* 생월 */}
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

        {/* 생일 */}
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

        {/* 태어난 시 */}
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

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          사주 분석하기
        </button>
      </div>
    </div>
  );
}
