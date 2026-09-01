// H11 grading uses two exact published HostConnectionService implementations.
// Points: candidate import 10, unit regression 10, rc.2 real registration 20,
// newer real registration 20, exact authority policy 30, branch-free source 10.
import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const FIXTURE = '/app/fixture'
const EXPECTED_CHANNELS = [
  '/mnemon.read',
  '/mnemon.activation',
  '/mnemon.write',
  '/mnemon.settings',
]
const COHORTS = [
  { name: 'rc2', root: '/opt/dsh-cohorts/rc2', version: '0.1.1-rc.2' },
  { name: 'alpha2', root: '/opt/dsh-cohorts/alpha2', version: '0.1.2-alpha.2' },
]

main().catch((error) => emit(0, [`judge error: ${error instanceof Error ? error.stack : String(error)}`]))

async function main() {
  const reasons = []
  const changed = await fixtureChanged()
  if (!changed.ok) emit(0, [changed.detail])
  reasons.push(changed.detail)

  let candidate
  try {
    candidate = await import(`${pathToFileURL(`${FIXTURE}/src/register.js`).href}?judge=${Date.now()}`)
  } catch (error) {
    emit(0, [...reasons, `candidate import failed: ${error instanceof Error ? error.message : String(error)}`])
  }
  if (typeof candidate.registerMnemonChannels !== 'function') {
    emit(0, [...reasons, 'required export registerMnemonChannels(connection, config) is missing'])
  }

  let score = 10
  reasons.push('candidate imports and preserves registerMnemonChannels')

  const unit = await run('npm', ['test'], FIXTURE, 60000)
  if (unit.code === 0) {
    score += 10
    reasons.push('candidate mock regression tests pass')
  } else {
    reasons.push(`candidate tests fail: ${tail(unit.stdout + unit.stderr, 240)}`)
  }

  const probes = new Map()
  for (const cohort of COHORTS) {
    const integrity = await cohortVersion(cohort)
    if (!integrity.ok) emit(0, [...reasons, integrity.detail])
    for (const remoteAccess of ['read-only', 'trusted-host']) {
      probes.set(`${cohort.name}:${remoteAccess}`, await probe(
        candidate.registerMnemonChannels,
        cohort,
        remoteAccess,
      ))
    }
  }

  for (const cohort of COHORTS) {
    const cohortProbes = ['read-only', 'trusted-host'].map((mode) => probes.get(`${cohort.name}:${mode}`))
    if (cohortProbes.every((result) => result.registrationOk)) {
      score += 20
      reasons.push(`${cohort.name}: both configs register all four routes through real HostConnectionService`)
    } else {
      for (const result of cohortProbes.filter((item) => !item.registrationOk)) {
        reasons.push(`${cohort.name}/${result.remoteAccess}: ${result.error}`)
      }
    }
  }

  let policyPasses = 0
  for (const remoteAccess of ['read-only', 'trusted-host']) {
    const expected = remoteAccess === 'read-only'
      ? ['trusted-host', 'trusted-host', 'loopback', 'loopback']
      : ['trusted-host', 'trusted-host', 'trusted-host', 'trusted-host']
    const results = COHORTS.map((cohort) => probes.get(`${cohort.name}:${remoteAccess}`))
    const ok = results.every((result) => result.registrationOk
      && JSON.stringify(result.authorities) === JSON.stringify(expected))
    if (ok) {
      policyPasses += 1
      reasons.push(`${remoteAccess}: one call shape preserves authorities ${expected.join(', ')}`)
    } else {
      for (const [index, result] of results.entries()) {
        if (JSON.stringify(result.authorities) !== JSON.stringify(expected)) {
          reasons.push(`${COHORTS[index].name}/${remoteAccess}: expected authorities ${expected.join(', ')}, got ${result.authorities.map(String).join(', ') || 'none'}`)
        }
      }
    }
  }
  score += policyPasses * 15

  const branchCheck = await inspectBranching()
  if (branchCheck.ok) {
    score += 10
    reasons.push('source uses no version, arity, source-text, or exception-retry cohort branch')
  } else {
    reasons.push(`branch-free gate failed: ${branchCheck.hits.join(', ')}`)
  }

  emit(score, reasons)
}

