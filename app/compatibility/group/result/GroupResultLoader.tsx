'use client';

import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function GroupResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1 items-center">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-64 w-64 rounded-full" />
        <SkeletonBox className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

const GroupResultContent = dynamic(() => import('./GroupResultContent'), {
  ssr: false,
  loading: () => <GroupResultSkeleton />,
});

export default function GroupResultLoader() {
  return <GroupResultContent />;
}
