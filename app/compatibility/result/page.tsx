'use client';
import dynamic from 'next/dynamic';

const CompatibilityResultContent = dynamic(() => import('./CompatibilityResultContent'), {
  ssr: false,
});

export default function CompatibilityResultPage() {
  return <CompatibilityResultContent />;
}
