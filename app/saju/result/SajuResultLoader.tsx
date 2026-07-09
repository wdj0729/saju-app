'use client';

import dynamic from 'next/dynamic';
import { SajuResultSkeleton } from './SajuResultSkeleton';

const SajuResultContent = dynamic(() => import('./SajuResultContent'), {
  ssr: false,
  loading: () => <SajuResultSkeleton />,
});

export default function SajuResultLoader() {
  return <SajuResultContent />;
}
