'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { decodeSajuShare } from '@/lib/saju-share';
import { calculateSaju } from '@/lib/saju-calculator';
import { saveSession } from '@/lib/session';

function ShareLoader() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const d = params.get('d');
    if (!d) {
      router.replace('/saju');
      return;
    }
    const payload = decodeSajuShare(d);
    if (!payload) {
      router.replace('/saju');
      return;
    }
    try {
      const result = calculateSaju({
        year: payload.year,
        month: payload.month,
        day: payload.day,
        hour: payload.hour,
        isLunar: payload.isLunar,
      });
      saveSession({
        input: {
          name: payload.name ?? '',
          year: payload.year,
          month: payload.month,
          day: payload.day,
          hour: payload.hour,
          isLunar: payload.isLunar,
          gender: payload.gender,
        },
        result,
      });
      router.replace('/saju/result');
    } catch {
      router.replace('/saju');
    }
  }, [params, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-muted">사주 불러오는 중...</p>
    </div>
  );
}

export default function SajuSharePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted">불러오는 중...</p>
        </div>
      }
    >
      <ShareLoader />
    </Suspense>
  );
}
