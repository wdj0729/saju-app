'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string,
  onLoaded?: (session: T) => void
): T | null {
  const router = useRouter();
  const [session, setSession] = useState<T | null>(null);
  const loaderRef = useRef(loader);
  const onLoadedRef = useRef(onLoaded);
  loaderRef.current = loader;
  onLoadedRef.current = onLoaded;

  useEffect(() => {
    const s = loaderRef.current();
    if (!s) {
      router.replace(redirectPath);
      return;
    }
    setSession(s);
    onLoadedRef.current?.(s);
  }, [router, redirectPath]);

  return session;
}
