import { SkeletonBox, SkeletonHeader } from '@/components/Skeleton';

export function SajuResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <SkeletonHeader titleWidth="w-24" />
      <div className="flex flex-col gap-6 px-4 py-6 flex-1">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonBox className="h-10 w-full" />
              <SkeletonBox className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-24" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-4 w-4/5" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-32 w-full" />
        </div>
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-2">
          <SkeletonBox className="h-3 w-20" />
          <SkeletonBox className="h-24 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 pb-8">
        <div className="flex gap-3">
          <SkeletonBox className="flex-1 h-12 rounded-2xl" />
          <SkeletonBox className="flex-1 h-12 rounded-2xl" />
        </div>
        <div className="flex gap-3">
          <SkeletonBox className="flex-1 h-12 rounded-2xl" />
          <SkeletonBox className="h-12 w-12 rounded-2xl" />
          <SkeletonBox className="h-12 w-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
