import type { SajuResult } from './saju-calculator';
import type { Ohaeng } from './saju-data';

export interface CompatibilityResult {
  score: number;
  grade: '최상' | '상' | '중' | '하';
  gradeLabel: string;
  summary: string;
  ohaengA: Record<Ohaeng, number>;
  ohaengB: Record<Ohaeng, number>;
  dominant: { a: Ohaeng; b: Ohaeng };
}

export interface CompatibilitySession {
  personA: { name: string; gender: 'M' | 'F'; result: SajuResult };
  personB: { name: string; gender: 'M' | 'F'; result: SajuResult };
  compatibility: CompatibilityResult;
}

const OHAENG_LIST: Ohaeng[] = ['목', '화', '토', '금', '수'];

const SANGSAENG = new Set(['목-화', '화-토', '토-금', '금-수', '수-목']);
const SANGGEUK = new Set(['목-토', '토-수', '수-화', '화-금', '금-목']);

function isSangsaeng(x: Ohaeng, y: Ohaeng): boolean {
  return SANGSAENG.has(`${x}-${y}`);
}

function isSanggeuk(x: Ohaeng, y: Ohaeng): boolean {
  return SANGGEUK.has(`${x}-${y}`);
}

function getDominant(ohaeng: Record<Ohaeng, number>): Ohaeng {
  return OHAENG_LIST.reduce((max, key) => (ohaeng[key] > ohaeng[max] ? key : max));
}

const GRADE_INFO: Record<'최상' | '상' | '중' | '하', { label: string; summary: string }> = {
  최상: {
    label: '천생연분',
    summary:
      '두 사람의 오행이 서로를 완벽하게 보완합니다. 함께할수록 각자의 장점이 빛나며 서로에게 큰 힘이 되는 관계입니다. 인생의 동반자로 이보다 나은 인연을 찾기 어렵습니다.',
  },
  상: {
    label: '좋은 인연',
    summary:
      '두 사람 사이에 상생의 기운이 강합니다. 서로의 부족함을 채워주며 함께 성장할 수 있는 좋은 궁합입니다. 작은 노력으로 더욱 깊은 관계를 만들어갈 수 있습니다.',
  },
  중: {
    label: '보통 궁합',
    summary:
      '상생과 상극이 균형을 이루는 관계입니다. 서로 이해하고 배려하는 노력이 필요하지만 그 과정에서 함께 성장할 수 있습니다. 대화와 소통으로 좋은 관계를 만들어갈 수 있습니다.',
  },
  하: {
    label: '주의 필요',
    summary:
      '두 사람의 오행에 상극의 기운이 강합니다. 서로의 차이를 인정하고 이해하는 노력이 특히 중요합니다. 서로를 존중하는 마음을 바탕으로 관계를 만들어가면 극복할 수 있습니다.',
  },
};

const COMPAT_KEY = 'compatibility-session';

export function saveCompatSession(data: CompatibilitySession): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(COMPAT_KEY, JSON.stringify(data));
}

function isCompatibilitySession(v: unknown): v is CompatibilitySession {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.personA === 'object' &&
    r.personA !== null &&
    typeof r.personB === 'object' &&
    r.personB !== null &&
    typeof r.compatibility === 'object' &&
    r.compatibility !== null
  );
}

export function loadCompatSession(): CompatibilitySession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(COMPAT_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isCompatibilitySession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearCompatSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(COMPAT_KEY);
}

export function calcCompatibility(a: SajuResult, b: SajuResult): CompatibilityResult {
  const ohaengA = a.ohaeng;
  const ohaengB = b.ohaeng;

  let rawScore = 0;
  let totalWeight = 0;

  for (const x of OHAENG_LIST) {
    for (const y of OHAENG_LIST) {
      const w = ohaengA[x] * ohaengB[y];
      if (isSangsaeng(x, y) || isSangsaeng(y, x)) rawScore += w;
      if (isSanggeuk(x, y) || isSanggeuk(y, x)) rawScore -= w;
      totalWeight += w;
    }
  }

  const raw = totalWeight > 0 ? 50 + (rawScore / totalWeight) * 50 : 50;
  const score = Math.round(Math.min(100, Math.max(0, raw)));

  const grade: '최상' | '상' | '중' | '하' =
    score >= 85 ? '최상' : score >= 70 ? '상' : score >= 50 ? '중' : '하';

  const { label: gradeLabel, summary } = GRADE_INFO[grade];

  return {
    score,
    grade,
    gradeLabel,
    summary,
    ohaengA,
    ohaengB,
    dominant: {
      a: getDominant(ohaengA),
      b: getDominant(ohaengB),
    },
  };
}
