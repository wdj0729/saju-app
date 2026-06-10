---
name: eslint-pr-check
description: PR 코드 리뷰 시 ESLint 검사를 자동으로 실행하고 결과를 리뷰 코멘트에 포함하는 스킬. /code-review 명령 실행 시, PR 리뷰 요청 시, 또는 "PR이 올라가면 리뷰해줘" 같은 요청 시 반드시 이 스킬을 먼저 참고할 것. ESLint 결과를 코드 리뷰와 함께 PR 코멘트에 포함해야 한다.
---

# ESLint PR Check

PR 코드 리뷰를 진행할 때 ESLint 검사를 함께 실행하고, 그 결과를 리뷰 코멘트에 포함한다.

## Steps

코드 리뷰 에이전트들을 spawn하는 것과 **병렬로** ESLint를 실행한다.

1. **ESLint 실행**: `npm run lint 2>&1` 실행
2. **결과 파싱**:
   - exit code 0이고 출력이 없으면 → "No issues found."
   - warning만 있으면 (exit code 0) → 경고 목록 수집
   - error가 있으면 (exit code 1) → 에러 + 경고 목록 수집
3. **코드 리뷰 코멘트 하단에 ESLint 섹션 추가**

## Output format

PR 코멘트 마지막에 아래 형식으로 추가한다:

```
### ESLint

No issues found.
```

또는 문제가 있을 때:

```
### ESLint

2 error(s), 1 warning(s):
- `src/lib/foo.ts:12` — @typescript-eslint/no-unused-vars: 'bar' is defined but never used
- `src/lib/foo.ts:34` — @typescript-eslint/no-explicit-any: Unexpected any
- `src/components/Card.tsx:5` — react-hooks/exhaustive-deps: React Hook useEffect has a missing dependency
```

## Notes

- `package.json`에 `lint` 스크립트가 없으면 이 섹션을 생략한다
- ESLint 실행은 다른 코드 리뷰 에이전트들과 병렬로 진행해도 됨
- CI에서도 별도로 실행되지만, 리뷰 시점에 결과를 함께 보여주는 것이 목적
- error가 있으면 코멘트에서 눈에 띄도록 강조(볼드 처리)해도 됨
