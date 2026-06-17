import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponse, formatOhaeng } from '@/lib/stream-anthropic';
import { AI_MODEL } from '@/lib/anthropic';

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

function isPersonData(v: unknown): v is PersonData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === 'string' &&
    typeof (v as Record<string, unknown>).ilgan === 'string' &&
    typeof (v as Record<string, unknown>).ohaeng === 'object' &&
    (v as Record<string, unknown>).ohaeng !== null
  );
}

function isCompatibilityAnalysisRequest(v: unknown): v is CompatibilityAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    isPersonData(r.personA) &&
    isPersonData(r.personB) &&
    typeof r.score === 'number' &&
    typeof r.grade === 'string'
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const parsed = await parseBody(req, isCompatibilityAnalysisRequest);
  if (parsed instanceof Response) return parsed;
  const { personA, personB, score, grade } = parsed.data;

  const nameA = personA.name || '첫 번째 분';
  const nameB = personB.name || '두 번째 분';

  const ohaengTextA = formatOhaeng(personA.ohaeng);
  const ohaengTextB = formatOhaeng(personB.ohaeng);

  try {
    return streamAnthropicResponse({
      model: AI_MODEL,
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
  } catch (error) {
    console.error('[compatibility-analysis] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
