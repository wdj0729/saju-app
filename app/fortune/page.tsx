import type { Metadata } from 'next';
import FortuneLoader from './FortuneLoader';

export const metadata: Metadata = {
  title: '오늘 운세',
  description: '일간별 오늘의 맞춤 운세를 확인하세요.',
};

export default function FortunePage() {
  return <FortuneLoader />;
}
