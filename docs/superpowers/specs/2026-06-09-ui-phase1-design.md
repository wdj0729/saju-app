# 사주 앱 UI Phase 1 설계 문서

**날짜:** 2026-06-09
**범위:** 홈(`/`) · 사주 입력(`/saju`) · 사주 결과(`/saju/result`)
**Phase 2 (별도 스펙):** 운세(`/fortune`) · 궁합(`/compatibility`)

---

## 기술 결정

| 항목 | 선택 |
|------|------|
| 스타일링 | Pure Tailwind CSS (컴포넌트 라이브러리 없음) |
| 상태 공유 | sessionStorage (페이지 간 사주 데이터 전달) |
| 레이아웃 | 공유 모바일 wrapper (`app/layout.tsx`) |
| 계산 엔진 | `lib/saju-calculator.ts` (기존 구현) |

---

## 파일 구조

```
app/
├── layout.tsx                # 다크 배경 + max-w-md 모바일 wrapper
├── globals.css               # CSS 변수 + Tailwind 확장 색상
├── page.tsx                  # 홈 (/)
└── saju/
    ├── page.tsx              # 생년월일시 입력 (/saju)
    └── result/
        └── page.tsx          # 사주 원국 결과 (/saju/result)

components/
├── SajuGrid.tsx              # 4기둥 한자 그리드
└── OhaengChart.tsx           # 오행 분포 가로 막대 차트

lib/
├── saju-calculator.ts        # (기존)
├── saju-data.ts              # (기존)
├── session.ts                # sessionStorage read/write 유틸
└── ilgan-text.ts             # 10천간별 일간 기질 설명 텍스트
```

---

## 컬러 시스템

`globals.css`에 CSS 변수 정의, `tailwind.config.ts`에 커스텀 색상 등록:

```css
:root {
  --bg-base: #1e1e2e;
  --bg-card: #2a2a3e;
  --bg-card-hover: #32324a;
  --accent-from: #667eea;
  --accent-to: #764ba2;
  --text-primary: #e8e8f0;
  --text-muted: #9090a8;
  --border: #3a3a52;
}
```

Tailwind 커스텀 색상 (짧은 클래스명으로 사용):
- `bg-base`, `bg-card`, `bg-card-hover`
- `text-primary`, `text-muted`
- `border-muted`

그라디언트 버튼: `bg-gradient-to-r from-[#667eea] to-[#764ba2]`

오행 색상 (OhaengChart + SajuGrid 기둥 배경):
| 오행 | 색상 |
|------|------|
| 목(木) | `#4ade80` |
| 화(火) | `#f87171` |
| 토(土) | `#facc15` |
| 금(金) | `#e2e8f0` |
| 수(水) | `#60a5fa` |

---

## 데이터 흐름

### sessionStorage 구조

```typescript
// lib/session.ts
interface SajuSession {
  input: {
    name: string;
    year: number;
    month: number;
    day: number;
    hour: number | null;   // null = 모름
    isLunar: boolean;
  };
  result: SajuResult;     // lib/saju-calculator.ts의 SajuResult 타입
}

const SESSION_KEY = 'saju-session';

export function saveSession(data: SajuSession): void
export function loadSession(): SajuSession | null
export function clearSession(): void
```

### 페이지 간 흐름

```
홈 (/) ──→ /saju (입력)
              │
              │ calculateSaju() 호출
              │ sessionStorage 저장
              ↓
           /saju/result (결과)
              │ 마운트 시 sessionStorage 읽기
              │ null이면 router.push('/saju')
```

---

## 레이아웃 (`app/layout.tsx`)

- `lang="ko"`, Geist Sans 폰트 유지
- `<body>`: `bg-base min-h-screen`
- 내부 wrapper: `max-w-md mx-auto min-h-screen flex flex-col`
- PWA 메타태그 (apple-touch-icon, theme-color) 포함
- `<title>`: "사주팔자"

---

## 페이지 상세

### 홈 (`app/page.tsx`)

레이아웃: 수직 중앙 정렬 (`flex flex-col items-center justify-center min-h-screen`)

구성 요소:
1. 로고 이모지 🔮 (4xl)
2. 제목 "사주팔자" (2xl bold, text-primary)
3. 부제 "나의 운명을 살펴보세요" (sm, text-muted)
4. 기능 카드 3개 (세로 스택, `flex flex-col gap-3 w-full px-6 mt-8`):
   - 각 카드: `bg-card rounded-2xl p-4 flex items-center gap-4`
   - 이모지 + 제목 + 부제 + 화살표(→)
   - 클릭 시 해당 페이지로 이동

카드 목록:
| 이모지 | 제목 | 부제 | 링크 | 활성화 |
|--------|------|------|------|--------|
| 🔮 | 내 사주 보기 | 생년월일시로 사주팔자 분석 | `/saju` | ✅ |
| 💫 | 오늘 운세 | 일간별 맞춤 운세 | `/fortune` | ❌ (opacity-50, pointer-events-none) |
| 💑 | 궁합 보기 | 두 사람의 사주 궁합 분석 | `/compatibility` | ❌ (opacity-50, pointer-events-none) |

서버 컴포넌트 (상태 없음).

---

### 사주 입력 (`app/saju/page.tsx`)

