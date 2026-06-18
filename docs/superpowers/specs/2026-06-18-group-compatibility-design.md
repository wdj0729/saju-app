# 모임 궁합 기능 설계

**날짜:** 2026-06-18  
**목표:** 2~10명의 사주를 입력받아 모든 쌍의 궁합 점수를 계산하고, 관계 그래프로 시각화 + AI 전체 분석을 제공한다.

---

## 결정 사항 요약

| 항목 | 결정 |
|------|------|
| 최대 인원 | 10명 (최소 2명) |
| 결과 레이아웃 | 관계 그래프형 (SVG 원형 노드 + 색상·두께 관계선) |
| AI 분석 | 모임 전체 1회 (N명 오행 데이터 → Claude) |
| 진입점 | 기존 `/compatibility`에 "1:1 / 모임" 탭 추가 |
| 인원 입력 | 동적 추가 (시작 2명, "+ 인원 추가" 버튼, 프로필 불러오기 가능) |

---

## 아키텍처

### 페이지 구조

```
/compatibility                     ← 기존 페이지, 상단에 1:1|모임 탭 추가
/compatibility/group               ← 모임 입력 페이지 (신규)
/compatibility/group/result        ← 모임 결과 페이지 (신규)
/api/group-compatibility-analysis  ← AI 분석 API (신규)
```

### 데이터 흐름

```
GroupCompatibilityLoader (입력)
  → PersonInputFields × N  (2~10명)
  → calcCompatibility() × N*(N-1)/2  (쌍별 점수)
  → saveGroupCompatSession()  (sessionStorage)
  → router.push('/compatibility/group/result')

GroupResultContent (결과)
  → loadGroupCompatSession()
  → SVG 관계 그래프
  → AiContent / useAiText  (버튼 탭 → AI 스트리밍)
```

---

## 타입 정의

`lib/group-compatibility.ts`에 선언:

```ts
interface GroupMember {
  name: string;
  gender: 'M' | 'F';
  result: SajuResult;
}

interface PairResult {
  indexA: number;
  indexB: number;
  score: number;
  grade: '최상' | '상' | '중' | '하';
  gradeLabel: string;
}

interface GroupCompatibilitySession {
  members: GroupMember[];   // 2~10명
  pairs: PairResult[];      // N*(N-1)/2 쌍
  averageScore: number;     // 전체 조화도 (pairs 평균)
}
```

`averageScore`는 저장 시 계산해서 함께 저장한다.

---

## 파일 목록

### 신규 생성

| 파일 | 역할 |
|------|------|
| `lib/group-compatibility.ts` | 타입, 세션 저장/로드, `calcGroupCompatibility()` |
| `app/compatibility/group/page.tsx` | 서버 컴포넌트 (metadata) |
| `app/compatibility/group/GroupCompatibilityLoader.tsx` | 동적 인원 추가 폼 |
| `app/compatibility/group/result/page.tsx` | 서버 컴포넌트 (metadata) |
| `app/compatibility/group/result/GroupResultContent.tsx` | SVG 그래프 + AI 분석 |
| `app/compatibility/group/result/GroupResultLoader.tsx` | 세션 로드 + Suspense |
| `app/api/group-compatibility-analysis/route.ts` | Claude AI 스트리밍 |
| `components/CompatibilityTabs.tsx` | "1:1 / 모임" 탭 UI |

### 수정

| 파일 | 변경 내용 |
|------|-----------|
| `app/compatibility/CompatibilityLoader.tsx` | `CompatibilityTabs` 추가 (상단) |
| `app/compatibility/page.tsx` | metadata 유지 (변경 없거나 미세 수정) |

---

## 컴포넌트 설계

### `CompatibilityTabs`

`/compatibility` 상단에 렌더. 현재 경로(`usePathname`)로 활성 탭 결정.

```
[💑 1:1 궁합] [👥 모임 궁합]
```

`/compatibility` 또는 `/compatibility/result` → 1:1 탭 활성  
`/compatibility/group` 또는 `/compatibility/group/result` → 모임 탭 활성

탭 클릭 시 `router.push()`.

### `GroupCompatibilityLoader`

- 상태: `members: MemberForm[]` (초기 2개)
- `MemberForm` = `{ name, gender, isLunar, year, month, day, hour }`
- "+ 인원 추가" 버튼 (members.length < 10일 때만 활성)
- "삭제" 버튼 (members.length > 2일 때만)
- 각 카드에 프로필 칩 (기존 `loadProfiles()` 재사용)
- 제출 시 `calcCompatibility()`로 모든 쌍 계산 → `saveGroupCompatSession()` → 결과 페이지 이동

### `GroupResultContent` — SVG 관계 그래프

N명을 원형으로 배치. 노드 반지름 = 화면폭 × 0.35 (모바일 기준 ~120px).

**노드:** 원 + 이름 텍스트 (일간 서브텍스트)

**관계선 스타일:**

| 등급 | 색상 | 두께 |
|------|------|------|
| 최상 (85+) | `#4ade80` (green) | 3.5px |
| 상 (70~84) | `#60a5fa` (blue) | 2.5px |
| 중 (50~69) | `#facc15` (yellow) | 2px |
| 하 (~49) | `#f87171` (red) | 1.5px |

**노드 탭 인터랙션:** 탭한 노드의 관계선만 하이라이트, 나머지 페이드. 하단 슬라이드업 패널에 해당 인물의 모든 쌍 목록 표시.

**전체 조화도:** 그래프 중앙에 averageScore 숫자 + 등급 라벨.

### `app/api/group-compatibility-analysis/route.ts`

요청 바디:

```ts
interface GroupAnalysisRequest {
  members: Array<{ name: string; ilgan: string; ohaeng: Record<string, number> }>;
  averageScore: number;
}
```

프롬프트 구성: 각 멤버의 일간·오행 → Claude에게 그룹 전체 역학, 강점, 주의점을 2~3문단으로 분석 요청.

스트리밍 응답 (`streamAnthropicResponse` 재사용).

---

## 재사용 목록

| 재사용 | 출처 |
|--------|------|
| `PersonInputFields` | 각 멤버 입력 카드 |
| `calcCompatibility()` | `lib/compatibility.ts` |
| `AiContent` + `useAiText` | AI 스트리밍 표시 |
| `createSessionStore` | `lib/session-store.ts` |
| `loadProfiles()` + 프로필 칩 | `lib/profiles.ts` |
| `getRateLimitResponse` | `lib/rate-limit.ts` |
| `streamAnthropicResponse` | `lib/stream-anthropic.ts` |
| `AI_MODEL` | `lib/anthropic.ts` |

---

## 엣지 케이스

- **인원 2명:** 기존 1:1 궁합과 동일한 계산이지만 모임 결과 페이지로 표시 (중복 기능이나 허용)
- **이름 미입력:** 이름 없음은 "첫 번째 분", "두 번째 분" 등으로 표시
- **세션 없이 결과 접근:** `SessionExpiredPage` 표시 (기존 패턴 그대로)
- **SVG 노드 겹침 (2명):** 2명일 때는 좌우 배치로 특수 처리
