import {
  GAN, JI, GAN_OHAENG, JI_OHAENG, JIJANGGAN,
  OHODUN, OJADUN, JEOLGI_JI,
} from '../saju-data';
import {
  getYearPillar, getMonthPillar, getDayPillar, getHourPillar,
  calcOhaeng, calculateSaju,
} from '../saju-calculator';
import type { Pillar } from '../saju-calculator';

describe('saju-data', () => {
  it('GAN은 10개', () => {
    expect(GAN).toHaveLength(10);
  });

  it('JI는 12개', () => {
    expect(JI).toHaveLength(12);
  });

  it('GAN_OHAENG는 모든 천간을 포함', () => {
    const validOhaeng = new Set(['목', '화', '토', '금', '수']);
    GAN.forEach(g => {
      expect(validOhaeng.has(GAN_OHAENG[g])).toBe(true);
    });
  });

  it('JI_OHAENG는 모든 지지를 포함', () => {
    const validOhaeng = new Set(['목', '화', '토', '금', '수']);
    JI.forEach(j => {
      expect(validOhaeng.has(JI_OHAENG[j])).toBe(true);
    });
  });

  it('JIJANGGAN는 12개 지지 모두 보유, 길이 2 또는 3', () => {
    JI.forEach(j => {
      expect(JIJANGGAN[j]).toBeDefined();
      expect([2, 3]).toContain(JIJANGGAN[j].length);
    });
  });

  it('중기 없는 지지(子卯午酉)는 길이 2', () => {
    ['子', '卯', '午', '酉'].forEach(j => {
      expect(JIJANGGAN[j]).toHaveLength(2);
    });
  });

  it('중기 있는 지지는 길이 3', () => {
    ['丑', '寅', '辰', '巳', '未', '申', '戌', '亥'].forEach(j => {
      expect(JIJANGGAN[j]).toHaveLength(3);
    });
  });

  it('OHODUN은 5개', () => {
    expect(OHODUN).toHaveLength(5);
  });

  it('OJADUN은 5개', () => {
    expect(OJADUN).toHaveLength(5);
  });

  it('JEOLGI_JI는 12개 절기 모두 포함', () => {
    const names = ['小寒','立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪'];
    names.forEach(n => {
      expect(JEOLGI_JI[n]).toBeDefined();
    });
  });
});

describe('getYearPillar', () => {
  it('1984-02-05 (입춘 2월4일 이후) → 甲子년', () => {
    const p = getYearPillar(1984, 2, 5);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
    expect(p.ganElement).toBe('목');
    expect(p.jiElement).toBe('수');
  });

  it('1984-02-03 (입춘 이전) → 癸亥년', () => {
    const p = getYearPillar(1984, 2, 3);
    expect(p.gan).toBe('癸');
    expect(p.ji).toBe('亥');
  });

  it('2024-06-15 → 甲辰년', () => {
    const p = getYearPillar(2024, 6, 15);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('辰');
  });

  it('1900-03-01 → 庚子년', () => {
    const p = getYearPillar(1900, 3, 1);
    expect(p.gan).toBe('庚');
    expect(p.ji).toBe('子');
  });
});

describe('getMonthPillar', () => {
  // 2024년 甲辰년, 인월 시작 月干=丙 (OHODUN[0]=2)
  it('2024-02-10 (입춘 2/4 이후) → 寅月, 甲辰년 → 丙寅월', () => {
    const p = getMonthPillar(2024, 2, 10, '甲');
    expect(p.ji).toBe('寅');
    expect(p.gan).toBe('丙');
  });

  it('2024-04-06 (청명 4/4 이후) → 辰月, 甲辰년 → 戊辰월', () => {
    // 辰月: offset=(4-2+12)%12=2, ganIndex=(2+2)%10=4 → GAN[4]=戊
    const p = getMonthPillar(2024, 4, 6, '甲');
    expect(p.ji).toBe('辰');
    expect(p.gan).toBe('戊');
  });

  it('2024-01-10 (소한 1/6 이후) → 丑月, 甲辰년 → 丁丑월', () => {
    // 丑月: offset=(1-2+12)%12=11, ganIndex=(2+11)%10=3 → 丁
    const p = getMonthPillar(2024, 1, 10, '甲');
    expect(p.ji).toBe('丑');
    expect(p.gan).toBe('丁');
  });

  it('2024-01-03 (소한 이전) → 子月, 甲辰년 → 丙子월', () => {
    // 大雪(12/6) 이후 소한 이전 → 子月: offset=(0-2+12)%12=10, ganIndex=(2+10)%10=2 → 丙
    const p = getMonthPillar(2024, 1, 3, '甲');
    expect(p.ji).toBe('子');
    expect(p.gan).toBe('丙');
  });
});

describe('getDayPillar', () => {
  it('1900-01-31 (기준일) → 甲戌', () => {
    const p = getDayPillar(1900, 1, 31);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('戌');
  });

  it('1900-02-01 (기준일+1) → 乙亥', () => {
    const p = getDayPillar(1900, 2, 1);
    expect(p.gan).toBe('乙');
    expect(p.ji).toBe('亥');
  });

  it('1900-03-31 (기준일+59) → 癸酉', () => {
    // daysDiff=59, index=(59+10)%60=9 → 癸(9), 酉(9)
    const p = getDayPillar(1900, 3, 31);
    expect(p.gan).toBe('癸');
    expect(p.ji).toBe('酉');
  });

  it('1900-04-01 (기준일+60) → 甲戌 (60갑자 순환)', () => {
    const p = getDayPillar(1900, 4, 1);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('戌');
  });
});
