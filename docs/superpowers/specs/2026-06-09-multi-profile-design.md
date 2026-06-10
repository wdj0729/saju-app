# 다중 프로필 저장 기능 설계 — 2026-06-09

## 개요

사주 입력 정보를 localStorage에 저장하여, 본인/가족/연인 등 여러 사람의 프로필을 앱에 보관하고 빠르게 불러올 수 있게 한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 저장소 | localStorage (`'saju-profiles'` 키) |
| 저장 트리거 | 사주 결과 페이지의 수동 "💾 저장" 버튼 |
| 프로필 진입점 | 홈 화면 칩 + 사주 입력 폼 상단 목록 (C) |
| 삭제 방식 | 홈 화면 편집 모드 → × 아이콘 (C) |

## 데이터 모델

```ts
// lib/profiles.ts
export interface Profile {
  id: string;        // String(Date.now())
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  ilgan: string;     // 저장 시점에 계산된 일간 (목록 표시용 캐시)
  createdAt: number; // timestamp (ms)
}
```

localStorage key: `'saju-profiles'`, value: `Profile[]` JSON 배열.

## 파일 구조

### 신규 파일

**`lib/profiles.ts`** — 프로필 CRUD 전담

- `loadProfiles(): Profile[]` — localStorage에서 배열 읽기, 실패 시 `[]`
- `saveProfile(input: SajuSessionInput, ilgan: string): void` — 동일 input 이미 저장됐으면 no-op
- `deleteProfile(id: string): void` — id로 항목 제거 후 저장
- `isProfileSaved(input: SajuSessionInput): boolean` — name+year+month+day+hour+isLunar 6개 필드 모두 일치 시 true

### 수정 파일

**`app/page.tsx`** — 서버 컴포넌트 → `'use client'` 전환

- `loadProfiles()`로 프로필 목록 로드 (useState 초기값)
- 프로필 있을 때: 홈 화면 상단에 프로필 섹션 추가
  - 프로필 칩: 탭 → `calculateSaju()` + `saveSession()` → `/saju/result` 이동
  - "편집" 버튼: `isEditing` 토글 → 칩에 × 아이콘 표시
  - × 클릭: `deleteProfile(id)` → 상태 갱신
  - "+ 추가" 칩: `/saju`로 이동
- 프로필 없을 때: 섹션 숨김 (기존 홈 그대로)

**`app/saju/page.tsx`** — 폼 상단 프로필 목록 추가

- `loadProfiles()`로 프로필 목록 로드
- 프로필 있을 때: 폼 상단에 "저장된 프로필 불러오기" 섹션
  - 프로필 행: 이름 + 생년월일 + 일간 표시
  - "선택" 탭: 해당 프로필로 폼 6개 필드(`name`, `year`, `month`, `day`, `hour`, `isLunar`) 자동 채워짐
- 프로필 없을 때: 섹션 숨김

**`app/saju/result/page.tsx`** — 하단 버튼 행에 저장 버튼 추가

- `isSaved` state: `isProfileSaved(input)` 초기값
- "💾 저장" 버튼: `saveProfile(input, result.ilgan)` 호출 → `isSaved = true`
- 저장 후: "✓ 저장됨" 텍스트로 변경, 버튼 비활성화
- 버튼 위치: 기존 `[운세 보기] [궁합 보기] [⬆ 공유]` 행에 추가 → `[운세 보기] [궁합 보기] [💾] [⬆]`

## UX 흐름

```
[홈] 프로필 칩 탭
  → calculateSaju(profile) → saveSession() → /saju/result

[홈] "내 사주 보기" → /saju
  → 폼 상단에 프로필 목록
  → "선택" 탭 → 폼 자동채우기
  → "사주 분석하기" → /saju/result
  → "💾 저장" 탭 → 저장됨

[홈] "편집" 탭
  → 칩에 × 아이콘
  → × 탭 → 해당 프로필 삭제
  → "완료" 탭 → 편집 모드 종료
```

## 제약 사항

- 프로필 최대 개수: 제한 없음 (localStorage 용량 5MB로 수백 개 이상 가능)
- 일간(ilgan) 표시: 저장 시점에 `ilgan`을 Profile에 포함하여 저장, 목록 렌더링 시 재계산 없음
- 프로필 수정 기능: 미포함 (삭제 후 재저장으로 대체)
- 궁합 페이지 프로필 연동: 미포함 (별도 기능으로 추후 구현)

## 미포함 사항

- 기기 간 동기화 (추후 소셜 로그인 연동 시 마이그레이션)
- 프로필 수정 UI
- 궁합 페이지에서 프로필 불러오기
