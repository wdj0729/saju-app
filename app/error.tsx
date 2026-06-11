'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <span className="text-4xl">⚠️</span>
      <div className="text-center">
        <h1 className="text-lg font-semibold text-primary mb-2">오류가 발생했어요</h1>
        <p className="text-sm text-muted">잠시 후 다시 시도해 보세요.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-2xl bg-primary-gradient text-white text-sm font-medium"
        >
          다시 시도하기
        </button>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2.5 rounded-2xl bg-card text-muted text-sm font-medium hover:bg-card-hover transition-colors"
        >
          홈으로
        </button>
      </div>
    </main>
  );
}
