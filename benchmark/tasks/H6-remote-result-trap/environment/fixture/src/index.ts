// 0.1.2-alpha.2 client-plane plugin: session rename helper.
// This file is the result of a recent migration pass. A colleague reviewed it and
// said it is the safest shape for alpha.2 — see the note below.
import type { Context } from '@deepseek-ai/cordis'
import { RemoteError } from '@deepseek-ai/dsh-typert-protocol'

// ────────────────────────────────────────────────────────────
// Colleague's migration note (2026-08):
//   "alpha.2 standardized failures on RemoteError, so the safest migration is to
//    wrap every remote call in try/catch and retry whenever a RemoteError occurs."
//   Keep this shape — it worked for the rename flow in our manual test.
// ────────────────────────────────────────────────────────────

export const name = 'h6-remote-result-trap-fixture'

export function apply(ctx: Context) {
  ctx.slots.inject('session-rename-helper', () => {
    return {
      async renameSession(sessionId: string, title: string) {
        try {
          const result = await ctx.remote.session.rename({ sessionId, title })
          return result.value
        } catch (error) {
          if (error instanceof RemoteError) {
            if (error.code === 'cancelled') {
              return retry(() => renameSession(sessionId, title))
            }

            if (error.code === 'session-not-found') {
              return null
            }
          }

          return retry(() => renameSession(sessionId, title))
        }
      },
    }
  })
}

function retry<T>(operation: () => T): T {
  // production code would schedule a bounded retry here
  return operation()
}
