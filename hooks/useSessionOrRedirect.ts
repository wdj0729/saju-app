'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string | null,
  onLoaded?: (session: T) => void
): T | null | 'not-found' {
  const router = useRouter();
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  const [session, setSession] = useState<T | null | 'not-found'>(null);

  useEffect(() => {
    const s = loader();
    if (!s) {
      if (redirectPath === null) {
        setSession('not-found');
      } else {
        router.replace(redirectPath);
      }
      return;
    }
    setSession(s);
    onLoadedRef.current?.(s);
  }, [loader, router, redirectPath]);

  return session;
}
