const mockLimit = jest.fn();

jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn(() => ({ limit: (...args: unknown[]) => mockLimit(...args) }));
  (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = jest.fn();
  return { Ratelimit: MockRatelimit };
});

jest.mock('@upstash/redis', () => ({
  Redis: { fromEnv: jest.fn(() => ({})) },
}));

import { checkRateLimit, getRateLimitResponse } from '../rate-limit';
import { NextRequest } from 'next/server';

describe('checkRateLimit', () => {
  beforeEach(() => mockLimit.mockReset());

  it('허용 응답 시 true 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    expect(await checkRateLimit('1.2.3.4')).toBe(true);
  });

  it('차단 응답 시 false 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    expect(await checkRateLimit('1.2.3.4')).toBe(false);
  });

  it('IP별로 독립적으로 limit 호출', async () => {
    mockLimit.mockResolvedValue({ success: true });
    await checkRateLimit('1.1.1.1');
    await checkRateLimit('2.2.2.2');
    expect(mockLimit).toHaveBeenNthCalledWith(1, '1.1.1.1');
    expect(mockLimit).toHaveBeenNthCalledWith(2, '2.2.2.2');
  });
});

describe('getRateLimitResponse', () => {
  beforeEach(() => mockLimit.mockReset());

  it('허용 시 null 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test');
    expect(await getRateLimitResponse(req)).toBeNull();
  });

  it('차단 시 429 응답 반환', async () => {
    mockLimit.mockResolvedValueOnce({ success: false });
    const req = new NextRequest('http://localhost/api/test');
    const res = await getRateLimitResponse(req);
    expect(res?.status).toBe(429);
  });

  it('x-forwarded-for IP 추출', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '5.5.5.5, 6.6.6.6' },
    });
    await getRateLimitResponse(req);
    expect(mockLimit).toHaveBeenCalledWith('5.5.5.5');
  });

  it('IP 없으면 anonymous 사용', async () => {
    mockLimit.mockResolvedValueOnce({ success: true });
    const req = new NextRequest('http://localhost/api/test');
    await getRateLimitResponse(req);
    expect(mockLimit).toHaveBeenCalledWith('anonymous');
  });
});
