import type { Metadata } from 'next';
import GroupResultLoader from './GroupResultLoader';

export const metadata: Metadata = {
  title: '모임 궁합 결과',
  description: '모임 구성원들의 사주 궁합 분석 결과입니다.',
};

export default function GroupResultPage() {
  return <GroupResultLoader />;
}
