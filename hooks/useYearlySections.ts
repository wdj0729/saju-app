'use client';

import {
  parseYearlySections,
  emptyYearlySections,
  YEARLY_SECTION_KEYS,
} from '@/lib/yearly-sections';
import { useSections } from './useSections';

export type { YearlySectionKey } from '@/lib/yearly-sections';
export {
  YEARLY_SECTION_KEYS,
  emptyYearlySections,
  parseYearlySections,
} from '@/lib/yearly-sections';

export function useYearlySections() {
  return useSections(YEARLY_SECTION_KEYS, parseYearlySections, emptyYearlySections);
}
