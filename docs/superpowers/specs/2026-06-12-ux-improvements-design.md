# UX Improvements: 홈 화면 정리 · 시간 입력 · 프로필 편집

Date: 2026-06-12

## 1. 홈 화면 카드 정리

### 문제
BottomNav(홈/사주/운세/궁합) 추가 후 홈 화면의 사주·궁합 카드와 중복 발생.

### 변경
`app/page.tsx`의 `CARDS` 배열에서 `내 사주 보기`(href: `/saju`)와 `궁합 보기`(href: `/compatibility`) 제거. `2026 신년운세`와 `오늘 운세` 두 항목만 유지.

프로필 섹션은 변경 없음.

---

## 2. HourInput 컴포넌트

### 문제
생년월일은 숫자 직접 입력(DateInput)으로 교체했으나 태어난 시는 `<select>` 유지 — UI 불일치.

### 컴포넌트 인터페이스
```tsx
// components/HourInput.tsx
interface HourInputProps {
  value: number | null; // null = 모름, 유효값 = 0–23
  onChange: (v: number | null) => void;
}
```

### 동작
- 2자리 숫자(00–23) 직접 입력
- 유효한 시간 입력 완료 시 해당 시진 이름 + 시간대 표시 (예: `14` → `미시 (13:00~15:00)`)
- 시진 매핑: SIJIN의 각 시진은 2시간 범위를 가짐. 입력한 시간이 속하는 시진을 계산
- `모름` 버튼: 탭하면 입력 초기화 + `null` 반환. 선택 시 강조 표시
- 입력 필드에 값 타이핑 시작 시 `모름` 상태 자동 해제
- 범위 초과(24 이상) 입력 시 23으로 clamp

### 시진 매핑 로직
```
00–00 → 자시(0), 01–02 → 축시(1), 03–04 → 인시(3),
05–06 → 묘시(5), 07–08 → 진시(7), 09–10 → 사시(9),
11–12 → 오시(11), 13–14 → 미시(13), 15–16 → 신시(15),
17–18 → 유시(17), 19–20 → 술시(19), 21–22 → 해시(21),
23 → 자시(0)
```

### 적용 위치
- `app/saju/page.tsx` — 기존 `<select>` → `HourInput`
- `app/compatibility/page.tsx` `PersonForm` — 기존 `<select>` → `HourInput`

---

## 3. 프로필 인라인 편집

### 문제
프로필 삭제만 가능. 이름·생년월일 등 수정 시 삭제 후 재입력 필요.

### 동작
기존 `isEditing` 모드를 확장:

| 모드 | 항목 탭 시 |
|------|-----------|
| 편집 OFF | 아코디언 열림 → 사주/운세/신년/궁합 빠른 이동 (현재와 동일) |
| 편집 ON | 아코디언 열림 → 인라인 수정 폼 |

수정 폼 필드: 이름(text input), 성별(M/F 토글), 양음력 토글, DateInput, HourInput, 저장 버튼.

편집 모드에서 항목 탭 시 expandedProfileId를 해당 id로 설정 (1개만 열림).

### 데이터 레이어
`lib/profiles.ts`에 `updateProfile` 추가:
```ts
export function updateProfile(id: string, patch: Partial<Omit<Profile, 'id' | 'createdAt'>>): void
```
ilgan 변경이 필요한 경우 caller가 재계산 후 전달.

---

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `app/page.tsx` | CARDS에서 사주·궁합 제거, 인라인 편집 폼 추가 |
| `components/HourInput.tsx` | 신규 생성 |
| `app/saju/page.tsx` | select → HourInput |
| `app/compatibility/page.tsx` | PersonForm select → HourInput |
| `lib/profiles.ts` | updateProfile 함수 추가 |
| `lib/__tests__/hour-input-utils.test.ts` | 시진 매핑 유닛 테스트 |
