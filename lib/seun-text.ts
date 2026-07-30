import type { Ohaeng } from './saju-data';
import { type RelationKey, getRelationText } from './ohaeng-relations';

const SEUN_RELATION_TEXT: Record<RelationKey, { label: string; desc: string }> = {
  same: {
    label: '경쟁·협력의 해',
    desc: '나와 비슷한 성격의 기운이 들어오는 해예요. 경쟁이 생기기도 하지만 협력과 독립의 기회도 함께 찾아와요.',
  },
  gen_me: {
    label: '배움·귀인의 해',
    desc: '나를 도와주는 기운이 들어오는 해예요. 공부, 자격증, 귀인의 도움처럼 나를 성장시키는 일들이 잘 풀려요.',
  },
  i_gen: {
    label: '표현·창작의 해',
    desc: '내가 에너지를 밖으로 내보내는 해예요. 창작, 표현, 새로운 시도처럼 자신을 드러내는 활동이 활발해져요.',
  },
  ctrl_me: {
    label: '책임·도전의 해',
    desc: '나를 단단하게 만드는 긴장감이 들어오는 해예요. 책임이 늘거나 도전적인 상황이 생기지만, 이겨내면 성장의 발판이 돼요.',
  },
  i_ctrl: {
    label: '재물·성취의 해',
    desc: '내가 통제하고 성과를 내는 기운이 강한 해예요. 재물이 들어오고 목표를 향해 움직이는 활동이 잘 풀려요.',
  },
};

export interface SeunInterpretation {
  label: string;
  desc: string;
}

export function getSeunInterpretation(ilganEl: Ohaeng, ganEl: Ohaeng): SeunInterpretation {
  return getRelationText(SEUN_RELATION_TEXT, ilganEl, ganEl);
}
