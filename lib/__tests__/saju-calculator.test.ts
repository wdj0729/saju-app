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
