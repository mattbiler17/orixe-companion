let counter = 1

function createUniqueIdPart(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).slice(2, 10)
  const sequence = counter.toString(36)
  counter += 1

  return `${timestamp}-${sequence}-${randomPart}`
}

export function nextId(prefix = 'id') {
  return `${prefix}-${createUniqueIdPart()}`
}
