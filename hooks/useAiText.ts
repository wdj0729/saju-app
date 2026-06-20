'use client';

import { useEffect, useState } from 'react';
import { saveAiCache, loadAiCache } from '@/lib/ai-cache';
import { useStreamingRequest } from './useStreamingRequest';

interface UseAiTextReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiText(cacheKey?: string): UseAiTextReturn {
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!cacheKey) return;
    const cached = loadAiCache(cacheKey);
    if (cached?.ai) setAiText(cached.ai as string);
  }, [cacheKey]);

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setAiText('');
      setAiError('');
    },
    onChunk: (text) => setAiText(text),
    onComplete: (text) => {
      setAiText(text);
      if (cacheKey) saveAiCache(cacheKey, { ai: text });
    },
    onError: (msg) => {
      setAiError(msg);
    },
  });

  return { aiText, isStreaming, aiError, request };
}
