import { checkRateLimit, _injectTimestampsForTest } from '../rate-limit';

describe('checkRateLimit', () => {
  it('한도 내 요청은 허용됨', () => {
    const ip = 'test-ip-1';
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip)).toBe(true);
    }
  });

  it('한도 초과 요청은 차단됨', () => {
    const ip = 'test-ip-2';
    for (let i = 0; i < 10; i++) checkRateLimit(ip);
    expect(checkRateLimit(ip)).toBe(false);
  });

  it('IP별로 독립적으로 계산', () => {
    const ip1 = 'test-ip-3';
    const ip2 = 'test-ip-4';
    for (let i = 0; i < 10; i++) checkRateLimit(ip1);
    expect(checkRateLimit(ip2)).toBe(true);
  });

  it('윈도우(1분) 밖 요청은 카운트 안됨', () => {
    const ip = 'test-ip-5';
    const old = Date.now() - 1000 * 70; // 70초 전
    _injectTimestampsForTest(ip, Array(9).fill(old));
    // 70초 전 요청 9개는 윈도우 밖이므로 만료 → 현재 요청 1개만 카운트 → 허용
    expect(checkRateLimit(ip)).toBe(true);
  });

  it('윈도우 안 요청은 카운트됨', () => {
    const ip = 'test-ip-6';
    const recent = Date.now() - 1000 * 30; // 30초 전
    _injectTimestampsForTest(ip, Array(9).fill(recent));
    // 30초 전 요청 9개 + 현재 1개 = 10개 → 허용 (정확히 한도)
    expect(checkRateLimit(ip)).toBe(true);
    // 11번째 → 차단
    expect(checkRateLimit(ip)).toBe(false);
  });
});
