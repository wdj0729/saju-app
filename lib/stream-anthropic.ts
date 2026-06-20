import type { NextRequest } from 'next/server';
import type { MessageStreamParams } from '@anthropic-ai/sdk/resources/messages/messages';
import { anthropic } from './anthropic';

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

export function streamAnthropicResponse(params: MessageStreamParams): Response {
  const stream = anthropic.messages.stream(params);

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error('[stream-anthropic] error:', err);
        let message = '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
        if (err && typeof err === 'object' && 'status' in err) {
          const status = (err as { status: number }).status;
          if (status === 429) message = '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
          else if (status >= 500) message = 'AI 서비스에 일시적인 오류가 발생했어요.';
        }
        controller.error(new Error(message));
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export function streamAnthropicResponseWithCache(
  params: MessageStreamParams,
  saveFn: (text: string) => Promise<void>
): Response {
  const stream = anthropic.messages.stream(params);

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const chunks: string[] = [];
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            chunks.push(event.delta.text);
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
        void saveFn(chunks.join(''));
      } catch (err) {
        console.error('[stream-anthropic] error:', err);
        let message = '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.';
        if (err && typeof err === 'object' && 'status' in err) {
          const status = (err as { status: number }).status;
          if (status === 429) message = '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
          else if (status >= 500) message = 'AI 서비스에 일시적인 오류가 발생했어요.';
        }
        controller.error(new Error(message));
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
