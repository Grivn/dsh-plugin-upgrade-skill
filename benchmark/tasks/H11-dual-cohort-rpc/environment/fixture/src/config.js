export function resolveConfig(input = {}) {
  const remoteAccess = input.remoteAccess ?? 'read-only'
  if (remoteAccess !== 'read-only' && remoteAccess !== 'trusted-host') {
    throw new TypeError(`unsupported remoteAccess value: ${String(remoteAccess)}`)
  }
  return { remoteAccess }
}
