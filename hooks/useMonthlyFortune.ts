'use client';

import { useEffect, useState, useCallback } from 'react';
import { makeMonthlyFortuneCacheKey, saveAiCache, loadAiCache } from '@/lib/ai-cache';
import {
  parseYearlySections,
  emptyYearlySections,
  YEARLY_SECTION_KEYS,
} from '@/lib/yearly-sections';
import type { YearlySectionKey } from '@/lib/yearly-sections';
import type { Pillar } from '@/lib/saju-calculator';
import type { Ohaeng } from '@/lib/saju-data';
import { getFortuneYear } from '@/lib/constants';
import { useStreamingRequest } from './useStreamingRequest';

export interface MonthlyFortuneInput {
  ilgan: string;
  ohaeng: Record<Ohaeng, number>;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  name?: string;
  gender?: 'M' | 'F';
}

export interface UseMonthlyFortuneReturn {
  selectedMonth: number;
  setSelectedMonth: (m: number) => void;
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  hasCachedResult: boolean;
  requestAi: () => void;
}

export function useMonthlyFortune(input: MonthlyFortuneInput): UseMonthlyFortuneReturn {
  const fortuneYear = getFortuneYear();
  const [selectedMonth, setSelectedMonthState] = useState<number>(new Date().getMonth() + 1);
  const [sections, setSections] = useState<Record<YearlySectionKey, string>>(emptyYearlySections());
  const [activeSection, setActiveSection] = useState<YearlySectionKey | null>(null);
  const [aiError, setAiError] = useState('');
  const [hasCachedResult, setHasCachedResult] = useState(false);

  const REVERSED_KEYS = [...YEARLY_SECTION_KEYS].reverse();

  const makeCacheKey = useCallback(
    (month: number) =>
      makeMonthlyFortuneCacheKey(
        `${input.pillars.day.gan}${input.pillars.day.ji}`,
        input.pillars.hour ? `${input.pillars.hour.gan}${input.pillars.hour.ji}` : null,
        fortuneYear,
        month
      ),
    [input.pillars.day, input.pillars.hour, fortuneYear]
  );

  const loadCache = useCallback(
    (month: number) => {
      const cached = loadAiCache(makeCacheKey(month));
      if (cached) {
        const validated = YEARLY_SECTION_KEYS.reduce(
          (acc, k) => {
            acc[k] = typeof cached[k] === 'string' ? cached[k] : '';
            return acc;
          },
          {} as Record<YearlySectionKey, string>
        );
        setSections(validated);
        setHasCachedResult(true);
      } else {
        setSections(emptyYearlySections());
        setHasCachedResult(false);
      }
      setAiError('');
    },
    [makeCacheKey]
  );

  useEffect(() => {
    loadCache(selectedMonth);
  }, [selectedMonth, loadCache]);

  const { isStreaming, request, abort } = useStreamingRequest({
    onStart: () => {
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError('');
      setHasCachedResult(false);
    },
    onChunk: (text) => {
      const parsed = parseYearlySections(text);
      setSections(parsed);
      setActiveSection(REVERSED_KEYS.find((k) => parsed[k].length > 0) ?? null);
    },
    onComplete: (text) => {
      const final = parseYearlySections(text);
      setSections(final);
      setActiveSection(null);
      setHasCachedResult(true);
      saveAiCache(makeCacheKey(selectedMonth), final);
    },
    onError: (msg) => {
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError(msg);
    },
  });

  function setSelectedMonth(m: number) {
    abort();
    setActiveSection(null);
    setSelectedMonthState(m);
  }

  function requestAi() {
    request('/api/monthly-fortune', { ...input, month: selectedMonth });
  }

  return {
    selectedMonth,
    setSelectedMonth,
    sections,
    activeSection,
    isStreaming,
    aiError,
    hasCachedResult,
    requestAi,
  };
}
