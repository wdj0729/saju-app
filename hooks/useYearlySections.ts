'use client';

import { useEffect, useRef, useState } from 'react';

export type YearlySectionKey = '총운' | '직업운' | '재물운' | '건강운' | '연애운';
export const YEARLY_SECTION_KEYS: YearlySectionKey[] = [
  '총운',
  '직업운',
  '재물운',
  '건강운',
  '연애운',
];
const REVERSED_YEARLY_SECTION_KEYS = [...YEARLY_SECTION_KEYS].reverse();

export function emptyYearlySections(): Record<YearlySectionKey, string> {
  return { 총운: '', 직업운: '', 재물운: '', 건강운: '', 연애운: '' };
}

export function parseYearlySections(text: string): Record<YearlySectionKey, string> {
  const result = emptyYearlySections();
  const markerRegex = /\[(총운|직업운|재물운|건강운|연애운)\]/g;
  let match: RegExpExecArray | null;
  let lastKey: YearlySectionKey | null = null;
  let lastIndex = 0;

  while ((match = markerRegex.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as YearlySectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}

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
