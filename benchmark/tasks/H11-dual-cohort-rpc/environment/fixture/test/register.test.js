import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACTIVATION_CHANNEL,
  READ_CHANNEL,
  registerMnemonChannels,
  SETTINGS_CHANNEL,
  WRITE_CHANNEL,
} from '../src/register.js'

test('registers all channels through the preview Connection interface', () => {
  const calls = []
  const connection = { rpc: { handle: (...args) => calls.push(args) } }

  registerMnemonChannels(connection, { remoteAccess: 'read-only' })

  assert.deepEqual(calls.map(([channel]) => channel), [
    READ_CHANNEL,
    ACTIVATION_CHANNEL,
    WRITE_CHANNEL,
    SETTINGS_CHANNEL,
  ])
  assert.deepEqual(calls.map((args) => args.length), [2, 2, 2, 2])
})
