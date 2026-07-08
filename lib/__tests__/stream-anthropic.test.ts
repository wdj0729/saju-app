const mockStream = jest.fn();

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      stream: (...args: unknown[]) => mockStream(...args),
    },
  }));
});

import { streamAnthropicResponse, streamAnthropicResponseWithCache } from '../stream-anthropic';
import { STREAM_ERROR_MARKER } from '../stream-error-marker';

function textDelta(text: string) {
  return { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } };
}

// Builds a fake Anthropic MessageStream: yields `events` in order, then
// either ends normally or throws `errorAfter` once events are exhausted.
function fakeAnthropicStream(events: unknown[], errorAfter?: unknown) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        async next() {
          if (i < events.length) {
            return { value: events[i++], done: false };
          }
          if (errorAfter !== undefined) throw errorAfter;
          return { value: undefined, done: true };
        },
      };
    },
  };
}

beforeEach(() => {
  mockStream.mockReset();
});

describe('streamAnthropicResponse', () => {
  it('정상 스트리밍 시 전체 텍스트를 본문으로 반환', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([textDelta('안녕'), textDelta('하세요')]));

    const res = await streamAnthropicResponse({} as never);

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('안녕하세요');
  });

  it('첫 청크 전(연결 단계) 에러는 상태 코드와 본문에 담긴 에러 응답으로 반환', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([], new Error('auth failed')));

    const res = await streamAnthropicResponse({} as never);

    expect(res.ok).toBe(false);
    expect(await res.text()).toBe('분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
  });

  it('429 에러는 요청 과다 메시지로 매핑', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([], { status: 429 }));

    const res = await streamAnthropicResponse({} as never);

    expect(res.ok).toBe(false);
    expect(await res.text()).toBe('요청이 너무 많아요. 잠시 후 다시 시도해주세요.');
  });

  it('5xx 에러는 일시적 서비스 오류 메시지로 매핑', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([], { status: 503 }));

    const res = await streamAnthropicResponse({} as never);

    expect(res.ok).toBe(false);
    expect(await res.text()).toBe('AI 서비스에 일시적인 오류가 발생했어요.');
  });

  it('첫 청크 이후(스트리밍 도중) 에러는 이미 커밋된 200 응답 본문에 마커로 실어 보냄', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([textDelta('부분 결과')], { status: 500 }));

    const res = await streamAnthropicResponse({} as never);

    // 스트리밍이 이미 시작된 뒤라 상태 코드를 바꿀 수 없다 — 200으로 커밋된 채
    // 마커를 통해서만 에러를 전달할 수 있다는 것이 이 테스트의 핵심 가정.
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe(
      '부분 결과' + STREAM_ERROR_MARKER + 'AI 서비스에 일시적인 오류가 발생했어요.'
    );
  });
});

describe('streamAnthropicResponseWithCache', () => {
  it('정상 완료 시 saveFn을 전체 텍스트로 호출', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([textDelta('안녕'), textDelta('하세요')]));
    const saveFn = jest.fn().mockResolvedValue(undefined);

    const res = await streamAnthropicResponseWithCache({} as never, saveFn);
    await res.text();

    expect(saveFn).toHaveBeenCalledWith('안녕하세요');
  });

  it('연결 단계 에러 시 saveFn을 호출하지 않음', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([], new Error('auth failed')));
    const saveFn = jest.fn().mockResolvedValue(undefined);

    await streamAnthropicResponseWithCache({} as never, saveFn);

    expect(saveFn).not.toHaveBeenCalled();
  });

  it('스트리밍 도중 에러 시 부분 결과를 저장하지 않음', async () => {
    mockStream.mockReturnValue(fakeAnthropicStream([textDelta('부분 결과')], new Error('boom')));
    const saveFn = jest.fn().mockResolvedValue(undefined);

    const res = await streamAnthropicResponseWithCache({} as never, saveFn);
    await res.text();

    expect(saveFn).not.toHaveBeenCalled();
  });
});
