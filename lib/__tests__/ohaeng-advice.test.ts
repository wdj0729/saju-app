import { getMostLackingOhaeng } from '../ohaeng-advice';

describe('getMostLackingOhaeng', () => {
  it('하나만 0인 경우 해당 오행 반환', () => {
    expect(getMostLackingOhaeng({ 목: 3, 화: 2, 토: 1, 금: 0, 수: 1 })).toBe('금');
  });

  it('여러 개가 0인 경우 목화토금수 순서 중 첫 번째 반환', () => {
    expect(getMostLackingOhaeng({ 목: 2, 화: 0, 토: 1, 금: 0, 수: 0 })).toBe('화');
  });

  it('모두 동일하면 null 반환', () => {
    expect(getMostLackingOhaeng({ 목: 2, 화: 2, 토: 2, 금: 2, 수: 2 })).toBeNull();
  });

  it('모두 0이면 null 반환', () => {
    expect(getMostLackingOhaeng({ 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 })).toBeNull();
  });

  it('일반 분포에서 최솟값 오행 반환', () => {
    expect(getMostLackingOhaeng({ 목: 4, 화: 3, 토: 2, 금: 1, 수: 3 })).toBe('금');
  });
});
