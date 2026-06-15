'use client';

import { useState } from 'react';
import { parseYearlySections, emptyYearlySections, YEARLY_SECTION_KEYS } from '@/lib/yearly-sections';
import { useStreamingRequest } from './useStreamingRequest';

export type { YearlySectionKey } from '@/lib/yearly-sections';
export { YEARLY_SECTION_KEYS, emptyYearlySections, parseYearlySections } from '@/lib/yearly-sections';

import type { YearlySectionKey } from '@/lib/yearly-sections';

const REVERSED_YEARLY_SECTION_KEYS = [...YEARLY_SECTION_KEYS].reverse();

interface UseYearlySectionsReturn {
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useYearlySections(): UseYearlySectionsReturn {
  const [sections, setSections] = useState<Record<YearlySectionKey, string>>(emptyYearlySections());
  const [activeSection, setActiveSection] = useState<YearlySectionKey | null>(null);
  const [aiError, setAiError] = useState('');

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError('');
    },
    onChunk: (text) => {
      const parsed = parseYearlySections(text);
      setSections(parsed);
      setActiveSection(REVERSED_YEARLY_SECTION_KEYS.find((k) => parsed[k].length > 0) ?? null);
    },
    onComplete: (text) => {
      setSections(parseYearlySections(text));
      setActiveSection(null);
    },
    onError: (msg) => {
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError(msg);
    },
  });

  return { sections, activeSection, isStreaming, aiError, request };
}
