import Link from 'next/link';

const CARDS = [
  {
    emoji: '🔮',
    title: '내 사주 보기',
    subtitle: '생년월일시로 사주팔자 분석',
    href: '/saju',
    active: true,
  },
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
    active: true,
  },
  {
    emoji: '💑',
    title: '궁합 보기',
    subtitle: '두 사람의 사주 궁합 분석',
    href: '/compatibility',
    active: false,
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center mb-8">
        <span className="text-4xl mb-3">🔮</span>
        <h1 className="text-2xl font-bold text-primary">사주팔자</h1>
        <p className="text-sm text-muted mt-1">나의 운명을 살펴보세요</p>
      </div>

      <div className="flex flex-col gap-3 w-full">
        {CARDS.map((card) =>
          card.active ? (
            <Link
              key={card.title}
              href={card.href}
              className="bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-card-hover transition-colors"
            >
              <span className="text-2xl">{card.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{card.title}</p>
                <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
              </div>
              <span className="text-muted">→</span>
            </Link>
          ) : (
            <div
              key={card.title}
              className="bg-card rounded-2xl p-4 flex items-center gap-4 opacity-50 pointer-events-none"
            >
              <span className="text-2xl">{card.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">{card.title}</p>
                <p className="text-xs text-muted mt-0.5">{card.subtitle}</p>
              </div>
              <span className="text-xs text-muted">준비 중</span>
            </div>
          )
        )}
      </div>
    </main>
  );
}
