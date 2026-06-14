import { FORTUNE_TEXT, getDayVariantIndex } from '../fortune-text';

const ILGAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DETAIL_KEYS = ['대운', '재물', '건강', '인간관계'] as const;

describe('FORTUNE_TEXT', () => {
  it('10개 일간 모두에 대한 운세가 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      expect(FORTUNE_TEXT[ilgan]).toBeDefined();
    });
  });

  it('각 일간에 오늘/이달/올해 3개 기간이 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      expect(FORTUNE_TEXT[ilgan].오늘).toBeDefined();
      expect(FORTUNE_TEXT[ilgan].이달).toBeDefined();
      expect(FORTUNE_TEXT[ilgan].올해).toBeDefined();
    });
  });

  it('오늘 운세는 3가지 변형이 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      expect(Array.isArray(FORTUNE_TEXT[ilgan].오늘)).toBe(true);
      expect(FORTUNE_TEXT[ilgan].오늘).toHaveLength(3);
    });
  });

  it('오늘 각 변형에 summary와 details가 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      FORTUNE_TEXT[ilgan].오늘.forEach((variant) => {
        expect(typeof variant.summary).toBe('string');
        expect(variant.summary.length).toBeGreaterThan(0);
        DETAIL_KEYS.forEach((key) => {
          expect(typeof variant.details[key]).toBe('string');
          expect(variant.details[key].length).toBeGreaterThan(0);
        });
      });
    });
  });

  it('이달/올해에 summary 문자열이 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      expect(typeof FORTUNE_TEXT[ilgan].이달.summary).toBe('string');
      expect(FORTUNE_TEXT[ilgan].이달.summary.length).toBeGreaterThan(0);
      expect(typeof FORTUNE_TEXT[ilgan].올해.summary).toBe('string');
      expect(FORTUNE_TEXT[ilgan].올해.summary.length).toBeGreaterThan(0);
    });
  });

  it('이달/올해에 4개 영역 상세(대운/재물/건강/인간관계)가 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      (['이달', '올해'] as const).forEach((period) => {
        const { details } = FORTUNE_TEXT[ilgan][period];
        DETAIL_KEYS.forEach((key) => {
          expect(typeof details[key]).toBe('string');
          expect(details[key].length).toBeGreaterThan(0);
        });
      });
    });
  });
});

describe('getDayVariantIndex', () => {
  it('0, 1, 2 중 하나를 반환한다', () => {
    const dates = [
      new Date('2026-01-01'),
      new Date('2026-06-14'),
      new Date('2026-12-31'),
    ];
    dates.forEach((date) => {
      const idx = getDayVariantIndex(date);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(2);
    });
  });

  it('같은 날짜는 항상 같은 인덱스를 반환한다', () => {
    const date = new Date('2026-06-14');
    expect(getDayVariantIndex(date)).toBe(getDayVariantIndex(new Date('2026-06-14')));
  });
});
