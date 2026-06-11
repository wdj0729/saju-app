'use client';
import dynamic from 'next/dynamic';

const FortuneContent = dynamic(() => import('./FortuneContent'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted">불러오는 중...</p>
    </div>
  ),
});

export default function FortunePage() {
  return <FortuneContent />;
}
