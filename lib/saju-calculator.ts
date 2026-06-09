import { Solar, Lunar } from 'lunar-javascript';
import {
  GAN, JI, GAN_OHAENG, JI_OHAENG, JIJANGGAN,
  OHODUN, OJADUN, JEOLGI_JI,
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

function indexToPillar(index: number): Pillar {
  const i = ((index % 60) + 60) % 60;
  const gan = GAN[i % 10];
  const ji = JI[i % 12];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

function getJieQiName(y: number, m: number, d: number): string {
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
    const inputMs  = Date.UTC(y, m - 1, d);
    const ipchunMs = Date.UTC(y, 1, ipchunDay);
    if (inputMs < ipchunMs) targetYear = y - 1;
  }

  const index = ((targetYear - 4) % 60 + 60) % 60;
  return indexToPillar(index);
}

function getMonthJiIndex(y: number, m: number, d: number): number {
  // 입력일 기준 최근 35일을 순방향 스캔해 가장 마지막 절기(節) 확인
  const inputMs = Date.UTC(y, m - 1, d);
  let jiIndex = -1;

  for (let offset = 35; offset >= 0; offset--) {
    const ms   = inputMs - offset * 86400000;
    const date = new Date(ms);
    const name = getJieQiName(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
    );
    if (Object.prototype.hasOwnProperty.call(JEOLGI_JI, name)) {
      jiIndex = JEOLGI_JI[name];
    }
  }

  if (jiIndex === -1) throw new Error(`절기 탐색 실패: ${y}-${m}-${d}`);
  return jiIndex;
}

export function getMonthPillar(y: number, m: number, d: number, yearGan: string): Pillar {
  const monthJiIndex  = getMonthJiIndex(y, m, d);
  const yearGanIndex  = GAN.indexOf(yearGan as (typeof GAN)[number]);
  const inGanStart    = OHODUN[yearGanIndex % 5];          // 인월 시작 月干 인덱스
  const monthOffset   = (monthJiIndex - 2 + 12) % 12;     // 인월로부터 오프셋
  const monthGanIndex = (inGanStart + monthOffset) % 10;

  const gan = GAN[monthGanIndex];
  const ji  = JI[monthJiIndex];
  return { gan, ji, ganElement: GAN_OHAENG[gan], jiElement: JI_OHAENG[ji] };
}

const DAY_REF_MS    = Date.UTC(1900, 0, 31);
const DAY_REF_INDEX = 10;
export function getDayPillar(_y: number, _m: number, _d: number): Pillar { throw new Error('not implemented'); }

export function getHourPillar(_hour: number, _dayGan: string): Pillar { throw new Error('not implemented'); }

export function calcOhaeng(_pillars: (Pillar | null)[]): Record<Ohaeng, number> { throw new Error('not implemented'); }

export function calculateSaju(_input: SajuInput): SajuResult { throw new Error('not implemented'); }
