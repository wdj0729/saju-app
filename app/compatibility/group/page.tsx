import type { Metadata } from 'next';
import GroupCompatibilityLoader from './GroupCompatibilityLoader';

export const metadata: Metadata = {
  title: '모임 궁합 분석',
  description: '여러 사람의 사주로 모임 궁합을 분석합니다.',
};

export default function GroupCompatibilityPage() {
  return <GroupCompatibilityLoader />;
}
