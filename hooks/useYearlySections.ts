'use client';

import { useEffect, useRef, useState } from 'react';
import { parseYearlySections, emptyYearlySections, YEARLY_SECTION_KEYS } from '@/lib/yearly-sections';

import type { YearlySectionKey } from '@/lib/yearly-sections';

export type { YearlySectionKey };
export { YEARLY_SECTION_KEYS, emptyYearlySections, parseYearlySections } from '@/lib/yearly-sections';

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
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function request(url: string, body: unknown) {
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

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
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
            const active = REVERSED_YEARLY_SECTION_KEYS.find((k) => parsed[k].length > 0) ?? null;
            setActiveSection(active);
            rafRef.current = null;
          });
        }
      }

      // flush any remaining bytes held in the decoder's internal buffer
      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setSections(parseYearlySections(textRef.current));
      setActiveSection(null);
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

  return { sections, activeSection, isStreaming, aiError, request };
}
