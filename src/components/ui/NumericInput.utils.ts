export function normalizeWholeNumberInput(value: string): string {
  const digitsOnly = value.replace(/\D+/g, '')

  if (digitsOnly === '') {
    return ''
  }

  return String(Number(digitsOnly))
}
