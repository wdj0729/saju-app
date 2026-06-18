'use client';

import { parseSections, emptySections, SECTION_KEYS } from '@/lib/saju-sections';
import { useSections } from './useSections';

export type { SectionKey } from '@/lib/saju-sections';
export { SECTION_KEYS, emptySections, parseSections } from '@/lib/saju-sections';

export function useAiSections(cacheKey?: string) {
  return useSections(SECTION_KEYS, parseSections, emptySections, cacheKey);
}
