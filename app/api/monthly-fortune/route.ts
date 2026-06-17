import { NextRequest } from 'next/server';
import {
  parseBody,
  streamAnthropicResponse,
  formatOhaeng,
  formatPillars,
  isPillarData,
  type PillarData,
} from '@/lib/stream-anthropic';
import { getFortuneYear } from '@/lib/constants';
import { AI_MODEL } from '@/lib/anthropic';
import { checkRateLimit } from '@/lib/rate-limit';

const ILGAN_VALUES = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const MONTHLY_FORTUNE_MAX_TOKENS = 1000;

interface MonthlyFortuneRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
  month: number;
  name?: string;
  gender?: 'M' | 'F';
}

function isMonthlyFortuneRequest(v: unknown): v is MonthlyFortuneRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    ILGAN_VALUES.includes(r.ilgan as (typeof ILGAN_VALUES)[number]) &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof r.month === 'number' &&
    Number.isInteger(r.month) &&
    r.month >= 1 &&
    r.month <= 12 &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day) &&
    (pillars.hour === null ||
      pillars.hour === undefined ||
      isPillarData(pillars.hour as unknown)) &&
    (r.name === undefined || (typeof r.name === 'string' && r.name.length <= 50))
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
  const parsed = await parseBody(req, isMonthlyFortuneRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, month, name, gender } = parsed.data;
  const fortuneYear = getFortuneYear();

  const pillarText = formatPillars(pillars);

  const ohaengText = formatOhaeng(ohaeng);
  const genderText = gender === 'M' ? '남성' : gender === 'F' ? '여성' : undefined;

  const lines = [
    '당신은 30년 경력의 명리학 전문가입니다.',
    '',
    '**사주 정보**',
    `- 사주팔자: ${pillarText}`,
    `- 일간: ${ilgan}`,
    `- 오행 분포: ${ohaengText}`,
    name ? `- 이름: ${name}` : null,
    genderText ? `- 성별: ${genderText}` : null,
    '',
    `위 사주를 바탕으로 ${fortuneYear}년 ${month}월 운세를 아래 5가지 항목으로 분석해주세요.`,
    '말투 규칙: 친근하고 쉬운 일상 언어로 쓰세요. 명리학 전문 용어는 쓰지 마세요. 꼭 써야 할 경우 괄호 안에 쉬운 말로 풀어 쓰세요.',
    '형식 규칙: 반드시 아래 마커 5개만 그대로 사용하세요. --- 구분선, 헤더(#), 마크다운 장식 일체를 쓰지 마세요. 각 항목은 2~3문장으로 쓰세요. [연애운] 내용 뒤에 바로 응답을 끝내세요.',
    '',
    '[총운]',
    `(${fortuneYear}년 ${month}월 전체 기운과 이 달의 핵심 흐름)`,
    '',
    '[직업운]',
    `(${month}월 커리어·직장에서 주목할 흐름과 조언)`,
    '',
    '[재물운]',
    `(${month}월 돈 흐름과 조언)`,
    '',
    '[건강운]',
    `(${month}월 건강에서 조심할 부분과 관리법)`,
    '',
    '[연애운]',
    `(${month}월 연애·관계 흐름과 조언. 이후 추가 내용 없이 여기서 끝내세요.)`,
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: AI_MODEL,
      max_tokens: MONTHLY_FORTUNE_MAX_TOKENS,
      messages: [{ role: 'user', content: lines }],
    });
  } catch (error) {
    console.error('[monthly-fortune] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
