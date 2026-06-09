# 사주 모바일 웹앱 설계 문서

**날짜:** 2026-06-09  
**플랫폼:** Web App (PWA)  
**스택:** Next.js 15 + TypeScript + Claude API

---

## 개요

생년월일시를 입력하면 사주팔자를 계산하고, 운세 해석과 궁합을 제공하는 PWA 앱. 로그인 없이 사용 가능하며, 홈 화면에 설치해 네이티브 앱처럼 사용할 수 있다.

---

## 기능 범위

### 포함
1. **사주팔자 조회** — 생년월일시(양력/음력) 입력 → 사주 원국(8글자) + 오행 분포 표시
2. **운세 해석** — 오늘/이달/올해 탭별 고정 텍스트 + AI 심층 분석(선택)
3. **궁합** — 두 사람의 사주 원국 비교 → 오행 상생/상극 분석 + 점수 + 해석

### 제외
- 로그인 / 회원 가입
- 작명 분석
- 명리학 학습 콘텐츠
- 서버사이드 데이터 저장

---

## 화면 구성 (5개 페이지)

### ① 홈 (`/`)
- 앱 제목과 3개 기능 진입 버튼 (세로 나열 아님, 가로 3열)
- 🔮 내 사주 보기 → `/saju`
- 💫 오늘 운세 → `/fortune` (사주 미입력 시 입력 먼저 유도)
- 💑 궁합 보기 → `/compatibility`

### ② 생년월일시 입력 (`/saju`)
- 이름 입력 (선택)
- 양력/음력 토글
- 생년월일 선택 (년/월/일 드롭다운)
- 태어난 시 선택 (자시~해시, 모름 선택 가능)
- "사주 분석하기" 버튼

### ③ 사주 원국 (`/saju/result`)
- 4기둥 천간·지지 한자 표시 (년/월/일/시)
- 오행(木火土金水) 분포 시각화
- 일간 기반 성격/기질 간단 설명
- 운세 보러 가기 / 궁합 보러 가기 버튼

### ④ 운세 해석 (`/fortune`)
- 오늘 / 이달 / 올해 탭 (가로 탭 UI)
- 탭별 고정 텍스트 운세 표시 (일간 기준 매핑)
- "🤖 AI 심층 분석 요청" 버튼 → 스트리밍 응답 표시

### ⑤ 궁합 (`/compatibility`)
- 나의 사주 (이전 입력값 자동 불러옴 또는 재입력)
- 상대방 생년월일시 입력
- "궁합 분석하기" 버튼
- 결과: 오행 상생/상극 관계, 궁합 점수(100점 기준), 해석 텍스트

---

## 아키텍처

```
saju-app/
├── app/
│   ├── page.tsx                    # 홈
│   ├── saju/
│   │   ├── page.tsx                # 생년월일시 입력
│   │   └── result/page.tsx         # 사주 원국
│   ├── fortune/page.tsx            # 운세 해석
│   ├── compatibility/page.tsx      # 궁합
│   └── api/
│       └── ai-analysis/route.ts    # Claude API 호출 (서버사이드, 스트리밍)
├── lib/
│   ├── saju-calculator.ts          # 사주 계산 엔진
│   ├── fortune-text.ts             # 고정 운세 텍스트 (일간별 매핑)
│   └── lunar-converter.ts          # 음력↔양력 변환 (lunar-javascript 래핑)
├── components/
│   ├── SajuGrid.tsx                # 4기둥 한자 그리드
│   ├── OhaengChart.tsx             # 오행 분포 차트
│   └── FortuneCard.tsx             # 운세 카드
└── public/
    ├── manifest.json               # PWA 매니페스트
    └── icons/                      # PWA 아이콘 (192x192, 512x512)
```

---

## 핵심 로직

### 사주 계산 (`saju-calculator.ts`)
- 입력: 생년월일시 (Date 객체 + 시간 인덱스)
- 음력 입력 시 `lunar-javascript`로 양력 변환 후 처리
- 60갑자 기반 년·월·일·시 천간·지지 계산
- 출력: `{ year: { gan, ji }, month: { gan, ji }, day: { gan, ji }, hour: { gan, ji }, ohaeng: Record<'목'|'화'|'토'|'금'|'수', number> }`

### 운세 텍스트 (`fortune-text.ts`)
- 10천간(甲~癸) × 3기간(오늘/이달/올해) 매핑 테이블
- 총 30개 고정 텍스트 항목

### AI 분석 (`/api/ai-analysis/route.ts`)
- POST 요청: 사주 원국 데이터 수신
- Claude `claude-sonnet-4-5` 모델 스트리밍 호출
- 프롬프트: 명리학 전문가 페르소나 + 사주 데이터 + 한국어 해석 요청
- 응답: `ReadableStream` (Server-Sent Events)

### 궁합 계산
- 두 사람의 오행 분포 비교
- 상생(相生) 관계: 점수 가산, 상극(相剋) 관계: 점수 감산
- 100점 만점 환산 + 등급(최상/상/중/하) + 텍스트 해석

---

## 데이터 흐름

```
사용자 입력 (생년월일시)
  → [음력이면] lunar-javascript → 양력 변환
  → saju-calculator → 8글자 + 오행 계산
  → sessionStorage 임시 저장 (페이지 간 공유)
  → 결과 페이지 렌더링

AI 심층 분석 요청 시:
  → POST /api/ai-analysis { sajuData }
  → Claude API 스트리밍 호출
  → SSE로 클라이언트에 청크 전달
  → 화면에 실시간 타이핑 효과로 표시
```

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | 서버사이드 AI 호출 + PWA 통합 용이 |
| 언어 | TypeScript | 사주 데이터 타입 안정성 |
| 스타일 | Tailwind CSS | 빠른 모바일 UI 구현 |
| AI 모델 | Claude claude-sonnet-4-5 | 한국어 명리학 맥락 이해 우수 |
| AI SDK | Anthropic SDK (스트리밍) | 타이핑 효과 자연스러운 UX |
| PWA | @ducanh2912/next-pwa | Next.js 15 App Router 호환 |
| 음력 변환 | lunar-javascript | 검증된 한국/중국 음력 라이브러리 |
| 배포 | Vercel | Next.js 최적화 + 무료 플랜 |

---

## 디자인 방향

- **컬러:** 보라(#667eea) → 인디고(#764ba2) 그라디언트
- **배경:** 다크 (#1e1e2e 계열)
- **타겟:** MZ세대, 트렌디하고 세련된 분위기
- **폰트:** 한자는 serif 계열, UI는 sans-serif

---

## PWA 설정

- `manifest.json`: 앱 이름, 아이콘, `display: standalone`, `theme_color`
- 오프라인 지원: 홈/입력 화면 캐시 (고정 텍스트 운세는 오프라인 가능, AI 분석은 온라인 필요)
- iOS 홈 화면 추가: `apple-touch-icon` 메타태그

---

## 제약 사항

- Claude API 키는 Vercel 환경변수로 관리 (클라이언트에 노출 금지)
- AI 분석은 사용자당 호출 횟수 제한 없음 (MVP 단계)
- 사주 계산은 1900년~2100년 범위 지원
