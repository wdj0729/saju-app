'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { ILGAN_TEXT } from '@/lib/ilgan-text';
import SajuGrid from '@/components/SajuGrid';
import OhaengChart from '@/components/OhaengChart';
import type { SajuSession } from '@/lib/session';

export default function SajuResultPage() {
  const router = useRouter();
  const [session, setSession] = useState<SajuSession | null>(null);

  useEffect(() => {
    const data = loadSession();
    if (!data) {
      router.replace('/saju');
      return;
    }
    setSession(data);
  }, [router]);

  if (!session) return null;

  const { input, result } = session;
  const displayName = input.name ? `${input.name}의 사주` : '사주 결과';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/saju')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 다시 입력
        </button>
        <h1 className="text-sm font-semibold text-primary">{displayName}</h1>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        {/* 사주 4기둥 그리드 */}
        <SajuGrid
          year={result.year}
          month={result.month}
          day={result.day}
          hour={result.hour}
        />

        {/* 일간 기질 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">일간 {result.ilgan} · 기질</p>
          <p className="text-sm text-primary leading-relaxed">
            {ILGAN_TEXT[result.ilgan] ?? '기질 정보를 불러올 수 없습니다.'}
          </p>
        </div>

        {/* 오행 분포 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-4">오행 분포</p>
          <OhaengChart ohaeng={result.ohaeng} />
        </div>
      </div>

      {/* Phase 2 버튼 (비활성화) */}
      <div className="flex gap-3 px-4 pb-8">
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          운세 보기
        </button>
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          궁합 보기
        </button>
      </div>
    </div>
  );
}
