'use client';

import { useEffect } from 'react';

const DEFAULT_TITLE = '사주팔자';

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    if (!title) return;
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
