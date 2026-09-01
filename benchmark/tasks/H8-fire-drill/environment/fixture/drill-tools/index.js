// Tool plugin — the tools registration API itself did not change in 0.1.2,
// so this plugin only needs its dependency cohort refreshed.
import { defineTool } from '@deepseek-ai/dsh-tools'

export const inject = ['tools']

export function apply(ctx) {
  ctx.tools.register(defineTool({
    name: 'drill_status',
    description: 'Benchmark fixture: report the drill workspace status',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }],
    },
    execute: () => Promise.resolve({ status: 'ok' }),
    timeoutMs: 1000,
  }))
}
