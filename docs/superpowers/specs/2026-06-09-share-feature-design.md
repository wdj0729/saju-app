# 공유 기능 설계 — 2026-06-09

## 개요

사주/궁합/운세 결과를 이미지로 공유하는 기능. 전용 공유 카드를 html2canvas로 캡처해 Web Share API로 공유하고, 미지원 환경에서는 이미지 다운로드로 폴백한다.

## 결정 사항

| 항목 | 결정 |
|------|------|
| 공유 방식 | 이미지 캡처 (html2canvas) |
| 캡처 대상 | 전용 공유 카드 컴포넌트 |
| 공유 메커니즘 | Web Share API → 다운로드 폴백 |
| 적용 페이지 | `/saju/result`, `/compatibility/result`, `/fortune` |

## 컴포넌트 설계

### `components/ShareCard.tsx`

페이지 타입에 따라 다른 공유 카드를 렌더링하는 컴포넌트. html2canvas가 캡처할 숨겨진 DOM 노드로 사용된다.

**숨김 렌더링:** `position: fixed; left: -9999px; top: 0`으로 뷰포트 밖에 렌더링. `display:none`이나 `visibility:hidden`은 html2canvas가 캡처하지 못하므로 사용 금지.

**Props:**
```ts
type ShareCardProps =
  | { type: 'saju'; name: string; ilgan: string; pillars: { year: string; month: string; day: string; hour?: string }; ohaeng: Record<string, number> }
  | { type: 'compatibility'; nameA: string; nameB: string; score: number; grade: string; gradeLabel: string; summary: string }
  | { type: 'fortune'; name: string; ilgan: string; period: string; summary: string; date: string }
```

**카드 디자인 공통 요소:**
- 배경: `linear-gradient(135deg, #2a2a3e, #1e1e2e)`
- 테두리: `1px solid #3a3a52`, `border-radius: 16px`
- 하단 브랜드 뱃지: `사주팔자` (보라 그라디언트)
- 크기: 고정 320×400px (html2canvas 캡처용)

**카드별 콘텐츠:**
- `saju`: 이름, 일간, 사주 4기둥, 오행 막대 차트
- `compatibility`: 두 사람 이름, 점수(대형), 등급, 한줄 요약
- `fortune`: 이름, 일간, 날짜, 운세 요약 텍스트

### `components/ShareButton.tsx`

공유 버튼 UI와 캡처/공유 로직을 담당.

**Props:**
```ts
interface ShareButtonProps {
  cardRef: React.RefObject<HTMLDivElement>;
  filename: string; // 다운로드 파일명 (예: "saju-result.png")
  shareTitle: string; // Web Share API title
}
```

**동작 흐름:**
1. `cardRef`가 가리키는 DOM을 `html2canvas`로 캡처 → `canvas.toBlob()`
2. `navigator.canShare({ files })` 지원 시 → `navigator.share()` 호출
3. 미지원 시 → `<a download>` 트릭으로 이미지 파일 다운로드
4. 캡처 중 로딩 상태 표시 (`isCapturing`)

**버튼 UI:**
- 아이콘: `⬆` (공유 아이콘)
- 스타일: `bg-card` 정사각형 버튼, 기존 하단 버튼 행 우측에 배치

## 페이지별 변경 사항

각 페이지에서 `const cardRef = useRef<HTMLDivElement>(null)`을 생성해 `ShareCard`의 `ref`와 `ShareButton`의 `cardRef`에 동일하게 전달한다.

### `/saju/result`
- `<ShareCard type="saju" ref={cardRef} ... />` 숨김 렌더링 추가
- 하단 버튼 행: `[운세 보기] [궁합 보기] [<ShareButton cardRef={cardRef} />]`

### `/compatibility/result`
- `<ShareCard type="compatibility" ref={cardRef} ... />` 숨김 렌더링 추가
- 하단 버튼 행: `[다시 분석하기] [<ShareButton cardRef={cardRef} />]`

### `/fortune`
- `<ShareCard type="fortune" ref={cardRef} ... />` 숨김 렌더링 추가
- 하단 버튼 행: `[💑 궁합 보러 가기] [<ShareButton cardRef={cardRef} />]`

## 의존성

- `html2canvas` 패키지 추가 (`npm install html2canvas`)
- 기존 의존성 변경 없음

## 에러 처리

- html2canvas 실패 시: 콘솔 에러 로그, 버튼 비활성화
- Web Share API 취소 시 (AbortError): 무시
- 기타 공유 실패 시: 다운로드 폴백으로 재시도

## 미포함 사항

- URL 기반 공유 (이미지 방식으로 결정)
- 서버사이드 이미지 생성 (클라이언트 캡처로 충분)
- 공유 횟수 트래킹
