'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { makeMonthlyFortuneCacheKey, saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { FORTUNE_TEXT, type FortuneEntry } from '@/lib/fortune-text';
import {
  parseYearlySections,
  emptyYearlySections,
  YEARLY_SECTION_KEYS,
} from '@/hooks/useYearlySections';
import type { YearlySectionKey } from '@/hooks/useYearlySections';
import type { Pillar } from '@/lib/saju-calculator';
import type { Ohaeng } from '@/lib/saju-data';
import { getFortuneYear } from '@/lib/constants';

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
  ruleSummary: FortuneEntry['이달'] | null;
  sections: Record<YearlySectionKey, string>;
  activeSection: YearlySectionKey | null;
  isStreaming: boolean;
  aiError: string;
  hasCachedResult: boolean;
  requestAi: () => void;
}

const REVERSED_KEYS = [...YEARLY_SECTION_KEYS].reverse();

export function useMonthlyFortune(input: MonthlyFortuneInput): UseMonthlyFortuneReturn {
  const fortuneYear = getFortuneYear();
  const [selectedMonth, setSelectedMonthState] = useState<number>(new Date().getMonth() + 1);
  const [sections, setSections] = useState<Record<YearlySectionKey, string>>(emptyYearlySections());
  const [activeSection, setActiveSection] = useState<YearlySectionKey | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const [hasCachedResult, setHasCachedResult] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const rafRef = useRef<number | null>(null);

  const ruleSummary = FORTUNE_TEXT[input.ilgan]?.이달 ?? null;

  const loadCache = useCallback(
    (month: number) => {
      const key = makeMonthlyFortuneCacheKey(
        `${input.pillars.day.gan}${input.pillars.day.ji}`,
        input.pillars.hour ? `${input.pillars.hour.gan}${input.pillars.hour.ji}` : null,
        fortuneYear,
        month
      );
      const cached = loadAiCache(key);
      if (cached) {
        setSections(cached as Record<YearlySectionKey, string>);
        setHasCachedResult(true);
      } else {
        setSections(emptyYearlySections());
        setHasCachedResult(false);
      }
      setAiError('');
    },
    [input.pillars.day, input.pillars.hour, fortuneYear]
  );

  useEffect(() => {
    loadCache(selectedMonth);
  }, [selectedMonth, loadCache]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function setSelectedMonth(m: number) {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsStreaming(false);
    setActiveSection(null);
    setSelectedMonthState(m);
  }

  async function requestAi() {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    textRef.current = '';
    setSections(emptyYearlySections());
    setActiveSection(null);
    setIsStreaming(true);
    setAiError('');
    setHasCachedResult(false);

    try {
      const res = await fetch('/api/monthly-fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ ...input, month: selectedMonth }),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했어요.');
      if (!res.body) throw new Error('Response body is missing');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textRef.current += decoder.decode(value, { stream: true });
        if (rafRef.current === null) {
          rafRef.current = requestAnimationFrame(() => {
            const parsed = parseYearlySections(textRef.current);
            setSections(parsed);
            const active = REVERSED_KEYS.find((k) => parsed[k].length > 0) ?? null;
            setActiveSection(active);
            rafRef.current = null;
          });
        }
      }

      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      const final = parseYearlySections(textRef.current);
      setSections(final);
      setActiveSection(null);
      setHasCachedResult(true);
      saveAiCache(
        makeMonthlyFortuneCacheKey(
          `${input.pillars.day.gan}${input.pillars.day.ji}`,
          input.pillars.hour ? `${input.pillars.hour.gan}${input.pillars.hour.ji}` : null,
          fortuneYear,
          selectedMonth
        ),
        final
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSections(emptyYearlySections());
      setActiveSection(null);
      setAiError(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setIsStreaming(false);
    }
  }

  return {
    selectedMonth,
    setSelectedMonth,
    ruleSummary,
    sections,
    activeSection,
    isStreaming,
    aiError,
    hasCachedResult,
    requestAi,
  };
}
