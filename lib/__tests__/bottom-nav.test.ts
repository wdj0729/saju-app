import { getActiveTab } from '../../components/BottomNav';

describe('getActiveTab', () => {
  it('returns 홈 for /', () => expect(getActiveTab('/')).toBe('홈'));
  it('returns 사주 for /saju', () => expect(getActiveTab('/saju')).toBe('사주'));
  it('returns 사주 for /saju/result', () => expect(getActiveTab('/saju/result')).toBe('사주'));
  it('returns 운세 for /fortune', () => expect(getActiveTab('/fortune')).toBe('운세'));
  it('returns 운세 for /fortune/yearly', () => expect(getActiveTab('/fortune/yearly')).toBe('운세'));
  it('returns 궁합 for /compatibility', () => expect(getActiveTab('/compatibility')).toBe('궁합'));
  it('returns 궁합 for /compatibility/result', () =>
    expect(getActiveTab('/compatibility/result')).toBe('궁합'));
  it('returns 홈 for unknown path', () => expect(getActiveTab('/unknown')).toBe('홈'));
});
