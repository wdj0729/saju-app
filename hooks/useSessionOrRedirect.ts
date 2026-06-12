'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useSessionOrRedirect<T>(
  loader: () => T | null,
  redirectPath: string,
  onLoaded?: (session: T) => void
): T | null {
  const router = useRouter();
  const onLoadedRef = useRef(onLoaded);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  });

  const [session, setSession] = useState<T | null>(null);

  useEffect(() => {
    const s = loader();
    if (!s) {
      router.replace(redirectPath);
      return;
    }
    setSession(s);
    onLoadedRef.current?.(s);
  }, [loader, router, redirectPath]);

  return session;
}
