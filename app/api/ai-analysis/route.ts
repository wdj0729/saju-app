import { NextRequest } from 'next/server';
import {
  parseBody,
  streamAnthropicResponse,
  formatOhaeng,
  formatPillars,
  isPillarData,
  type PillarData,
} from '@/lib/stream-anthropic';
import { AI_MODEL } from '@/lib/anthropic';
import { checkRateLimit } from '@/lib/rate-limit';

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

function isAiAnalysisRequest(v: unknown): v is AiAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
  if (!checkRateLimit(ip)) {
    return new Response('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }
  const parsed = await parseBody(req, isAiAnalysisRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars } = parsed.data;

  const pillarText = formatPillars(pillars);

  const ohaengText = formatOhaeng(ohaeng);

  const today = new Date();
  const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  try {
    return streamAnthropicResponse({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `당신은 30년 경력의 명리학 전문가입니다. 아래 사주를 보고 오늘의 운세를 한국어로 해석해주세요.

오늘 날짜: ${todayStr}
사주 원국: ${pillarText}
일간: ${ilgan}
오행 분포: ${ohaengText}

**대운**, **재물**, **건강**, **인간관계** 항목별로 각 2~3문장씩 구체적이고 친근한 말투로 설명해주세요.`,
        },
      ],
    });
  } catch (error) {
    console.error('[ai-analysis] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
