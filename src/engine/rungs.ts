// Rungs utilities for Orixe bidding
export type Rung = number

export function getRungSequence(playerCount: number): number[] {
  // rules:
  // 2 players => 3..13 (for now)
  // 3 players => 3..13
  // 4 players => 3..13
  // 5 players => 3..10
  if (![2,3,4,5].includes(playerCount)) {
    throw new Error(`Unsupported player count: ${playerCount}`)
  }

  const start = 3
  const end = playerCount === 5 ? 10 : 13
  const seq: number[] = []
  for (let i = start; i <= end; i++) seq.push(i)
  return seq
}

const ORDINAL_WORDS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth'
]

export function getRungName(index: number): string {
  if (!Number.isFinite(index) || index < 0) return 'Unknown Rung'
  const idx = Math.floor(index)
  if (idx < ORDINAL_WORDS.length) return `${ORDINAL_WORDS[idx]} Rung`
  // fallback to numeric ordinal
  const n = idx + 1
  const suffix = (n % 10 === 1 && n % 100 !== 11) ? 'st' : (n % 10 === 2 && n % 100 !== 12) ? 'nd' : (n % 10 === 3 && n % 100 !== 13) ? 'rd' : 'th'
  return `${n}${suffix} Rung`
}

