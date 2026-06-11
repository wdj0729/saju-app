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
  onLoadedRef.current = onLoaded;

  const [session] = useState<T | null>(() => loader());

  useEffect(() => {
    if (!session) {
      router.replace(redirectPath);
      return;
    }
    onLoadedRef.current?.(session);
  }, [session, router, redirectPath]);

  return session;
}
