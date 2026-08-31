# H6 reference solution

## Checkpoint in one sentence

The Remote failure semantics of [DSH-0.1.2-A2-02](../../../../skills/plugin-upgrade/references/v0.1.2-alpha.2.md)
and [API-02](../../../../skills/plugin-upgrade/references/api-migration-0.1.2-alpha.2.md):
in alpha.2, ordinary business/carrier/cancellation failures of a unary Remote resolve
to the `{ ok: false, error }` branch of `RemoteResult<T>` — they do **not** reject;
only assembly/programming errors (arity, unmounted method, missing Context adapter)
still reject and must be exposed. The reference report is
[solution/report.md](report.md); the expected judge score is 100.

## The trap

The colleague note at the top of the fixture ("wrap every remote call in try/catch and
retry whenever a RemoteError occurs") is deliberately wrong: ok:false never enters
catch; `instanceof RemoteError` misses across bundles/workers/realms; the bare legacy
codes `cancelled` / `session-not-found` became `gateway/cancelled` /
`session/not-found` in alpha.2; cancellation and internal/unknown codes get retried
indiscriminately; assembly errors are swallowed by the blanket catch.

## Grading structure

The judge parses the six canonical sections and grades each section's own text
(Root Cause 20 / Problems 10 / Corrected Implementation 20 / Error Code Migration 20 /
Retry Policy 15 / Error Boundary 15). The Corrected Implementation is graded from its
fenced code block only. Direction-aware detection plus four hard caps: a
throw-centric claim caps at 30; a repair that still uses bare legacy codes, blanket
retry, or instanceof caps at 60; a report that never mentions result.ok caps at 60.
Legacy code may only be quoted inline — a fenced block is graded as the agent's own
proposed fix, so honest inline quoting never triggers a cap (see control H).

## Boundaries

- Read-only task: the fixture must stay unchanged (modifying it scores 0 directly);
  dsh is not installed and no runtime verification is performed;
- The report does not need to cite card IDs; card references appear only in the task
  prompt and README for the with-skill round to consult.
