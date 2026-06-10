'use client';
import dynamic from 'next/dynamic';

const FortuneContent = dynamic(() => import('./FortuneContent'), { ssr: false });

export default function FortunePage() {
  return <FortuneContent />;
}
