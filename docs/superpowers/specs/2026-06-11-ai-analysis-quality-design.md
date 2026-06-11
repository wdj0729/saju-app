# AI 분석 품질 개선 설계

**날짜:** 2026-06-11  
**목표:** 사주 결과 페이지의 AI 분석을 5개 섹션(성격 + 재물/건강/연애/직업)으로 구조화하고, 더 풍부한 사주 데이터를 프롬프트에 반영해 분석 깊이를 높인다.

---

## 1. 전체 아키텍처

기존 `useAiStream` / `AiContent` / `/api/ai-analysis`는 fortune·compatibility 페이지가 그대로 사용하므로 건드리지 않는다. 사주 결과 페이지 전용 레이어를 새로 추가한다.

### 변경/추가 파일

| 파일 | 신규/수정 | 역할 |
|------|-----------|------|
| `hooks/useAiSections.ts` | 신규 | 스트리밍 텍스트를 5섹션으로 파싱하는 훅 |
| `hooks/__tests__/useAiSections.test.ts` | 신규 | 파서 순수 함수 단위 테스트 |
| `components/AiSections.tsx` | 신규 | 5개 섹션 카드 렌더링 컴포넌트 |
| `app/api/saju-analysis/route.ts` | 신규 | 사주 전용 풍부한 AI 분석 엔드포인트 |
| `app/saju/result/SajuResultContent.tsx` | 수정 | 새 훅/컴포넌트/엔드포인트로 교체 |

---

## 2. 섹션 파싱 방식

### 마커 형식

Claude가 아래 형식으로 응답한다:

```
[성격분석]
일간 甲木은 ...

[재물운]
재물 흐름은 ...

[건강운]
...

[연애운]
...

[직업운]
...
```

### 섹션 키 타입

```ts
export type SectionKey = '성격분석' | '재물운' | '건강운' | '연애운' | '직업운';
export const SECTION_KEYS: SectionKey[] = ['성격분석', '재물운', '건강운', '연애운', '직업운'];
```

### 파서 순수 함수

스트리밍 누적 텍스트 전체를 입력받아 섹션 맵을 반환하는 순수 함수로 추출한다. 훅 내부에서 매 청크마다 호출.

```ts
export function parseSections(text: string): Record<SectionKey, string> {
  // [섹션명] 패턴을 기준으로 split → 각 조각을 해당 섹션에 배정
  // 마커 이전 텍스트는 버림
}
```

이 함수는 훅과 분리되어 있어서 단위 테스트가 쉽다.

---

## 3. `useAiSections` 훅 인터페이스

`useAiStream`과 같은 RAF 배칭·abort 패턴을 그대로 적용한다.

```ts
interface UseAiSectionsReturn {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;  // 현재 스트리밍 중인 섹션
  isStreaming: boolean;
  aiError: string;
  request: (url: string, body: unknown) => Promise<void>;
}
```

`activeSection`은 스트리밍 중 가장 마지막으로 감지된 마커 섹션. 완료 후 `null`.

---

## 4. API 엔드포인트: `/api/saju-analysis`

### 요청 바디

```ts
interface SajuAnalysisRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  };
  name?: string;
  gender?: 'M' | 'F';
  birthYear: number;
  currentAge: number;
  currentDaewoon?: { gan: string; ji: string; startAge: number; endAge: number };
}
```

### 프롬프트 구성

기존 대비 추가되는 컨텍스트:
- 이름·성별
- 만 나이 (현재 삶의 단계 추론)
- 현재 대운 간지 + 나이 범위
- 일주 조합 명시 (일간+일지)

max_tokens: **2048** (기존 1024에서 상향)

### 응답 형식 지시

프롬프트 마지막에 명시:

```
다음 형식으로 정확히 답하세요. 마커([성격분석] 등)는 반드시 줄 시작에 단독으로 써야 합니다.
각 섹션은 3~4문장, 구체적이고 친근한 말투로.

[성격분석]
...

[재물운]
...

[건강운]
...

[연애운]
...

[직업운]
...
```

---

## 5. `AiSections` 컴포넌트

```tsx
interface AiSectionsProps {
  sections: Record<SectionKey, string>;
  activeSection: SectionKey | null;
  isStreaming: boolean;
  aiError: string;
  onRequest: () => void;
}
```

**렌더링 상태별 동작:**

| 상태 | 화면 |
|------|------|
| 초기 (아무것도 없음) | "분석 요청하기" 버튼 1개 |
| 스트리밍 시작 ~ 완료 | 5개 카드 순서대로 표시, 미도착 섹션은 Skeleton |
| 완료 | 5개 카드 전부 텍스트, "다시 요청" 링크 |
| 에러 | 에러 메시지 + "다시 시도" |

각 카드: 섹션 제목(이모지 포함) + 본문 텍스트 + 스트리밍 중이면 커서(`▌`)

섹션별 이모지:
- 성격분석 → 🔮
- 재물운 → 💰
- 건강운 → 🌿
- 연애운 → 💕
- 직업운 → 💼

---

## 6. SajuResultContent 변경 요약

- `useAiStream` → `useAiSections`
- `AiContent` → `AiSections`
- `request('/api/ai-analysis', ...)` → `request('/api/saju-analysis', { ...richer data })`
- `handleAiRequest`에서 `daewoon` 현재 대운 피리어드 계산 후 전달

---

## 7. 테스트 전략

`parseSections` 순수 함수를 단위 테스트로 커버:
- 빈 문자열 → 모든 섹션 빈 문자열
- 마커 1개만 있을 때 → 해당 섹션만 채워짐
- 마커 앞 텍스트 → 버려짐
- 마커 순서가 다를 때 → 올바른 섹션에 배정
- 스트리밍 중 마커가 잘릴 때 (예: `[성격분` 상태) → 안전하게 처리

---

## 8. 기존 페이지 영향 없음

`fortune`, `compatibility` 페이지는 `/api/ai-analysis` + `useAiStream` + `AiContent` 조합을 그대로 사용. 이번 작업과 무관.
