import { getDaewoonInterpretation } from '../daewoon-text';

describe('getDaewoonInterpretation', () => {
  // 일간: 목(木)
  test('같은 오행 → 비겁 (경쟁·독립)', () => {
    const result = getDaewoonInterpretation('목', '목', '화');
    expect(result.label).toBe('경쟁·독립의 10년');
    expect(result.desc).toContain('비슷한 기운');
    expect(result.desc).toContain('화(火)');
  });

  test('천간이 일간을 생 → 인성 (배움·귀인)', () => {
    // 수(水)가 목(木)을 생함
    const result = getDaewoonInterpretation('목', '수', '토');
    expect(result.label).toBe('배움·귀인의 10년');
    expect(result.desc).toContain('도와주는 기운');
    expect(result.desc).toContain('토(土)');
  });

  test('일간이 천간을 생 → 식상 (표현·창작)', () => {
    // 목(木)이 화(火)를 생함
    const result = getDaewoonInterpretation('목', '화', '금');
    expect(result.label).toBe('표현·창작의 10년');
    expect(result.desc).toContain('에너지를 밖으로');
    expect(result.desc).toContain('금(金)');
  });

  test('천간이 일간을 극 → 관살 (책임·도전)', () => {
    // 금(金)이 목(木)을 극함
    const result = getDaewoonInterpretation('목', '금', '수');
    expect(result.label).toBe('책임·도전의 10년');
    expect(result.desc).toContain('긴장감');
    expect(result.desc).toContain('수(水)');
  });

  test('일간이 천간을 극 → 재성 (재물·성취)', () => {
    // 목(木)이 토(土)를 극함
    const result = getDaewoonInterpretation('목', '토', '목');
    expect(result.label).toBe('재물·성취의 10년');
    expect(result.desc).toContain('성과를 내는');
    expect(result.desc).toContain('목(木)');
  });
});
