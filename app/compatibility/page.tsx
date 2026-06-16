import type { Metadata } from 'next';
import CompatibilityLoader from './CompatibilityLoader';

export const metadata: Metadata = {
  title: '궁합 분석',
  description: '두 사람의 사주로 궁합을 분석합니다.',
};

export default function CompatibilityPage() {
  return <CompatibilityLoader />;
}
