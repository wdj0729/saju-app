'use client';
import dynamic from 'next/dynamic';

const SajuResultContent = dynamic(() => import('./SajuResultContent'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted">불러오는 중...</p>
    </div>
  ),
});

export default function SajuResultPage() {
  return <SajuResultContent />;
}
