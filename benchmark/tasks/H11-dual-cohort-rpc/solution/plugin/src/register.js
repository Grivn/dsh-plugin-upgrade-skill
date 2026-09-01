import { resolveConfig } from './config.js'

export const READ_CHANNEL = '/mnemon.read'
export const ACTIVATION_CHANNEL = '/mnemon.activation'
export const WRITE_CHANNEL = '/mnemon.write'
export const SETTINGS_CHANNEL = '/mnemon.settings'

const ok = async () => ({ ok: true, value: null })

/** Register one JavaScript call shape across the released and preview cohorts. */
export function registerMnemonChannels(connection, input = {}) {
  const config = resolveConfig(input)
  const managementAuthority = config.remoteAccess === 'trusted-host'
    ? 'trusted-host'
    : 'loopback'
  connection.rpc.handle(READ_CHANNEL, ok, { authority: 'trusted-host' })
  connection.rpc.handle(ACTIVATION_CHANNEL, ok, { authority: 'trusted-host' })
  connection.rpc.handle(WRITE_CHANNEL, ok, { authority: managementAuthority })
  connection.rpc.handle(SETTINGS_CHANNEL, ok, { authority: managementAuthority })
}
