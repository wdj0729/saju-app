# 궁합 초대 링크 기능 설계

**날짜:** 2026-06-17  
**상태:** 승인됨

## 개요

현재 궁합 페이지는 두 사람의 정보를 한 기기에서 모두 입력해야 한다. 이 기능은 A가 자신의 정보만 입력한 뒤 링크를 생성해 B에게 공유하면, B가 자신의 정보를 입력해 결과를 확인할 수 있게 한다.

## 사용자 흐름

```
A: /compatibility 입력 페이지
   → 자신의 정보 입력
   → "링크로 초대" 버튼 클릭
   → URL 생성: /compatibility/invite?from=base64(A정보)
   → 클립보드 복사 / Web Share API

B: 링크 오픈 → /compatibility/invite?from=...
   → "A님이 궁합을 요청했어요" + A 정보 read-only 표시
   → B 자신의 정보 입력
   → 제출 → /compatibility/result (기존 결과 페이지 재활용)
```

## 데이터 모델

A의 정보를 URL 파라미터 `from`에 base64(JSON) 형태로 인코딩한다. DB/서버 저장 없음.

```ts
// lib/invite.ts에 정의할 타입
interface InvitePayload {
  name: string;
  year: number;
  month: number;
  day: number;
  hour: number | null;
  isLunar: boolean;
  gender: 'M' | 'F';
}
```

인코딩 예시: `btoa(JSON.stringify(payload))` → URL safe base64 (`+`→`-`, `/`→`_`)

## 변경/추가 파일

### 1. `lib/invite.ts` (신규)
- `encodeInvite(payload: InvitePayload): string` — base64 URL-safe 인코딩
- `decodeInvite(encoded: string): InvitePayload | null` — 디코딩, 파싱 실패 시 null 반환
- 입력값 검증 (year 범위, month 1-12, day 1-31, gender 'M'|'F')

### 2. `app/compatibility/CompatibilityLoader.tsx` (수정)
- A 정보 입력 완료 후 활성화되는 "링크로 초대" 버튼 추가
- 버튼 클릭 → `encodeInvite` → URL 생성 → `navigator.share` or 클립보드 복사
- 버튼은 이름이 있고 생년월일이 유효할 때만 활성화

### 3. `app/compatibility/invite/page.tsx` (신규)
- 메타데이터: "궁합 초대"
- `InvitePage` 서버 컴포넌트 → `<Suspense>` → `InviteLoader` 클라이언트 컴포넌트에 위임 (`useSearchParams` 사용으로 Suspense 경계 필수)

### 4. `app/compatibility/invite/InviteLoader.tsx` (신규)
- `useSearchParams()`로 `from` 파라미터 읽기
- `decodeInvite(from)` 실패 시 에러 메시지 표시
- A 정보를 read-only 카드로 표시 ("A님이 궁합을 요청했어요")
- B 정보 입력 폼 (`PersonInputFields` 재활용)
- 제출 시 `calcCompatibility` → `saveCompatSession` → `/compatibility/result` 이동

## 에러 처리

- `from` 파라미터 없음 또는 디코딩 실패 → "올바르지 않은 초대 링크입니다" 안내 + `/compatibility` 이동 버튼
- B 입력값 검증 오류 → 기존 "입력한 날짜를 확인해주세요" 메시지 재활용

## 재활용하는 기존 코드

- `PersonInputFields` 컴포넌트
- `calcCompatibility`, `saveCompatSession` (lib/compatibility.ts)
- `calculateSaju` (lib/saju-calculator.ts)
- `/compatibility/result` 전체 (변경 없음)

## 범위 밖 (이번에 구현하지 않음)

- B가 결과를 A에게 다시 공유하는 플로우
- 초대 링크 OG 이미지 커스터마이징
- 링크 만료 처리 (URL 인코딩이므로 만료 없음)
