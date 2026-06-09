# Fortune Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/fortune` 페이지 구현 — 일간 기반 고정 운세 텍스트(오늘/이달/올해 탭 + 아코디언) + Claude AI 심층 분석 스트리밍

**Architecture:** sessionStorage에서 사주 세션을 읽어 일간(日干)으로 고정 운세 텍스트를 조회하고, 선택 시 Claude API 스트리밍으로 AI 심층 분석을 제공한다. 탭 전환 시 아코디언은 초기화되고, AI 분석 결과는 탭과 무관하게 유지된다.

**Tech Stack:** Next.js 16 App Router, TypeScript, @anthropic-ai/sdk ^0.102.0, Tailwind CSS v4

---

## File Map

| 파일 | 역할 |
|------|------|
| `lib/fortune-text.ts` | 고정 운세 텍스트 데이터 (10일간 × 3기간) |
| `lib/__tests__/fortune-text.test.ts` | fortune-text 구조 검증 테스트 |
| `app/api/ai-analysis/route.ts` | Claude 스트리밍 API 라우트 |
| `app/fortune/page.tsx` | 운세 페이지 (탭 + 아코디언 + AI 분석) |
| `app/saju/result/page.tsx` | "운세 보기" 버튼 활성화 (수정) |
| `app/page.tsx` | 운세 카드 링크 활성화 (수정) |

---

## Task 1: fortune-text.ts 타입 정의 및 구현

**Files:**
- Create: `lib/fortune-text.ts`
- Create: `lib/__tests__/fortune-text.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

```typescript
// lib/__tests__/fortune-text.test.ts
import { FORTUNE_TEXT } from '../fortune-text';

const ILGAN_LIST = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const PERIODS = ['오늘', '이달', '올해'] as const;
const DETAIL_KEYS = ['대운', '재물', '건강', '인간관계'];

