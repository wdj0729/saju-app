import type { Ohaeng } from './saju-data';

const OHAENG_GENERATES: Record<Ohaeng, Ohaeng> = {
  목: '화',
  화: '토',
  토: '금',
  금: '수',
  수: '목',
};

const OHAENG_CONTROLS: Record<Ohaeng, Ohaeng> = {
  목: '토',
  화: '금',
  토: '수',
  금: '목',
  수: '화',
};

const RELATION_TEXT: Record<string, { label: string; relDesc: string }> = {
  same: {
    label: '경쟁·독립의 10년',
    relDesc:
      '나와 비슷한 기운이 10년간 강해지는 시기예요. 경쟁이 생기기도 하지만, 스스로의 힘으로 독립하고 자립하는 기회가 찾아와요.',
  },
  gen_me: {
    label: '배움·귀인의 10년',
    relDesc:
      '나를 도와주는 기운이 10년간 흐르는 시기예요. 공부, 자격증, 귀인의 도움처럼 내면을 성장시키는 일들이 잘 풀려요.',
  },
  i_gen: {
    label: '표현·창작의 10년',
    relDesc:
      '내가 에너지를 밖으로 내보내는 10년이에요. 창작, 표현, 새로운 시도처럼 자신을 드러내는 활동이 활발해지는 시기예요.',
  },
  ctrl_me: {
    label: '책임·도전의 10년',
    relDesc:
      '나를 단단하게 만드는 긴장감이 10년간 흐르는 시기예요. 책임이 늘거나 도전적인 상황이 생기지만, 이겨내면 큰 성장의 발판이 돼요.',
  },
  i_ctrl: {
    label: '재물·성취의 10년',
    relDesc:
      '내가 통제하고 성과를 내는 기운이 10년간 강한 시기예요. 재물이 들어오고 목표를 향해 움직이는 활동이 잘 풀려요.',
  },
};

const JI_FLAVOR: Record<Ohaeng, string> = {
  목: '목(木)의 기운이 더해져 성장과 새로운 시작이 함께 찾아와요.',
  화: '화(火)의 기운이 더해져 열정과 표현력이 강해지는 시기예요.',
  토: '토(土)의 기운이 더해져 안정과 실리를 추구하게 되는 시기예요.',
  금: '금(金)의 기운이 더해져 결단력과 냉철함이 필요해지는 시기예요.',
  수: '수(水)의 기운이 더해져 지혜와 유연성이 중요해지는 시기예요.',
};

function getRelationKey(ilganEl: Ohaeng, ganEl: Ohaeng): string {
  if (ganEl === ilganEl) return 'same';
  if (OHAENG_GENERATES[ganEl] === ilganEl) return 'gen_me';
  if (OHAENG_GENERATES[ilganEl] === ganEl) return 'i_gen';
  if (OHAENG_CONTROLS[ganEl] === ilganEl) return 'ctrl_me';
  return 'i_ctrl';
}

export interface DaewoonInterpretation {
  label: string;
  desc: string;
}

export function getDaewoonInterpretation(
  ilganEl: Ohaeng,
  ganEl: Ohaeng,
  jiEl: Ohaeng
): DaewoonInterpretation {
  const key = getRelationKey(ilganEl, ganEl);
  const { label, relDesc } = RELATION_TEXT[key];
  return { label, desc: `${relDesc} ${JI_FLAVOR[jiEl]}` };
}
