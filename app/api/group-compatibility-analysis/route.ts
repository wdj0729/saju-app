import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponseWithCache, formatOhaeng } from '@/lib/stream-anthropic';
import { AI_MODEL } from '@/lib/anthropic';
import { getRateLimitResponse } from '@/lib/rate-limit';
import { getRedisAiCache, setRedisAiCache, makeGroupAnalysisCacheKey } from '@/lib/redis-ai-cache';

interface MemberData {
  name: string;
  ilgan: string;
  ohaeng: Record<string, number>;
}

interface GroupAnalysisRequest {
  members: MemberData[];
  averageScore: number;
}

function isMemberData(v: unknown): v is MemberData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).name === 'string' &&
    typeof (v as Record<string, unknown>).ilgan === 'string' &&
    typeof (v as Record<string, unknown>).ohaeng === 'object' &&
    (v as Record<string, unknown>).ohaeng !== null
  );
}

function isGroupAnalysisRequest(v: unknown): v is GroupAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    Array.isArray(r.members) &&
    r.members.length >= 2 &&
    r.members.every(isMemberData) &&
    typeof r.averageScore === 'number'
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const rateLimitRes = await getRateLimitResponse(req);
  if (rateLimitRes) return rateLimitRes;

  const parsed = await parseBody(req, isGroupAnalysisRequest);
  if (parsed instanceof Response) return parsed;

  const { members, averageScore } = parsed.data;
  const cacheKey = makeGroupAnalysisCacheKey(
    members.map((m) => m.ilgan),
    averageScore
  );
  const cached = await getRedisAiCache(cacheKey);
  if (cached) {
    return new Response(cached, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
  const N = members.length;

  const memberLines = members
    .map((m, i) => {
      const name = m.name || `${i + 1}번째 분`;
      return `${i + 1}. ${name}: 일간 ${m.ilgan}, 오행 분포 ${formatOhaeng(m.ohaeng)}`;
    })
    .join('\n');

  try {
    return streamAnthropicResponseWithCache(
      {
        model: AI_MODEL,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `당신은 30년 경력의 명리학 전문가입니다. 다음 ${N}명의 사주 오행을 분석해 이 모임의 전체 역학을 한국어로 설명해주세요.

${memberLines}
전체 조화도: ${averageScore}점

**그룹의 강점**, **주의할 관계**, **함께 시너지를 내는 방법** 세 가지 측면에서 각 2~3문장씩 따뜻하고 구체적인 말투로 설명해주세요.`,
          },
        ],
      },
      (text) => setRedisAiCache(cacheKey, text, 86400)
    );
  } catch (error) {
    console.error('[group-compatibility-analysis] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
