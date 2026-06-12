import { NextRequest } from 'next/server';
import {
  parseBody,
  streamAnthropicResponse,
  formatOhaeng,
  isPillarData,
  type PillarData,
} from '@/lib/stream-anthropic';
import { YEARLY_FORTUNE_YEAR, YEARLY_FORTUNE_GANJEE } from '@/lib/constants';

interface YearlyFortuneRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
  name?: string;
  gender?: 'M' | 'F';
}

function isYearlyFortuneRequest(v: unknown): v is YearlyFortuneRequest {
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
  const parsed = await parseBody(req, isYearlyFortuneRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, name, gender } = parsed.data;

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

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
    `위 사주를 바탕으로 ${YEARLY_FORTUNE_YEAR}년 ${YEARLY_FORTUNE_GANJEE} 신년운세를 아래 5가지 항목으로 분석해주세요.`,
    '말투 규칙: 친근하고 쉬운 일상 언어로 쓰세요. 명리학 전문 용어는 쓰지 마세요. 꼭 써야 할 경우 괄호 안에 쉬운 말로 풀어 쓰세요. 사주를 전혀 모르는 사람도 바로 이해할 수 있어야 합니다.',
    '형식 규칙: 반드시 아래 마커 5개만 그대로 사용하세요. --- 구분선, 헤더(#), 마크다운 장식 일체를 쓰지 마세요. 각 항목은 3~4문장으로 쓰세요. [연애운] 내용 뒤에 바로 응답을 끝내세요.',
    '',
    '[총운]',
    `(${YEARLY_FORTUNE_YEAR}년 전체 기운과 이 사람에게 어떤 한 해가 될지 핵심만)`,
    '',
    '[직업운]',
    '(올해 커리어·직장에서 주목할 흐름과 조언)',
    '',
    '[재물운]',
    '(올해 돈 흐름, 수입·지출의 특징과 조언)',
    '',
    '[건강운]',
    '(올해 건강에서 조심할 부분과 실천 가능한 관리법)',
    '',
    '[연애운]',
    '(올해 연애·관계에서의 흐름과 조언. 이후 추가 내용 없이 여기서 끝내세요.)',
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: lines }],
    });
  } catch (error) {
    console.error('[yearly-fortune] AI request failed:', error);
    return new Response('AI 분석 요청에 실패했어요.', { status: 500 });
  }
}
