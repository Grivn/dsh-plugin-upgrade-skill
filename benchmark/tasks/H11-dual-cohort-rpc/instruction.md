# H11 · One RPC registration shape across two DSH cohorts

## Unattended benchmark authorization (BENCHMARK-AUTH-v1)

This is an unattended evaluation in a disposable isolated container; there will be
no follow-up user messages. This prompt is the user's explicit authorization and
confirmation for the analysis, plan, and execution needed to complete the task.
Proceed as soon as the plan is formed; do not pause to wait for “confirmation” and
do not ask the user follow-up questions. This authorization is limited to this scope:

- You may read local files and tools in the container, may modify `/app/fixture/`
  directly, and may write a report under `/app/agent-output/H11-dual-cohort-rpc/`;
- You may run local tests and probes and create disposable files under `/tmp`;
- You must not modify the skill, verifier, reference solution, `/opt/dsh-cohorts`, or
  resources outside the container, and must not publish, push, or access external
  services;
- Do not use provider-side web search or outside repository material. If completion
  is impossible, report the blocker honestly, but do not stop merely because another
  round of confirmation is missing.

## Scenario

`/app/fixture/` is a small source slice distilled from a real Web/Host plugin
migration. Its local mock tests pass after the plugin adopted the newer Connection
API's two-argument `rpc.handle(channel, handler)` shape. Production still has two
supported cohorts, however:

- `/opt/dsh-cohorts/rc2` contains the published DSH 0.1.1-rc.2 Connection package;
- `/opt/dsh-cohorts/alpha2` contains the published DSH 0.1.2-alpha.2 Connection
  package, whose registration behavior at this seam is the same as the unpublished
  alpha.1 source target from the incident.

`npm run probe` invokes the fixture against both real `HostConnectionService`
implementations. The current source fails on rc.2 during route registration even
though `npm test` is green.

Repair the fixture so that:

1. The exported `registerMnemonChannels(connection, config)` API remains intact and
   the same implementation registers all four routes on both cohorts.
2. It does not parse a DSH version, inspect function arity, retry after a failed
   registration, or branch on a guessed capability.
3. The legacy rc.2 authority policy remains exact: read and activation channels are
   `trusted-host`; write and settings are `loopback` when `remoteAccess` is
   `read-only`, and `trusted-host` when it is `trusted-host`.
4. Update the mock regression tests so they encode the cross-cohort call contract
   instead of accepting the broken alpha-only shape.
5. Run both `npm test` and `npm run probe`. Do not publish the private fixture.

Make the changes directly under `/app/fixture/`. The installed cohort trees and the
benchmark internals are evidence and verification infrastructure, not editable task
inputs.
