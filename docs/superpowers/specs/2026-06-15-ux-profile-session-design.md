# UX 개선: 세션 없을 때 프로필 선택 화면

**날짜:** 2026-06-15  
**범위:** SessionExpiredPage 업그레이드 (파일 1개)

## 문제

프로필이 2개 이상일 때 홈 카드(신년운세/오늘운세) 또는 BottomNav 탭을 클릭하면 세션 없이 목적지 페이지로 이동하고, `useSessionOrRedirect`가 `'not-found'`를 반환해 `SessionExpiredPage`가 표시된다. 현재 이 화면은 "다시 입력하기" 버튼만 있어 사용자가 생년월일을 처음부터 다시 입력해야 한다.

## 목표

저장된 프로필이 있으면 클릭 한 번으로 세션을 설정하고 바로 원하는 페이지를 볼 수 있게 한다.

## 결정 사항

- **홈 카드, BottomNav, 직접 URL 진입 모두 동일하게 처리** — 진입점별로 별도 UI를 만들지 않는다.
- **SessionExpiredPage를 자기완결형으로 업그레이드** — 내부에서 `loadProfiles()`를 호출하고 프로필 유무에 따라 UI를 분기한다. 호출 측(FortuneContent 등)은 변경하지 않는다.
- **CompatibilityResultContent는 스킵** — 궁합은 두 사람의 세션이 필요해 프로필 1개 선택으로 해결되지 않는다.

## 변경 파일

### `components/SessionExpiredPage.tsx`

**Props:** 기존 그대로 (`redirectPath`, `redirectLabel`)

**내부 추가:**

```tsx
const [profiles, setProfiles] = useState<Profile[]>([]);
useEffect(() => { setProfiles(loadProfiles()); }, []);
```

**분기:**

| 조건 | 표시 UI |
|---|---|
| `profiles.length > 0` | 프로필 선택 화면 |
| `profiles.length === 0` | 기존 세션 만료 화면 |

**프로필 클릭 핸들러:**

```
calculateSaju(profile)
  → saveSession({ input: { ...profile, gender: profile.gender ?? 'M' }, result })
  → router.replace(pathname)   // 현재 페이지 재렌더 — 이번엔 세션 있음
  → (실패 시) router.push(redirectPath)
```

`usePathname()`으로 현재 경로를 가져와 `router.replace`에 사용한다.

**프로필 선택 UI 구성:**

- 🔮 아이콘 + "누구의 운세를 볼까요?" 타이틀
- 프로필 카드 목록 (첫 번째 카드는 `bg-primary-gradient` 강조)
- 구분선 (`또는`) + "직접 생년월일 입력하기" 링크 (`→ redirectPath`)

**기존 세션 만료 UI:** 변경 없음 (프로필 없을 때 그대로 표시)

## 변경 없는 파일

- `hooks/useSessionOrRedirect.ts`
- `app/fortune/FortuneContent.tsx`
- `app/fortune/yearly/YearlyFortuneContent.tsx`
- `app/saju/result/SajuResultContent.tsx`
- `app/compatibility/result/CompatibilityResultContent.tsx`

## 동작 흐름

```
홈 카드 클릭 (프로필 2개↑)
  → /fortune 이동
  → useSessionOrRedirect → 'not-found'
  → SessionExpiredPage 렌더
  → 프로필 목록 표시
  → 사용자 클릭
  → calculateSaju + saveSession + router.replace('/fortune')
  → FortuneContent 재렌더 → 세션 있음 → 정상 표시

홈 카드 클릭 (프로필 1개)
  → 기존 동작 유지 (자동 세션 설정 후 이동)

BottomNav 탭 클릭 (세션 없음)
  → 동일 흐름
```
