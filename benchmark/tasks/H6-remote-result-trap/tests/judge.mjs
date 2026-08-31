// H6-remote-result-trap grading: read-only gate + section-scoped Markdown scoring.
//
// Unlike the keyword-oriented written judges (S1/S2/S3/H4), this judge parses the
// report into the six canonical sections and grades each section on its own text:
//   Root Cause                       20  paired semantics: business failure -> ok:false AND not reject/catch
//   Problems in the Current Code     10  at least two real wrongness items, correct direction
//   Corrected Implementation         20  fenced ts/js code only: failure branch + before-value ordering + error.code switch
//   Error Code Migration             20  cancelled -> gateway/cancelled (10) + session-not-found -> session/not-found (10)
//   Retry Policy                     15  no retry on cancellation (5) + no auto-retry internal/unknown (5) + transient/idempotent/policy (5)
//   Error Boundary                   15  not instanceof (5) + isRemoteFailure catch boundary (5) + assembly errors propagate (5)
//
// Hard caps (all caps take the minimum; every cap is written into reasons):
//   fixture modified                       -> 0
//   no report / empty report               -> 0
//   Root Cause / Problems still claim "ordinary remote failures throw / handle primarily via try/catch" -> cap 30
//   Corrected Implementation fenced code still uses bare legacy codes as fixes   -> cap 60
//   Corrected Implementation fenced code blanket-retries (cancelled/internal/default) -> cap 60
//   report never mentions result.ok anywhere                                     -> cap 60
//   Corrected Implementation fenced code discriminates with instanceof RemoteError -> cap 60
//
// Direction awareness: wrong-claim detection ignores matches preceded by a negation
// window ("should NOT be handled through try/catch" is a correct statement).
// Old-code quoting in prose/inline code never triggers caps — only the agent's own
// fenced proposal inside Corrected Implementation does.
import { pathToFileURL } from 'node:url'
import { emit, fixtureChanges, readAgentText } from './judge-utils.mjs'

const TASK = 'H6-remote-result-trap'

const CANONICAL = [
  'Root Cause',
  'Problems in the Current Code',
  'Corrected Implementation',
  'Error Code Migration',
  'Retry Policy',
  'Error Boundary',
]
const ALIASES = {
  'Root Cause': ['根本原因', '根因'],
  'Problems in the Current Code': ['当前代码的问题', '当前代码问题', '现有代码的问题'],
  'Corrected Implementation': ['修正后的实现', '修正实现', '正确的实现', '修复后的实现'],
  'Error Code Migration': ['错误码迁移', '错误代码迁移'],
  'Retry Policy': ['重试策略'],
  'Error Boundary': ['错误边界'],
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) main().catch((error) => emit(0, [`judge error: ${error.message}`]))

async function main() {
  const reasons = []

  const gate = await fixtureChanges('fixture')
  if (gate.changed === true) {
    emit(0, [`fixture was modified, 0 points (read-only discipline): ${gate.detail}`])
  }
  if (gate.changed === null) reasons.push(`warning: ${gate.detail}`)
  else reasons.push('fixture unchanged (read-only discipline passed)')

  const { text, files } = readAgentText('', TASK)
  if (!text.trim()) {
    emit(0, [...reasons, `no report found under /app/agent-output/${TASK}/, treated as 0 points`])
  }
  reasons.push(`read agent report: ${files.join(', ')}`)

  const result = scoreReport(text)
  emit(result.score, [...reasons, ...result.reasons])
}

// ── Pure scoring logic (exported for offline negative-control testing) ──

