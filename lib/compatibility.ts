import type { SajuResult } from './saju-calculator';
import type { Ohaeng } from './saju-data';
import { createSessionStore } from './session-store';

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
      '두 사람의 오행이 서로를 완벽하게 보완해요. 함께할수록 각자의 장점이 빛나며 서로에게 큰 힘이 되는 관계예요. 인생의 동반자로 이보다 나은 인연을 찾기 어려워요.',
  },
  상: {
    label: '좋은 인연',
    summary:
      '두 사람 사이에 상생의 기운이 강해요. 서로의 부족함을 채워주며 함께 성장할 수 있는 좋은 궁합이에요. 작은 노력으로 더욱 깊은 관계를 만들어갈 수 있어요.',
  },
  중: {
    label: '보통 궁합',
    summary:
      '상생과 상극이 균형을 이루는 관계예요. 서로 이해하고 배려하는 노력이 필요하지만 그 과정에서 함께 성장할 수 있어요. 대화와 소통으로 좋은 관계를 만들어갈 수 있어요.',
  },
  하: {
    label: '주의 필요',
    summary:
      '두 사람의 오행에 상극의 기운이 강해요. 서로의 차이를 인정하고 이해하는 노력이 특히 중요해요. 서로를 존중하는 마음을 바탕으로 관계를 만들어가면 극복할 수 있어요.',
  },
};

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

const compatStore = createSessionStore('compatibility-session', isCompatibilitySession);

export const saveCompatSession = compatStore.save;
export const loadCompatSession = compatStore.load;
export const clearCompatSession = compatStore.clear;

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

  // 중심 60 + 증폭 2.5배: 중립→60, 상생 집중→85+, 상극 집중→35-
  const ratio = totalWeight > 0 ? rawScore / totalWeight : 0;
  const score = Math.round(Math.min(100, Math.max(0, 60 + ratio * 125)));

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
