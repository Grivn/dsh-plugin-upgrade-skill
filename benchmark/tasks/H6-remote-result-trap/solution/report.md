# H6 Diagnostic Report (Reference Answer)

## Root Cause

In dsh 0.1.2-alpha.2 a generated unary Remote resolves to a `RemoteResult<T>`:
ordinary business, carrier, and cancellation failures surface as the
`{ ok: false, error }` branch of the result — they do **not** reject the promise
and never enter a `try/catch`. The current code only reads `result.value`, so
whenever the call fails, the failure branch is mistaken for success and
`result.value` is read as if it held the renamed session.

## Problems in the Current Code

1. The `catch` never receives `ok: false` failures — the try/catch can only see
   assembly-level rejects, not business failures;
2. `result.value` is returned without checking `result.ok` first, so failures are
   read as success;
3. The code branches on bare legacy error codes (`cancelled`,
   `session-not-found`) that no longer exist in the alpha.2 namespaced
   vocabulary — every one of them falls into the default path;
4. `error instanceof RemoteError` is used as the discriminator, which misses
   across bundles, workers, and realms;
5. `cancelled` is retried instead of finishing or propagating the cancellation;
6. the final `return retry(...)` is a blanket retry that replays unknown and
   `gateway/internal` failures, including non-idempotent writes;
7. assembly/programming rejects (arity, unmounted method, missing Context
   adapter) are swallowed by the blanket catch and dressed up as retryable
   business failures.

## Corrected Implementation

```ts
const result = await ctx.remote.session.rename({ sessionId, title })

if (!result.ok) {
  switch (result.error.code) {
    case 'gateway/cancelled':
      // Finish the current operation or propagate cancellation along the call
      // chain; never retry and never report it as a generic error.
      return
    case 'session/not-found':
      showSessionMissing(result.error.details.sessionId)
      return
    default:
      // Preserve code/details and report; unknown and gateway/internal codes
      // are not auto-retried.
      reportRemoteFailure(result.error)
      return
  }
}

return result.value
```

## Error Code Migration

| Old (legacy) code | alpha.2 code |
| --- | --- |
| `cancelled` | `gateway/cancelled` |
| `session-not-found` | `session/not-found` |

## Retry Policy

- `gateway/cancelled` must not be retried — finish the operation or propagate
  the cancellation;
- `gateway/internal` and unknown codes are not automatically retried: keep the
  original `code`/`details` and report them;
- Retry only when all three hold: the failure code is explicitly transient, the
  operation is idempotent, and user policy allows it.

## Error Boundary

- Never discriminate failures with `instanceof RemoteError` — branch on the
  `error.code` (structural discrimination survives bundles, workers, and realms);
- `isRemoteFailure` (from `@deepseek-ai/dsh-api-gateway/client`) is for a real
  catch boundary only — when a consumer explicitly `throw`s `result.error` or a
  stream throws a terminal Remote failure — not for the ordinary
  `RemoteResult` main path;
- Assembly/programming errors (arity, unmounted method, missing Context
  adapter) still reject and must propagate to the caller — never swallow them in
  a blanket catch.
