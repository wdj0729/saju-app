'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadProfiles, deleteProfile } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
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
] as const;

export default function Home() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(() => loadProfiles());
  const [isEditing, setIsEditing] = useState(false);

  function handleProfileSelect(profile: Profile) {
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
        },
        result,
      });
      router.push('/saju/result');
    } catch {
      router.push('/saju');
    }
  }

  function handleDelete(id: string) {
    deleteProfile(id);
    setProfiles(prev => prev.filter(p => p.id !== id));
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
              onClick={() => setIsEditing(!isEditing)}
              className={`text-xs transition-colors ${isEditing ? 'text-hwa' : 'text-primary'}`}
            >
              {isEditing ? '완료' : '편집'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="relative inline-flex items-center">
                <button
                  onClick={() => handleProfileSelect(profile)}
                  disabled={isEditing}
                  className="bg-card-hover rounded-full px-3 py-1.5 text-xs text-primary disabled:cursor-default"
                >
                  🔮 {profile.name || '이름 없음'}
                </button>
                {isEditing && (
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-hwa rounded-full text-white text-xs flex items-center justify-center leading-none"
                    aria-label={`${profile.name} 삭제`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {!isEditing && (
              <Link
                href="/saju"
                className="bg-primary-gradient rounded-full px-3 py-1.5 text-xs text-white"
              >
                + 추가
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
