import type { Ohaeng } from './saju-data';

export interface OhaengAdviceTip {
  label: string;
  tip: string;
}

export interface OhaengAdviceEntry {
  hanja: string;
  particle: '이' | '가';
  color: OhaengAdviceTip;
  direction: OhaengAdviceTip;
  food: OhaengAdviceTip;
  activity: OhaengAdviceTip;
}

export const OHAENG_ADVICE: Record<Ohaeng, OhaengAdviceEntry> = {
  목: {
    hanja: '木',
    particle: '이',
    color: { label: '색상', tip: '초록·청록 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '동쪽이 유리해요. 동향 자리에 앉아보세요' },
    food: { label: '음식', tip: '신 음식, 부추·쑥·나물류가 목기(木氣)를 보충해요' },
    activity: { label: '활동', tip: '산책, 스트레칭, 원예로 목의 기운을 채워보세요' },
  },
  화: {
    hanja: '火',
    particle: '가',
    color: { label: '색상', tip: '빨강·주황 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '남쪽이 유리해요. 남향 자리에 앉아보세요' },
    food: { label: '음식', tip: '쓴 음식, 고추·홍고추·견과류가 화기(火氣)를 보충해요' },
    activity: { label: '활동', tip: '러닝, 댄스, 사교 모임으로 화의 기운을 채워보세요' },
  },
  토: {
    hanja: '土',
    particle: '가',
    color: { label: '색상', tip: '황토·노랑 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '중앙이 안정적이에요. 공간의 중심을 활용하세요' },
    food: { label: '음식', tip: '단 음식, 고구마·호박·곡물류가 토기(土氣)를 보충해요' },
    activity: { label: '활동', tip: '요가, 도예, 일기 쓰기로 토의 기운을 채워보세요' },
  },
  금: {
    hanja: '金',
    particle: '이',
    color: { label: '색상', tip: '흰색·은색 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '서쪽이 유리해요. 서향 자리에 앉아보세요' },
    food: { label: '음식', tip: '매운 음식, 무·양파·마늘이 금기(金氣)를 보충해요' },
    activity: { label: '활동', tip: '등산, 격투기, 규칙적인 루틴이 금의 기운을 채워줘요' },
  },
  수: {
    hanja: '水',
    particle: '가',
    color: { label: '색상', tip: '검정·짙은 파랑 계열 소품이나 옷을 가까이 두세요' },
    direction: { label: '방향', tip: '북쪽이 유리해요. 북향 자리에 앉아보세요' },
    food: { label: '음식', tip: '짠 음식, 해산물·콩·검은깨가 수기(水氣)를 보충해요' },
    activity: { label: '활동', tip: '수영, 명상, 물가 산책으로 수의 기운을 채워보세요' },
  },
};

const ORDER: readonly Ohaeng[] = ['목', '화', '토', '금', '수'];

export function getMostLackingOhaeng(ohaeng: Record<Ohaeng, number>): Ohaeng | null {
  const min = Math.min(...ORDER.map((k) => ohaeng[k]));
  const max = Math.max(...ORDER.map((k) => ohaeng[k]));
  if (min === max) return null;
  return ORDER.find((k) => ohaeng[k] === min) || null;
}
