// stub — 이후 Task들에서 실제 구현으로 교체됨
export type Ohaeng = never;
export interface Pillar { gan: string; ji: string; ganElement: never; jiElement: never; }
export interface SajuResult { year: Pillar; month: Pillar; day: Pillar; hour: Pillar | null; ilgan: string; ohaeng: Record<string, number>; }
export interface SajuInput { year: number; month: number; day: number; hour: number | null; isLunar: boolean; }
export function getYearPillar(_y: number, _m: number, _d: number): Pillar { throw new Error('not implemented'); }
export function getMonthPillar(_y: number, _m: number, _d: number, _yearGan: string): Pillar { throw new Error('not implemented'); }
export function getDayPillar(_y: number, _m: number, _d: number): Pillar { throw new Error('not implemented'); }
export function getHourPillar(_hour: number, _dayGan: string): Pillar { throw new Error('not implemented'); }
export function calcOhaeng(_pillars: (Pillar | null)[]): Record<string, number> { throw new Error('not implemented'); }
export function calculateSaju(_input: SajuInput): SajuResult { throw new Error('not implemented'); }
