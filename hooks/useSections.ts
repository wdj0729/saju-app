'use client';

import { useEffect, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { useStreamingRequest } from './useStreamingRequest';

interface UseSectionsReturn<K extends string> {
  sections: Record<K, string>;
  activeSection: K | null;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useSections<K extends string>(
  keys: readonly K[],
  parse: (text: string) => Record<K, string>,
  empty: () => Record<K, string>,
  cacheKey?: string
): UseSectionsReturn<K> {
  const reversedKeys = [...keys].reverse() as K[];

  const [sections, setSections] = useState<Record<K, string>>(() => {
    if (!cacheKey) return empty();
    const cached = loadAiCache(cacheKey);
    return cached ? (cached as Record<K, string>) : empty();
  });
  const [activeSection, setActiveSection] = useState<K | null>(null);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!cacheKey) return;
    const cached = loadAiCache(cacheKey);
    if (cached) setSections(cached as Record<K, string>);
  }, [cacheKey]);

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setSections(empty());
      setActiveSection(null);
      setAiError('');
    },
    onChunk: (text) => {
      const parsed = parse(text);
      setSections(parsed);
      setActiveSection(reversedKeys.find((k) => parsed[k].length > 0) ?? null);
    },
    onComplete: (text) => {
      const final = parse(text);
      if (cacheKey) saveAiCache(cacheKey, final);
      setSections(final);
      setActiveSection(null);
    },
    onError: (msg) => {
      setActiveSection(null);
      setAiError(msg);
    },
  });

  return { sections, activeSection, isStreaming, aiError, request };
}
