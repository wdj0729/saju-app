'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadGroupCompatSession } from '@/lib/group-compatibility';
import type { GroupCompatibilitySession, PairResult } from '@/lib/group-compatibility';
import { useSessionOrRedirect } from '@/hooks/useSessionOrRedirect';
import { useAiText } from '@/hooks/useAiText';
import AiContent from '@/components/AiContent';
import BackButton from '@/components/BackButton';
import SessionExpiredPage from '@/components/SessionExpiredPage';

// SVG 설정
const SVG_SIZE = 300;
const CENTER = SVG_SIZE / 2;
const LAYOUT_R = 100; // 원형 배치 반지름
const NODE_R = 22; // 노드 원 반지름

const JIJI_ANIMAL: Record<string, string> = {
  子: '🐭',
  丑: '🐂',
  寅: '🐯',
  卯: '🐰',
  辰: '🐉',
  巳: '🐍',
  午: '🐴',
  未: '🐑',
  申: '🐵',
  酉: '🐓',
  戌: '🐕',
  亥: '🐷',
};

const GRADE_STYLE: Record<PairResult['grade'], { color: string; width: number }> = {
  최상: { color: '#4ade80', width: 3.5 },
  상: { color: '#60a5fa', width: 2.5 },
  중: { color: '#facc15', width: 2 },
  하: { color: '#f87171', width: 1.5 },
};

const OVERALL_LABEL: Record<string, string> = {
  '85': '천생연분 모임',
  '70': '좋은 모임',
  '50': '보통 모임',
  '0': '주의 필요',
};

function getOverallLabel(score: number): string {
  if (score >= 85) return OVERALL_LABEL['85'];
  if (score >= 70) return OVERALL_LABEL['70'];
  if (score >= 50) return OVERALL_LABEL['50'];
  return OVERALL_LABEL['0'];
}

function getNodePositions(count: number): { x: number; y: number }[] {
  if (count === 2) {
    return [
      { x: CENTER - LAYOUT_R, y: CENTER },
      { x: CENTER + LAYOUT_R, y: CENTER },
    ];
  }
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return {
      x: CENTER + LAYOUT_R * Math.cos(angle),
      y: CENTER + LAYOUT_R * Math.sin(angle),
    };
  });
}

function getMemberName(session: GroupCompatibilitySession, index: number): string {
  return session.members[index].name || `${index + 1}번째 분`;
}

export default function GroupResultContent() {
  const router = useRouter();
  const session = useSessionOrRedirect(loadGroupCompatSession, null);
  const { aiText, isStreaming, aiError, request, abort } = useAiText();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const positions = useMemo(() => {
    if (!session || session === 'not-found') return [];
    return getNodePositions(session.members.length);
  }, [session]);

  const handleAiRequest = useCallback(() => {
    if (!session || session === 'not-found') return;
    void request('/api/group-compatibility-analysis', {
      members: session.members.map((m) => ({
        name: m.name,
        ilgan: m.result.ilgan,
        ohaeng: m.result.ohaeng,
      })),
      averageScore: session.averageScore,
    });
  }, [request, session]);

  if (session === 'not-found') {
    return <SessionExpiredPage redirectPath="/compatibility/group" redirectLabel="다시 입력하기" />;
  }

  if (!session) return null;

  const selectedPairs =
    selectedIndex !== null
      ? session.pairs.filter((p) => p.indexA === selectedIndex || p.indexB === selectedIndex)
      : [];

  return (
    <div className="flex flex-col flex-1">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <BackButton href="/compatibility/group" label="뒤로" />
        <h1 className="text-sm font-semibold text-primary">모임 궁합 결과</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* 전체 조화도 */}
        <div className="bg-card rounded-2xl p-5 flex flex-col items-center gap-1">
          <p className="text-xs text-muted">전체 조화도</p>
          <p
            className="text-5xl font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {session.averageScore}
          </p>
          <p className="text-sm font-semibold text-primary">
            {getOverallLabel(session.averageScore)}
          </p>
          <p className="text-xs text-muted">
            {session.members.length}명 · {session.pairs.length}쌍 분석
          </p>
        </div>

        {/* SVG 관계 그래프 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">이름을 탭하면 관계를 볼 수 있어요</p>
          <svg
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="w-full max-w-xs mx-auto block"
            aria-label="모임 구성원 관계 그래프"
          >
            {/* 관계선 */}
            {session.pairs.map((pair, i) => {
              const a = positions[pair.indexA];
              const b = positions[pair.indexB];
              const style = GRADE_STYLE[pair.grade];
              const isInvolved =
                selectedIndex === null ||
                pair.indexA === selectedIndex ||
                pair.indexB === selectedIndex;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={style.color}
                  strokeWidth={style.width}
                  strokeOpacity={isInvolved ? 0.85 : 0.12}
                  style={{ transition: 'stroke-opacity 0.2s' }}
                />
              );
            })}

            {/* 노드 */}
            {session.members.map((member, i) => {
              const pos = positions[i];
              const isSelected = selectedIndex === i;
              return (
                <g
                  key={i}
                  onClick={() => setSelectedIndex(isSelected ? null : i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIndex(isSelected ? null : i);
                    }
                  }}
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  aria-label={`${getMemberName(session, i)} 관계 보기`}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_R}
                    fill={isSelected ? '#4c1d95' : '#1e1b4b'}
                    stroke={isSelected ? '#a78bfa' : '#6d28d9'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 4}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#e2e8f0"
                    fontWeight="600"
                  >
                    {getMemberName(session, i).slice(0, 4)}
                  </text>
                  <text x={pos.x} y={pos.y + 8} textAnchor="middle" fontSize="11" fill="#a78bfa">
                    {JIJI_ANIMAL[member.result.year.ji] ?? ''}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 범례 */}
          <div className="flex justify-center gap-3 mt-2 flex-wrap">
            {(
              Object.entries(GRADE_STYLE) as [
                PairResult['grade'],
                { color: string; width: number },
              ][]
            ).map(([grade, { color }]) => (
              <span key={grade} className="flex items-center gap-1 text-xs text-muted">
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 2,
                    background: color,
                    borderRadius: 1,
                  }}
                  aria-hidden="true"
                />
                {grade}
              </span>
            ))}
          </div>
        </div>

        {/* 선택된 인물 관계 목록 */}
        {selectedIndex !== null && (
          <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-primary">
              {getMemberName(session, selectedIndex)}의 관계
            </p>
            {selectedPairs.map((pair, i) => {
              const otherIndex = pair.indexA === selectedIndex ? pair.indexB : pair.indexA;
              const style = GRADE_STYLE[pair.grade];
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-primary">{getMemberName(session, otherIndex)}</span>
                  <span
                    className="text-xs font-semibold rounded-full px-3 py-1"
                    style={{ color: style.color, background: `${style.color}22` }}
                  >
                    {pair.score} {pair.gradeLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* AI 분석 */}
        <div className="bg-card rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-primary">모임 AI 분석</p>
          <AiContent
            aiText={aiText}
            isStreaming={isStreaming}
            aiError={aiError}
            onRequest={handleAiRequest}
            onAbort={abort}
            requestLabel="모임 분석 요청하기"
          />
        </div>
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility/group')}
          className="w-full py-4 rounded-2xl border border-border text-sm font-medium text-primary"
        >
          다시 분석하기
        </button>
      </div>
    </div>
  );
}
