import { Lunar } from 'lunar-javascript';
import { GAN, JI, GAN_OHAENG, JI_OHAENG, JEOLGI_JI } from './saju-data';
import type { Ohaeng } from './saju-data';
import type { Pillar, SajuInput } from './saju-calculator';
import { getJieQiName } from './saju-calculator';

export interface DaewoonPillar {
  gan: string;
  ji: string;
  ganElement: Ohaeng;
  jiElement: Ohaeng;
  startAge: number;
  endAge: number;
}

export interface DaewoonResult {
  daewoonSu: number;
  direction: '순행' | '역행';
  pillars: DaewoonPillar[];
}

const YIN_GAN = new Set(['乙', '丁', '己', '辛', '癸']);

function isForward(yearGan: string, gender: 'M' | 'F'): boolean {
  const isYangYear = !YIN_GAN.has(yearGan);
  return (isYangYear && gender === 'M') || (!isYangYear && gender === 'F');
}

function findJeolgiDays(y: number, m: number, d: number, direction: 1 | -1): number {
  const baseMs = Date.UTC(y, m - 1, d);
  for (let i = 1; i <= 35; i++) {
    const ms = baseMs + direction * i * 86400000;
    const date = new Date(ms);
    const name = getJieQiName(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
    if (Object.prototype.hasOwnProperty.call(JEOLGI_JI, name)) return i;
  }
  throw new Error(`절기 탐색 실패: ${y}-${m}-${d} direction=${direction}`);
}

function pillarToIndex(gan: string, ji: string): number {
  const g = GAN.indexOf(gan as (typeof GAN)[number]);
  const j = JI.indexOf(ji as (typeof JI)[number]);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === g && i % 12 === j) return i;
  }
  throw new Error(`간지 인덱스 탐색 실패: ${gan}${ji}`);
}

function indexToDaewoonPillar(index: number, startAge: number): DaewoonPillar {
  const i = ((index % 60) + 60) % 60;
  const gan = GAN[i % 10];
  const ji = JI[i % 12];
  return {
    gan,
    ji,
    ganElement: GAN_OHAENG[gan],
    jiElement: JI_OHAENG[ji],
    startAge,
    endAge: startAge + 9,
  };
}

export function calcMadeAge(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  today: Date = new Date()
): number {
  const age = today.getFullYear() - birthYear;
  const hasBirthdayPassed =
    today.getMonth() + 1 > birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);
  return hasBirthdayPassed ? age : age - 1;
}

export function calculateDaewoon(
  input: SajuInput,
  gender: 'M' | 'F',
  yearPillar: Pillar,
  monthPillar: Pillar
): DaewoonResult {
  let { year, month, day } = input;
  const { isLunar } = input;

  if (isLunar) {
    const solar = Lunar.fromYmd(year, month, day).getSolar();
    year = solar.getYear();
    month = solar.getMonth();
    day = solar.getDay();
  }

  const forward = isForward(yearPillar.gan, gender);
  const days = findJeolgiDays(year, month, day, forward ? 1 : -1);
  const daewoonSu = Math.max(1, Math.round(days / 3));

  const monthIndex = pillarToIndex(monthPillar.gan, monthPillar.ji);
  const step = forward ? 1 : -1;
  const pillars: DaewoonPillar[] = [];
  for (let i = 0; i < 8; i++) {
    pillars.push(indexToDaewoonPillar(monthIndex + step * (i + 1), daewoonSu + i * 10));
  }

  return { daewoonSu, direction: forward ? '순행' : '역행', pillars };
}
