'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateSaju } from '@/lib/saju-calculator';
import { calcGroupCompatibility, saveGroupCompatSession } from '@/lib/group-compatibility';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import BackButton from '@/components/BackButton';
import PersonInputFields from '@/components/PersonInputFields';
import CompatibilityTabs from '@/components/CompatibilityTabs';

interface MemberForm {
  id: string;
  name: string;
  gender: 'M' | 'F';
  isLunar: boolean;
  year: number;
  month: number;
  day: number;
  hour: number | null;
}

function defaultMember(): MemberForm {
  return {
    id: crypto.randomUUID(),
    name: '',
    gender: 'M',
    isLunar: false,
    year: new Date().getFullYear() - 30,
    month: 1,
    day: 1,
    hour: null,
  };
}

function updateMember(members: MemberForm[], index: number, patch: Partial<MemberForm>): MemberForm[] {
  return members.map((m, i) => (i === index ? { ...m, ...patch } : m));
}

export default function GroupCompatibilityLoader() {
  const router = useRouter();
  const [members, setMembers] = useState<MemberForm[]>([defaultMember(), defaultMember()]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

  function addMember() {
    if (members.length >= 10) return;
    setMembers((prev) => [...prev, defaultMember()]);
  }

  function removeMember(index: number) {
    if (members.length <= 2) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function loadProfile(index: number, profile: Profile) {
    setMembers((prev) =>
      updateMember(prev, index, {
        name: profile.name,
        year: profile.year,
        month: profile.month,
        day: profile.day,
        hour: profile.hour,
        isLunar: profile.isLunar,
        gender: profile.gender,
      })
    );
  }

  function handleSubmit() {
    setError('');
    try {
      const groupMembers = members.map((m) => {
        const maxDay = m.isLunar ? 30 : new Date(m.year, m.month, 0).getDate();
        const day = Math.min(m.day, maxDay);
        const result = calculateSaju({ year: m.year, month: m.month, day, hour: m.hour, isLunar: m.isLunar });
        return { name: m.name, gender: m.gender, result };
      });
      const { pairs, averageScore } = calcGroupCompatibility(groupMembers);
      saveGroupCompatSession({ members: groupMembers, pairs, averageScore });
      router.push('/compatibility/group/result');
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

      <CompatibilityTabs />

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {members.map((m, index) => (
          <div key={m.id} className="relative">
            <PersonInputFields
              label={`👤 ${index + 1}번째 인물`}
              profileChips={
                profiles.length > 0 ? (
                  <div>
                    <p className="text-xs text-muted mb-1.5">저장된 프로필 불러오기</p>
                    <div className="flex flex-wrap gap-2">
                      {profiles.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => loadProfile(index, profile)}
                          className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary"
                        >
                          {profile.name || '이름 없음'} · {profile.ilgan}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : undefined
              }
              name={m.name}
              onNameChange={(v) => setMembers((prev) => updateMember(prev, index, { name: v }))}
              gender={m.gender}
              onGenderChange={(v) => setMembers((prev) => updateMember(prev, index, { gender: v }))}
              isLunar={m.isLunar}
              onIsLunarChange={(v) => setMembers((prev) => updateMember(prev, index, { isLunar: v }))}
              year={m.year}
              month={m.month}
              day={m.day}
              maxDay={m.isLunar ? 30 : new Date(m.year, m.month, 0).getDate()}
              onYearChange={(v) => setMembers((prev) => updateMember(prev, index, { year: v }))}
              onMonthChange={(v) => setMembers((prev) => updateMember(prev, index, { month: v }))}
              onDayChange={(v) => setMembers((prev) => updateMember(prev, index, { day: v }))}
              hourValue={m.hour}
              onHourChange={(v) => setMembers((prev) => updateMember(prev, index, { hour: v }))}
              showOptionalHints
              namePlaceholder={`${index + 1}번째 이름 (선택)`}
              compact
            />
            {members.length > 2 && (
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="absolute top-3 right-3 text-xs text-muted hover:text-hwa transition-colors"
                aria-label={`${index + 1}번째 인물 삭제`}
              >
                삭제
              </button>
            )}
          </div>
        ))}

        {error && <p className="text-sm text-hwa text-center">{error}</p>}
      </div>

      <div className="px-4 pb-8 flex flex-col gap-3">
        {members.length < 10 && (
          <button
            type="button"
            onClick={addMember}
            className="w-full py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-muted hover:text-primary hover:border-primary transition-colors"
          >
            + 인원 추가 ({members.length}/10)
          </button>
        )}
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl bg-primary-gradient text-white font-semibold text-sm"
        >
          모임 궁합 분석하기
        </button>
      </div>
    </div>
  );
}
