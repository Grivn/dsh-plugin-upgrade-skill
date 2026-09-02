# H11 admission validation

Validation was run locally on 2026-09-01 before benchmark admission. The image used
the pinned `node:24-bookworm` manifest from the task Dockerfile and produced the local
Linux/arm64 image ID
`sha256:32a14c926c4e34a74f07055ec33e9d7b690d9386ee783fc00110e79f579b5819`.
The image ID records this build, not a claim of cross-platform bit identity.

Build:

```sh
docker build -t dsh-bench-h11:local \
  benchmark/tasks/H11-dual-cohort-rpc/environment
```

The untouched fixture produced the intended attribution trap:

```text
npm test: 1 passed, 0 failed
rc2: TypeError: Cannot read properties of undefined (reading 'authority')
alpha2: registered /mnemon.read, /mnemon.activation, /mnemon.write, /mnemon.settings
judge: {"score":0,"max":100,"reasons":["fixture unchanged relative to baseline, graded as 0"]}
```

After applying `solution/solve.sh`, the sealed verifier produced:

```text
npm test: 2 passed, 0 failed
rc2: registered /mnemon.read, /mnemon.activation, /mnemon.write, /mnemon.settings
alpha2: registered /mnemon.read, /mnemon.activation, /mnemon.write, /mnemon.settings
{"score":100,"max":100,"reasons":[
  "candidate imports and preserves registerMnemonChannels",
  "candidate mock regression tests pass",
  "rc2: both configs register all four routes through real HostConnectionService",
  "alpha2: both configs register all four routes through real HostConnectionService",
  "read-only: one call shape preserves authorities trusted-host, trusted-host, loopback, loopback",
  "trusted-host: one call shape preserves authorities trusted-host, trusted-host, trusted-host, trusted-host",
  "source uses no version, arity, source-text, or exception-retry cohort branch"
]}
reward: 1
```

Three grader calibrations checked the partial-credit and anti-gaming boundaries:

| Candidate variation | Reward | Expected boundary |
|---|---:|---|
| Starting two-argument implementation with a non-semantic edit | `0.50` | mocks and alpha2 pass; real rc.2 and authority policy fail |
| Oracle behavior plus executable `handle.length` inspection | `0.90` | both cohorts pass; branch-free gate withholds 10 points |
| Oracle behavior plus a comment warning against `handle.length` | `1.00` | comments are not misclassified as executable branching |

The task then passed the actual Harbor 0.22.0 oracle path, including schema loading,
solution execution, artifact handling, and verifier normalization:

```text
harbor run -p benchmark/tasks/H11-dual-cohort-rpc -a oracle
Trials: 1; Exceptions: 0; Mean reward: 1.000; runtime: 21s
```

The manual calibration runs used `--network none` after image construction. At
initial admission, the repository validators confirmed 24 registered tasks, the
`BENCHMARK-AUTH-v1` contract, the fixed skill snapshot with Example 04 absent, all
Markdown/card links, and the plugin-upgrade skill schema. No agent/model result is
inferred from oracle admission.

## Review follow-up validation

After rebasing onto upstream commit
`7d33bf4c492da250c94f48aebd29bb16877d7a36` on 2026-09-02, the grader was tightened
in response to review. Registration and authority checks now align by channel instead
of relying on source order, while the branch-free check scans every file under
`fixture/src/` recursively. The frozen skill commit, tree, and archive hashes were
also refreshed to that latest pre-answer upstream baseline.

The following focused calibrations ran in the pinned task image with
`--network none`:

| Candidate variation | Reward | Verified boundary |
|---|---:|---|
| Oracle with write/settings registration order swapped | `1.00` | Registration order is not an unstated contract |
| Oracle authority multiset assigned to the wrong channels | `0.85` | Authority remains exact per channel, not merely as a multiset |
| Oracle plus executable `fn.length` inspection in `src/config.js` | `0.90` | The branch-free gate covers helper modules under `src/` |

The complete repository suite then passed with 27 registered tasks, including task
registry, evaluation-snapshot, checkpoint, runtime, and release-smoke validation. A
fresh Harbor 0.22.0 oracle run completed with one trial, zero exceptions, and mean
reward `1.000` in under 10 seconds.
