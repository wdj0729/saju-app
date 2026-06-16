import type { Metadata } from 'next';
import { getFortuneYear } from '@/lib/constants';
import YearlyFortuneContent from './YearlyFortuneContent';

const year = getFortuneYear();

export const metadata: Metadata = {
  title: `${year} 신년운세`,
  description: `${year}년 총운·직업·재물·건강·연애 신년운세.`,
};

export default function YearlyFortunePage() {
  return <YearlyFortuneContent />;
}
