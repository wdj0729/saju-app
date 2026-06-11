import {
  calcCompatibility,
  saveCompatSession,
  loadCompatSession,
  clearCompatSession,
} from '../compatibility';
import type { CompatibilitySession } from '../compatibility';
import type { SajuResult } from '../saju-calculator';

function makeSaju(ohaeng: Record<'목' | '화' | '토' | '금' | '수', number>): SajuResult {
  return {
    year: { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' },
    month: { gan: '丙', ji: '午', ganElement: '화', jiElement: '화' },
    day: { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' },
    hour: null,
    ilgan: '甲',
    ohaeng,
  };
}

const pureWood = makeSaju({ 목: 5, 화: 0, 토: 0, 금: 0, 수: 0 });
const pureFire = makeSaju({ 목: 0, 화: 5, 토: 0, 금: 0, 수: 0 });
const pureMetal = makeSaju({ 목: 0, 화: 0, 토: 0, 금: 5, 수: 0 });
const pureWater = makeSaju({ 목: 0, 화: 0, 토: 0, 금: 0, 수: 5 });

describe('calcCompatibility', () => {
  it('score는 0~100 범위', () => {
    const { score } = calcCompatibility(pureWood, pureFire);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('상생 관계(木→火): score >= 50', () => {
    const { score } = calcCompatibility(pureWood, pureFire);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('상극 관계(金↔木): score < 50', () => {
    const { score } = calcCompatibility(pureWood, pureMetal);
    expect(score).toBeLessThan(50);
  });

  it('score >= 85 → grade 최상, gradeLabel 천생연분', () => {
    const { grade, gradeLabel } = calcCompatibility(pureWood, pureFire);
    expect(grade).toBe('최상');
    expect(gradeLabel).toBe('천생연분');
  });

  it('score < 50 → grade 하, gradeLabel 주의 필요', () => {
    const { grade, gradeLabel } = calcCompatibility(pureWood, pureMetal);
    expect(grade).toBe('하');
    expect(gradeLabel).toBe('주의 필요');
  });

  it('水→木 상생: score >= 50', () => {
    const { score } = calcCompatibility(pureWater, pureWood);
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('dominant는 오행 중 최댓값 원소', () => {
    const { dominant } = calcCompatibility(pureWood, pureFire);
    expect(dominant.a).toBe('목');
    expect(dominant.b).toBe('화');
  });

  it('ohaengA·ohaengB가 결과에 포함', () => {
    const result = calcCompatibility(pureWood, pureFire);
    expect(result.ohaengA).toEqual(pureWood.ohaeng);
    expect(result.ohaengB).toEqual(pureFire.ohaeng);
  });

  it('summary는 비어있지 않은 문자열', () => {
    const { summary } = calcCompatibility(pureWood, pureFire);
    expect(typeof summary).toBe('string');
    expect(summary.length).toBeGreaterThan(0);
  });
});

// sessionStorage 모킹
const store: Record<string, string> = {};
beforeAll(() => {
  Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    },
    writable: true,
    configurable: true,
  });
});
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

describe('CompatibilitySession 스토리지', () => {
  const dummy: CompatibilitySession = {
    personA: { name: '홍길동', gender: 'M' as const, result: pureWood },
    personB: { name: '김순이', gender: 'F' as const, result: pureFire },
    compatibility: calcCompatibility(pureWood, pureFire),
  };

  it('saveCompatSession → loadCompatSession 라운드트립', () => {
    saveCompatSession(dummy);
    const loaded = loadCompatSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.personA.name).toBe('홍길동');
    expect(loaded?.personB.name).toBe('김순이');
  });

  it('세션이 없으면 null 반환', () => {
    expect(loadCompatSession()).toBeNull();
  });

  it('clearCompatSession 후 loadCompatSession은 null 반환', () => {
    saveCompatSession(dummy);
    clearCompatSession();
    expect(loadCompatSession()).toBeNull();
  });
});

describe('SSR 환경 (window 없음)', () => {
  let saved: typeof globalThis.window;

  beforeEach(() => {
    saved = globalThis.window;
    // @ts-expect-error
    delete globalThis.window;
  });

  afterEach(() => {
    globalThis.window = saved;
  });

  it('saveCompatSession은 아무것도 하지 않음', () => {
    expect(() => saveCompatSession({} as CompatibilitySession)).not.toThrow();
  });

  it('loadCompatSession은 null 반환', () => {
    expect(loadCompatSession()).toBeNull();
  });

  it('clearCompatSession은 아무것도 하지 않음', () => {
    expect(() => clearCompatSession()).not.toThrow();
  });
});
