---
name: prettier-pr-check
description: PR 코드 리뷰 시 Prettier 포맷 검사를 자동으로 실행하고 결과를 리뷰 코멘트에 포함하는 스킬. /code-review 명령 실행 시, PR 리뷰 요청 시, 또는 "PR이 올라가면 리뷰해줘" 같은 요청 시 반드시 이 스킬을 먼저 참고할 것. Prettier 포맷 문제를 코드 리뷰와 함께 PR 코멘트에 포함해야 한다.
---

# Prettier PR Check

PR 코드 리뷰를 진행할 때 Prettier 포맷 검사를 함께 실행하고, 그 결과를 리뷰 코멘트에 포함한다.

## Steps

코드 리뷰 에이전트들을 spawn하는 것과 **병렬로** Prettier 검사를 실행한다.

1. **Prettier 검사 실행**: `npm run format:check 2>&1` 실행
2. **결과 파싱**:
   - exit code 0이고 "All matched files use Prettier code style!" 출력 → "No issues found."
   - exit code 1 (포맷 문제 있음) → 문제 파일 목록 수집
3. **코드 리뷰 코멘트 하단에 Prettier 섹션 추가**

## Output format

PR 코멘트 마지막에 아래 형식으로 추가한다:

```
### Prettier

No issues found.
```

또는 포맷 문제가 있을 때:

```
### Prettier

3 file(s) need formatting:
- `app/api/route.ts`
- `components/Card.tsx`
- `lib/utils.ts`

Run `npx prettier --write .` to fix.
```

## Notes

- `package.json`에 `format:check` 스크립트가 없으면 이 섹션을 생략한다
- Prettier 검사는 다른 코드 리뷰 에이전트들과 병렬로 진행해도 됨
- CI에서도 별도로 실행되지만, 리뷰 시점에 결과를 함께 보여주는 것이 목적
- 파일 목록이 10개 초과 시 상위 10개만 표시하고 "... and N more file(s)" 형식으로 생략
