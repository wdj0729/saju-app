import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

interface PillarData {
  gan: string;
  ji: string;
}

interface AiAnalysisRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
}

function isPillarData(v: unknown): v is PillarData {
  return (
    typeof v === 'object' && v !== null &&
    typeof (v as Record<string, unknown>).gan === 'string' &&
    typeof (v as Record<string, unknown>).ji === 'string'
  );
}

function isAiAnalysisRequest(v: unknown): v is AiAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' && r.ohaeng !== null &&
    typeof r.pillars === 'object' && r.pillars !== null &&
    isPillarData((r.pillars as Record<string, unknown>).year) &&
    isPillarData((r.pillars as Record<string, unknown>).month) &&
    isPillarData((r.pillars as Record<string, unknown>).day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('요청 형식이 잘못되었습니다.', { status: 400 });
  }

  if (!isAiAnalysisRequest(body)) {
    return new Response('필수 파라미터가 누락되었습니다.', { status: 400 });
  }

  const { ilgan, ohaeng, pillars } = body;

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

  const ohaengText = Object.entries(ohaeng)
    .map(([k, v]) => `${k} ${Number(v).toFixed(1)}`)
    .join(' / ');

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `당신은 30년 경력의 명리학 전문가입니다. 아래 사주를 보고 오늘의 운세를 한국어로 해석해주세요.

사주 원국: ${pillarText}
일간: ${ilgan}
오행 분포: ${ohaengText}

**대운**, **재물**, **건강**, **인간관계** 항목별로 각 2~3문장씩 구체적이고 친근한 말투로 설명해주세요.`,
        },
      ],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error('[ai-analysis] stream error:', err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch {
    return new Response('AI 분석 요청에 실패했습니다.', { status: 500 });
  }
}
