import { Suspense } from 'react';
import type { Metadata } from 'next';
import InviteLoader from './InviteLoader';
import { SkeletonBox } from '@/components/Skeleton';

export const metadata: Metadata = {
  title: '궁합 초대',
  description: '궁합 분석 초대를 받았습니다. 내 정보를 입력해 궁합을 확인하세요.',
};

function InviteSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-24" />
      </header>
      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<InviteSkeleton />}>
      <InviteLoader />
    </Suspense>
  );
}
