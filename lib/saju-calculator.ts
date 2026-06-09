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

// 나머지 함수들은 이후 Task에서 구현 — 지금은 throw로 유지
function getMonthJiIndex(_y: number, _m: number, _d: number): number { throw new Error('not implemented'); }
export function getMonthPillar(_y: number, _m: number, _d: number, _yearGan: string): Pillar { throw new Error('not implemented'); }

const DAY_REF_MS    = Date.UTC(1900, 0, 31);
const DAY_REF_INDEX = 10;
export function getDayPillar(_y: number, _m: number, _d: number): Pillar { throw new Error('not implemented'); }

export function getHourPillar(_hour: number, _dayGan: string): Pillar { throw new Error('not implemented'); }

export function calcOhaeng(_pillars: (Pillar | null)[]): Record<Ohaeng, number> { throw new Error('not implemented'); }

export function calculateSaju(_input: SajuInput): SajuResult { throw new Error('not implemented'); }
