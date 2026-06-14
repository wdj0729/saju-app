'use client';
import dynamic from 'next/dynamic';
import { SkeletonBox } from '@/components/Skeleton';

function FortuneSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-28" />
      </header>
      <div className="flex border-b border-border">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 py-3 flex justify-center">
            <SkeletonBox className="h-4 w-8" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-32" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-3/4" />
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

const FortuneContent = dynamic(() => import('./FortuneContent'), {
  ssr: false,
  loading: () => <FortuneSkeleton />,
});

export default function FortunePage() {
  return <FortuneContent />;
}
