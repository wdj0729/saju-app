import { parseSectionsByKeys } from './saju-sections';

export type YearlySectionKey = '총운' | '직업운' | '재물운' | '건강운' | '연애운';
export const YEARLY_SECTION_KEYS: YearlySectionKey[] = [
  '총운',
  '직업운',
  '재물운',
  '건강운',
  '연애운',
];

export function emptyYearlySections(): Record<YearlySectionKey, string> {
  return { 총운: '', 직업운: '', 재물운: '', 건강운: '', 연애운: '' };
}

export function parseYearlySections(text: string): Record<YearlySectionKey, string> {
  return parseSectionsByKeys(text, YEARLY_SECTION_KEYS);
}
