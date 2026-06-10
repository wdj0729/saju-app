import { calculateSaju } from '../saju-calculator';
import { calculateDaewoon, calcMadeAge } from '../daewoon';

// ────────────────────────────────
// calcMadeAge
// ────────────────────────────────
describe('calcMadeAge', () => {
  it('생일이 이미 지난 경우: 올해 - 출생년도', () => {
    const today = new Date(2026, 5, 9); // 2026-06-09
    expect(calcMadeAge(1990, 3, 15, today)).toBe(36);
  });

  it('생일이 아직 안 지난 경우: 올해 - 출생년도 - 1', () => {
    const today = new Date(2026, 5, 9); // 2026-06-09
    expect(calcMadeAge(1990, 8, 1, today)).toBe(35);
  });

  it('생일이 오늘인 경우: 올해 - 출생년도', () => {
    const today = new Date(2026, 5, 9); // 2026-06-09 (월은 0-indexed → 5 = 6월)
    expect(calcMadeAge(1990, 6, 9, today)).toBe(36);
  });
});

// ────────────────────────────────
// calculateDaewoon
// ────────────────────────────────
describe('calculateDaewoon', () => {
  // 1984 = 甲子년 (甲 = 양간)
  const input1984M = { year: 1984, month: 3, day: 15, hour: null as null, isLunar: false };
  const saju1984 = calculateSaju(input1984M);

  // 1985 = 乙丑년 (乙 = 음간)
  const input1985 = { year: 1985, month: 3, day: 15, hour: null as null, isLunar: false };
  const saju1985 = calculateSaju(input1985);

  it('양년간(甲) + 남성 → 순행', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    expect(result.direction).toBe('순행');
  });

  it('양년간(甲) + 여성 → 역행', () => {
    const result = calculateDaewoon(input1984M, 'F', saju1984.year, saju1984.month);
    expect(result.direction).toBe('역행');
  });

  it('음년간(乙) + 여성 → 순행', () => {
    const result = calculateDaewoon(input1985, 'F', saju1985.year, saju1985.month);
    expect(result.direction).toBe('순행');
  });

  it('음년간(乙) + 남성 → 역행', () => {
    const result = calculateDaewoon(input1985, 'M', saju1985.year, saju1985.month);
    expect(result.direction).toBe('역행');
  });

  it('대운 개수는 항상 8개', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    expect(result.pillars).toHaveLength(8);
  });

  it('대운수는 1 이상 12 이하 (절기 간격 최대 ~35일 ÷ 3)', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    expect(result.daewoonSu).toBeGreaterThanOrEqual(1);
    expect(result.daewoonSu).toBeLessThanOrEqual(12);
  });

  it('첫 대운의 startAge === daewoonSu', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    expect(result.pillars[0].startAge).toBe(result.daewoonSu);
  });

  it('각 대운의 endAge === startAge + 9', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    result.pillars.forEach((p) => {
      expect(p.endAge).toBe(p.startAge + 9);
    });
  });

  it('대운 나이 범위가 연속적 (다음 startAge = 이전 endAge + 1)', () => {
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    for (let i = 0; i < result.pillars.length - 1; i++) {
      expect(result.pillars[i + 1].startAge).toBe(result.pillars[i].endAge + 1);
    }
  });

  it('모든 대운 간지가 유효한 GAN/JI', () => {
    const validGan = new Set(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']);
    const validJi = new Set([
      '子',
      '丑',
      '寅',
      '卯',
      '辰',
      '巳',
      '午',
      '未',
      '申',
      '酉',
      '戌',
      '亥',
    ]);
    const result = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    result.pillars.forEach((p) => {
      expect(validGan.has(p.gan)).toBe(true);
      expect(validJi.has(p.ji)).toBe(true);
    });
  });

  it('음력 입력도 처리 (8개 대운, 대운수 ≥ 1)', () => {
    const lunarInput = { year: 1984, month: 2, day: 15, hour: null as null, isLunar: true };
    const lunarSaju = calculateSaju(lunarInput);
    const result = calculateDaewoon(lunarInput, 'M', lunarSaju.year, lunarSaju.month);
    expect(result.pillars).toHaveLength(8);
    expect(result.daewoonSu).toBeGreaterThanOrEqual(1);
  });

  it('역행 시 순행과 다른 기둥을 반환', () => {
    const forward = calculateDaewoon(input1984M, 'M', saju1984.year, saju1984.month);
    const backward = calculateDaewoon(input1984M, 'F', saju1984.year, saju1984.month);
    expect(forward.pillars[0].gan + forward.pillars[0].ji).not.toBe(
      backward.pillars[0].gan + backward.pillars[0].ji
    );
  });
});
