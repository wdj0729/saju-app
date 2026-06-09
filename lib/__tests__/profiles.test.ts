import { loadProfiles, saveProfile, deleteProfile, isProfileSaved } from '../profiles';
import type { SajuSessionInput } from '../session';

const store: Record<string, string> = {};

beforeAll(() => {
  Object.defineProperty(global, 'window', { value: {}, writable: true, configurable: true });
  Object.defineProperty(global, 'localStorage', {
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
  Object.keys(store).forEach(k => delete store[k]);
});

const INPUT: SajuSessionInput = {
  name: '홍길동',
  year: 1990,
  month: 6,
  day: 15,
  hour: null,
  isLunar: false,
  gender: 'M',
};

describe('loadProfiles', () => {
  it('비어있으면 [] 반환', () => {
    expect(loadProfiles()).toEqual([]);
  });

  it('손상된 JSON이면 [] 반환', () => {
    store['saju-profiles'] = '{bad json';
    expect(loadProfiles()).toEqual([]);
  });

  it('배열이 아닌 값이면 [] 반환', () => {
    store['saju-profiles'] = '{"key":"value"}';
    expect(loadProfiles()).toEqual([]);
  });
});

describe('saveProfile', () => {
  it('저장 후 loadProfiles에 포함됨', () => {
    saveProfile(INPUT, '甲');
    const profiles = loadProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('홍길동');
    expect(profiles[0].ilgan).toBe('甲');
    expect(profiles[0].year).toBe(1990);
  });

  it('동일 input 두 번 저장 시 1개만 유지됨 (중복 방지)', () => {
    saveProfile(INPUT, '甲');
    saveProfile(INPUT, '甲');
    expect(loadProfiles()).toHaveLength(1);
  });

  it('이름이 다른 input은 별도 저장됨', () => {
    saveProfile(INPUT, '甲');
    saveProfile({ ...INPUT, name: '김영희' }, '丙');
    expect(loadProfiles()).toHaveLength(2);
  });

  it('저장된 profile에 id와 createdAt이 있음', () => {
    saveProfile(INPUT, '甲');
    const p = loadProfiles()[0];
    expect(typeof p.id).toBe('string');
    expect(p.id.length).toBeGreaterThan(0);
    expect(typeof p.createdAt).toBe('number');
  });
});

describe('deleteProfile', () => {
  it('id로 프로필 삭제', () => {
    saveProfile(INPUT, '甲');
    const id = loadProfiles()[0].id;
    deleteProfile(id);
    expect(loadProfiles()).toHaveLength(0);
  });

  it('존재하지 않는 id 삭제 시 오류 없음', () => {
    saveProfile(INPUT, '甲');
    deleteProfile('nonexistent-id');
    expect(loadProfiles()).toHaveLength(1);
  });
});

describe('isProfileSaved', () => {
  it('저장된 input → true', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved(INPUT)).toBe(true);
  });

  it('저장 안 된 input → false', () => {
    expect(isProfileSaved(INPUT)).toBe(false);
  });

  it('이름만 다르면 false', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved({ ...INPUT, name: '김영희' })).toBe(false);
  });

  it('연도만 다르면 false', () => {
    saveProfile(INPUT, '甲');
    expect(isProfileSaved({ ...INPUT, year: 1991 })).toBe(false);
  });
});
