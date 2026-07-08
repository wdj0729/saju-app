const mockLimit = jest.fn();
const mockHset = jest.fn();
const mockHdel = jest.fn();

// The push routes import `parseBody` from lib/stream-anthropic, which
// imports lib/anthropic (constructs a real Anthropic client at module load
// time otherwise) — stub it out, these tests never touch it.
jest.mock('@anthropic-ai/sdk', () => jest.fn().mockImplementation(() => ({})));

jest.mock('@upstash/ratelimit', () => {
  const MockRatelimit = jest.fn(() => ({ limit: (...args: unknown[]) => mockLimit(...args) }));
  (MockRatelimit as unknown as Record<string, unknown>).slidingWindow = jest.fn();
  return { Ratelimit: MockRatelimit };
});

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(() => ({
      hset: (...args: unknown[]) => mockHset(...args),
      hdel: (...args: unknown[]) => mockHdel(...args),
    })),
  },
}));

import { NextRequest } from 'next/server';
import { POST as subscribe } from '@/app/api/push/subscribe/route';
import { DELETE as unsubscribe } from '@/app/api/push/unsubscribe/route';

function makeRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockLimit.mockReset().mockResolvedValue({ success: true });
  mockHset.mockReset().mockResolvedValue(1);
  mockHdel.mockReset().mockResolvedValue(1);
});

describe('POST /api/push/subscribe', () => {
  it('유효한 구독 정보면 201과 함께 redis에 저장', async () => {
    const res = await subscribe(
      makeRequest('http://localhost/api/push/subscribe', {
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'x', auth: 'y' },
      })
    );
    expect(res.status).toBe(201);
    expect(mockHset).toHaveBeenCalledTimes(1);
  });

  it('endpoint가 없으면 400, redis를 건드리지 않음', async () => {
    const res = await subscribe(
      makeRequest('http://localhost/api/push/subscribe', { keys: { p256dh: 'x' } })
    );
    expect(res.status).toBe(400);
    expect(mockHset).not.toHaveBeenCalled();
  });

  it('endpoint가 문자열이 아니면(예: 숫자) 크래시 대신 400을 반환', async () => {
    // 과거엔 `body.endpoint as string`로 unchecked cast해서 createHash가 던지는 크래시였음
    const res = await subscribe(
      makeRequest('http://localhost/api/push/subscribe', { endpoint: 123, keys: {} })
    );
    expect(res.status).toBe(400);
    expect(mockHset).not.toHaveBeenCalled();
  });

  it('keys가 없으면 400', async () => {
    const res = await subscribe(
      makeRequest('http://localhost/api/push/subscribe', { endpoint: 'https://push.example/abc' })
    );
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/push/unsubscribe', () => {
  it('유효한 endpoint면 200과 함께 redis에서 삭제', async () => {
    const res = await unsubscribe(
      makeRequest('http://localhost/api/push/unsubscribe', {
        endpoint: 'https://push.example/abc',
      })
    );
    expect(res.status).toBe(200);
    expect(mockHdel).toHaveBeenCalledTimes(1);
  });

  it('endpoint가 없으면 400, redis를 건드리지 않음', async () => {
    const res = await unsubscribe(makeRequest('http://localhost/api/push/unsubscribe', {}));
    expect(res.status).toBe(400);
    expect(mockHdel).not.toHaveBeenCalled();
  });

  it('endpoint가 숫자면 크래시 대신 400을 반환', async () => {
    const res = await unsubscribe(
      makeRequest('http://localhost/api/push/unsubscribe', { endpoint: 999 })
    );
    expect(res.status).toBe(400);
    expect(mockHdel).not.toHaveBeenCalled();
  });
});