클라이언트 컴포넌트 (`'use client'`).

상단 헤더:
- `← 뒤로` 버튼 (`router.back()`) + 페이지 제목 "생년월일시 입력"

폼 필드 (순서대로):
1. **이름** — `<input type="text" placeholder="이름 (선택)">`
2. **양력/음력 토글** — pill 형태 두 버튼. 선택된 쪽 `bg-gradient`, 미선택 `bg-card`
3. **생년** — `<select>` 1900~2100년
4. **생월** — `<select>` 1~12월
5. **생일** — `<select>` 1~31일 (월에 따라 동적으로 최대일 계산)
6. **태어난 시** — `<select>` 옵션:
   - "모름" (value: null)
   - 자시 (23·0시), 축시(1·2시), 인시(3·4시), 묘시(5·6시), 진시(7·8시), 사시(9·10시), 오시(11·12시), 미시(13·14시), 신시(15·16시), 유시(17·18시), 술시(19·20시), 해시(21·22시)
   - 시진 선택 시 내부적으로 해당 시진의 시작 시각(홀수 시)을 hour 값으로 사용

"사주 분석하기" 버튼:
- 폼 하단, 전체 너비
- `bg-gradient-to-r from-[#667eea] to-[#764ba2]`
- 클릭 시: 유효성 검사(년·월·일 필수) → `calculateSaju()` → `saveSession()` → `router.push('/saju/result')`

상태 (`useState`):
```typescript
const [name, setName] = useState('');
const [isLunar, setIsLunar] = useState(false);
const [year, setYear] = useState(1990);
const [month, setMonth] = useState(1);
const [day, setDay] = useState(1);
const [hourIndex, setHourIndex] = useState<number | null>(null); // null = 모름
```

---

### 사주 결과 (`app/saju/result/page.tsx`)

클라이언트 컴포넌트 (`'use client'`).

마운트 시:
- `loadSession()` 호출
- null이면 `router.replace('/saju')`

구성 요소 (위→아래):
1. **헤더**: `← 다시 입력` 버튼 + `{name}의 사주` 타이틀
2. **SajuGrid**: 4기둥 표시
3. **일간 기질 설명**: `lib/ilgan-text.ts`에서 `result.ilgan`에 해당하는 텍스트 1~2줄
4. **OhaengChart**: 오행 분포 시각화
5. **하단 버튼**: "운세 보기" · "궁합 보기" (opacity-50, disabled, Phase 2 예정)

---

## 컴포넌트 상세

### `SajuGrid`

```typescript
interface SajuGridProps {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
}
```

레이아웃: 4열 그리드 (`grid grid-cols-4 gap-2`)

각 기둥 셀:
- 상단 레이블: "년" / "월" / "일" / "시" (xs, text-muted)
- 천간 한자: `font-serif text-3xl font-bold`
- 지지 한자: `font-serif text-3xl font-bold`
- 셀 배경: 지지의 오행 색상 10% 투명도 (`/10`)
- 시주가 null이면 시 열: "?" 또는 빈 셀 with `text-muted`

### `OhaengChart`

```typescript
interface OhaengChartProps {
  ohaeng: Record<'목'|'화'|'토'|'금'|'수', number>;
}
```

레이아웃: 5행 (`flex flex-col gap-2`)

각 행:
- 오행 한자 레이블 (2글자 고정 너비)
- 가로 막대: 최대값 기준 상대 너비 (`width: (값/최대값 * 100)%`)
- 막대 색상: 오행 색상
- 숫자 표시 (소수점 1자리)

---

## `lib/ilgan-text.ts`

10천간별 일간 기질 한 줄 설명:

```typescript
export const ILGAN_TEXT: Record<string, string> = {
  '甲': '강직하고 진취적인 성품으로 리더십이 강합니다.',
  '乙': '유연하고 섬세한 감수성으로 조화를 추구합니다.',
  '丙': '밝고 열정적인 에너지로 주변을 따뜻하게 합니다.',
  '丁': '섬세하고 집중력이 강하며 예술적 감각이 뛰어납니다.',
  '戊': '안정적이고 포용력이 넓으며 신뢰를 중시합니다.',
  '己': '꼼꼼하고 실용적이며 현실감각이 탁월합니다.',
  '庚': '결단력이 강하고 의리를 중시하는 기질입니다.',
  '辛': '예민하고 완벽주의적 성향으로 심미안이 뛰어납니다.',
  '壬': '지혜롭고 유연하며 넓은 시야를 가집니다.',
  '癸': '직관력이 뛰어나고 깊은 내면세계를 가집니다.',
};
```

---

## 제약 사항

- 모든 페이지 모바일 최적화 (max-w-md 기준)
- 생일 select는 월 변경 시 일 수 자동 조정 (예: 2월 → 28/29일)
- 음력 입력 유효성: `lunar-javascript`가 지원하는 범위(1900~2100)
- 시진 선택 → hour 변환: 자시=0, 축시=1, 인시=3, 묘시=5, 진시=7, 사시=9, 오시=11, 미시=13, 신시=15, 유시=17, 술시=19, 해시=21 (각 시진의 시작 시각)
- Next.js App Router 기준, 모든 페이지 기본 서버 컴포넌트 + 필요 시 `'use client'` 추가
