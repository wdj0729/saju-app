import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

interface PersonData {
  name: string;
  ilgan: string;
  ohaeng: Record<string, number>;
}

interface CompatibilityAnalysisRequest {
  personA: PersonData;
  personB: PersonData;
  score: number;
  grade: string;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response('요청 형식이 잘못되었습니다.', { status: 400 });
  }

  const { personA, personB, score, grade } = body as CompatibilityAnalysisRequest;
  if (!personA?.ilgan || !personB?.ilgan || score == null || !grade) {
    return new Response('필수 파라미터가 누락되었습니다.', { status: 400 });
  }

  const nameA = personA.name || '첫 번째 분';
  const nameB = personB.name || '두 번째 분';

  const ohaengTextA = Object.entries(personA.ohaeng).map(([k, v]) => `${k} ${Number(v).toFixed(1)}`).join(' / ');
  const ohaengTextB = Object.entries(personB.ohaeng).map(([k, v]) => `${k} ${Number(v).toFixed(1)}`).join(' / ');

  try {
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `당신은 30년 경력의 명리학 전문가입니다. 두 사람의 사주 오행을 바탕으로 궁합을 한국어로 해석해주세요.

${nameA}: 일간 ${personA.ilgan}, 오행 분포 ${ohaengTextA}
${nameB}: 일간 ${personB.ilgan}, 오행 분포 ${ohaengTextB}
궁합 점수: ${score}점 (${grade})

**연애·감정**, **결혼·생활**, **직업·사회** 측면에서 각 2~3문장씩 구체적이고 친근한 말투로 설명해주세요.`,
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
          console.error('[compatibility-analysis] stream error:', err);
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
