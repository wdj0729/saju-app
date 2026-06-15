'use client';

import { useEffect, useRef, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';

export type SectionKey = '성격분석' | '재물운' | '건강운' | '연애운' | '직업운';
export const SECTION_KEYS: SectionKey[] = ['성격분석', '재물운', '건강운', '연애운', '직업운'];
const REVERSED_SECTION_KEYS = [...SECTION_KEYS].reverse();

export function emptySections(): Record<SectionKey, string> {
  return { 성격분석: '', 재물운: '', 건강운: '', 연애운: '', 직업운: '' };
}

const SECTION_MARKER_RE = /\[(성격분석|재물운|건강운|연애운|직업운)\]/g;

export function parseSections(text: string): Record<SectionKey, string> {
  SECTION_MARKER_RE.lastIndex = 0;
  const result = emptySections();
  let match: RegExpExecArray | null;
  let lastKey: SectionKey | null = null;
  let lastIndex = 0;

  while ((match = SECTION_MARKER_RE.exec(text)) !== null) {
    if (lastKey !== null) {
      result[lastKey] = text.slice(lastIndex, match.index).trim();
    }
    lastKey = match[1] as SectionKey;
    lastIndex = match.index + match[0].length;
  }

  if (lastKey !== null) {
    result[lastKey] = text.slice(lastIndex).trim();
  }

  return result;
}

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

  useEffect(() => {
    if (!cacheKey) return;
    const cached = loadAiCache(cacheKey);
    if (cached) setSections(cached as Record<SectionKey, string>);
  }, [cacheKey]);

  async function request(url: string, body: unknown) {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    textRef.current = '';
    setSections(emptySections());
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
            const parsed = parseSections(textRef.current);
            setSections(parsed);
            const active = REVERSED_SECTION_KEYS.find((k) => parsed[k].length > 0) ?? null;
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
      const finalSections = parseSections(textRef.current);
      if (cacheKey) saveAiCache(cacheKey, finalSections);
      setSections(finalSections);
      setActiveSection(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setSections(emptySections());
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
