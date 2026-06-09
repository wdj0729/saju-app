# 운세 해석 페이지 설계 문서

**날짜:** 2026-06-09
**페이지:** `/fortune`
**스택:** Next.js 15 App Router + TypeScript + Claude API (스트리밍)

---

## 개요

사주 원국에서 추출한 일간(日干)을 기반으로 오늘/이달/올해 운세를 표시하는 페이지.
고정 텍스트(요약 + 영역별 상세)와 Claude AI 심층 분석(스트리밍)을 함께 제공한다.

---

## 기능 범위

### 포함
- 오늘 / 이달 / 올해 탭 전환
- 탭별 운세 카드: 요약(2~3문장) + 아코디언 펼침(영역별 상세)
- AI 심층 분석 요청 버튼 + 스트리밍 응답 표시
- 세션 없을 때 `/saju`로 리다이렉트

### 제외
- 운세 히스토리 저장
- 푸시 알림
- 공유 기능

---

## 파일 구성

```
app/
  fortune/
    page.tsx              # 운세 페이지 (탭 + 아코디언 + AI 분석)
  api/
    ai-analysis/
      route.ts            # Claude 스트리밍 API 엔드포인트
lib/
  fortune-text.ts         # 고정 운세 텍스트 (일간 10 × 기간 3)
```

---

## 데이터 구조

### fortune-text.ts

```typescript
interface FortunePeriod {
  summary: string;  // 카드에 보이는 2~3문장 요약
  details: {
    대운: string;
    재물: string;
    건강: string;
    인간관계: string;
  };
}

type FortunePeriodKey = '오늘' | '이달' | '올해';
type FortuneEntry = Record<FortunePeriodKey, FortunePeriod>;

const FORTUNE_TEXT: Record<string, FortuneEntry> = {
  甲: { 오늘: {...}, 이달: {...}, 올해: {...} },
  乙: { ... },
  // 丙 丁 戊 己 庚 辛 壬 癸
};
```

### AI 분석 요청 바디

```typescript
interface AiAnalysisRequest {
  ilgan: string;
  ohaeng: Record<string, number>;
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  };
}
```

---

## 페이지 UI 설계

### 레이아웃 (위→아래)

1. **헤더** — `← 내 사주` 뒤로가기 + 이름/일간 표시
2. **탭 바** — `오늘 | 이달 | 올해` 수평 탭, 활성 탭 하단 밑줄
3. **운세 카드** — 요약 + 아코디언 펼침 (탭 전환 시 접힘 초기화)
4. **AI 분석 카드** — 탭 무관하게 페이지 하단 고정, 한 번 받은 결과 탭 전환 후에도 유지

### 아코디언 카드 구조

```
┌─────────────────────────────────┐
│  💫 오늘의 운세 · 甲 일간        │
│  요약 2~3문장...                 │
│                        ∨ 자세히 │
├─────────────────────────────────┤  ← 펼쳐지면 표시
│  대운      오늘은 ...            │
│  재물      ...                   │
│  건강      ...                   │
│  인간관계  ...                   │
└─────────────────────────────────┘
```

### AI 분석 카드 상태

| 상태 | 표시 |
|------|------|
| 초기 | "🤖 AI 심층 분석" + [분석 요청하기] 버튼 |
| 로딩 중 | 버튼 비활성화 + 스피너, 텍스트 스트리밍 누적 표시 |
| 완료 | 전체 분석 텍스트 + [다시 요청] 버튼 |
| 오류 | 오류 메시지 + [다시 시도] 버튼 |

---

## 상태 관리

`page.tsx` 내 `useState` 4개:

```typescript
const [activeTab, setActiveTab] = useState<'오늘' | '이달' | '올해'>('오늘');
const [isExpanded, setIsExpanded] = useState(false);   // 탭 변경 시 false 초기화
const [aiText, setAiText] = useState('');
const [isStreaming, setIsStreaming] = useState(false);
```

---

## AI 분석 API

### `POST /api/ai-analysis`

**응답:** `ReadableStream` (plain text chunks)

**Claude 프롬프트:**
```
당신은 30년 경력의 명리학 전문가입니다.
아래 사주를 보고 오늘의 운세를 한국어로 해석해주세요.

사주 원국: {년주} {월주} {일주} {시주}
일간: {ilgan}
오행 분포: 목 {목} / 화 {화} / 토 {토} / 금 {금} / 수 {수}

대운, 재물, 건강, 인간관계 측면에서 각 2~3문장씩 구체적으로 설명해주세요.
```

**모델:** `claude-sonnet-4-6`

**스트리밍 구현:**
- 서버: `@anthropic-ai/sdk` `client.messages.stream()` → `ReadableStream` + `TextEncoder`
- 클라이언트: `fetch()` → `response.body.getReader()` → `reader.read()` 루프

---

## 데이터 흐름

```
페이지 진입
  → sessionStorage loadSession()
  → 세션 없음 → router.replace('/saju')
  → ilgan = session.result.ilgan
  → FORTUNE_TEXT[ilgan][activeTab] 렌더링

탭 전환
  → activeTab 변경
  → isExpanded = false (아코디언 접힘)
  → FORTUNE_TEXT[ilgan][activeTab] 재렌더링

AI 분석 요청
  → setIsStreaming(true), setAiText('')
  → POST /api/ai-analysis { ilgan, ohaeng, pillars }
  → 청크 수신마다 setAiText(prev => prev + chunk)
  → 완료 시 setIsStreaming(false)
```

---

## 오류 처리

- 세션 없음: `/saju` 리다이렉트 (기존 result 페이지와 동일 패턴)
- AI API 오류: 오류 메시지 표시 + 재시도 버튼 (스트리밍 중단)
- 환경변수 `ANTHROPIC_API_KEY` 미설정: 서버에서 500 응답

---

## 연결

- `/saju/result` 페이지의 "운세 보기" 버튼 → `/fortune` 활성화
- `/fortune` → `/compatibility` 진입 버튼 추가 (하단)