async function probe(register, cohort, remoteAccess) {
  const calls = []
  const routes = []
  try {
    const connectionModule = await import(pathToFileURL(
      `${cohort.root}/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js`,
    ))
    const cordisModule = await import(pathToFileURL(
      `${cohort.root}/node_modules/@deepseek-ai/cordis/lib/index.js`,
    ))
    const context = new cordisModule.Context()
    context.provide('webServer', {
      register(route) {
        routes.push(route.path)
        return () => { routes.splice(routes.indexOf(route.path), 1) }
      },
    })
    const service = new connectionModule.HostConnectionService(context, ['trusted.example'], {
      isAuthenticated: () => true,
      authorizeIndex: () => true,
      authenticatedUrl: value => value,
    })
    const realRpc = service.rpc
    const recordingConnection = {
      rpc: {
        handle(...args) {
          calls.push(args)
          return realRpc.handle(...args)
        },
      },
    }
    await register(recordingConnection, { remoteAccess })
    const channels = calls.map((args) => args[0])
    const registrationOk = JSON.stringify(channels) === JSON.stringify(EXPECTED_CHANNELS)
      && JSON.stringify(routes) === JSON.stringify(EXPECTED_CHANNELS)
    return {
      remoteAccess,
      registrationOk,
      authorities: calls.map((args) => args[2]?.authority),
      error: registrationOk
        ? undefined
        : `expected calls/routes ${EXPECTED_CHANNELS.join(', ')}; calls=${channels.join(', ') || 'none'} routes=${routes.join(', ') || 'none'}`,
    }
  } catch (error) {
    return {
      remoteAccess,
      registrationOk: false,
      authorities: calls.map((args) => args[2]?.authority),
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function inspectBranching() {
  const source = stripComments(await readFile(`${FIXTURE}/src/register.js`, 'utf8'))
  const checks = [
    [/\.length\b/, 'function arity inspection'],
    [/\b(?:dsh|connection|host)Version\b/i, 'version variable'],
    [/\bsemver\b|0\.1\.[12]/i, 'version parsing/literal'],
    [/package\.json|process\.env|import\.meta\.resolve/i, 'environment/package capability probe'],
    [/\.toString\s*\(/, 'implementation source inspection'],
    [/\bcatch\s*\(/, 'exception retry/fallback'],
  ]
  const hits = checks.filter(([pattern]) => pattern.test(source)).map(([, label]) => label)
  return { ok: hits.length === 0, hits }
}

// Explanatory comments may name rejected strategies; score executable text only.
// The task fixture contains no regex literals, so this deliberately small lexer is
// sufficient and avoids adding a parser dependency to the sealed judge.
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

async function cohortVersion(cohort) {
  try {
    const pkg = JSON.parse(await readFile(
      `${cohort.root}/node_modules/@deepseek-ai/dsh-client-connection/package.json`,
      'utf8',
    ))
    return pkg.version === cohort.version
      ? { ok: true }
      : { ok: false, detail: `${cohort.name} package version changed: ${String(pkg.version)}` }
  } catch (error) {
    return { ok: false, detail: `${cohort.name} package integrity check failed: ${error.message}` }
  }
}

async function fixtureChanged() {
  const result = await run('git', ['status', '--porcelain', '--', 'fixture'], '/app', 20000)
  if (result.code !== 0) return { ok: false, detail: `git status failed: ${tail(result.stderr, 200)}` }
  const lines = result.stdout.trim().split('\n').filter(Boolean)
  return lines.length > 0
    ? { ok: true, detail: `fixture changed: ${lines.join('; ')}` }
    : { ok: false, detail: 'fixture unchanged relative to baseline, graded as 0' }
}

function run(file, args, cwd, timeout) {
  return new Promise((resolve) => {
    execFile(file, args, { cwd, timeout }, (error, stdout, stderr) => {
      resolve({ code: typeof error?.code === 'number' ? error.code : error ? 1 : 0, stdout: stdout ?? '', stderr: stderr ?? '' })
    })
  })
}

function tail(text, size) {
  return String(text).trim().slice(-size) || 'no output'
}

function emit(rawScore, reasons) {
  const score = Math.max(0, Math.min(100, Math.round(rawScore)))
  process.stdout.write(`${JSON.stringify({ score, max: 100, reasons })}\n`)
  process.exit(0)
}
