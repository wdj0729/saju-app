'use client';

import Link from 'next/link';

interface SessionExpiredPageProps {
  redirectPath: string;
  redirectLabel?: string;
}

export default function SessionExpiredPage({
  redirectPath,
  redirectLabel = '다시 입력하기',
}: SessionExpiredPageProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-4">
      <span className="text-4xl">🔮</span>
      <h2 className="text-base font-semibold text-primary">세션이 만료됐어요</h2>
      <p className="text-sm text-muted leading-relaxed">
        생년월일을 다시 입력하면
        <br />
        결과를 볼 수 있어요
      </p>
      <Link
        href={redirectPath}
        className="mt-2 px-6 py-3 rounded-2xl bg-primary-gradient text-white text-sm font-semibold"
      >
        {redirectLabel}
      </Link>
    </main>
  );
}
