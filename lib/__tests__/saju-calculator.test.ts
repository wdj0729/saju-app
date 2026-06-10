import { GAN, JI, GAN_OHAENG, JI_OHAENG, JIJANGGAN, OHODUN, OJADUN, JEOLGI_JI } from '../saju-data';
import {
  getYearPillar,
  getMonthPillar,
  getDayPillar,
  getHourPillar,
  calcOhaeng,
  calculateSaju,
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
    GAN.forEach((g) => {
      expect(validOhaeng.has(GAN_OHAENG[g])).toBe(true);
    });
  });

  it('JI_OHAENG는 모든 지지를 포함', () => {
    const validOhaeng = new Set(['목', '화', '토', '금', '수']);
    JI.forEach((j) => {
      expect(validOhaeng.has(JI_OHAENG[j])).toBe(true);
    });
  });

  it('JIJANGGAN는 12개 지지 모두 보유, 길이 2 또는 3', () => {
    JI.forEach((j) => {
      expect(JIJANGGAN[j]).toBeDefined();
      expect([2, 3]).toContain(JIJANGGAN[j].length);
    });
  });

  it('중기 없는 지지(子卯午酉)는 길이 2', () => {
    ['子', '卯', '午', '酉'].forEach((j) => {
      expect(JIJANGGAN[j]).toHaveLength(2);
    });
  });

  it('중기 있는 지지는 길이 3', () => {
    ['丑', '寅', '辰', '巳', '未', '申', '戌', '亥'].forEach((j) => {
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
    const names = [
      '小寒',
      '立春',
      '惊蛰',
      '清明',
      '立夏',
      '芒种',
      '小暑',
      '立秋',
      '白露',
      '寒露',
      '立冬',
      '大雪',
    ];
    names.forEach((n) => {
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

  it('2024-03-07 (경칩 3/5 이후) → 卯月, 甲辰년 → 丁卯월', () => {
    // 惊蛰(경칩) 검증 — 경칩 이후 卯月
    // 卯月: jiIndex=3, offset=(3-2+12)%12=1, ganIndex=(2+1)%10=3 → 丁
    const p = getMonthPillar(2024, 3, 7, '甲');
    expect(p.ji).toBe('卯');
    expect(p.gan).toBe('丁');
  });

  it('2024-02-10 乙庚년 계산 → 戊寅월', () => {
    // 乙庚년: yearGanIndex=1, OHODUN[1]=4(戊) → 인월=戊寅
    const p = getMonthPillar(2024, 2, 10, '乙');
    expect(p.ji).toBe('寅');
    expect(p.gan).toBe('戊');
  });

  it('2024-02-10 丙辛년 계산 → 庚寅월', () => {
    const p = getMonthPillar(2024, 2, 10, '丙');
    expect(p.ji).toBe('寅');
    expect(p.gan).toBe('庚');
  });
});

describe('getDayPillar', () => {
  it('1900-01-31 (기준일) → 甲辰', () => {
    const p = getDayPillar(1900, 1, 31);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('辰');
  });

  it('1900-02-01 (기준일+1) → 乙巳', () => {
    const p = getDayPillar(1900, 2, 1);
    expect(p.gan).toBe('乙');
    expect(p.ji).toBe('巳');
  });

  it('1900-03-31 (기준일+59) → 癸卯', () => {
    // daysDiff=59, index=(59+40)%60=39 → 癸(9), 卯(3)
    const p = getDayPillar(1900, 3, 31);
    expect(p.gan).toBe('癸');
    expect(p.ji).toBe('卯');
  });

  it('1900-04-01 (기준일+60) → 甲辰 (60갑자 순환)', () => {
    const p = getDayPillar(1900, 4, 1);
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('辰');
  });

  it('1993-07-29 → 辛亥', () => {
    const p = getDayPillar(1993, 7, 29);
    expect(p.gan).toBe('辛');
    expect(p.ji).toBe('亥');
  });
});

describe('getHourPillar', () => {
  it('甲일 hour=0 (자시) → 甲子시', () => {
    const p = getHourPillar(0, '甲');
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
  });

  it('甲일 hour=23 (야자시) → 甲子시 (당일 자시 처리)', () => {
    const p = getHourPillar(23, '甲');
    expect(p.gan).toBe('甲');
    expect(p.ji).toBe('子');
  });

  it('甲일 hour=1 (축시) → 乙丑시', () => {
    const p = getHourPillar(1, '甲');
    expect(p.gan).toBe('乙');
    expect(p.ji).toBe('丑');
  });

  it('甲일 hour=13 (미시, jiIndex=7) → 辛未시', () => {
    // jiIndex=floor(14/2)=7, ganIndex=(0+7)%10=7 → 辛
    const p = getHourPillar(13, '甲');
    expect(p.gan).toBe('辛');
    expect(p.ji).toBe('未');
  });

  it('乙일 hour=0 (자시) → 丙子시', () => {
    // 乙ganIndex=1, OJADUN[1%5]=2(丙), jiIndex=0 → 丙子
    const p = getHourPillar(0, '乙');
    expect(p.gan).toBe('丙');
    expect(p.ji).toBe('子');
  });

  it('丙일 hour=0 (자시) → 戊子시', () => {
    // 丙ganIndex=2, OJADUN[2%5]=4(戊), jiIndex=0 → 戊子
    const p = getHourPillar(0, '丙');
    expect(p.gan).toBe('戊');
    expect(p.ji).toBe('子');
  });

  it('丁일 hour=0 (자시) → 庚子시', () => {
    // 丁ganIndex=3, OJADUN[3%5]=6(庚), jiIndex=0 → 庚子
    const p = getHourPillar(0, '丁');
    expect(p.gan).toBe('庚');
    expect(p.ji).toBe('子');
  });

  it('戊일 hour=0 (자시) → 壬子시', () => {
    // 戊ganIndex=4, OJADUN[4%5]=8(壬), jiIndex=0 → 壬子
    const p = getHourPillar(0, '戊');
    expect(p.gan).toBe('壬');
    expect(p.ji).toBe('子');
  });
});

describe('calcOhaeng', () => {
  it('甲子 기둥 하나 → 목1.0, 수2.5', () => {
    const pillar: Pillar = { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' };
    const result = calcOhaeng([pillar]);
    expect(result['목']).toBeCloseTo(1.0);
    expect(result['수']).toBeCloseTo(2.5); // 子:수1 + 壬(여기):수0.5 + 癸(정기):수1
  });

  it('null 기둥은 건너뜀', () => {
    const pillar: Pillar = { gan: '甲', ji: '子', ganElement: '목', jiElement: '수' };
    const r1 = calcOhaeng([pillar, null]);
    const r2 = calcOhaeng([pillar]);
    expect(r1).toEqual(r2);
  });

  it('모든 오행 키가 존재', () => {
    const result = calcOhaeng([]);
    expect(Object.keys(result).sort()).toEqual(['금', '목', '수', '토', '화'].sort());
  });

  it('丑 지장간(癸辛己) — 여기0.5 + 중기0.5 + 정기1', () => {
    const pillar: Pillar = { gan: '甲', ji: '丑', ganElement: '목', jiElement: '토' };
    const result = calcOhaeng([pillar]);
    // 甲:목1, 丑표면:토1, 癸여기:수0.5, 辛중기:금0.5, 己정기:토1
    expect(result['목']).toBeCloseTo(1.0);
    expect(result['토']).toBeCloseTo(2.0); // 丑표면1 + 己정기1
    expect(result['수']).toBeCloseTo(0.5);
    expect(result['금']).toBeCloseTo(0.5);
  });
});

describe('calculateSaju', () => {
  it('양력 1984-02-05 시간없음 → 4기둥 + ilgan + ohaeng 반환', () => {
    const result = calculateSaju({ year: 1984, month: 2, day: 5, hour: null, isLunar: false });
    expect(result.year.gan).toBe('甲');
    expect(result.year.ji).toBe('子');
    expect(result.day).toBeDefined();
    expect(result.hour).toBeNull();
    expect(result.ilgan).toBe(result.day.gan);
    const total = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });

  it('시간 있음 → hour 기둥이 null이 아님', () => {
    const result = calculateSaju({ year: 2024, month: 6, day: 15, hour: 10, isLunar: false });
    expect(result.hour).not.toBeNull();
    expect(result.hour!.ji).toBe('巳'); // hour=10 → jiIndex=floor(11/2)=5 → 巳
  });

  it('음력 입력 → 양력 변환 후 계산', () => {
    // 음력 2024-01-01 = 양력 2024-02-10
    const resultLunar = calculateSaju({ year: 2024, month: 1, day: 1, hour: null, isLunar: true });
    const resultSolar = calculateSaju({
      year: 2024,
      month: 2,
      day: 10,
      hour: null,
      isLunar: false,
    });
    expect(resultLunar.year.gan).toBe(resultSolar.year.gan);
    expect(resultLunar.day.gan).toBe(resultSolar.day.gan);
  });

  it('ohaeng 합계가 시주 없을 때 예상 범위 (10.5~12)', () => {
    const result = calculateSaju({ year: 1984, month: 2, day: 5, hour: null, isLunar: false });
    const total = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(10.5);
    expect(total).toBeLessThanOrEqual(12);
  });

  it('ohaeng 합계가 시주 있을 때 예상 범위 (14~16)', () => {
    const result = calculateSaju({ year: 1984, month: 2, day: 5, hour: 10, isLunar: false });
    const total = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(14);
    expect(total).toBeLessThanOrEqual(16);
  });
});
