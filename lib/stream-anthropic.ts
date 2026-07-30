import type { NextRequest } from 'next/server';
import type {
  MessageStreamEvent,
  MessageStreamParams,
} from '@anthropic-ai/sdk/resources/messages/messages';
import { anthropic } from './anthropic';
import { STREAM_ERROR_MARKER } from './stream-error-marker';

export interface PillarData {
  gan: string;
  ji: string;
}

export function isPillarData(v: unknown): v is PillarData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).gan === 'string' &&
    typeof (v as Record<string, unknown>).ji === 'string'
  );
}

export interface NamedOhaengData {
  name: string;
  ilgan: string;
  ohaeng: Record<string, number>;
}

export function isNamedOhaengData(v: unknown): v is NamedOhaengData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === 'string' &&
    typeof (v as Record<string, unknown>).ilgan === 'string' &&
    typeof (v as Record<string, unknown>).ohaeng === 'object' &&
    (v as Record<string, unknown>).ohaeng !== null
  );
}

export async function parseBody<T>(
  req: NextRequest,
  validate: (v: unknown) => v is T
): Promise<{ data: T } | Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('요청 형식이 잘못되었어요.', { status: 400 });
  }
  if (!validate(body)) {
    return new Response('필수 파라미터가 누락되었어요.', { status: 400 });
  }
  return { data: body };
}

export function formatGender(gender?: 'M' | 'F'): string | undefined {
  if (gender === 'M') return '남성';
  if (gender === 'F') return '여성';
  return undefined;
}

export function formatOhaeng(ohaeng: Record<string, number>): string {
  return Object.entries(ohaeng)
    .map(([k, v]) => `${k} ${Number(v).toFixed(1)}`)
    .join(' / ');
}

export function formatPillars(pillars: {
  year: PillarData;
  month: PillarData;
  day: PillarData;
  hour: PillarData | null;
}): string {
  return [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');
}

function toFriendlyStreamErrorMessage(err: unknown): string {
  let message = '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 429) message = '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
    else if (typeof status === 'number' && status >= 500)
      message = 'AI 서비스에 일시적인 오류가 발생했어요.';
  }
  return message;
}

// Errors that happen before any bytes are sent can be reported with a normal
// error Response (status + text), which the client already handles via
// `!res.ok`. But once streaming has started, the response is committed to
// status 200 — calling controller.error() at that point just resets the
// connection (net::ERR_EMPTY_RESPONSE) and the message never reaches the
// client. So we buffer the first content chunk before creating the
// Response: a connect/auth/rate-limit error surfaces as a proper error
// Response, and only a failure *after* that first chunk falls back to the
// in-stream STREAM_ERROR_MARKER, which the client parses out of the text.
async function createAnthropicStreamResponse(
  params: MessageStreamParams,
  onComplete?: (text: string) => void
): Promise<Response> {
  const encoder = new TextEncoder();
  const chunks: string[] = [];
  let firstChunk: string | null = null;
  let iteratorDone = false;
  let iterator: AsyncIterator<MessageStreamEvent>;
  let abortUpstream: (() => void) | null = null;

  try {
    const stream = anthropic.messages.stream(params);
    abortUpstream = () => stream.abort();
    const streamIterator = stream[Symbol.asyncIterator]();
    while (firstChunk === null) {
      const { value, done } = await streamIterator.next();
      if (done) {
        iteratorDone = true;
        break;
      }
      if (value.type === 'content_block_delta' && value.delta.type === 'text_delta') {
        firstChunk = value.delta.text;
      }
    }
    iterator = streamIterator;
  } catch (err) {
    console.error('[stream-anthropic] error:', err);
    return new Response(toFriendlyStreamErrorMessage(err), { status: 502 });
  }

  if (firstChunk !== null) chunks.push(firstChunk);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (firstChunk !== null) controller.enqueue(encoder.encode(firstChunk));
        while (!iteratorDone) {
          const { value, done } = await iterator.next();
          if (done) break;
          if (value.type === 'content_block_delta' && value.delta.type === 'text_delta') {
            chunks.push(value.delta.text);
            controller.enqueue(encoder.encode(value.delta.text));
          }
        }
        controller.close();
        if (onComplete) onComplete(chunks.join(''));
      } catch (err) {
        console.error('[stream-anthropic] error:', err);
        try {
          controller.enqueue(
            encoder.encode(STREAM_ERROR_MARKER + toFriendlyStreamErrorMessage(err))
          );
          controller.close();
        } catch {
          // client already disconnected (see cancel() below) — nothing left to deliver
        }
      }
    },
    // Fires when the client disconnects mid-stream (tab closed, navigated
    // away). Without this the loop above keeps pulling from Anthropic and
    // the upstream request runs to completion server-side for nothing.
    cancel(reason) {
      console.error('[stream-anthropic] client disconnected, aborting upstream:', reason);
      abortUpstream?.();
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export function streamAnthropicResponse(params: MessageStreamParams): Promise<Response> {
  return createAnthropicStreamResponse(params);
}

export function streamAnthropicResponseWithCache(
  params: MessageStreamParams,
  saveFn: (text: string) => Promise<void>
): Promise<Response> {
  return createAnthropicStreamResponse(params, (text) => void saveFn(text));
}
