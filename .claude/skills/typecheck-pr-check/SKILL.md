---
name: typecheck-pr-check
description: PR 코드 리뷰 시 TypeScript 타입 체크를 자동으로 실행하고 결과를 리뷰 코멘트에 포함하는 스킬. /code-review 명령 실행 시, PR 리뷰 요청 시, 또는 "PR이 올라가면 리뷰해줘" 같은 요청 시 반드시 이 스킬을 먼저 참고할 것. TypeScript 타입 에러를 코드 리뷰와 함께 PR 코멘트에 포함해야 한다.
---

# TypeScript Type Check PR

PR 코드 리뷰를 진행할 때 TypeScript 타입 체크를 함께 실행하고, 그 결과를 리뷰 코멘트에 포함한다.

## Steps

코드 리뷰 에이전트들을 spawn하는 것과 **병렬로** 타입 체크를 실행한다.

1. **타입 체크 실행**: `npx tsc --noEmit 2>&1` 실행
2. **결과 파싱**:
   - exit code 0이고 출력이 없으면 → "No type errors found."
   - exit code 1 (타입 에러 있음) → 에러 목록 수집
3. **코드 리뷰 코멘트 하단에 TypeScript 섹션 추가**

## Output format

PR 코멘트 마지막에 아래 형식으로 추가한다:

```
### TypeScript

No type errors found.
```

또는 에러가 있을 때:

```
### TypeScript

3 error(s):
- `src/lib/foo.ts:12:5` — TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
- `src/components/Card.tsx:34:10` — TS2339: Property 'name' does not exist on type 'User'
- `src/app/page.tsx:8:1` — TS2307: Cannot find module '@/components/Header'
```

## Notes

- `tsconfig.json`이 없으면 이 섹션을 생략한다
- 타입 체크는 다른 코드 리뷰 에이전트들과 병렬로 진행해도 됨
- CI에서도 별도로 실행되지만, 리뷰 시점에 결과를 함께 보여주는 것이 목적
- 출력이 길 경우 상위 10개만 표시하고 "... and N more error(s)" 형식으로 생략
