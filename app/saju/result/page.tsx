'use client';
import dynamic from 'next/dynamic';

const SajuResultContent = dynamic(() => import('./SajuResultContent'), { ssr: false });

export default function SajuResultPage() {
  return <SajuResultContent />;
}
