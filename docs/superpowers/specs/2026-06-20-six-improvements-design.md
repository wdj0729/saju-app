# saju-app 6개 개선사항 설계 문서

작성일: 2026-06-20

---

## 1. Redis AI 캐싱

### 대상 엔드포인트
- `/api/saju-analysis` — 사주 분석 (5개 섹션)
- `/api/ai-analysis` — 오늘 운세 (날짜 포함 캐시 키)
- `/api/yearly-fortune` — 신년운세

### 아키텍처

```
POST /api/saju-analysis
  → Redis GET(cacheKey)
    → HIT: 캐시된 텍스트를 ReadableStream으로 즉시 반환
    → MISS: Claude 스트리밍 → 클라이언트에 동시 스트림 + 버퍼 누적
              → 스트리밍 완료 후 Redis SET(cacheKey, fullText, EX=30일)
```

### 캐시 키
- saju-analysis: `server-ai:saju:v1:{year}-{month}-{day}-{hour|x}-{L|S}`
  - 이름·나이는 키에 포함하지 않음 (사주 원국은 생년월일시만으로 결정)
- ai-analysis: `server-ai:fortune:v1:{year}-{month}-{day}-{hour|x}-{L|S}:{todayYear}-{todayMonth}-{todayDay}`
- yearly-fortune: `server-ai:yearly:v1:{year}-{month}-{day}-{hour|x}-{L|S}:{fortuneYear}`

### 구현 위치
- `lib/redis-ai-cache.ts` 신규 파일: `getRedisAiCache`, `setRedisAiCache` 함수
- 각 route.ts에서 `parseBody` 이후, `streamAnthropicResponse` 이전에 캐시 체크

### TTL
- saju-analysis, yearly-fortune: 30일
- ai-analysis: 1일 (오늘 날짜 포함이므로)

---

## 2. Streaming 재시도 UI

### 현재 상태
`useSections` hook의 `aiError` 상태가 설정되면 에러 메시지만 표시됨. 재시도 방법 없음.

### 변경 사항

**`hooks/useSections.ts`**
- `lastRequestArgs: { url: string; body: unknown } | null` ref 추가
- `request()` 호출 시 args 저장
- `retry()` 함수 노출 — lastRequestArgs로 request() 재호출

**`components/AiSections.tsx`**
- `aiError`가 있을 때 기존 에러 텍스트 아래 "다시 시도" 버튼 추가
- `retry` prop 받아서 버튼 onClick에 연결

**`hooks/useAiSections.ts`, `hooks/useYearlySections.ts` 등**
- `retry` 반환값 추가 노출

---

## 3. 사주 결과 URL 공유

### 방식
초대 링크(`/compatibility/invite`)와 동일한 base64 URL-safe 인코딩.

### 새 파일/라우트

**`lib/saju-share.ts`**
```ts
interface SajuSharePayload {
  year: number; month: number; day: number;
  hour: number | null; isLunar: boolean; gender: 'M' | 'F'; name?: string;
}
encodeSajuShare(payload): string
decodeSajuShare(encoded): SajuSharePayload | null
```

**`app/saju/share/page.tsx`**
- URL 파라미터 `?d=<encoded>` 파싱
- 페이로드로 사주 계산 + 세션 저장 → `/saju/result`로 redirect
- 유효하지 않으면 `/saju`로 redirect

### 공유 버튼 위치
- `/saju/result` 페이지 상단 (ShareButton 옆 또는 대체)
- 기존 이미지 공유(ShareButton)와 별도로 "링크 공유" 버튼 추가

---

## 4. sitemap.xml + robots.txt

### App Router 방식
Next.js App Router의 `MetadataRoute` 타입 사용.

**`app/sitemap.ts`**
정적 라우트만 포함:
- `/` (홈)
- `/saju` (사주 입력)
- `/fortune` (오늘 운세)
- `/fortune/yearly` (신년운세)
- `/compatibility` (궁합)
- `/compatibility/group` (모임 궁합)

동적 결과 페이지(`/saju/result` 등)는 포함하지 않음 (세션 의존).

**`app/robots.ts`**
- `User-agent: *` 허용
- `/api/*` disallow

---

## 5. 프로필 JSON export/import

### UI 위치
홈 페이지 프로필 섹션의 "편집" 버튼 옆에 "내보내기 / 가져오기" 추가.

### Export
- `profiles.json` 파일 다운로드 (Blob + URL.createObjectURL)
- 형식: `{ version: 1, profiles: Profile[] }`

### Import
- `<input type="file" accept=".json">` (숨김)
- 파싱 후 각 항목을 `isProfile()` 검증
- 기존 프로필과 id 충돌 시 skip (같은 id는 덮어쓰지 않음)
- 결과 토스트: "N개 가져왔어요 / M개 중복 건너뜀"

### 구현 위치
- `lib/profiles.ts`에 `exportProfiles()`, `importProfiles()` 함수 추가
- `app/page.tsx`에 버튼 및 파일 input 추가

---

## 6. 대운 연도 레이블

### 현재
`DaewoonChart` 카드에 나이(`5~14`)만 표시.

### 변경
`DaewoonPillar`의 `startAge`와 `daewoonSu`(대운수 = 시작 나이), 그리고 `birthYear`를 이용해 실제 연도 계산.

```
startYear = birthYear + pillar.startAge
endYear   = birthYear + pillar.endAge
```

카드 나이 표시(`5~14세`) 아래에 실제 연도(`1995~2004`) 추가.

### 구현 위치
- `DaewoonChart` props에 `birthYear: number` 추가
- 카드 내부 나이 레이블 아래 `{startYear}~{endYear}` 표시
- `SajuResultContent`에서 `birthYear` props 전달

---

## 파일 변경 요약

| 파일 | 변경 유형 |
|------|-----------|
| `lib/redis-ai-cache.ts` | 신규 |
| `app/api/saju-analysis/route.ts` | 수정 |
| `app/api/ai-analysis/route.ts` | 수정 |
| `app/api/yearly-fortune/route.ts` | 수정 |
| `hooks/useSections.ts` | 수정 |
| `hooks/useAiSections.ts` | 수정 |
| `hooks/useYearlySections.ts` | 수정 |
| `components/AiSections.tsx` | 수정 |
| `lib/saju-share.ts` | 신규 |
| `app/saju/share/page.tsx` | 신규 |
| `app/saju/result/SajuResultContent.tsx` | 수정 |
| `app/sitemap.ts` | 신규 |
| `app/robots.ts` | 신규 |
| `lib/profiles.ts` | 수정 |
| `app/page.tsx` | 수정 |
| `components/DaewoonChart.tsx` | 수정 |
