import { resolveConfig } from './config.js'

export const READ_CHANNEL = '/mnemon.read'
export const ACTIVATION_CHANNEL = '/mnemon.activation'
export const WRITE_CHANNEL = '/mnemon.write'
export const SETTINGS_CHANNEL = '/mnemon.settings'

const ok = async () => ({ ok: true, value: null })

/**
 * Register the four Host RPC channels.
 *
 * Migration note: the preview Host owns authentication uniformly, so its public
 * TypeScript interface has only two parameters. Keep calls aligned with that
 * interface; legacy per-channel options are obsolete.
 */
export function registerMnemonChannels(connection, input = {}) {
  resolveConfig(input)
  connection.rpc.handle(READ_CHANNEL, ok)
  connection.rpc.handle(ACTIVATION_CHANNEL, ok)
  connection.rpc.handle(WRITE_CHANNEL, ok)
  connection.rpc.handle(SETTINGS_CHANNEL, ok)
}
