import { SkeletonBox, SkeletonHeader } from '@/components/Skeleton';

export function GroupResultSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <SkeletonHeader titleWidth="w-24" />
      <div className="flex flex-col gap-4 px-4 py-6 flex-1 items-center">
        <SkeletonBox className="h-6 w-40" />
        <SkeletonBox className="h-64 w-64 rounded-full" />
        <SkeletonBox className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
