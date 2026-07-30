const mockGet = jest.fn();
const mockSet = jest.fn();
const mockStream = jest.fn();

jest.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: jest.fn(() => ({
      get: (...args: unknown[]) => mockGet(...args),
      set: (...args: unknown[]) => mockSet(...args),
    })),
  },
}));

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      stream: (...args: unknown[]) => mockStream(...args),
    },
  }));
});

import {
  getRedisAiCache,
  setRedisAiCache,
  makeSajuAnalysisCacheKey,
  makeAiAnalysisCacheKey,
  makeYearlyFortuneCacheKey,
  streamAnthropicResponseWithRedisCache,
} from '../redis-ai-cache';
import type { PillarData } from '../stream-anthropic';

function textDelta(text: string) {
  return { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } };
}

function fakeAnthropicStream(events: unknown[]) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) return { value: events[i++], done: false };
          return { value: undefined, done: true };
        },
      };
    },
  };
}

const PILLARS = {
  year: { gan: '甲', ji: '子' } as PillarData,
  month: { gan: '乙', ji: '丑' } as PillarData,
  day: { gan: '丙', ji: '寅' } as PillarData,
  hour: null,
};

beforeEach(() => {
  mockGet.mockReset();
  mockSet.mockReset();
});

describe('getRedisAiCache', () => {
  it('값이 있으면 string 반환', async () => {
    mockGet.mockResolvedValueOnce('cached text');
    expect(await getRedisAiCache('key')).toBe('cached text');
  });

  it('값이 없으면 null 반환', async () => {
    mockGet.mockResolvedValueOnce(null);
    expect(await getRedisAiCache('key')).toBeNull();
  });

  it('Redis 에러 시 null 반환 (예외 미전파)', async () => {
    mockGet.mockRejectedValueOnce(new Error('connection error'));
    expect(await getRedisAiCache('key')).toBeNull();
  });
});

describe('setRedisAiCache', () => {
  it('redis.set을 key/value/ex 옵션과 함께 호출', async () => {
    mockSet.mockResolvedValueOnce('OK');
    await setRedisAiCache('key', 'text', 3600);
    expect(mockSet).toHaveBeenCalledWith('key', 'text', { ex: 3600 });
  });

  it('Redis 에러 시 예외 미전파', async () => {
    mockSet.mockRejectedValueOnce(new Error('fail'));
    await expect(setRedisAiCache('key', 'text')).resolves.toBeUndefined();
  });
});

describe('makeSajuAnalysisCacheKey', () => {
  it('시 없는 경우 x 포함', () => {
    const key = makeSajuAnalysisCacheKey(PILLARS, 'M', 1990, 2026);
    expect(key).toBe('server-ai:saju:v1:甲子.乙丑.丙寅.x-M-1990-2026');
  });

  it('시 있는 경우 포함', () => {
    const pillarsWithHour = { ...PILLARS, hour: { gan: '丁', ji: '卯' } as PillarData };
    const key = makeSajuAnalysisCacheKey(pillarsWithHour, 'F', 1990, 2026);
    expect(key).toBe('server-ai:saju:v1:甲子.乙丑.丙寅.丁卯-F-1990-2026');
  });

  it('gender 없으면 x', () => {
    const key = makeSajuAnalysisCacheKey(PILLARS, undefined, 1990, 2026);
    expect(key).toContain('-x-');
  });
});

describe('makeAiAnalysisCacheKey', () => {
  it('날짜 포함 키 생성', () => {
    const key = makeAiAnalysisCacheKey(PILLARS, 2026, 6, 20);
    expect(key).toBe('server-ai:fortune:v1:甲子.乙丑.丙寅.x:2026-6-20');
  });
});

describe('makeYearlyFortuneCacheKey', () => {
  it('fortuneYear 포함 키 생성', () => {
    const key = makeYearlyFortuneCacheKey(PILLARS, 'M', 2026);
    expect(key).toBe('server-ai:yearly:v1:甲子.乙丑.丙寅.x-M-2026');
  });
});

describe('streamAnthropicResponseWithRedisCache', () => {
  beforeEach(() => {
    mockStream.mockReset();
  });

  it('캐시 히트 시 스트리밍 없이 캐시된 텍스트를 바로 반환', async () => {
    mockGet.mockResolvedValueOnce('cached text');

    const res = await streamAnthropicResponseWithRedisCache({} as never, 'key', 3600);

    expect(await res.text()).toBe('cached text');
    expect(res.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(mockStream).not.toHaveBeenCalled();
  });

  it('캐시 미스 시 스트리밍하고 완료된 텍스트를 setRedisAiCache로 저장', async () => {
    mockGet.mockResolvedValueOnce(null);
    mockSet.mockResolvedValueOnce('OK');
    mockStream.mockReturnValue(fakeAnthropicStream([textDelta('안녕'), textDelta('하세요')]));

    const res = await streamAnthropicResponseWithRedisCache({} as never, 'key', 3600);

    expect(await res.text()).toBe('안녕하세요');
    expect(mockSet).toHaveBeenCalledWith('key', '안녕하세요', { ex: 3600 });
  });
});
