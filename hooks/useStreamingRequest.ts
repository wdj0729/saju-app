'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface StreamingRequestOptions {
  onStart: () => void;
  onChunk: (rawText: string) => void;
  onComplete: (rawText: string) => void;
  onError: (message: string) => void;
}

interface UseStreamingRequestReturn {
  isStreaming: boolean;
  request: (url: string, body: unknown) => Promise<void>;
  abort: () => void;
}

export function useStreamingRequest(options: StreamingRequestOptions): UseStreamingRequestReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function abort() {
    abortRef.current?.abort();
    abortRef.current = null;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsStreaming(false);
  }

  async function request(url: string, body: unknown) {
    abortRef.current?.abort();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    textRef.current = '';
    optionsRef.current.onStart();
    setIsStreaming(true);

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
            optionsRef.current.onChunk(textRef.current);
            rafRef.current = null;
          });
        }
      }

      textRef.current += decoder.decode();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      optionsRef.current.onComplete(textRef.current);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      optionsRef.current.onError(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Guard against racing a subsequent request() call that already set isStreaming=true
      if (abortRef.current === controller) {
        setIsStreaming(false);
      }
    }
  }

  return { isStreaming, request, abort };
}
