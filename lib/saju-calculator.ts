import { Solar, Lunar } from 'lunar-javascript';
import {
  GAN,
  JI,
  GAN_OHAENG,
  JI_OHAENG,
  JIJANGGAN,
  OHODUN,
  OJADUN,
  JEOLGI_JI,
  type Ohaeng,
} from './saju-data';

export interface Pillar {
  gan: string;
  ji: string;
  ganElement: Ohaeng;
  jiElement: Ohaeng;
}

export interface SajuResult {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
  ilgan: string;
  ohaeng: Record<Ohaeng, number>;
}

export interface SajuInput {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
}

export function toSolarDate(
  year: number,
  month: number,
  day: number,
  isLunar: boolean
): { year: number; month: number; day: number } {
  if (!isLunar) return { year, month, day };
  const solar = Lunar.fromYmd(year, month, day).getSolar();
  return { year: solar.getYear(), month: solar.getMonth(), day: solar.getDay() };
}

export function indexToPillar(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  const gan = GAN[i % 10];
  const ji = JI[i % 12];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

export function getJieQiName(y: number, m: number, d: number): string {
  return Solar.fromYmd(y, m, d).getLunar().getJieQi();
}

export function getYearPillar(y: number, m: number, d: number): Pillar {
  // 해당 년도 입춘(立春) 날짜 탐색 (2월 1~10일 범위)
  let ipchunDay = -1;
  for (let dd = 1; dd <= 10; dd++) {
    if (getJieQiName(y, 2, dd) === '立春') {
      ipchunDay = dd;
      break;
    }
  }

  let targetYear = y;
  if (ipchunDay !== -1) {
    const inputMs = Date.UTC(y, m - 1, d);
    const ipchunMs = Date.UTC(y, 1, ipchunDay);
    if (inputMs < ipchunMs) targetYear = y - 1;
  }

  const index = (((targetYear - 4) % 60) + 60) % 60;
  return indexToPillar(index);
}

function getMonthJiIndex(y: number, m: number, d: number): number {
  const inputMs = Date.UTC(y, m - 1, d);

  for (let offset = 0; offset <= 35; offset++) {
    const ms = inputMs - offset * 86400000;
    const date = new Date(ms);
    const name = getJieQiName(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    if (Object.prototype.hasOwnProperty.call(JEOLGI_JI, name)) {
      return JEOLGI_JI[name];
    }
  }

  throw new Error(`절기 탐색 실패: ${y}-${m}-${d}`);
}

export function getMonthPillar(y: number, m: number, d: number, yearGan: string): Pillar {
  const monthJiIndex = getMonthJiIndex(y, m, d);
  const yearGanIndex = GAN.indexOf(yearGan as (typeof GAN)[number]);
  const inGanStart = OHODUN[yearGanIndex % 5]; // 인월 시작 月干 인덱스
  const monthOffset = (monthJiIndex - 2 + 12) % 12; // 인월로부터 오프셋
  const monthGanIndex = (inGanStart + monthOffset) % 10;

  const gan = GAN[monthGanIndex];
  const ji = JI[monthJiIndex];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

const DAY_REF_MS = Date.UTC(1900, 0, 31); // 1900-01-31 UTC 자정
const DAY_REF_INDEX = 40; // 甲辰 = 60갑자 인덱스 40

export function getDayPillar(y: number, m: number, d: number): Pillar {
  const inputMs = Date.UTC(y, m - 1, d);
  const daysDiff = Math.round((inputMs - DAY_REF_MS) / 86400000);
  const index = (((daysDiff + DAY_REF_INDEX) % 60) + 60) % 60;
  return indexToPillar(index);
}

function hourToJiIndex(hour: number): number {
  if (hour === 23) return 0; // 야자시는 당일 子時로 처리 (설계 의도)
  return Math.floor((hour + 1) / 2);
}

export function getHourPillar(hour: number, dayGan: string): Pillar {
  const jiIndex = hourToJiIndex(hour);
  const dayGanIndex = GAN.indexOf(dayGan as (typeof GAN)[number]);
  const hourGanStart = OJADUN[dayGanIndex % 5];
  const hourGanIndex = (hourGanStart + jiIndex) % 10;

  const gan = GAN[hourGanIndex];
  const ji = JI[jiIndex];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

export function calcOhaeng(pillars: (Pillar | null)[]): Record<Ohaeng, number> {
  const result: Record<Ohaeng, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  for (const pillar of pillars) {
    if (!pillar) continue;

    result[pillar.ganElement] += 1.0; // 천간
    result[pillar.jiElement] += 1.0; // 지지 표면

    const jjg = JIJANGGAN[pillar.ji];
    result[GAN_OHAENG[jjg[0]]] += 0.5; // 여기
    if (jjg.length === 3) result[GAN_OHAENG[jjg[1]]] += 0.5; // 중기
    result[GAN_OHAENG[jjg.at(-1)!]] += 1.0; // 정기
  }

  return result;
}

export function calculateSaju(input: SajuInput): SajuResult {
  const { hour, isLunar } = input;
  const { year, month, day } = toSolarDate(input.year, input.month, input.day, isLunar);

  const yearPillar = getYearPillar(year, month, day);
  const monthPillar = getMonthPillar(year, month, day, yearPillar.gan);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = hour !== null ? getHourPillar(hour, dayPillar.gan) : null;

  return {
    year: yearPillar,
    month: monthPillar,
    day: dayPillar,
    hour: hourPillar,
    ilgan: dayPillar.gan,
    ohaeng: calcOhaeng([yearPillar, monthPillar, dayPillar, hourPillar]),
  };
}
