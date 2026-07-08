/**
 * @jest-environment jsdom
 */
import { TextDecoder, TextEncoder } from 'util';
import { renderHook, act } from '@testing-library/react';
import { useStreamingRequest } from '@/hooks/useStreamingRequest';
import { STREAM_ERROR_MARKER } from '@/lib/stream-error-marker';

// jsdom doesn't provide these globally.
global.TextDecoder = TextDecoder as typeof global.TextDecoder;
global.TextEncoder = TextEncoder as typeof global.TextEncoder;

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

beforeAll(() => {
  global.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  }) as typeof requestAnimationFrame;
  global.cancelAnimationFrame = jest.fn();
});

function setup() {
  const onStart = jest.fn();
  const onChunk = jest.fn();
  const onComplete = jest.fn();
  const onError = jest.fn();
  const { result } = renderHook(() =>
    useStreamingRequest({ onStart, onChunk, onComplete, onError })
  );
  return { result, onStart, onChunk, onComplete, onError };
}

describe('useStreamingRequest', () => {
  it('정상 스트리밍 시 청크를 합쳐 onComplete 호출', async () => {
    global.fetch = mockOkFetch(['안녕', '하세요']);
    const { result, onComplete, onError } = setup();

    await act(async () => {
      await result.current.request('/api/test', {});
    });

    expect(onComplete).toHaveBeenCalledWith('안녕하세요');
    expect(onError).not.toHaveBeenCalled();
  });

  it('!res.ok 응답은 본문 텍스트를 에러 메시지로 사용', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      text: async () => '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    });
    const { result, onError, onComplete } = setup();

    await act(async () => {
      await result.current.request('/api/test', {});
    });

    expect(onError).toHaveBeenCalledWith('분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('스트림 도중 STREAM_ERROR_MARKER를 만나면 부분 결과를 보존하고 onError를 호출, onComplete는 호출하지 않음', async () => {
    global.fetch = mockOkFetch([
      '부분 결과',
      STREAM_ERROR_MARKER + 'AI 서비스에 일시적인 오류가 발생했어요.',
    ]);
    const { result, onChunk, onComplete, onError } = setup();

    await act(async () => {
      await result.current.request('/api/test', {});
    });

    expect(onChunk).toHaveBeenCalledWith('부분 결과');
    expect(onError).toHaveBeenCalledWith('AI 서비스에 일시적인 오류가 발생했어요.');
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('마커 뒤에 메시지가 없으면 기본 에러 메시지를 사용', async () => {
    global.fetch = mockOkFetch([STREAM_ERROR_MARKER]);
    const { result, onError } = setup();

    await act(async () => {
      await result.current.request('/api/test', {});
    });

    expect(onError).toHaveBeenCalledWith('분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
  });

  it('스트리밍 도중 abort() 호출 시 즉시 isStreaming=false가 되고, 이어지는 AbortError는 onComplete/onError 없이 조용히 무시됨', async () => {
    let rejectRead!: (err: unknown) => void;
    const pendingRead = new Promise((_resolve, reject) => {
      rejectRead = reject;
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
      body: {
        getReader: () => ({
          read: jest.fn(() => pendingRead),
          cancel: jest.fn(async () => undefined),
        }),
      },
    });

    const { result, onComplete, onError } = setup();

    let requestPromise!: Promise<void>;
    await act(async () => {
      requestPromise = result.current.request('/api/test', {});
      // fetch()가 resolve되고 첫 reader.read()가 걸릴 때까지 마이크로태스크를 흘려보낸다.
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.abort();
    });

    // 실제 fetch가 취소를 완료하기 전이라도 UI는 즉시 중단 상태를 반영해야 한다.
    expect(result.current.isStreaming).toBe(false);

    await act(async () => {
      rejectRead(new DOMException('The user aborted a request.', 'AbortError'));
      await requestPromise;
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
