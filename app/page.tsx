'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadProfiles, deleteProfile, updateProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';
import { YEARLY_FORTUNE_YEAR, LABEL_CLASS, INPUT_CLASS } from '@/lib/constants';
import { setPrefillA } from '@/lib/compatibility-prefill';
import DateInput from '@/components/DateInput';
import HourInput from '@/components/HourInput';

const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
  },
  {
    emoji: '✨',
    title: `${YEARLY_FORTUNE_YEAR} 신년운세`,
    subtitle: `${YEARLY_FORTUNE_YEAR}년 총운·직업·재물·건강·연애`,
    href: '/fortune/yearly',
  },
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
  },
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
  },
];

interface ProfileEditFormProps {
  profile: Profile;
  onSave: (id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>) => void;
  onCancel: () => void;
}

function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [name, setName] = useState(profile.name);
  const [gender, setGender] = useState<'M' | 'F'>(profile.gender ?? 'M');
  const [isLunar, setIsLunar] = useState(profile.isLunar);
  const [year, setYear] = useState(profile.year);
  const [month, setMonth] = useState(profile.month);
  const [day, setDay] = useState(profile.day);
  const [hourValue, setHourValue] = useState<number | null>(profile.hour);

  const maxDay = isLunar ? 30 : new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDay);

  function handleSave() {
    try {
      const result = calculateSaju({ year, month, day: clampedDay, hour: hourValue, isLunar });
      onSave(profile.id, {
        name,
        gender,
        isLunar,
        year,
        month,
        day: clampedDay,
        hour: hourValue,
        ilgan: result.ilgan,
      });
    } catch {
      // 잘못된 날짜이면 저장하지 않음
    }
  }

  return (
    <div className="border-t border-border px-3 py-3 flex flex-col gap-3">
      <div>
        <label className={LABEL_CLASS}>이름</label>
        <input
          type="text"
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
              type="button"
              onClick={() => setGender(g)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
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
              type="button"
              onClick={() => setIsLunar(lunar)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                isLunar === lunar ? 'bg-primary-gradient text-white' : 'bg-card text-muted'
              }`}
            >
              {lunar ? '음력' : '양력'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className={LABEL_CLASS}>생년월일</label>
        <DateInput
          year={year}
          month={month}
          day={clampedDay}
          maxDay={maxDay}
          onYearChange={setYear}
          onMonthChange={setMonth}
          onDayChange={setDay}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>태어난 시</label>
        <HourInput value={hourValue} onChange={setHourValue} />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl text-sm text-muted bg-card"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-2 rounded-xl text-sm font-semibold bg-primary-gradient text-white"
        >
          저장
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null);

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  function handleProfileNav(profile: Profile, dest: 'saju' | 'fortune' | 'yearly' | 'compat') {
    if (dest === 'compat') {
      setPrefillA(profile);
      router.push('/compatibility');
      return;
    }
    try {
      const result = calculateSaju({
        year: profile.year,
        month: profile.month,
        day: profile.day,
        hour: profile.hour,
        isLunar: profile.isLunar,
      });
      saveSession({
        input: {
          name: profile.name,
          year: profile.year,
          month: profile.month,
          day: profile.day,
          hour: profile.hour,
          isLunar: profile.isLunar,
          gender: profile.gender ?? 'M',
        },
        result,
      });
      router.push(
        dest === 'saju' ? '/saju/result' : dest === 'fortune' ? '/fortune' : '/fortune/yearly'
      );
    } catch {
      router.push('/saju');
    }
  }

  function handleDelete(id: string) {
    deleteProfile(id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  function handleSaveEdit(
    id: string,
    patch: Partial<Omit<Profile, 'id' | 'createdAt'>>
  ) {
    updateProfile(id, patch);
    setProfiles(loadProfiles());
    setExpandedProfileId(null);
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center mb-8">
        <span className="text-4xl mb-3">🔮</span>
        <h1 className="text-2xl font-bold text-primary">사주팔자</h1>
        <p className="text-sm text-muted mt-1">나의 운명을 살펴보세요</p>
      </div>

      {profiles.length > 0 && (
        <div className="w-full bg-card rounded-2xl px-4 py-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted">저장된 프로필</span>
            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setExpandedProfileId(null);
              }}
              className={`text-xs transition-colors ${isEditing ? 'text-hwa' : 'text-primary'}`}
            >
              {isEditing ? '완료' : '편집'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-card-hover rounded-2xl overflow-hidden">
                <div className="flex items-center px-3 py-2 gap-2">
                  <button
                    onClick={() => {
                      setExpandedProfileId(expandedProfileId === profile.id ? null : profile.id);
                    }}
                    className="flex-1 text-left text-xs text-primary"
                  >
                    🔮 {profile.name || '이름 없음'} · {profile.ilgan}
                  </button>
                  {isEditing ? (
                    <button
                      onClick={() => handleDelete(profile.id)}
                      className="w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none shrink-0"
                      aria-label={`${profile.name || '이름 없음'} 삭제`}
                    >
                      ×
                    </button>
                  ) : (
                    <span className="text-muted text-xs shrink-0">
                      {expandedProfileId === profile.id ? '∧' : '∨'}
                    </span>
                  )}
                </div>
                {expandedProfileId === profile.id && (
                  isEditing ? (
                    <ProfileEditForm
                      profile={profile}
                      onSave={handleSaveEdit}
                      onCancel={() => setExpandedProfileId(null)}
                    />
                  ) : (
                    <div className="flex border-t border-border">
                      {(
                        [
                          { icon: '🔮', label: '사주', dest: 'saju' },
                          { icon: '💫', label: '운세', dest: 'fortune' },
                          { icon: '✨', label: '신년', dest: 'yearly' },
                          { icon: '💑', label: '궁합', dest: 'compat' },
                        ] as const
                      ).map(({ icon, label, dest }) => (
                        <button
                          key={label}
                          onClick={() => handleProfileNav(profile, dest)}
                          className="flex-1 py-2 flex flex-col items-center gap-0.5 hover:bg-card transition-colors"
                        >
                          <span className="text-sm">{icon}</span>
                          <span className="text-xs text-muted">{label}</span>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            ))}
            {!isEditing && (
              <Link
                href="/saju"
                className="bg-primary-gradient rounded-2xl px-3 py-2 text-xs text-white text-center"
              >
                + 새 프로필 추가
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 w-full">
        {CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-card-hover transition-colors"
          >
            <span className="text-2xl">{card.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">{card.title}</p>
              <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
            </div>
            <span className="text-muted">→</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
