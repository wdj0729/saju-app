'use client';
import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function CompatibilityResultSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-3">
          <SkeletonBox className="h-4 w-28" />
          <SkeletonBox className="h-16 w-24" />
          <SkeletonBox className="h-4 w-20" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
          <SkeletonBox className="h-3 w-20" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <SkeletonBox className="flex-1 h-3" />
              <SkeletonBox className="h-3 w-4 shrink-0" />
              <SkeletonBox className="flex-1 h-3" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-10 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex gap-3 px-4 pb-8">
        <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        <SkeletonBox className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  );
}

const CompatibilityResultContent = dynamic(() => import('./CompatibilityResultContent'), {
  ssr: false,
  loading: () => <CompatibilityResultSkeleton />,
});

export default function CompatibilityResultPage() {
  return <CompatibilityResultContent />;
}
