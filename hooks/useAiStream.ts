'use client';

import { useState } from 'react';
import { useStreamingRequest } from './useStreamingRequest';

interface UseAiStreamReturn {
  aiText: string;
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}

export function useAiStream(): UseAiStreamReturn {
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState('');

  const { isStreaming, request } = useStreamingRequest({
    onStart: () => {
      setAiText('');
      setAiError('');
    },
    onChunk: (text) => setAiText(text),
    onComplete: (text) => setAiText(text),
    onError: (msg) => {
      setAiText('');
      setAiError(msg);
    },
  });

  return { aiText, isStreaming, aiError, request };
}
