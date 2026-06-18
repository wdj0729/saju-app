import type { SajuResult } from './saju-calculator';
import { calcCompatibility } from './compatibility';
import { createSessionStore } from './session-store';

export interface GroupMember {
  name: string;
  gender: 'M' | 'F';
  result: SajuResult;
}

export interface PairResult {
  indexA: number;
  indexB: number;
  score: number;
  grade: '최상' | '상' | '중' | '하';
  gradeLabel: string;
}

export interface GroupCompatibilitySession {
  members: GroupMember[];
  pairs: PairResult[];
  averageScore: number;
}

export function calcGroupCompatibility(members: GroupMember[]): {
  pairs: PairResult[];
  averageScore: number;
} {
  const pairs: PairResult[] = [];
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const r = calcCompatibility(members[i].result, members[j].result);
      pairs.push({
        indexA: i,
        indexB: j,
        score: r.score,
        grade: r.grade,
        gradeLabel: r.gradeLabel,
      });
    }
  }
  const averageScore =
    pairs.length > 0
      ? Math.round(pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length)
      : 0;
  return { pairs, averageScore };
}

function isGroupCompatibilitySession(v: unknown): v is GroupCompatibilitySession {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    Array.isArray(r.members) &&
    r.members.length >= 2 &&
    r.members.length <= 10 &&
    Array.isArray(r.pairs) &&
    typeof r.averageScore === 'number'
  );
}

const store = createSessionStore('group-compatibility-session', isGroupCompatibilitySession);

export const saveGroupCompatSession = store.save;
export const loadGroupCompatSession = store.load;
export const clearGroupCompatSession = store.clear;
