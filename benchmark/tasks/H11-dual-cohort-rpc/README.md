# H11-dual-cohort-rpc · Real Connection contract across two cohorts

This hands-on task distills the rc.2 regression found during the real
`omdsh-dev/dsh-mnemon` alpha migration. The fixture begins with the alpha-style
two-argument registrations: its mock tests pass, the newer real Connection service
registers every route, and the real rc.2 service throws before registration because
it consumes `options.authority`.

The agent must find one branch-free call shape that both JavaScript implementations
accept, preserve the rc.2 read/write authority policy, and update the misleading mock
contract. See [instruction.md](instruction.md) for the task and
[provenance/README.md](provenance/README.md) for the fixed incident, package, and
skill-freeze evidence.

- **Environment:** Node 24, git, and two separately locked published package closures
  under `/opt/dsh-cohorts/{rc2,alpha2}`. Agent network access is disabled.
- **Verifier:** imports the candidate once per cohort/config combination, wraps the
  real `HostConnectionService.rpc.handle`, and requires four real route registrations
  plus the exact legacy authority arguments. It also runs the candidate's unit tests
  and rejects version/arity/retry branching.
- **Oracle:** `harbor run -p benchmark/tasks/H11-dual-cohort-rpc -a oracle`, expected
  reward `1.0`.
- **Evaluation boundary:** use the pre-contribution plugin-upgrade skill snapshot at
  commit `7d33bf4c492da250c94f48aebd29bb16877d7a36`, not the current skill tree
  containing Example 04. The task is a closed-book transfer case; current Example 04
  states the answer.

This is a Host Connection registration test. It does not claim a browser DOM mount,
Provider/API credential path, or whole-product equivalence between alpha.1 and
alpha.2.
