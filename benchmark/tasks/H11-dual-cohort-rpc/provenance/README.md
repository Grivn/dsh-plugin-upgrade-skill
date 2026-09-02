# H11 provenance, executable substitution, and skill freeze

## Real incident

- Plugin: [`omdsh-dev/dsh-mnemon`](https://github.com/omdsh-dev/dsh-mnemon)
- Initial alpha migration:
  [`30d7476ba58f86e417959aae64d4dd3fb80f0434`](https://github.com/omdsh-dev/dsh-mnemon/commit/30d7476ba58f86e417959aae64d4dd3fb80f0434)
- Dual-cohort correction:
  [`b50a504dbe738aa359cd6ef8e4fd790ed9c19a10`](https://github.com/omdsh-dev/dsh-mnemon/commit/b50a504dbe738aa359cd6ef8e4fd790ed9c19a10)
- Merged incident review: [`omdsh-dev/dsh-mnemon#105`](https://github.com/omdsh-dev/dsh-mnemon/pull/105)
- Released correction: [`dsh-mnemon v0.3.5`](https://github.com/omdsh-dev/dsh-mnemon/releases/tag/v0.3.5)
- Upgrade-card seam: `DSH-0.1.2-A1-08`; full field record:
  [`skills/plugin-upgrade/examples/04-dual-cohort-plugin.md`](../../../../skills/plugin-upgrade/examples/04-dual-cohort-plugin.md)

The initial migration removed the third argument from each
`connection.rpc.handle(channel, handler, options)` call. Its alpha-side build and
mock tests passed. The real rc.2 `HostConnectionService` reads
`options.authority`, so Web route registration threw before mounting. The correction
always supplied the legacy options object; the newer JavaScript implementation safely
ignored the trailing argument.

The fixture is a purpose-written, private four-channel distillation, not copied
dsh-mnemon source. It preserves the observed failure shape, the read/activation versus
write/settings policy split, and the misleading two-argument mock. The oracle maps to
the fixed commit's call contract. No personal data, credentials, memory contents, or
unrelated mnemon implementation is included.

## DSH versions and executable cohort choice

| Role | Version / commit | Evidence |
|---|---|---|
| Installable legacy cohort | `dsh-v0.1.1-rc.2` / `b150a551b8d465e31e418e1b2eaf5e79bbb7d28e` | [`rpc-host.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.1-rc.2/packages/client/connection/src/rpc-host.ts); published package integrity `sha512-YX2WLA/aZdDQsien4Zo7IHTEfYVJ+4QhRXbgA6BrRUM23NSP/+V3K00dQYyQVsF3ZwocE5uyvlZvbYeg1Iz4ug==` |
| Incident preview source | `dsh-v0.1.2-alpha.1` / `cd5ef8148158c3a752a658978873241fdf8e2bbc` | [`rpc-host.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.2-alpha.1/packages/client/connection/src/rpc-host.ts); package was not published to npm |
| Executable newer cohort | `dsh-v0.1.2-alpha.2` / `0a53fb55bea101816fa226bb964ae2bed71c343b` | [`rpc-host.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.1.2-alpha.2/packages/client/connection/src/rpc-host.ts); published package integrity `sha512-au2+lgnwmJboCvW/LXLJvmyAKsUa0iISjS0T5k4TyZ80KbGQo0erIH0E9GnKbbmER6tk/Kaom9AEewAEY8TAjQ==` |

alpha.1 cannot be installed from npm. The task therefore executes the exact published
alpha.2 package to keep repeated multi-model trials cheap and registry-reproducible.
At the measured seam, both fixed sources implement the same behavior:
`handle: (channel, handler) => register(owner, channel, handler)`. This establishes
behavioral substitution only for ignoring the trailing registration argument. The
task does not claim that alpha.1 and alpha.2 are equivalent elsewhere.

The two `environment/cohorts/*/pnpm-lock.yaml` files freeze each full package closure.
The judge also checks the installed Connection package versions before scoring.

## Closed-book evaluation and contamination control

Example 04 contains the exact diagnosis and solution. A with-skill trial against the
current tree would therefore measure answer retrieval, not transfer. H11 is admitted
only with the plugin-upgrade skill frozen at commit
`7d33bf4c492da250c94f48aebd29bb16877d7a36`, the upstream-main
parent of the contribution; that tree contains the general migration/card procedure
but not Example 04 or H11.

Materialize the evaluated skill without copying or maintaining a second skill corpus:

```sh
h11_snapshot_root="$(mktemp -d /tmp/h11-skill-snapshot.XXXXXX)"
git archive 7d33bf4c492da250c94f48aebd29bb16877d7a36 skills/plugin-upgrade \
  > "$h11_snapshot_root/skill.tar"
node -e 'const f=require("node:fs"),c=require("node:crypto");const got=c.createHash("sha256").update(f.readFileSync(process.argv[1])).digest("hex");if(got!==process.argv[2])throw new Error(`snapshot hash mismatch: ${got}`)' \
  "$h11_snapshot_root/skill.tar" \
  1d4f2413bca7c95578e6eae38ceddf3407408c2298218d9bb96f8b21a666baa7
mkdir "$h11_snapshot_root/tree"
tar -xf "$h11_snapshot_root/skill.tar" -C "$h11_snapshot_root/tree"
test ! -e "$h11_snapshot_root/tree/skills/plugin-upgrade/examples/04-dual-cohort-plugin.md"
```

The pinned `skills/plugin-upgrade` tree object is
`933534bd1e0acf0e79cd667683c1db3fa5055e77`. The commit, tree, and archive hash
identify the same evaluated corpus independently of a mutable branch name.

Attach `$h11_snapshot_root/tree/skills/plugin-upgrade` for the with-skill condition.
Use the unchanged prompt and task image for no-skill and generic-skill conditions.
For paper results, run at least three trials per model/condition and report the median,
using at least one cost-efficient and one frontier model tier; a second model vendor
is preferable when the same unattended tool contract is available. Record exact
model IDs, agent scaffold, reasoning settings, task commit, skill snapshot, raw
rewards, and transcripts. No H11 score is included in this contribution.

## Verified and unverified boundaries

The sealed judge proves real route registration in two published Connection package
closures and observes every supplied rc.2 authority option. It does not boot a whole
DSH Web product, execute a browser bundle, redeem a token/cookie, use Provider
credentials, or install one packed dsh-mnemon tarball. Those remain separate product
acceptance claims and are not part of H11's score.
