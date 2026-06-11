import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 gap-6">
      <span className="text-4xl">🔮</span>
      <div className="text-center">
        <h1 className="text-lg font-semibold text-primary mb-2">페이지를 찾을 수 없어요</h1>
        <p className="text-sm text-muted">요청하신 페이지가 존재하지 않아요.</p>
      </div>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-2xl bg-primary-gradient text-white text-sm font-medium"
      >
        홈으로
      </Link>
    </main>
  );
}
