import { NextRequest } from 'next/server';
import { parseBody, streamAnthropicResponse, formatOhaeng } from '@/lib/stream-anthropic';

interface PillarData {
  gan: string;
  ji: string;
}

interface CurrentDaewoon {
  gan: string;
  ji: string;
  startAge: number;
  endAge: number;
}

interface SajuAnalysisRequest {
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
  birthYear: number;
  currentAge: number;
  currentDaewoon?: CurrentDaewoon;
}

function isPillarData(v: unknown): v is PillarData {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as Record<string, unknown>).gan === 'string' &&
    typeof (v as Record<string, unknown>).ji === 'string'
  );
}

function isSajuAnalysisRequest(v: unknown): v is SajuAnalysisRequest {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  const pillars = r.pillars as Record<string, unknown> | undefined;
  return (
    typeof r.ilgan === 'string' &&
    typeof r.ohaeng === 'object' &&
    r.ohaeng !== null &&
    typeof r.birthYear === 'number' &&
    typeof r.currentAge === 'number' &&
    typeof pillars === 'object' &&
    pillars !== null &&
    isPillarData(pillars.year) &&
    isPillarData(pillars.month) &&
    isPillarData(pillars.day)
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const parsed = await parseBody(req, isSajuAnalysisRequest);
  if (parsed instanceof Response) return parsed;
  const { ilgan, ohaeng, pillars, name, gender, birthYear, currentAge, currentDaewoon } =
    parsed.data;

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

  const dayPillar = `${pillars.day.gan}${pillars.day.ji}`;
  const ohaengText = formatOhaeng(ohaeng);
  const genderText = gender === 'M' ? '남성' : gender === 'F' ? '여성' : undefined;
  const daewoonText = currentDaewoon
    ? `${currentDaewoon.gan}${currentDaewoon.ji} (${currentDaewoon.startAge}~${currentDaewoon.endAge}세)`
    : undefined;

  const lines = [
    '당신은 30년 경력의 명리학 전문가입니다.',
    '',
    '**사주 정보**',
    `- 사주팔자: ${pillarText}`,
    `- 일간: ${ilgan}`,
    `- 일주: ${dayPillar}`,
    `- 오행 분포: ${ohaengText}`,
    name ? `- 이름: ${name}` : null,
    genderText ? `- 성별: ${genderText}` : null,
    `- 출생 연도: ${birthYear}년`,
    `- 만 나이: ${currentAge}세`,
    daewoonText ? `- 현재 대운: ${daewoonText}` : null,
    '',
    '위 사주를 바탕으로 아래 5가지 항목을 각 4~5문장씩 분석해주세요.',
    '말투 규칙: 친근하고 쉬운 일상 언어로 쓰세요. 명리학 전문 용어(일간, 오행, 대운, 비겁, 관성 등)는 쓰지 마세요. 꼭 써야 할 경우 괄호 안에 쉬운 말로 풀어 쓰세요. 예: "목(나무 기운)". 사주를 전혀 모르는 사람도 바로 이해할 수 있어야 합니다.',
    '형식 규칙: 반드시 아래 마커 5개만 그대로 사용하세요. --- 구분선, 총평, 헤더(#), 마크다운 장식 일체를 쓰지 마세요. [직업운] 내용 뒤에 바로 응답을 끝내세요.',
    '',
    '[성격분석]',
    '(이 사람의 성격, 기질, 강점, 약점을 구체적인 상황 예시와 함께)',
    '',
    '[재물운]',
    '(돈을 버는 방식, 소비 습관, 지금 시기의 재물 흐름을 실생활 언어로)',
    '',
    '[건강운]',
    '(어떤 부분을 조심해야 하는지, 왜 그런지 이유와 함께 실천 가능한 관리법으로)',
    '',
    '[연애운]',
    '(연애 스타일, 잘 맞는 상대 유형, 지금 인연 흐름을 구체적으로)',
    '',
    '[직업운]',
    '(잘 맞는 직업 분야와 이유, 지금 커리어에서 집중할 점. 이후 추가 내용 없이 여기서 끝내세요.)',
  ]
    .filter((l): l is string => l !== null)
    .join('\n');

  try {
    return streamAnthropicResponse({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: lines }],
    });
  } catch {
    return new Response('AI 분석 요청에 실패했습니다.', { status: 500 });
  }
}
