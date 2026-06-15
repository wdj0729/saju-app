import type { Metadata } from 'next';
import CompatibilityResultLoader from './CompatibilityResultLoader';

export const metadata: Metadata = {
  title: '궁합 분석 결과',
  description: '두 사람의 궁합 분석 결과를 확인하세요.',
};

export default function CompatibilityResultPage() {
  return <CompatibilityResultLoader />;
}
