/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from 'util';
import { renderHook, act } from '@testing-library/react';
import { useMonthlyFortune, type MonthlyFortuneInput } from '@/hooks/useMonthlyFortune';
import { STREAM_ERROR_MARKER } from '@/lib/stream-error-marker';

global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.TextEncoder = TextEncoder as typeof global.TextEncoder;

beforeAll(() => {
  global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = jest.fn();
});

beforeEach(() => {
  localStorage.clear();
});

function readerFromChunks(chunks: string[]) {
  let i = 0;
  return {
    read: jest.fn(async () => {
      if (i < chunks.length) {
        return { done: false, value: new TextEncoder().encode(chunks[i++]) };
      }
      return { done: true, value: undefined };
    }),
    cancel: jest.fn(async () => undefined),
  };
}

function mockOkFetch(chunks: string[]) {
  return jest.fn().mockResolvedValue({
    ok: true,
    text: async () => '',
    body: { getReader: () => readerFromChunks(chunks) },
  });
}

const INPUT: MonthlyFortuneInput = {
  ilgan: '갑',
  ohaeng: { 목: 2, 화: 1, 토: 1, 금: 2, 수: 2 },
  pillars: {
    year: { gan: '갑', ji: '자', ganElement: '목', jiElement: '수' },
    month: { gan: '을', ji: '축', ganElement: '목', jiElement: '토' },
    day: { gan: '병', ji: '인', ganElement: '화', jiElement: '목' },
    hour: null,
  },
};

describe('useMonthlyFortune', () => {
  it('스트리밍 도중 에러가 나도 이미 받은 부분 결과를 지우지 않는다', async () => {
    global.fetch = mockOkFetch([
      '[총운]\n순조로운 한 달',
      STREAM_ERROR_MARKER + 'AI 서비스에 일시적인 오류가 발생했어요.',
    ]);
    const { result } = renderHook(() => useMonthlyFortune(INPUT));

    await act(async () => {
      result.current.requestAi();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.aiError).toBe('AI 서비스에 일시적인 오류가 발생했어요.');
    expect(result.current.sections['총운']).toBe('순조로운 한 달');
  });
});
