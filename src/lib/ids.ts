let counter = 1
export function nextId(prefix = 'id'){
  return `${prefix}-${counter++}`
}
