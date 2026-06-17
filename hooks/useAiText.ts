'use client';

import { useEffect, useRef, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { useStreamingRequest } from './useStreamingRequest';

interface UseAiTextReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiText(cacheKey?: string): UseAiTextReturn {
  const [aiText, setAiText] = useState<string>(() => {
    if (!cacheKey || typeof window === 'undefined') return '';
    const cached = loadAiCache(cacheKey);
    return (cached?.ai as string) ?? '';
  });
  const [aiError, setAiError] = useState('');
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;

  useEffect(() => {
    if (!cacheKey || aiText) return; // 이미 텍스트가 있으면 스킵
    const cached = loadAiCache(cacheKey);
    if (cached?.ai) setAiText(cached.ai as string);
  }, [cacheKey]); // aiText는 의존성에서 제외 (한 번만 체크)

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setAiText('');
      setAiError('');
    },
    onChunk: (text) => setAiText(text),
    onComplete: (text) => {
      setAiText(text);
      if (cacheKeyRef.current) saveAiCache(cacheKeyRef.current, { ai: text });
    },
    onError: (msg) => {
      setAiText('');
      setAiError(msg);
    },
  });

  return { aiText, isStreaming, aiError, request };
}
