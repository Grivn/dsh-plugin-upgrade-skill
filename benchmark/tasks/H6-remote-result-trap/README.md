# H6-remote-result-trap · Remote Failure Semantics Trap (Read-Only Markdown Diagnosis)

The agent diagnoses a "safely migrated" alpha.2 Remote consumer whose shape is wrong:
ordinary unary failures resolve to `RemoteResult`'s `ok: false` branch instead of
rejecting, yet the code relies on a blanket try/catch, `instanceof RemoteError`, bare
legacy codes, and unconditional retry. The trap: the colleague note at the top of the
fixture — "wrap every remote call in try/catch and retry whenever a RemoteError
occurs". The checkpoint and migration rules live in card
[DSH-0.1.2-A2-02](../../../skills/plugin-upgrade/references/v0.1.2-alpha.2.md), the
ledger [API-02](../../../skills/plugin-upgrade/references/api-migration-0.1.2-alpha.2.md),
and the [rollup "Remote call error flow"](../../../skills/plugin-upgrade/references/rollup-0.1.2.md)
section. Task statement in [instruction.md](instruction.md), grading logic in
[tests/judge.mjs](tests/judge.mjs).

- **Environment**: `node:24-bookworm` + git (the fixture is committed as a git baseline for the read-only gate); dsh is not installed (this task is pure diagnosis).
- **Verifier**: the judge parses the six canonical Markdown sections and grades each section's own text (Root Cause 20 / Problems 10 / Corrected Implementation 20 / Error Code Migration 20 / Retry Policy 15 / Error Boundary 15); the Corrected Implementation is graded from its fenced code block only; direction-aware checks plus four hard caps; 0-100 normalized to `/logs/verifier/reward.txt`.
- **Oracle**: `harbor run -p benchmark/tasks/H6-remote-result-trap -a oracle`, expected reward 1.0.

## Negative controls (no model API)

| Control | Procedure | Expected reward |
|---|---|---|
| A · no report | run the verifier without writing a report | 0 |
| B · keyword stuffing | report contains RemoteResult/result.ok/isRemoteFailure etc. but none of the six canonical sections | ≤ 0.20 |
| C · bare legacy codes in the fix | correct diagnosis but the repair code still uses `case 'cancelled'` | ≤ 0.60 |
| D · blanket retry in the fix | repair code retries cancelled/internal/default failures | ≤ 0.60 |
| E · wrong throw/catch model | Root Cause claims "ordinary remote failures throw, use try/catch" | ≤ 0.30 |
| F · instanceof fix | repair code discriminates with instanceof RemoteError | ≤ 0.60 |
| G · oracle | solution/report.md | 1.00 |
| H · honest quoting | inline/prose quotes of the legacy codes + a fully correct fix (anti-false-positive guard) | ≥ 0.90 |

```
environment/fixture/   # read-only fixture: the wrongly-migrated session-rename helper (with the colleague note)
tests/                 # judge.mjs + judge-utils.mjs + test.sh
solution/              # six-section reference report + solve.sh
```
