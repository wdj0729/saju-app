'use client';

import dynamic from 'next/dynamic';
import { GroupResultSkeleton } from './GroupResultSkeleton';

const GroupResultContent = dynamic(() => import('./GroupResultContent'), {
  ssr: false,
  loading: () => <GroupResultSkeleton />,
});

export default function GroupResultLoader() {
  return <GroupResultContent />;
}