describe('FORTUNE_TEXT', () => {
  it('10개 일간 모두에 대한 운세가 존재한다', () => {
    ILGAN_LIST.forEach(ilgan => {
      expect(FORTUNE_TEXT[ilgan]).toBeDefined();
    });
  });

  it('각 일간에 오늘/이달/올해 3개 기간이 존재한다', () => {
    ILGAN_LIST.forEach(ilgan => {
      PERIODS.forEach(period => {
        expect(FORTUNE_TEXT[ilgan][period]).toBeDefined();
      });
    });
  });

  it('각 기간에 summary 문자열이 존재한다', () => {
    ILGAN_LIST.forEach(ilgan => {
      PERIODS.forEach(period => {
        const { summary } = FORTUNE_TEXT[ilgan][period];
        expect(typeof summary).toBe('string');
        expect(summary.length).toBeGreaterThan(0);
      });
    });
  });

  it('각 기간에 4개 영역 상세(대운/재물/건강/인간관계)가 존재한다', () => {
    ILGAN_LIST.forEach(ilgan => {
      PERIODS.forEach(period => {
        const { details } = FORTUNE_TEXT[ilgan][period];
        DETAIL_KEYS.forEach(key => {
          expect(typeof details[key]).toBe('string');
          expect(details[key].length).toBeGreaterThan(0);
        });
      });
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- lib/__tests__/fortune-text.test.ts
```

Expected: `Cannot find module '../fortune-text'`

- [ ] **Step 3: fortune-text.ts 구현**

```typescript
// lib/fortune-text.ts
interface FortunePeriod {
  summary: string;
  details: {
    대운: string;
    재물: string;
    건강: string;
    인간관계: string;
  };
}

type FortunePeriodKey = '오늘' | '이달' | '올해';
export type FortuneEntry = Record<FortunePeriodKey, FortunePeriod>;

export const FORTUNE_TEXT: Record<string, FortuneEntry> = {
  甲: {
    오늘: {
      summary: '추진력이 강해지는 날입니다. 미뤄두었던 계획을 과감히 실행할 좋은 기회입니다. 주변 사람들의 신뢰를 한몸에 받을 수 있습니다.',
      details: {
        대운: '리더십이 빛나는 시기입니다. 새로운 일을 시작하기에 적합한 날입니다.',
        재물: '작은 지출이 예상됩니다. 큰 투자보다는 안정적인 저축이 유리합니다.',
        건강: '활동량이 늘어 체력 소모가 있을 수 있습니다. 충분한 수분 섭취를 잊지 마세요.',
        인간관계: '솔직한 소통이 관계를 돈독히 합니다. 오랜 지인과의 재회 가능성이 있습니다.',
      },
    },
    이달: {
      summary: '한 달 내내 진취적 기운이 이어집니다. 새로운 도전을 시작하기에 좋은 달입니다. 주도적인 역할이 긍정적 결과를 가져올 것입니다.',
      details: {
        대운: '성장과 발전의 기운이 강합니다. 중요한 결정을 내리기에 유리한 달입니다.',
        재물: '수입이 증가할 가능성이 있습니다. 다만 충동적 지출을 주의하세요.',
        건강: '에너지가 넘치지만 과로에 주의가 필요합니다. 규칙적인 운동이 도움이 됩니다.',
        인간관계: '새로운 인연이 생길 수 있습니다. 기존 관계도 더욱 단단해지는 달입니다.',
      },
    },
    올해: {
      summary: '크게 성장하는 해입니다. 오랫동안 준비해온 일들이 결실을 맺을 가능성이 높습니다. 자신감을 갖고 나아가세요.',
      details: {
        대운: '커다란 전환점이 찾아올 수 있습니다. 원하던 목표에 한 발짝 가까워지는 해입니다.',
        재물: '재물운이 상승하는 해입니다. 장기적 투자를 시작하기에 좋은 시점입니다.',
        건강: '전반적인 건강은 양호하지만 환절기 체력 관리에 신경 쓰세요.',
        인간관계: '귀인을 만날 수 있는 해입니다. 인맥을 넓히는 노력이 큰 결실로 이어집니다.',
      },
    },
  },
  乙: {
    오늘: {
      summary: '유연한 대처가 빛을 발하는 날입니다. 무리하게 밀어붙이기보다 상황에 맞게 흘러가는 것이 유리합니다. 섬세한 감각이 주변의 호감을 삽니다.',
      details: {
        대운: '조용히 실력을 쌓는 것이 나중에 큰 힘이 됩니다. 급하게 서두르지 마세요.',
        재물: '예상치 못한 소소한 수입이 생길 수 있습니다. 씀씀이를 점검할 좋은 날입니다.',
        건강: '정신적 피로가 쌓일 수 있습니다. 산책이나 가벼운 스트레칭으로 기분을 환기하세요.',
        인간관계: '경청하는 태도가 큰 신뢰를 얻습니다. 상대방의 말에 귀를 기울여 보세요.',
      },
    },
    이달: {
      summary: '부드러운 추진력으로 원하는 바를 이루는 달입니다. 협력과 조화 속에서 성과를 거둘 수 있습니다. 감수성이 예민해져 창의적 아이디어가 풍부해집니다.',
      details: {
        대운: '협력 관계에서 좋은 성과를 기대할 수 있습니다. 혼자보다 함께할 때 더 빛납니다.',
        재물: '수입보다 지출이 많을 수 있는 달입니다. 불필요한 소비를 줄여보세요.',
        건강: '수면의 질에 주의를 기울이세요. 규칙적인 취침 시간이 건강을 지킵니다.',
        인간관계: '배려와 공감이 주변 사람들의 마음을 열게 합니다. 관계가 깊어지는 달입니다.',
      },
    },
    올해: {
      summary: '꾸준한 노력이 빛을 발하는 해입니다. 겉으로 드러나지 않아도 내실 있는 성장이 이어집니다. 느리지만 확실하게 목표를 향해 나아가는 한 해입니다.',
      details: {
        대운: '내실을 쌓는 한 해입니다. 눈에 보이지 않는 성장이 훗날 큰 결실을 맺습니다.',
        재물: '꾸준한 저축이 재물을 불립니다. 투기보다 안정적인 재테크가 유리합니다.',
        건강: '만성 피로에 주의하세요. 정기 건강검진을 통해 몸 상태를 점검해 보세요.',
        인간관계: '깊은 신뢰 관계가 형성되는 해입니다. 오랜 인연이 더욱 소중해집니다.',
      },
    },
  },
  丙: {
    오늘: {
      summary: '밝고 활기찬 에너지로 주변을 빛내는 날입니다. 적극적으로 나서면 좋은 결과가 따라옵니다. 열정이 넘쳐 어떤 일도 즐겁게 처리할 수 있습니다.',
      details: {
        대운: '눈에 띄는 활약이 기대됩니다. 발표나 프레젠테이션에 유리한 날입니다.',
        재물: '활발한 활동으로 재물 기회가 생깁니다. 단, 과소비에 주의하세요.',
        건강: '넘치는 에너지를 잘 분배하세요. 심장과 혈압 관리에 신경 쓸 필요가 있습니다.',
        인간관계: '밝은 태도가 주변에 긍정적인 영향을 줍니다. 새로운 만남이 기분 좋게 이루어집니다.',
      },
    },
    이달: {
      summary: '열정과 추진력이 최고조에 달하는 달입니다. 어떤 일을 시작하든 긍정적인 에너지가 함께합니다. 주변 사람들에게 활력을 불어넣는 존재가 됩니다.',
      details: {
        대운: '주목받는 기회가 많아지는 달입니다. 자신을 드러내는 것을 주저하지 마세요.',
        재물: '예상보다 좋은 재물 흐름이 기대됩니다. 적극적인 활동이 수익으로 이어집니다.',
        건강: '활동량이 많아 체력 소모가 클 수 있습니다. 충분한 휴식을 취하는 것이 중요합니다.',
        인간관계: '인기가 높아지는 달입니다. 많은 사람과의 교류를 즐길 수 있습니다.',
      },
    },
    올해: {
      summary: '화려하게 빛나는 한 해입니다. 노력과 열정이 인정받아 큰 성취를 이룰 수 있습니다. 주변 사람들에게 영감을 주는 존재로 자리매김하는 해입니다.',
      details: {
        대운: '커리어나 사회적 지위에서 도약이 기대됩니다. 과감한 도전이 빛나는 결과를 냅니다.',
        재물: '수입 증가의 기회가 찾아옵니다. 새로운 수익원을 발굴할 수 있는 해입니다.',
        건강: '과도한 열정으로 번아웃이 올 수 있습니다. 주기적으로 휴식을 취하는 습관이 필요합니다.',
        인간관계: '넓은 인맥을 쌓을 수 있는 해입니다. 귀인과의 만남이 삶에 큰 변화를 줍니다.',
      },
    },
  },
  丁: {
    오늘: {
      summary: '집중력이 극대화되는 날입니다. 세밀한 작업이나 창의적인 일에서 뛰어난 성과를 낼 수 있습니다. 내면의 감수성이 풍부해져 예술적 영감이 떠오릅니다.',
      details: {
        대운: '전문성을 발휘할 기회가 옵니다. 디테일에 집중하면 좋은 결과를 얻습니다.',
        재물: '꼼꼼한 금전 관리가 재물을 지킵니다. 계획적인 소비 습관을 이어가세요.',
        건강: '눈과 머리를 많이 사용하는 날입니다. 중간중간 눈을 쉬게 해주세요.',
        인간관계: '진심이 담긴 한마디가 상대방의 마음을 움직입니다. 깊은 대화를 나눠보세요.',
      },
    },
    이달: {
      summary: '꾸준한 집중력으로 의미 있는 성과를 내는 달입니다. 겉으로 화려하지 않아도 내실 있는 결과물이 나옵니다. 섬세한 감각이 주변에 인정받습니다.',
      details: {
        대운: '전문성과 기술을 쌓는 데 최적인 달입니다. 학습이나 자기 계발에 투자하세요.',
        재물: '소소한 절약이 큰 재산이 됩니다. 지출 내역을 꼼꼼히 기록해 보세요.',
        건강: '신경이 예민해질 수 있습니다. 명상이나 독서로 마음을 안정시키세요.',
        인간관계: '깊이 있는 소수의 관계가 힘이 됩니다. 진실된 사람들과 더 많은 시간을 보내세요.',
      },
    },
    올해: {
      summary: '묵묵히 쌓아온 전문성이 빛을 발하는 해입니다. 한 분야에 깊이 파고드는 노력이 큰 결실로 이어집니다. 완성도 높은 성과물로 인정받는 한 해입니다.',
      details: {
        대운: '한 분야의 전문가로 인정받는 해입니다. 지식과 기술을 더욱 갈고닦으세요.',
        재물: '안정적인 수입이 유지됩니다. 조금씩 꾸준히 모아가는 전략이 효과적입니다.',
        건강: '과도한 완벽주의가 스트레스를 유발할 수 있습니다. 때로는 여유를 갖는 것이 필요합니다.',
        인간관계: '신뢰할 수 있는 깊은 관계가 형성됩니다. 소중한 인연을 더욱 가꾸는 해입니다.',
      },
    },
  },
  戊: {
    오늘: {
      summary: '안정감이 넘치는 하루입니다. 흔들리지 않는 중심으로 주변 사람들에게 신뢰를 줍니다. 포용력 있는 태도가 갈등을 부드럽게 해결합니다.',
      details: {
        대운: '안정과 지속성이 키워드인 날입니다. 꾸준히 해온 일에서 성과가 나타납니다.',
        재물: '재물이 안정적으로 유지됩니다. 무리한 투자보다 기존 자산 관리에 집중하세요.',
        건강: '소화기 계통에 주의가 필요합니다. 규칙적인 식사와 충분한 수면을 챙기세요.',
        인간관계: '든든한 버팀목이 되어주는 날입니다. 주변 사람들이 당신에게 의지하고 싶어합니다.',
      },
    },
    이달: {
      summary: '안정 속에서 꾸준한 성장을 이루는 달입니다. 변화보다는 지속성을 유지하는 것이 유리합니다. 신중한 판단으로 좋은 결정을 내릴 수 있습니다.',
      details: {
        대운: '기반을 다지는 데 좋은 달입니다. 급하게 서두르지 말고 차근차근 나아가세요.',
        재물: '수입과 지출이 균형을 이루는 달입니다. 재정 계획을 세우기에 좋은 시기입니다.',
        건강: '체력 유지를 위해 규칙적인 생활 습관이 중요합니다. 과식을 피하고 균형 잡힌 식사를 하세요.',
        인간관계: '신뢰를 바탕으로 한 관계가 더욱 견고해집니다. 오랜 인연을 소중히 여기세요.',
      },
    },
    올해: {
      summary: '굳건한 기반 위에서 한 단계 도약하는 해입니다. 오랜 기간 쌓아온 신뢰가 큰 기회로 연결됩니다. 안정 속에서 꾸준한 발전을 이루는 한 해입니다.',
      details: {
        대운: '오랫동안 기다려온 기회가 찾아옵니다. 준비된 자에게 좋은 운이 따릅니다.',
        재물: '재물이 서서히 늘어나는 해입니다. 부동산이나 장기 저축이 좋은 성과를 냅니다.',
        건강: '기초 체력을 강화하는 한 해로 삼으세요. 꾸준한 운동과 정기 검진을 권합니다.',
        인간관계: '믿음직한 조력자가 나타나는 해입니다. 주변의 도움으로 목표를 이룰 수 있습니다.',
      },
    },
  },
  己: {
    오늘: {
      summary: '꼼꼼하고 실용적인 능력이 빛나는 날입니다. 세밀한 부분까지 챙기는 능력으로 신뢰를 얻을 수 있습니다. 현실적인 판단이 좋은 결과를 가져옵니다.',
      details: {
        대운: '정확하고 꼼꼼한 처리가 높은 평가를 받습니다. 실무 능력을 발휘할 기회입니다.',
        재물: '꼼꼼한 지출 관리로 재물이 새나가는 것을 막을 수 있습니다. 가계부를 정리해 보세요.',
        건강: '소화 기능에 주의를 기울이세요. 천천히 꼭꼭 씹어 먹는 식습관이 건강에 좋습니다.',
        인간관계: '성실하고 책임감 있는 태도가 신뢰를 쌓습니다. 작은 약속도 지키는 것이 중요합니다.',
      },
    },
    이달: {
      summary: '실용적이고 현실적인 접근으로 성과를 내는 달입니다. 세부 사항을 꼼꼼히 챙기는 것이 큰 차이를 만듭니다. 착실한 노력이 눈에 보이는 결과로 나타납니다.',
      details: {
        대운: '계획대로 진행하면 안정적인 성과를 낼 수 있습니다. 무리한 변화보다 현재 계획을 완수하세요.',
        재물: '절약과 저축에 집중할수록 재물이 늘어납니다. 작은 금액도 모이면 큰 힘이 됩니다.',
        건강: '규칙적인 생활 패턴이 건강의 비결입니다. 수면 시간과 식사 시간을 일정하게 유지하세요.',
        인간관계: '성실함과 진실함이 주변의 신뢰를 얻습니다. 조용히 베푸는 선행이 관계를 풍요롭게 합니다.',
      },
    },
    올해: {
      summary: '착실하고 꼼꼼한 노력이 인정받는 한 해입니다. 현실 감각이 뛰어나 실용적인 성과를 거둡니다. 묵묵히 자신의 길을 걷는 것이 결국 가장 빠른 길입니다.',
      details: {
        대운: '실무적 능력이 빛을 발하는 해입니다. 전문성을 인정받고 더 큰 역할을 맡게 됩니다.',
        재물: '꾸준한 저축과 합리적 소비가 재물을 쌓아줍니다. 올해 재정 목표를 세워보세요.',
        건강: '위장 건강에 특히 신경 쓰세요. 스트레스 해소 방법을 찾아 실천하는 것이 중요합니다.',
        인간관계: '오래되고 믿을 수 있는 관계가 더욱 빛나는 해입니다. 진실한 인연을 소중히 가꾸세요.',
      },
    },
  },
  庚: {
    오늘: {
      summary: '결단력이 요구되는 상황에서 빛나는 날입니다. 망설이지 말고 과감하게 결정을 내리세요. 의리와 책임감이 주변 사람들에게 깊은 인상을 남깁니다.',
      details: {
        대운: '결단이 필요한 순간, 자신을 믿고 나아가세요. 과감한 선택이 좋은 결과를 부릅니다.',
        재물: '재물을 둘러싼 결정이 필요할 수 있습니다. 충동보다 냉정한 판단으로 접근하세요.',
        건강: '폐와 호흡기 건강에 주의하세요. 깨끗한 공기와 충분한 환기가 도움이 됩니다.',
        인간관계: '의리 있는 행동이 주변 사람들의 마음을 사로잡습니다. 약속을 끝까지 지키세요.',
      },
    },
    이달: {
      summary: '강한 추진력으로 장애물을 돌파하는 달입니다. 단호한 결정이 막혀있던 문제를 풀어줍니다. 책임감 있는 모습이 리더로서의 면모를 드러냅니다.',
      details: {
        대운: '막혔던 일이 뚫리는 달입니다. 결단력 있게 행동하면 빠른 진전을 이룰 수 있습니다.',
        재물: '수익이 있지만 큰 지출도 예상됩니다. 수입과 지출의 균형을 잘 맞추세요.',
        건강: '무리한 운동보다 꾸준한 가벼운 활동이 좋습니다. 관절 건강에도 신경 쓰세요.',
        인간관계: '솔직하고 직선적인 소통이 신뢰를 줍니다. 오해가 생기면 빨리 풀어나가세요.',
      },
    },
    올해: {
      summary: '큰 결단을 내리고 새로운 길을 여는 한 해입니다. 과감한 도전이 예상보다 훨씬 좋은 결과를 가져옵니다. 의지와 실행력이 올해의 핵심 키워드입니다.',
      details: {
        대운: '인생의 중요한 전환점이 될 수 있는 해입니다. 두려움 없이 새로운 도전에 나서세요.',
        재물: '과감한 결정이 재물운을 끌어올립니다. 다만 무모한 투기는 조심하세요.',
        건강: '건강 관리에 적극적으로 투자하는 해로 삼으세요. 꾸준한 운동이 활력의 원천입니다.',
        인간관계: '리더십을 인정받는 해입니다. 주변 사람들을 이끌며 함께 성장하는 경험을 합니다.',
      },
    },
  },
  辛: {
    오늘: {
      summary: '예민한 감각이 날카롭게 살아있는 날입니다. 완성도를 높이는 작업에서 탁월한 능력을 발휘합니다. 심미적 안목이 빛나는 하루입니다.',
      details: {
        대운: '완벽함을 추구하는 오늘, 자신의 기준에 맞는 결과물을 만들어낼 수 있습니다.',
        재물: '충동구매보다 신중한 소비가 필요한 날입니다. 품질 좋은 하나를 선택하는 것이 낫습니다.',
        건강: '예민한 신경이 두통이나 긴장으로 이어질 수 있습니다. 이완 운동이나 명상이 도움이 됩니다.',
        인간관계: '섬세한 배려가 상대방에게 깊은 인상을 남깁니다. 작은 것에도 세심하게 신경 써주세요.',
      },
    },
    이달: {
      summary: '섬세함과 완벽주의가 높은 성과로 이어지는 달입니다. 퀄리티를 중시하는 자세가 주변의 인정을 받습니다. 예술적 감각이 돋보이는 시기입니다.',
      details: {
        대운: '세심한 작업에서 두드러진 성과를 냅니다. 품질과 완성도를 높이는 데 집중하세요.',
        재물: '합리적이고 신중한 소비 패턴이 재물을 지킵니다. 가성비 높은 선택을 해보세요.',
        건강: '긴장과 스트레스를 적절히 해소하는 것이 중요합니다. 피부 건강에도 신경 써보세요.',
        인간관계: '섬세한 공감 능력이 관계를 풍요롭게 합니다. 친밀한 관계에서 더 큰 기쁨을 찾으세요.',
      },
    },
    올해: {
      summary: '완성도 높은 결과물로 이름을 알리는 한 해입니다. 세밀한 노력의 축적이 올해 빛을 발합니다. 미적 감각과 전문성이 인정받는 해입니다.',
      details: {
        대운: '전문 분야에서 두각을 나타내는 해입니다. 자신만의 스타일과 강점을 계속 발전시키세요.',
        재물: '고품질의 투자가 좋은 결실을 맺습니다. 자신의 전문성에 투자하는 것이 가장 효과적입니다.',
        건강: '완벽주의에서 오는 스트레스를 주의하세요. 때로는 충분히 좋은 것으로도 만족하는 여유가 필요합니다.',
        인간관계: '진지하고 깊이 있는 관계가 형성되는 해입니다. 소수의 진정한 인연이 삶을 풍요롭게 합니다.',
      },
    },
  },
  壬: {
    오늘: {
      summary: '넓은 시야로 전체를 꿰뚫는 통찰이 빛나는 날입니다. 유연한 사고로 복잡한 문제를 쉽게 풀어냅니다. 지혜로운 판단이 좋은 선택으로 이어집니다.',
      details: {
        대운: '큰 그림을 그리고 장기적인 전략을 세우기에 좋은 날입니다. 즉흥보다 계획이 유리합니다.',
        재물: '재물의 흐름을 파악하는 날입니다. 투자보다 현금 흐름 관리에 집중해 보세요.',
        건강: '신장과 방광 건강에 주의하세요. 충분한 물 마시기가 건강을 지킵니다.',
        인간관계: '다양한 사람들과 원활하게 소통하는 날입니다. 사교적인 자리에서 좋은 인연이 생깁니다.',
      },
    },
    이달: {
      summary: '광활한 가능성이 펼쳐지는 달입니다. 다양한 방향에서 기회가 오며, 유연한 적응력이 강점입니다. 지혜로운 판단으로 좋은 선택을 이어가세요.',
      details: {
        대운: '새로운 가능성을 탐색하는 달입니다. 다양한 옵션을 검토하고 최선의 방향을 선택하세요.',
        재물: '다양한 경로에서 수입 기회가 생깁니다. 새로운 수익 모델을 고려해 볼 시기입니다.',
        건강: '수분 섭취와 순환계 건강에 주의를 기울이세요. 수영이나 물놀이가 건강에 특히 좋습니다.',
        인간관계: '넓고 다양한 인맥이 형성되는 달입니다. 다양한 배경의 사람들과 교류해 보세요.',
      },
    },
    올해: {
      summary: '넓은 시야와 유연한 적응력으로 큰 성취를 이루는 해입니다. 변화하는 환경에서도 흔들리지 않는 지혜가 빛납니다. 다양한 분야에서 성장이 이루어지는 한 해입니다.',
      details: {
        대운: '큰 변화와 성장이 기다리는 해입니다. 유연한 마음으로 변화를 받아들이면 더 큰 기회가 옵니다.',
        재물: '다양한 수익원이 생기는 해입니다. 재테크에 관심을 가지고 적극적으로 투자해 보세요.',
        건강: '순환계 건강 관리가 특히 중요한 해입니다. 규칙적인 유산소 운동을 생활화하세요.',
        인간관계: '넓은 인맥이 큰 기회를 불러오는 해입니다. 다양한 사람들과의 연결이 삶을 풍요롭게 합니다.',
      },
    },
  },
  癸: {
    오늘: {
      summary: '직관력이 예리하게 발동하는 날입니다. 겉으로 드러나지 않은 진실을 꿰뚫어 보는 통찰이 강해집니다. 내면의 목소리에 귀를 기울이면 좋은 결정을 내릴 수 있습니다.',
      details: {
        대운: '직감을 믿고 행동할 때 좋은 결과가 따릅니다. 이유를 설명하기 어려워도 느낌을 따라가 보세요.',
        재물: '재물에 관한 예민한 감각이 살아있는 날입니다. 직관적인 판단이 좋은 재정 결정으로 이어집니다.',
        건강: '정서적 건강이 신체 건강과 직결됩니다. 마음의 평화를 유지하는 것이 중요합니다.',
        인간관계: '상대방의 감정을 잘 읽어내는 날입니다. 공감과 이해로 깊은 연결을 만들어 보세요.',
      },
    },
    이달: {
      summary: '깊은 내면 세계가 풍요로워지는 달입니다. 직관과 창의성이 최고조에 달해 독창적인 아이디어가 샘솟습니다. 감성이 풍부해져 예술적 표현에서 특히 빛납니다.',
      details: {
        대운: '직관적인 판단으로 중요한 결정을 내리기 좋은 달입니다. 논리보다 감각이 더 정확할 수 있습니다.',
        재물: '예상치 못한 곳에서 수입이 생길 수 있습니다. 직관적으로 좋아 보이는 기회에 주목하세요.',
        건강: '감기나 면역 저하에 주의가 필요합니다. 충분한 수면과 따뜻한 음식으로 몸을 챙기세요.',
        인간관계: '깊고 진실한 연결이 이루어지는 달입니다. 진심을 나눌 수 있는 대화를 해보세요.',
      },
    },
    올해: {
      summary: '내면의 지혜가 꽃을 피우는 한 해입니다. 오랫동안 준비해온 꿈이 현실로 이루어질 조건이 갖춰집니다. 직관과 통찰로 중요한 기회를 놓치지 않는 해입니다.',
      details: {
        대운: '정신적, 영적 성장이 크게 이루어지는 해입니다. 자기 자신을 더 깊이 이해하게 됩니다.',
        재물: '직관적인 투자 감각이 빛나는 해입니다. 감각을 믿되 충분한 조사도 병행하세요.',
        건강: '정서적 건강 관리가 올해의 핵심입니다. 상담이나 명상 등 내면 치유에 투자해 보세요.',
        인간관계: '진정한 이해와 공감을 나눌 수 있는 깊은 관계가 형성되는 해입니다. 인연의 깊이를 소중히 여기세요.',
      },
    },
  },
};
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- lib/__tests__/fortune-text.test.ts
```

Expected: `Tests: 4 passed, 4 total`

- [ ] **Step 5: 커밋**

```bash
git add lib/fortune-text.ts lib/__tests__/fortune-text.test.ts
git commit -m "feat: add fortune text data for 10 ilgan × 3 periods"
```

---

## Task 2: AI 분석 API 라우트

**Files:**
- Create: `app/api/ai-analysis/route.ts`

> 참고: Next.js API에 대한 변경사항이 있을 수 있으므로 `node_modules/next/dist/docs/` 가이드를 먼저 확인할 것 (AGENTS.md 지시사항).

- [ ] **Step 1: 디렉토리 및 파일 생성**

```bash
mkdir -p app/api/ai-analysis
```

- [ ] **Step 2: route.ts 구현**

```typescript
// app/api/ai-analysis/route.ts
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

const client = new Anthropic();

interface PillarData {
  gan: string;
  ji: string;
}

interface AiAnalysisRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    hour: PillarData | null;
  };
}

export async function POST(req: NextRequest) {
  const { ilgan, ohaeng, pillars } = (await req.json()) as AiAnalysisRequest;

  const pillarText = [
    `${pillars.year.gan}${pillars.year.ji}`,
    `${pillars.month.gan}${pillars.month.ji}`,
    `${pillars.day.gan}${pillars.day.ji}`,
    pillars.hour ? `${pillars.hour.gan}${pillars.hour.ji}` : '시주 미상',
  ].join(' / ');

  const ohaengText = Object.entries(ohaeng)
    .map(([k, v]) => `${k} ${Number(v).toFixed(1)}`)
    .join(' / ');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `당신은 30년 경력의 명리학 전문가입니다. 아래 사주를 보고 오늘의 운세를 한국어로 해석해주세요.

사주 원국: ${pillarText}
일간: ${ilgan}
오행 분포: ${ohaengText}

**대운**, **재물**, **건강**, **인간관계** 항목별로 각 2~3문장씩 구체적이고 친근한 말투로 설명해주세요.`,
      },
    ],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const text of stream.textStream) {
          controller.enqueue(encoder.encode(text));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```

- [ ] **Step 3: 환경변수 확인**

`.env.local`에 다음이 설정되어 있어야 한다:
```
ANTHROPIC_API_KEY=sk-ant-...
```

없으면 생성:
```bash
echo "ANTHROPIC_API_KEY=your_key_here" >> .env.local
```

- [ ] **Step 4: 커밋**

```bash
git add app/api/ai-analysis/route.ts
git commit -m "feat: add Claude streaming API route for AI fortune analysis"
```

---

## Task 3: 운세 페이지 구현

**Files:**
- Create: `app/fortune/page.tsx`

- [ ] **Step 1: 디렉토리 생성**

```bash
mkdir -p app/fortune
```

- [ ] **Step 2: page.tsx 구현**

```typescript
// app/fortune/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadSession } from '@/lib/session';
import { FORTUNE_TEXT } from '@/lib/fortune-text';
import type { SajuSession } from '@/lib/session';

type Period = '오늘' | '이달' | '올해';

const PERIODS: Period[] = ['오늘', '이달', '올해'];

const PERIOD_LABEL: Record<Period, string> = {
  오늘: '오늘의 운세',
  이달: '이달의 운세',
  올해: '올해의 운세',
};

export default function FortunePage() {
  const router = useRouter();
  const [session] = useState<SajuSession | null>(() =>
    typeof window !== 'undefined' ? loadSession() : null
  );
  const [activeTab, setActiveTab] = useState<Period>('오늘');
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiText, setAiText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!session) router.replace('/saju');
  }, [session, router]);

  if (!session) return null;

  const { ilgan } = session.result;
  const fortune = FORTUNE_TEXT[ilgan];
  const currentPeriod = fortune[activeTab];

  function handleTabChange(tab: Period) {
    setActiveTab(tab);
    setIsExpanded(false);
  }

  async function requestAiAnalysis() {
    setIsStreaming(true);
    setAiText('');
    setAiError('');
    try {
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ilgan,
          ohaeng: session.result.ohaeng,
          pillars: {
            year: { gan: session.result.year.gan, ji: session.result.year.ji },
            month: { gan: session.result.month.gan, ji: session.result.month.ji },
            day: { gan: session.result.day.gan, ji: session.result.day.ji },
            hour: session.result.hour
              ? { gan: session.result.hour.gan, ji: session.result.hour.ji }
              : null,
          },
        }),
      });
      if (!res.ok) throw new Error('분석 요청에 실패했습니다.');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAiText((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => router.push('/saju/result')}
          className="text-muted text-sm hover:text-primary transition-colors"
        >
          ← 내 사주
        </button>
        <h1 className="text-sm font-semibold text-primary">
          {session.input.name ? `${session.input.name}의 운세` : '운세'}
        </h1>
      </header>

      {/* 탭 바 */}
      <div className="flex border-b border-border">
        {PERIODS.map((period) => (
          <button
            key={period}
            onClick={() => handleTabChange(period)}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === period ? 'text-primary' : 'text-muted'
            }`}
          >
            {period}
            {activeTab === period && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#667eea] to-[#764ba2]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 px-4 py-6 flex-1">
        {/* 운세 카드 */}
        <div className="bg-card rounded-2xl overflow-hidden">
          {/* 요약 */}
          <div className="p-4">
            <p className="text-xs text-muted mb-2">
              💫 {PERIOD_LABEL[activeTab]} · {ilgan} 일간
            </p>
            <p className="text-sm text-primary leading-relaxed">
              {currentPeriod.summary}
            </p>
          </div>

          {/* 아코디언 토글 */}
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-full px-4 py-2.5 flex items-center justify-between border-t border-border text-xs text-muted hover:text-primary transition-colors"
          >
            <span>영역별 상세</span>
            <span>{isExpanded ? '∧ 접기' : '∨ 자세히'}</span>
          </button>

          {/* 상세 내용 */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-3 flex flex-col gap-3 border-t border-border">
              {(
                Object.entries(currentPeriod.details) as [string, string][]
              ).map(([key, value]) => (
                <div key={key}>
                  <span className="text-xs text-muted font-medium">{key}</span>
                  <p className="text-sm text-primary leading-relaxed mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI 심층 분석 카드 */}
        <div className="bg-card rounded-2xl p-4">
          <p className="text-xs text-muted mb-3">🤖 AI 심층 분석</p>

          {!aiText && !isStreaming && !aiError && (
            <button
              onClick={requestAiAnalysis}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium"
            >
              분석 요청하기
            </button>
          )}

          {isStreaming && !aiText && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <span className="animate-pulse">●</span>
              <span>분석 중...</span>
            </div>
          )}

          {aiText && (
            <div className="text-sm text-primary leading-relaxed whitespace-pre-wrap">
              {aiText}
              {isStreaming && (
                <span className="animate-pulse opacity-70">▌</span>
              )}
            </div>
          )}

          {aiError && (
            <div>
              <p className="text-sm text-hwa mb-2">{aiError}</p>
              <button
                onClick={requestAiAnalysis}
                className="text-xs text-muted underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {aiText && !isStreaming && (
            <button
              onClick={requestAiAnalysis}
              className="mt-3 text-xs text-muted underline"
            >
              다시 요청
            </button>
          )}
        </div>
      </div>

      {/* 하단 궁합 버튼 */}
      <div className="px-4 pb-8">
        <button
          onClick={() => router.push('/compatibility')}
          className="w-full py-3 rounded-2xl bg-card text-primary text-sm font-medium"
        >
          💑 궁합 보러 가기
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 빌드 타입 체크**

```bash
npm run build 2>&1 | head -30
```

Expected: 타입 오류 없이 빌드 완료 (또는 기존 오류만 존재)

- [ ] **Step 4: 커밋**

```bash
git add app/fortune/page.tsx
git commit -m "feat: implement fortune page with tabs, accordion, and AI streaming"
```

---

## Task 4: 연결 — 버튼 활성화

**Files:**
- Modify: `app/saju/result/page.tsx:65-78`
- Modify: `app/page.tsx:1-25`

- [ ] **Step 1: result 페이지 "운세 보기" 버튼 활성화**

`app/saju/result/page.tsx`의 하단 버튼 섹션을 수정한다.

변경 전 (`app/saju/result/page.tsx:64-79`):
```tsx
      {/* Phase 2 버튼 (비활성화) */}
      <div className="flex gap-3 px-4 pb-8">
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          운세 보기
        </button>
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          궁합 보기
        </button>
      </div>
```

변경 후:
```tsx
      <div className="flex gap-3 px-4 pb-8">
        <button
          onClick={() => router.push('/fortune')}
          className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white text-sm font-medium"
        >
          운세 보기
        </button>
        <button
          disabled
          className="flex-1 py-3 rounded-2xl bg-card text-muted text-sm font-medium opacity-50 cursor-not-allowed"
        >
          궁합 보기
        </button>
      </div>
```

- [ ] **Step 2: 홈 페이지 운세 카드 활성화**

`app/page.tsx`의 CARDS 배열에서 운세 카드의 `active`를 `true`로 변경한다.

변경 전 (`app/page.tsx:7-12`):
```tsx
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
    active: false,
  },
```

변경 후:
```tsx
  {
    emoji: '💫',
    title: '오늘 운세',
    subtitle: '일간별 맞춤 운세',
    href: '/fortune',
    active: true,
  },
```

- [ ] **Step 3: 전체 테스트 실행**

```bash
npm test
```

Expected: 기존 테스트 포함 전체 통과

- [ ] **Step 4: 커밋**

```bash
git add app/saju/result/page.tsx app/page.tsx
git commit -m "feat: enable fortune page links from result and home"
```

---

## 완료 후 검증

1. `npm run dev` 실행
2. 홈 → 사주 입력 → 사주 결과 → "운세 보기" 버튼 확인
3. 운세 페이지에서 탭 전환 시 아코디언 초기화 확인
4. 아코디언 펼쳐서 영역별 상세 표시 확인
5. "분석 요청하기" 클릭 → 스트리밍 텍스트 타이핑 확인
6. AI 분석 완료 후 탭 전환해도 결과 유지 확인
