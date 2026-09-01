# H11 dual-cohort RPC reference solution

The real rc.2 implementation consumes `options.authority` while the newer
implementation declares two parameters and ignores an additional JavaScript
argument. The common call shape is therefore to always provide the legacy trailing
options object; no version or capability branch is needed.

The read and activation channels always receive `trusted-host`. The write and
settings channels derive their authority from the retained startup configuration:
`read-only` maps to `loopback`, while `trusted-host` promotes both management
channels. The mock test now asserts the three-argument call contract so it can no
longer pass the original rc.2 regression.

The oracle must score 100 against both installed real Connection services. This
proves registration and authority call semantics only, not a browser mount.
