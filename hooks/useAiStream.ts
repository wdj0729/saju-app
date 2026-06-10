'use client';

import { useEffect, useRef, useState } from 'react';

interface UseAiStreamReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiStream(): UseAiStreamReturn {
  const [aiText, setAiText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function request(url: string, body: unknown) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했습니다.');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiText((prev) => prev + decoder.decode(value, { stream: true }));
      }
      setAiText((prev) => prev + decoder.decode());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setAiText('');
      setAiError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsStreaming(false);
    }
  }

  return { aiText, isStreaming, aiError, request };
}
