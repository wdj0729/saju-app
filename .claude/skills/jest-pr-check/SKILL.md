---
name: jest-pr-check
description: PR 코드 리뷰 시 Jest 테스트를 자동으로 실행하고 결과를 리뷰 코멘트에 포함하는 스킬. /code-review 명령 실행 시, PR 리뷰 요청 시, 또는 "PR이 올라가면 리뷰해줘" 같은 요청 시 반드시 이 스킬을 먼저 참고할 것. Jest 테스트 결과를 코드 리뷰와 함께 PR 코멘트에 포함해야 한다.
---

# Jest PR Check

PR 코드 리뷰를 진행할 때 Jest 테스트를 함께 실행하고, 그 결과를 리뷰 코멘트에 포함한다.

## Steps

코드 리뷰 에이전트들을 spawn하는 것과 **병렬로** 테스트를 실행한다.

1. **테스트 실행**: `npm test -- --passWithNoTests 2>&1` 실행
2. **결과 파싱**:
   - 모든 테스트 통과 (exit code 0) → 통과한 테스트 수 표시
   - 실패한 테스트 있음 (exit code 1) → 실패한 테스트 목록 수집
3. **코드 리뷰 코멘트 하단에 Jest 섹션 추가**

## Output format

PR 코멘트 마지막에 아래 형식으로 추가한다:

```
### Tests

94 passed (7 suites)
```

또는 실패가 있을 때:

```
### Tests

**2 failed**, 92 passed (7 suites):
- `lib/__tests__/saju-calculator.test.ts` — getSaju › should return correct heavenly stem
- `lib/__tests__/daewoon.test.ts` — getDaewoon › should calculate daewoon correctly
```

## Notes

- `package.json`에 `test` 스크립트가 없으면 이 섹션을 생략한다
- 테스트 실행은 다른 코드 리뷰 에이전트들과 병렬로 진행해도 됨
- 실패한 테스트가 있으면 코멘트에서 눈에 띄도록 볼드 처리
- 실패 목록이 10개 초과 시 상위 10개만 표시하고 "... and N more failure(s)" 형식으로 생략
- 실패한 테스트의 에러 메시지는 포함하지 않고 테스트 이름만 표시 (너무 길어짐 방지)
