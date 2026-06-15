import type { Metadata } from 'next';
import SajuLoader from './SajuLoader';

export const metadata: Metadata = {
  title: '사주 분석',
  description: '생년월일시를 입력하면 AI가 사주팔자를 분석합니다.',
};

export default function SajuInputPage() {
  return <SajuLoader />;
}