export function scoreReport(reportText) {
  const sections = parseSections(reportText)
  const reasons = []

  for (const title of CANONICAL) {
    if (!sections.has(title)) reasons.push(`missing section "## ${title}" (0 points for that block)`)
  }

  const root = sections.get('Root Cause') ?? ''
  const problems = sections.get('Problems in the Current Code') ?? ''
  const corrected = sections.get('Corrected Implementation') ?? ''
  const migration = sections.get('Error Code Migration') ?? ''
  const retry = sections.get('Retry Policy') ?? ''
  const boundary = sections.get('Error Boundary') ?? ''

  let score = 0

  // 1. Root Cause (20): paired semantics.
  const okFalse = /ok\s*:\s*false|failure branch|失败分支/i.test(root)
  const notReject = /(?:does|do)\s+\*{0,2}not\*{0,2}\s+(?:reject|throw)|(?:is|are)\s+\*{0,2}not\*{0,2}\s+(?:rejected|thrown)|never\s+(?:rejects?|throws?)\b|never\s+(?:enters?|lands?\s+in|goes?\s+into)\b.{0,20}catch|no\s+rejection|(?:不进|不会进|不进入|不会进入|不会走|不走).{0,10}catch|(?:not|不).{0,20}(?:through|via|by)\s+(?:reject|throw|catch)/i.test(root)
  if (okFalse) { score += 10; reasons.push('Root Cause: business failure -> ok:false / failure branch (+10)') }
  else reasons.push('Root Cause: missing the ok:false / failure-branch fact (+0)')
  if (notReject) { score += 10; reasons.push('Root Cause: ordinary failures do not reject / never enter catch (+10)') }
  else reasons.push('Root Cause: missing "ordinary failures do not reject / do not enter catch" (+0)')

  // 2. Problems in the Current Code (10): at least two real wrongness items.
  const wrongnessItems = [
    [/(?:never|does\s+not|doesn'?t|won'?t|will\s+not|不会|不).{0,40}(?:enter|reach|go\s+into|land\s+in|进入|走到).{0,15}catch|catch.{0,80}(?:never|not|不会|不能|不).{0,30}(?:ok\s*:\s*false|business\s+failure|业务失败)/i, 'catch never receives ok:false'],
    [/result\.value.{0,60}(?:without|before|no|未|没有|不).{0,20}(?:checking|check|ok|判断|检查)|(?:reads?|returns?)\s+result\.value.{0,60}(?:unchecked|未检查)/i, 'reads result.value without checking ok'],
    [/(?:bare|legacy|old|unprefixed|旧|裸).{0,20}(?:error\s+)?codes?/i, 'bare legacy error codes'],
    [/instanceof\s+RemoteError/i, 'instanceof RemoteError discrimination'],
    [/(?:cancelled|取消).{0,40}(?:retr|重试)/i, 'cancellation is retried'],
    [/(?:blanket|一律|无条件|unconditional).{0,30}(?:retry|重试)|(?:every|all|所有|任何).{0,40}(?:failure|error|失败).{0,30}(?:retr|重试)/i, 'blanket retry'],
    [/(?:assembly|programming|local|装配|编程|本地).{0,50}(?:error|fault|defect|错误).{0,40}(?:swallow|吞|hide|掩盖|伪装|dress)/i, 'assembly errors swallowed by blanket catch'],
    [/catch.{0,60}(?:swallow|吞).{0,40}(?:reject|throw|error|错误)|(?:swallow|吞).{0,40}(?:assembly|programming|reject)/i, 'catch swallows rejects'],
  ]
  let problemsHits = 0
  for (const [pattern, label] of wrongnessItems) {
    if (pattern.test(problems)) {
      problemsHits += 1
      reasons.push(`Problems: identified "${label}"`)
    }
  }
  if (problemsHits >= 2) { score += 10; reasons.push('Problems: at least two real wrongness items (+10)') }
  else if (problemsHits === 1) { score += 5; reasons.push('Problems: only one wrongness item (+5)') }
  else reasons.push('Problems: no real wrongness item identified (+0)')

  // 3. Corrected Implementation (20): fenced code content only.
  const blocks = extractFencedBlocks(corrected)
  if (blocks.length === 0) {
    reasons.push('Corrected Implementation: no fenced code block found (+0 for the whole block)')
  } else {
    const block = blocks.find((b) => /!\s*result\.ok\b|result\.ok\s*===\s*false/.test(b)) ?? blocks[0]
    let blockScore = 0
    if (/!\s*result\.ok\b|result\.ok\s*===\s*false/.test(block)) {
      blockScore += 8
      reasons.push('Corrected Implementation: failure branch (!result.ok) present (+8)')
    } else {
      reasons.push('Corrected Implementation: fenced code has no result.ok failure branch (+0)')
    }
    const valueIndex = block.search(/result\.value/)
    const branchIndex = block.search(/!\s*result\.ok\b|result\.ok\s*===\s*false/)
    if (branchIndex >= 0 && valueIndex >= 0 && branchIndex < valueIndex) {
      blockScore += 6
      reasons.push('Corrected Implementation: failure branch precedes the result.value success read (+6)')
    } else if (branchIndex >= 0 && valueIndex < 0) {
      reasons.push('Corrected Implementation: no result.value read; ordering not verifiable (+0)')
    } else if (branchIndex < 0) {
      reasons.push('Corrected Implementation: ordering not applicable without a failure branch (+0)')
    } else {
      reasons.push('Corrected Implementation: result.value is read before the failure branch (+0)')
    }
    if (/result\.error\.code|switch\s*\([^)]*code\s*\)/i.test(block)) {
      blockScore += 6
      reasons.push('Corrected Implementation: branches on result.error.code (+6)')
    } else {
      reasons.push('Corrected Implementation: does not branch on result.error.code (+0)')
    }
    score += blockScore
  }

  // 4. Error Code Migration (20): two directed pairs, 10 each.
  const cancelledPair = /cancelled\s*(?:→|->)\s*`?gateway\/cancelled`?|`?gateway\/cancelled`?\s*(?:←|<-)\s*cancelled|\|\s*`?cancelled`?\s*\|\s*`?gateway\/cancelled`?/i.test(migration)
  const notFoundPair = /session-not-found\s*(?:→|->)\s*`?session\/not-found`?|`?session\/not-found`?\s*(?:←|<-)\s*session-not-found|\|\s*`?session-not-found`?\s*\|\s*`?session\/not-found`?/i.test(migration)
  if (cancelledPair) { score += 10; reasons.push('Error Code Migration: cancelled -> gateway/cancelled (+10)') }
  else reasons.push('Error Code Migration: missing directed pair cancelled -> gateway/cancelled (+0)')
  if (notFoundPair) { score += 10; reasons.push('Error Code Migration: session-not-found -> session/not-found (+10)') }
  else reasons.push('Error Code Migration: missing directed pair session-not-found -> session/not-found (+0)')

  // 5. Retry Policy (15): three items, 5 each.
  const noRetryCancelled = /(?:gateway\/cancelled|cancellation|cancelled|取消).{0,60}(?:not|no|never|should\s+not|must\s+not|不|不得|禁止).{0,30}(?:retr|重试)|(?:finish|terminate|end|propagate|结束|终止|传播).{0,40}(?:cancellation|cancelled|取消)/i.test(retry)
  const noAutoRetryInternal = /(?:gateway\/internal|internal|unknown|未知).{0,60}(?:not|no|never|should\s+not|must\s+not|默认不|不).{0,30}(?:auto-?retr|retr|重试)|(?:gateway\/internal|internal|unknown|未知).{0,50}(?:preserve|keep|report|保留|上报|记录)/i.test(retry)
  const hasTransient = /transient|瞬态/i.test(retry)
  const hasIdempotent = /idempotent|幂等/i.test(retry)
  const hasPolicy = /(?:policy|策略).{0,20}(?:allow|permit|允许)|(?:allowed|允许).{0,20}(?:by|policy|策略)/i.test(retry)
  if (noRetryCancelled) { score += 5; reasons.push('Retry Policy: cancellation is not retried (+5)') }
  else reasons.push('Retry Policy: missing "cancellation must not be retried" (+0)')
  if (noAutoRetryInternal) { score += 5; reasons.push('Retry Policy: internal/unknown are not auto-retried (+5)') }
  else reasons.push('Retry Policy: missing "internal/unknown must not be auto-retried" (+0)')
  const preconditionCount = (hasTransient ? 1 : 0) + (hasIdempotent ? 1 : 0) + (hasPolicy ? 1 : 0)
  if (preconditionCount === 3) { score += 5; reasons.push('Retry Policy: transient + idempotent + policy-allow preconditions (+5)') }
  else if (preconditionCount === 2) { score += 3; reasons.push(`Retry Policy: only ${preconditionCount}/3 retry preconditions expressed (+3)`) }
  else if (preconditionCount === 1) { score += 1; reasons.push('Retry Policy: only 1/3 retry preconditions expressed (+1)') }
  else reasons.push('Retry Policy: no retry preconditions expressed (+0)')

  // 6. Error Boundary (15): three items, 5 each.
  const notInstanceof = /(?:not|never|avoid|don'?t|shouldn'?t|不应|不要|避免).{0,30}instanceof|(?:discriminat|区分|判别).{0,30}(?:by|按|用).{0,15}code/i.test(boundary)
  const isRemoteBoundary = /isRemoteFailure/i.test(boundary) && /(?:only|真正|只|仅).{0,40}(?:catch|throw|stream)|(?:catch\s+boundary|explicit.{0,20}throw|stream).{0,40}isRemoteFailure/i.test(boundary)
  const assemblyPropagate = /(?:assembly|programming|local|装配|编程|本地).{0,40}(?:error|fault|defect|错误)/i.test(boundary) && /(?:propagat|surface|expose|暴露|传播|not\s+swallow|must\s+not\s+swallow|不吞|不应吞)/i.test(boundary)
  if (notInstanceof) { score += 5; reasons.push('Error Boundary: rejects instanceof discrimination / branches on code (+5)') }
  else reasons.push('Error Boundary: missing "do not discriminate via instanceof" (+0)')
  if (isRemoteBoundary) { score += 5; reasons.push('Error Boundary: isRemoteFailure scoped to a real catch boundary (+5)') }
  else reasons.push('Error Boundary: missing the isRemoteFailure catch-boundary scope (+0)')
  if (assemblyPropagate) { score += 5; reasons.push('Error Boundary: assembly/programming errors must propagate (+5)') }
  else reasons.push('Error Boundary: missing "assembly errors must propagate, not be swallowed" (+0)')

  // ── Direction-aware wrong-claim detection (Root Cause + Problems only) ──
  const wrongClaim = /(?:all|every|ordinary|business|unary).{0,50}(?:remote\s+)?(?:failures?|errors?)\s+(?:reject|throw|are\s+thrown|are\s+rejected)|(?:should|must|need).{0,30}(?:be\s+handled|handled).{0,30}try\s*\/?\s*catch|every\s+Remote\s+failure\s+(?:enters|goes\s+to|lands\s+in)\s+catch|(?:全部|所有).{0,15}(?:失败|错误).{0,20}(?:会|都).{0,10}(?:throw|reject|抛)|主要靠.{0,10}catch|primarily.{0,20}catch/i
  const wrongHits = []
  for (const section of [root, problems]) {
    for (const match of section.matchAll(new RegExp(wrongClaim.source, 'gi'))) {
      const before = section.slice(Math.max(0, match.index - 50), match.index)
      if (/(?:not|don'?t|shouldn'?t|doesn'?t|never|不|不应|不该|不能|避免)/i.test(before)) continue
      wrongHits.push(match[0].slice(0, 80))
    }
  }

  // ── Caps (minimum of all triggered caps) ──
  let capped = 100
  const correctedBlocks = extractFencedBlocks(corrected)
  const correctedCode = correctedBlocks.join('\n')

  if (wrongHits.length > 0) {
    capped = Math.min(capped, 30)
    reasons.push(`cap 30: report still claims ordinary remote failures throw / primary handling is try/catch (${wrongHits[0]})`)
  }
  if (/case\s*['"]cancelled['"]|code\s*===?\s*['"]cancelled['"]|['"]cancelled['"]\s*===?\s*code|case\s*['"]session-not-found['"]|code\s*===?\s*['"]session-not-found['"]/i.test(correctedCode)) {
    capped = Math.min(capped, 60)
    reasons.push('cap 60: the corrected fenced code still uses bare legacy error codes')
  }
  if (/case\s*['"]gateway\/cancelled['"]\s*:[^}]{0,80}retry\s*\(|case\s*['"]gateway\/internal['"]\s*:[^}]{0,80}retry\s*\(|default\s*:[^}]{0,80}retry\s*\(|catch[\s\S]{0,150}retry\s*\(\s*\)/i.test(correctedCode)) {
    capped = Math.min(capped, 60)
    reasons.push('cap 60: the corrected fenced code blanket-retries cancellation/internal/default failures')
  }
  if (!/result\.ok|result\[['"]ok['"]\]/i.test(reportText)) {
    capped = Math.min(capped, 60)
    reasons.push('cap 60: the report never mentions result.ok (no failure-branch discriminant anywhere)')
  }
  if (/instanceof\s+RemoteError/i.test(correctedCode)) {
    capped = Math.min(capped, 60)
    reasons.push('cap 60: the corrected fenced code still discriminates with instanceof RemoteError')
  }

  return { score: Math.min(score, capped), reasons }
}

// ── Markdown section parser ──
// Every `##`-level heading starts a new block; only canonical titles (plus the
// accepted aliases) are scored. Content outside any recognized section is ignored.
export function parseSections(text) {
  const sections = new Map()
  const lines = text.replaceAll('\r\n', '\n').split('\n')
  let current = null
  for (const line of lines) {
    const heading = /^#{2,4}\s+(.+?)\s*$/.exec(line)
    if (heading) {
      const title = heading[1].trim()
      const canonical = CANONICAL.find((c) => title.toLowerCase() === c.toLowerCase())
      const aliasOf = canonical ?? CANONICAL.find((c) => (ALIASES[c] ?? []).includes(title))
      current = aliasOf ?? null
      if (aliasOf && !sections.has(aliasOf)) sections.set(aliasOf, [])
      continue
    }
    if (current) {
      const entry = sections.get(current)
      entry.push(line)
    }
  }
  const result = new Map()
  for (const title of CANONICAL) result.set(title, (sections.get(title) ?? []).join('\n'))
  return result
}

// Fenced code blocks: ```ts / ```js / ```typescript / ```javascript / plain ```.
export function extractFencedBlocks(text) {
  const blocks = []
  const re = /```[ \t]*(?:ts|typescript|js|javascript)?[ \t]*\r?\n([\s\S]*?)\r?\n?```/g
  for (const match of text.matchAll(re)) blocks.push(match[1])
  return blocks
}
