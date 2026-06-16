import { getSinsals } from '../sinsal';
import type { SajuResult, Pillar } from '../saju-calculator';

const ZERO_OHAENG = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

function pillar(gan: string, ji: string): Pillar {
  return { gan, ji, ganElement: '목', jiElement: '목' };
}

function makeSaju(overrides: {
  yearJi: string;
  monthJi: string;
  dayGan: string;
  dayJi: string;
  hourJi?: string;
}): SajuResult {
  return {
    year: pillar('甲', overrides.yearJi),
    month: pillar('甲', overrides.monthJi),
    day: pillar(overrides.dayGan, overrides.dayJi),
    hour: overrides.hourJi ? pillar('甲', overrides.hourJi) : null,
    ilgan: overrides.dayGan,
    ohaeng: ZERO_OHAENG,
  };
}

describe('getSinsals', () => {
  it('일지가 寅午戌국이고 卯가 있으면 도화살', () => {
    // 일지 午 (寅午戌국), 월지 卯 → 도화살
    const saju = makeSaju({ yearJi: '子', monthJi: '卯', dayGan: '甲', dayJi: '午' });
    expect(getSinsals(saju)).toContain('도화살');
  });

  it('일지가 寅午戌국이고 申이 있으면 역마살', () => {
    // 일지 寅 (寅午戌국), 시지 申 → 역마살
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '甲', dayJi: '寅', hourJi: '申' });
    expect(getSinsals(saju)).toContain('역마살');
  });

  it('일지가 申子辰국이고 辰이 있으면 화개살', () => {
    // 일지 子 (申子辰국), 월지 辰 → 화개살
    const saju = makeSaju({ yearJi: '丑', monthJi: '辰', dayGan: '甲', dayJi: '子' });
    expect(getSinsals(saju)).toContain('화개살');
  });

  it('일간 甲이고 丑이 있으면 천을귀인', () => {
    // 甲戊庚 → 丑未
    const saju = makeSaju({ yearJi: '丑', monthJi: '寅', dayGan: '甲', dayJi: '辰' });
    expect(getSinsals(saju)).toContain('천을귀인');
  });

  it('일간 甲이고 卯가 있으면 양인살', () => {
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '甲', dayJi: '卯' });
    expect(getSinsals(saju)).toContain('양인살');
  });

  it('음간(乙)은 양인살 후보에서 제외된다', () => {
    // 乙의 양인 후보 지지가 없으므로, 어떤 지지를 채워도 양인살이 나오면 안 됨
    const saju = makeSaju({ yearJi: '子', monthJi: '丑', dayGan: '乙', dayJi: '辰' });
    expect(getSinsals(saju)).not.toContain('양인살');
  });

  it('아무 신살도 없으면 빈 배열', () => {
    // 일지 寅(寅午戌국) → 도화 卯, 역마 申, 화개 戌 — 모두 branches에 없음
    // 일간 乙(음간, 양인 없음) → 천을귀인 후보 子,申 — branches에 없음
    const saju = makeSaju({ yearJi: '丑', monthJi: '辰', dayGan: '乙', dayJi: '寅' });
    expect(getSinsals(saju)).toEqual([]);
  });

  it('여러 신살이 동시에 성립하면 정해진 순서로 모두 반환', () => {
    // 일지 午(寅午戌국) → 도화 卯, 역마 申, 화개 戌
    // 월지 卯(도화), 시지 申(역마)
    // 일간 甲 → 천을귀인 丑未, 양인 卯
    // 년지 丑 → 천을귀인 성립, 월지 卯 → 양인살도 성립
    const saju = makeSaju({ yearJi: '丑', monthJi: '卯', dayGan: '甲', dayJi: '午', hourJi: '申' });
    expect(getSinsals(saju)).toEqual(['도화살', '역마살', '천을귀인', '양인살']);
  });
});
