'use client';

import dynamic from 'next/dynamic';

const YearlyFortuneContent = dynamic(() => import('./YearlyFortuneContent'), {
  ssr: false,
});

export default function YearlyFortuneLoader() {
  return <YearlyFortuneContent />;
}
