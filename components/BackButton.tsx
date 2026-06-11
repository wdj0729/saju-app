'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href: string;
  label: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className="text-muted text-sm hover:text-primary transition-colors"
    >
      ← {label}
    </button>
  );
}
