import { FORTUNE_TEXT } from '../fortune-text';

const ILGAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const PERIODS = ['오늘', '이달', '올해'] as const;
const DETAIL_KEYS = ['대운', '재물', '건강', '인간관계'] as const;

describe('FORTUNE_TEXT', () => {
  it('10개 일간 모두에 대한 운세가 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      expect(FORTUNE_TEXT[ilgan]).toBeDefined();
    });
  });

  it('각 일간에 오늘/이달/올해 3개 기간이 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      PERIODS.forEach((period) => {
        expect(FORTUNE_TEXT[ilgan][period]).toBeDefined();
      });
    });
  });

  it('각 기간에 summary 문자열이 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      PERIODS.forEach((period) => {
        const { summary } = FORTUNE_TEXT[ilgan][period];
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });
    });
  });

  it('각 기간에 4개 영역 상세(대운/재물/건강/인간관계)가 존재한다', () => {
    ILGAN_LIST.forEach((ilgan) => {
      PERIODS.forEach((period) => {
        const { details } = FORTUNE_TEXT[ilgan][period];
        DETAIL_KEYS.forEach((key) => {
          expect(typeof details[key as keyof typeof details]).toBe('string');
          expect(details[key as keyof typeof details].length).toBeGreaterThan(0);
        });
      });
    });
  });
});
