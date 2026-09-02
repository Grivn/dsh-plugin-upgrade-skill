import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  authorityPolicyMatches,
  inspectBranching,
  sameMembers,
} from './judge-utils.mjs'

test('channel comparison is order independent but still rejects duplicates', () => {
  const expected = ['/mnemon.read', '/mnemon.activation', '/mnemon.write', '/mnemon.settings']

  assert.equal(sameMembers([...expected].reverse(), expected), true)
  assert.equal(sameMembers([
    '/mnemon.read',
    '/mnemon.activation',
    '/mnemon.write',
    '/mnemon.write',
  ], expected), false)
})

test('authority policy is matched by channel rather than as an ordered vector or multiset', () => {
  const expected = {
    '/mnemon.read': 'trusted-host',
    '/mnemon.activation': 'trusted-host',
    '/mnemon.write': 'loopback',
    '/mnemon.settings': 'loopback',
  }
  const reordered = {
    registrationOk: true,
    registrations: [
      { channel: '/mnemon.settings', authority: 'loopback' },
      { channel: '/mnemon.write', authority: 'loopback' },
      { channel: '/mnemon.activation', authority: 'trusted-host' },
      { channel: '/mnemon.read', authority: 'trusted-host' },
    ],
  }
  const wrongChannels = {
    registrationOk: true,
    registrations: [
      { channel: '/mnemon.settings', authority: 'loopback' },
      { channel: '/mnemon.write', authority: 'trusted-host' },
      { channel: '/mnemon.activation', authority: 'trusted-host' },
      { channel: '/mnemon.read', authority: 'loopback' },
    ],
  }

  assert.equal(authorityPolicyMatches(reordered, expected), true)
  assert.equal(authorityPolicyMatches(wrongChannels, expected), false)
})

test('branch scan covers nested source helpers and ignores explanatory comments', async () => {
  const root = await mkdtemp(join(tmpdir(), 'h11-judge-utils-'))
  try {
    await mkdir(join(root, 'nested'))
    await writeFile(join(root, 'register.js'), 'export const register = true // handle.length is forbidden\n')
    await writeFile(join(root, 'nested', 'config.js'), 'const fn = () => null\nvoid fn.length\n')

    assert.deepEqual(await inspectBranching(root), {
      ok: false,
      hits: ['nested/config.js: function arity inspection'],
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
