import type { Ohaeng } from '@/lib/saju-data';

const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'] as const;
const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'] as const;
const STEMS_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export function getFortuneYear(): number {
  const now = new Date();
  return now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
}

export function getFortuneGanjee(year: number): string {
  const offset = (((year - 1984) % 60) + 60) % 60;
  const stem = STEMS_KO[offset % 10];
  const branch = BRANCHES_KO[offset % 12];
  const stemHan = STEMS_HAN[offset % 10];
  const branchHan = BRANCHES_HAN[offset % 12];
  return `${stem}${branch}년(${stemHan}${branchHan}年)`;
}

export const YEARS = Array.from({ length: 201 }, (_, i) => 1900 + i);
export const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const INPUT_CLASS =
  'w-full bg-card border border-border rounded-xl px-4 py-3 text-primary text-base appearance-none';
export const LABEL_CLASS = 'block text-xs text-muted mb-1.5';

export const SIJIN = [
  { label: '자시 (23:00 ~ 01:00)', value: 0 },
  { label: '축시 (01:00 ~ 03:00)', value: 1 },
  { label: '인시 (03:00 ~ 05:00)', value: 3 },
  { label: '묘시 (05:00 ~ 07:00)', value: 5 },
  { label: '진시 (07:00 ~ 09:00)', value: 7 },
  { label: '사시 (09:00 ~ 11:00)', value: 9 },
  { label: '오시 (11:00 ~ 13:00)', value: 11 },
  { label: '미시 (13:00 ~ 15:00)', value: 13 },
  { label: '신시 (15:00 ~ 17:00)', value: 15 },
  { label: '유시 (17:00 ~ 19:00)', value: 17 },
  { label: '술시 (19:00 ~ 21:00)', value: 19 },
  { label: '해시 (21:00 ~ 23:00)', value: 21 },
] as const;

export const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];

export const OHAENG_LABEL: Record<Ohaeng, string> = {
  목: '木',
  화: '火',
  토: '土',
  금: '金',
  수: '水',
};

export const OHAENG_BAR: Record<Ohaeng, string> = {
  목: 'bg-mok',
  화: 'bg-hwa',
  토: 'bg-to',
  금: 'bg-geum',
  수: 'bg-su',
};

export const OHAENG_COLORS: Record<Ohaeng, string> = {
  목: '#4ade80',
  화: '#f87171',
  토: '#facc15',
  금: '#e2e8f0',
  수: '#60a5fa',
};

export const OHAENG_TEXT: Record<Ohaeng, string> = {
  목: 'text-mok',
  화: 'text-hwa',
  토: 'text-to',
  금: 'text-geum',
  수: 'text-su',
};
