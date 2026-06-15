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
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
