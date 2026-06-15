'use client';

import { useEffect, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { parseSections, emptySections, SECTION_KEYS } from '@/lib/saju-sections';
import { useStreamingRequest } from './useStreamingRequest';

export type { SectionKey } from '@/lib/saju-sections';
export { SECTION_KEYS, emptySections, parseSections } from '@/lib/saju-sections';

import type { SectionKey } from '@/lib/saju-sections';

const REVERSED_SECTION_KEYS = [...SECTION_KEYS].reverse();

interface UseAiSectionsReturn {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiSections(cacheKey?: string): UseAiSectionsReturn {
  const [sections, setSections] = useState<Record<SectionKey, string>>(() => {
    if (!cacheKey) return emptySections();
    const cached = loadAiCache(cacheKey);
    if (!cached) return emptySections();
    return cached as Record<SectionKey, string>;
  });
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!cacheKey) return;
    const cached = loadAiCache(cacheKey);
    if (cached) setSections(cached as Record<SectionKey, string>);
  }, [cacheKey]);

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setSections(emptySections());
      setActiveSection(null);
      setAiError('');
    },
    onChunk: (text) => {
      const parsed = parseSections(text);
      setSections(parsed);
      setActiveSection(REVERSED_SECTION_KEYS.find((k) => parsed[k].length > 0) ?? null);
    },
    onComplete: (text) => {
      const finalSections = parseSections(text);
      if (cacheKey) saveAiCache(cacheKey, finalSections);
      setSections(finalSections);
      setActiveSection(null);
    },
    onError: (msg) => {
      setSections(emptySections());
      setActiveSection(null);
      setAiError(msg);
    },
  });

  return { sections, activeSection, isStreaming, aiError, request };
}
