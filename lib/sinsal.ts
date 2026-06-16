import type { SajuResult } from './saju-calculator';

export type SinsalType = '도화살' | '역마살' | '화개살' | '천을귀인' | '양인살';

export interface SinsalEntry {
  hanja: string;
  description: string;
}

export const SINSAL_INFO: Record<SinsalType, SinsalEntry> = {
  도화살: {
    hanja: '桃花殺',
    description: '매력과 인기운이 강해요. 사람을 끄는 힘이 있지만 감정 기복에 유의하세요',
  },
  역마살: {
    hanja: '驛馬殺',
    description: '이동과 변화의 기운이 강해요. 여행, 이주, 직업 변동이 잦을 수 있어요',
  },
  화개살: {
    hanja: '華蓋殺',
    description: '예술·종교·학문에 대한 깊은 통찰력이 있어요. 고독을 즐기는 성향도 있어요',
  },
  천을귀인: {
    hanja: '天乙貴人',
    description: '주변에서 도움을 주는 사람이 많아요. 어려운 순간에 귀인의 조력을 받기 쉬워요',
  },
  양인살: {
    hanja: '羊刃殺',
    description: '강한 추진력과 결단력을 가졌어요. 직설적인 표현으로 마찰이 생기지 않게 조심하세요',
  },
};

type SamhapGroup = '寅午戌' | '申子辰' | '巳酉丑' | '亥卯未';

const SAMHAP_GROUP: Record<string, SamhapGroup> = {
  寅: '寅午戌',
  午: '寅午戌',
  戌: '寅午戌',
  申: '申子辰',
  子: '申子辰',
  辰: '申子辰',
  巳: '巳酉丑',
  酉: '巳酉丑',
  丑: '巳酉丑',
  亥: '亥卯未',
  卯: '亥卯未',
  未: '亥卯未',
};

const DOHWA_JI: Record<SamhapGroup, string> = {
  寅午戌: '卯',
  申子辰: '酉',
  巳酉丑: '午',
  亥卯未: '子',
};

const YEOKMA_JI: Record<SamhapGroup, string> = {
  寅午戌: '申',
  申子辰: '寅',
  巳酉丑: '亥',
  亥卯未: '巳',
};

const HWAGAE_JI: Record<SamhapGroup, string> = {
  寅午戌: '戌',
  申子辰: '辰',
  巳酉丑: '丑',
  亥卯未: '未',
};

const CHEONEUL_JI: Record<string, string[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  庚: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  辛: ['午', '寅'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
};

const YANGIN_JI: Record<string, string> = {
  甲: '卯',
  丙: '午',
  戊: '午',
  庚: '酉',
  壬: '子',
};

export function getSinsals(saju: SajuResult): SinsalType[] {
  const branches = [saju.year.ji, saju.month.ji, saju.day.ji, saju.hour?.ji].filter(
    (ji): ji is string => Boolean(ji)
  );

  const result: SinsalType[] = [];

  const group = SAMHAP_GROUP[saju.day.ji];
  if (group) {
    if (branches.includes(DOHWA_JI[group])) result.push('도화살');
    if (branches.includes(YEOKMA_JI[group])) result.push('역마살');
    if (branches.includes(HWAGAE_JI[group])) result.push('화개살');
  }

  const cheoneulCandidates = CHEONEUL_JI[saju.ilgan];
  if (cheoneulCandidates && cheoneulCandidates.some((ji) => branches.includes(ji))) {
    result.push('천을귀인');
  }

  const yanginJi = YANGIN_JI[saju.ilgan];
  if (yanginJi && branches.includes(yanginJi)) {
    result.push('양인살');
  }

  return result;
}
