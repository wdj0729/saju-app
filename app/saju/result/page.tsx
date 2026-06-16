import type { Metadata } from 'next';
import SajuResultLoader from './SajuResultLoader';

export const metadata: Metadata = {
  title: '사주 분석 결과',
  description: '나의 사주팔자 분석 결과를 확인하세요.',
};

export default function SajuResultPage() {
  return <SajuResultLoader />;
}
