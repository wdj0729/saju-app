'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loadProfiles } from '@/lib/profiles';
import type { Profile } from '@/lib/profiles';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

interface SessionExpiredPageProps {
  redirectPath: string;
  redirectLabel?: string;
}

export default function SessionExpiredPage({
  redirectPath,
  redirectLabel = '다시 입력하기',
}: SessionExpiredPageProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    setProfiles(loadProfiles());
  }, []);

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
          gender: profile.gender ?? 'M',
        },
        result,
      });
      router.refresh();
    } catch {
      router.push(redirectPath);
    }
  }

  if (profiles.length > 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
        <span className="text-4xl" aria-hidden="true">
          🔮
        </span>
        <div className="text-center">
          <h1 className="text-base font-semibold text-primary mb-1">누구의 운세를 볼까요?</h1>
          <p className="text-sm text-muted">프로필을 선택하면 바로 볼 수 있어요</p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-2">
          {profiles.map((profile, i) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile)}
              className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                i === 0
                  ? 'bg-primary-gradient text-white'
                  : 'bg-card hover:bg-card-hover'
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                🔮
              </span>
              <div className="flex-1">
                <p
                  className={`text-sm font-semibold ${
                    i === 0 ? 'text-white' : 'text-primary'
                  }`}
                >
                  {profile.name || '이름 없음'}
                </p>
                <p className={`text-xs ${i === 0 ? 'text-white/70' : 'text-muted'}`}>
                  {profile.ilgan} 일간
                </p>
              </div>
              <span
                className={`text-sm ${i === 0 ? 'text-white/60' : 'text-muted'}`}
                aria-hidden="true"
              >
                →
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <Link
          href={redirectPath}
          className="text-sm text-primary/70 hover:text-primary transition-colors"
        >
          {redirectLabel}
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
      <span className="text-4xl" aria-hidden="true">
        🔮
      </span>
      <h1 className="text-base font-semibold text-primary">세션이 만료됐어요</h1>
      <p className="text-sm text-muted leading-relaxed">
        생년월일을 다시 입력하면
        <br />
        결과를 볼 수 있어요
      </p>
      <Link
        href={redirectPath}
        className="mt-2 px-6 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-semibold"
      >
        {redirectLabel}
      </Link>
    </main>
  );
}
