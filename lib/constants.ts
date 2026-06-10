import type { Ohaeng } from '@/lib/saju-data';

export const SIJIN = [
  { label: '자시 (23·0시)',  value: 0  },
  { label: '축시 (1·2시)',   value: 1  },
  { label: '인시 (3·4시)',   value: 3  },
  { label: '묘시 (5·6시)',   value: 5  },
  { label: '진시 (7·8시)',   value: 7  },
  { label: '사시 (9·10시)',  value: 9  },
  { label: '오시 (11·12시)', value: 11 },
  { label: '미시 (13·14시)', value: 13 },
  { label: '신시 (15·16시)', value: 15 },
  { label: '유시 (17·18시)', value: 17 },
  { label: '술시 (19·20시)', value: 19 },
  { label: '해시 (21·22시)', value: 21 },
] as const;

export const OHAENG_ORDER: Ohaeng[] = ['목', '화', '토', '금', '수'];

export const OHAENG_LABEL: Record<Ohaeng, string> = {
  목: '木', 화: '火', 토: '土', 금: '金', 수: '水',
};

export const OHAENG_BAR: Record<Ohaeng, string> = {
  목: 'bg-mok', 화: 'bg-hwa', 토: 'bg-to', 금: 'bg-geum', 수: 'bg-su',
};

export const OHAENG_COLORS: Record<Ohaeng, string> = {
  목: '#4ade80', 화: '#f87171', 토: '#facc15', 금: '#e2e8f0', 수: '#60a5fa',
};
