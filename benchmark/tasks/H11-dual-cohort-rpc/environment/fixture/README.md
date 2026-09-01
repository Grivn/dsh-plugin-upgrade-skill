# Private H11 benchmark fixture — do not publish

This source slice models four Mnemon Host RPC channels and the retained rc.2
`remoteAccess` policy. It has no external runtime dependencies.

- `npm test` runs the local mock contract. The starting assertion reflects only the
  newer two-argument API and therefore passes while rc.2 is broken.
- `npm run probe` loads the exact published Connection packages installed under
  `/opt/dsh-cohorts/` and attempts real route registration in both cohorts.

The public integration API is `registerMnemonChannels(connection, config)` from
`src/register.js`. `config.remoteAccess` is either `read-only` (the default) or
`trusted-host`. Read/activation traffic remains available to trusted hosts, while
write/settings traffic is loopback-only unless the operator explicitly selects
`trusted-host` at startup.
