import type { Ohaeng } from './saju-data';

export type RelationKey = 'same' | 'gen_me' | 'i_gen' | 'ctrl_me' | 'i_ctrl';

export const OHAENG_GENERATES: Record<Ohaeng, Ohaeng> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

export const OHAENG_CONTROLS: Record<Ohaeng, Ohaeng> = {
  목: '토',
  화: '금',
  토: '수',
  금: '목',
  수: '화',
};

export function getOhaengRelationKey(ilganEl: Ohaeng, ganEl: Ohaeng): RelationKey {
  if (ganEl === ilganEl) return 'same';
  if (OHAENG_GENERATES[ganEl] === ilganEl) return 'gen_me';
  if (OHAENG_GENERATES[ilganEl] === ganEl) return 'i_gen';
  if (OHAENG_CONTROLS[ganEl] === ilganEl) return 'ctrl_me';
  return 'i_ctrl';
}
