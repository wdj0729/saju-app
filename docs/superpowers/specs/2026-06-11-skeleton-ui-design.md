# Skeleton UI Design

## Goal

Add loading skeleton UI to eliminate blank-screen flashes and improve perceived performance across all result pages and AI streaming states.

## Loading Scenarios

| Where | When | Current | After |
|-------|------|---------|-------|
| `/saju/result`, `/fortune`, `/compatibility/result` | sessionStorage loads (brief) | blank screen | page-shaped skeleton |
| AiContent | AI streaming not yet started | `● 분석 중...` text | 3-line skeleton |

## Architecture

### `components/Skeleton.tsx`

Single primitive: `SkeletonBox` — a `div` with `animate-pulse bg-border rounded` and forwarded `className` for size/shape customization. No other exports needed.

### Page skeletons

Each result page Content file gets a local skeleton function at the bottom of the file. The skeleton mirrors the real layout: same header, same card structure, skeleton boxes where real content lives.

- `SajuResultSkeleton` — header + SajuGrid placeholder (4×2 grid) + 3 cards + bottom buttons
- `FortuneSkeleton` — header + 3 tabs + fortune card + AI card
- `CompatibilityResultSkeleton` — header + score card + ohaeng bars + summary + AI card

Guard: `if (!session) return <XxxSkeleton />`

### AiContent skeleton

Replace `isStreaming && !aiText` branch with three `SkeletonBox` lines of varying width (100%, 85%, 60%).

## Files Changed

- `components/Skeleton.tsx` — new
- `components/AiContent.tsx` — update loading branch
- `app/saju/result/SajuResultContent.tsx` — add skeleton
- `app/fortune/FortuneContent.tsx` — add skeleton
- `app/compatibility/result/CompatibilityResultContent.tsx` — add skeleton
