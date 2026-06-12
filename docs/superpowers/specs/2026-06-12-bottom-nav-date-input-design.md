# 하단 네비게이션 + 생년월일 숫자 입력 설계

**날짜:** 2026-06-12

---

## 1. 하단 네비게이션 바

### 결정: 4탭 (홈·사주·운세·궁합)

탭 구성:

| 탭 | 아이콘 | 이동 경로 | 활성화 경로 |
|----|--------|-----------|-------------|
| 홈 | 🏠 | `/` | `/` 만 |
| 사주 | 🔮 | `/saju` | `/saju`, `/saju/result` |
| 운세 | 💫 | `/fortune` | `/fortune`, `/fortune/yearly` |
| 궁합 | 💑 | `/compatibility` | `/compatibility`, `/compatibility/result` |

**활성 스타일:** 탭 레이블에 그라데이션 색상 + 아래 도트  
**비활성 스타일:** muted 색상  
**배치:** `fixed bottom-0`, 전체 너비, `z-50`

**신규 파일:**
- `components/BottomNav.tsx` — 'use client', `usePathname()` 사용
- `lib/__tests__/bottom-nav.test.ts` — `getActiveTab()` 단위 테스트

**수정 파일:**
- `app/layout.tsx` — `<BottomNav />` 추가, 콘텐츠 래퍼에 `pb-20` 추가

---

## 2. 생년월일 숫자 직접 입력

### 결정: 인라인 숫자 필드 (년 4자리 · 월 2자리 · 일 2자리)

**동작:**
- `type="text"` + `inputMode="numeric"` → 모바일 숫자 키패드 호출
- 년 4자리 입력 → 월 필드 자동 포커스
- 월 2자리 입력 → 일 필드 자동 포커스
- blur 시 범위 벗어난 값 자동 클램핑 (년: 1900~현재년, 월: 1~12, 일: 1~말일)
- 외부(프로필 로드)에서 값 변경 시 표시 자동 갱신

**태어난 시(時) 선택:** 기존 select 유지 (십이지 12항목)

**신규 파일:**
- `components/DateInput.tsx` — 날짜 입력 컴포넌트 (재사용 가능)
- `lib/__tests__/date-input-utils.test.ts` — 클램핑 로직 단위 테스트

**수정 파일:**
- `app/saju/page.tsx` — 년/월/일 select → `<DateInput>` 교체
- `app/compatibility/page.tsx` — PersonForm의 년/월/일 select → `<DateInput>` 교체, PersonFormProps 인터페이스 수정
