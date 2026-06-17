import {
  makeAiCacheKey,
  makeMonthlyFortuneCacheKey,
  makeFortuneDayCacheKey,
  saveAiCache,
  loadAiCache,
} from '../ai-cache';
import { setupStorageMock } from './test-utils';

setupStorageMock('localStorage');

describe('makeAiCacheKey', () => {
  it('양력, 시 없음', () => {
    expect(makeAiCacheKey(1990, 6, 15, null, false)).toBe('saju-ai-cache:1990-6-15-x-S');
  });

  it('음력, 시 있음', () => {
    expect(makeAiCacheKey(1990, 6, 15, 9, true)).toBe('saju-ai-cache:1990-6-15-9-L');
  });
});

describe('saveAiCache / loadAiCache', () => {
  const key = 'saju-ai-cache:1990-6-15-x-S';
  const sections = { 성격분석: '용감한', 재물운: '좋음', 건강운: '', 연애운: '', 직업운: '' };

  it('저장 후 불러오기', () => {
    saveAiCache(key, sections);
    expect(loadAiCache(key)).toEqual(sections);
  });

  it('없는 키는 null 반환', () => {
    expect(loadAiCache('saju-ai-cache:missing')).toBeNull();
  });

  it('손상된 JSON은 null 반환', () => {
    localStorage.setItem('saju-ai-cache:bad', '{bad json');
    expect(loadAiCache('saju-ai-cache:bad')).toBeNull();
  });

  it('배열은 null 반환', () => {
    localStorage.setItem('saju-ai-cache:arr', '[]');
    expect(loadAiCache('saju-ai-cache:arr')).toBeNull();
  });

  it('버전 불일치 시 null 반환', () => {
    localStorage.setItem('saju-ai-cache:old', JSON.stringify({ v: 0, sections }));
    expect(loadAiCache('saju-ai-cache:old')).toBeNull();
  });

  it('sections가 배열이면 null 반환', () => {
    localStorage.setItem('saju-ai-cache:arr-sections', JSON.stringify({ v: 2, savedAt: Date.now(), sections: [] }));
    expect(loadAiCache('saju-ai-cache:arr-sections')).toBeNull();
  });
});

describe('makeMonthlyFortuneCacheKey', () => {
  it('일주·연도·월로 캐시 키 생성', () => {
    expect(makeMonthlyFortuneCacheKey('甲子', null, 2026, 6)).toBe('monthly-fortune:甲子-x:2026:6');
  });

  it('시주 있으면 포함', () => {
    expect(makeMonthlyFortuneCacheKey('甲子', '壬午', 2026, 1)).toBe(
      'monthly-fortune:甲子-壬午:2026:1'
    );
  });

  it('다른 일주는 다른 키', () => {
    expect(makeMonthlyFortuneCacheKey('甲子', null, 2026, 6)).not.toBe(
      makeMonthlyFortuneCacheKey('甲午', null, 2026, 6)
    );
  });
});

describe('makeFortuneDayCacheKey', () => {
  it('생일과 오늘 날짜 조합으로 키 생성', () => {
    expect(makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 17)).toBe(
      'fortune-day:1990-6-15-x-S:2026-6-17'
    );
  });

  it('시주 있으면 포함', () => {
    expect(makeFortuneDayCacheKey(1990, 6, 15, 9, true, 2026, 6, 17)).toBe(
      'fortune-day:1990-6-15-9-L:2026-6-17'
    );
  });

  it('오늘 날짜가 다르면 다른 키', () => {
    const key1 = makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 17);
    const key2 = makeFortuneDayCacheKey(1990, 6, 15, null, false, 2026, 6, 18);
    expect(key1).not.toBe(key2);
  });
});

describe('캐시 TTL 만료', () => {
  const key = 'saju-ai-cache:ttl-test';
  const sections = { 성격분석: '용감한', 재물운: '좋음', 건강운: '', 연애운: '', 직업운: '' };

  it('30일 이내 캐시는 반환됨', () => {
    const recent = Date.now() - 1000 * 60 * 60 * 24 * 29; // 29일 전
    localStorage.setItem(key, JSON.stringify({ v: 2, savedAt: recent, sections }));
    expect(loadAiCache(key)).toEqual(sections);
  });

  it('30일 초과 캐시는 null 반환', () => {
    const old = Date.now() - 1000 * 60 * 60 * 24 * 31; // 31일 전
    localStorage.setItem(key, JSON.stringify({ v: 2, savedAt: old, sections }));
    expect(loadAiCache(key)).toBeNull();
  });

  it('savedAt 없으면 null 반환', () => {
    localStorage.setItem(key, JSON.stringify({ v: 2, sections }));
    expect(loadAiCache(key)).toBeNull();
  });
});
