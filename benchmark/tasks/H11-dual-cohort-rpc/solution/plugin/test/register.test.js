import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACTIVATION_CHANNEL,
  READ_CHANNEL,
  registerMnemonChannels,
  SETTINGS_CHANNEL,
  WRITE_CHANNEL,
} from '../src/register.js'

test('preserves the rc.2 policy in the call shape accepted by both cohorts', () => {
  const calls = []
  const connection = { rpc: { handle: (...args) => calls.push(args) } }

  registerMnemonChannels(connection, { remoteAccess: 'read-only' })

  assert.deepEqual(calls.map(([channel]) => channel), [
    READ_CHANNEL,
    ACTIVATION_CHANNEL,
    WRITE_CHANNEL,
    SETTINGS_CHANNEL,
  ])
  assert.deepEqual(calls.map((args) => args[2]), [
    { authority: 'trusted-host' },
    { authority: 'trusted-host' },
    { authority: 'loopback' },
    { authority: 'loopback' },
  ])
})

test('promotes management channels only when the operator opts in', () => {
  const calls = []
  const connection = { rpc: { handle: (...args) => calls.push(args) } }

  registerMnemonChannels(connection, { remoteAccess: 'trusted-host' })

  assert.deepEqual(calls.map((args) => args[2]), [
    { authority: 'trusted-host' },
    { authority: 'trusted-host' },
    { authority: 'trusted-host' },
    { authority: 'trusted-host' },
  ])
})
