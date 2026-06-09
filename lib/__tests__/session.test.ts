import type { SajuResult } from '../saju-calculator';
import { saveSession, loadSession, clearSession } from '../session';
import type { SajuSession } from '../session';

// Node test env에 window/sessionStorage 없으므로 file-scope 객체로 모킹
const store: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(global, 'window', {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem:    (k: string) => store[k] ?? null,
      setItem:    (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    },
    writable: true,
    configurable: true,
  });
});

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
});

const DUMMY_RESULT: SajuResult = {
  year:  { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' },
  month: { gan: '丙', ji: '寅', ganElement: '화', jiElement: '목' },
  day:   { gan: '戊', ji: '辰', ganElement: '토', jiElement: '토' },
  hour:  null,
  ilgan: '戊',
  ohaeng: { 목: 3, 화: 1, 토: 4, 금: 0, 수: 0.5 },
};

const DUMMY_SESSION: SajuSession = {
  input: { name: '홍길동', year: 1990, month: 6, day: 15, hour: null, isLunar: false },
  result: DUMMY_RESULT,
};

describe('session', () => {
  it('saveSession → loadSession 라운드트립', () => {
    saveSession(DUMMY_SESSION);
    const loaded = loadSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.input.name).toBe('홍길동');
    expect(loaded?.result.ilgan).toBe('戊');
  });

  it('clearSession 후 loadSession은 null 반환', () => {
    saveSession(DUMMY_SESSION);
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it('sessionStorage가 비어있으면 loadSession은 null 반환', () => {
    expect(loadSession()).toBeNull();
  });

  it('손상된 JSON이면 loadSession은 null 반환', () => {
    store['saju-session'] = '{bad json';
    expect(loadSession()).toBeNull();
  });
});
