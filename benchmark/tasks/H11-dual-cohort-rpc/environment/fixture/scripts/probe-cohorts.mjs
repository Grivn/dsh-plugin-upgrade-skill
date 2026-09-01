import { pathToFileURL } from 'node:url'
import { registerMnemonChannels } from '../src/register.js'

const COHORTS = [
  ['rc2', '/opt/dsh-cohorts/rc2'],
  ['alpha2', '/opt/dsh-cohorts/alpha2'],
]

let failed = false
for (const [name, root] of COHORTS) {
  try {
    const result = await probe(root)
    console.log(`${name}: registered ${result.routes.join(', ')}`)
  } catch (error) {
    failed = true
    console.error(`${name}: ${error instanceof Error ? error.stack : String(error)}`)
  }
}

if (failed) process.exitCode = 1

async function probe(root) {
  const connectionModule = await import(pathToFileURL(
    `${root}/node_modules/@deepseek-ai/dsh-client-connection/lib/index.js`,
  ))
  const cordisModule = await import(pathToFileURL(
    `${root}/node_modules/@deepseek-ai/cordis/lib/index.js`,
  ))
  const routes = []
  const context = new cordisModule.Context()
  context.provide('webServer', {
    register(route) {
      routes.push(route.path)
      return () => { routes.splice(routes.indexOf(route.path), 1) }
    },
  })
  const service = new connectionModule.HostConnectionService(context, [], {
    isAuthenticated: () => true,
    authorizeIndex: () => true,
    authenticatedUrl: value => value,
  })
  registerMnemonChannels(service, { remoteAccess: 'read-only' })
  return { routes }
}
