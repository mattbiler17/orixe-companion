/**
 * Orixe Companion shared data models (pure TypeScript types only).
 * - No React imports
 * - No scoring logic here
 */

export const SUITS = ['wheels', 'shields', 'swords', 'stars'] as const
export type Suit = typeof SUITS[number]

export const SUIT_PAIRINGS: Record<Suit, Suit> = {
  wheels: 'shields',
  shields: 'wheels',
  swords: 'stars',
  stars: 'swords',
}

export type GameMode = 'multiplayer' | 'duel'

export const CACHE_CAP = 5

export type CacheWinner = 'Declarer' | 'Defender' | 'None'

export type Player = {
  id: string
  name: string
}

export type SessionPlayerState = {
  id: string
  name: string
  // running totals tracked by the companion app
  totalPoints: number
  bags: number
}

// ---- Multiplayer input types ----

export type MultiplayerPlayerInput = {
  playerId: string
  bid: number
  tricksWon: number
  // prime ranks are tracked as counts (number of primes taken)
  primesCount: number
  previousBags?: number
  previousTotalPoints?: number
}

export type MultiplayerHandInput = {
  handId: string
  dealerId?: string
  rung?: number
  handSize?: number
  players: MultiplayerPlayerInput[]
  // optional metadata
  note?: string
}

export type MultiplayerPlayerBreakdown = {
  playerId: string
  contractPoints: number
  primePoints: number
  bagGain: number
  bagPenaltyApplied: boolean
  bagPenaltyPoints: number
  totalDelta: number
  newBagTotal: number
}

export type MultiplayerHandResult = {
  handId: string
  breakdowns: MultiplayerPlayerBreakdown[]
  // aggregate points after applying this hand
  updatedTotals: Record<string, { totalPoints: number; bags: number }>
}

// ---- Duel input/result types ----

export type DuelHandInput = {
  handId: string
  declarerId: string
  defenderId: string
  // declarer contract (rung or points) represented as a number for v1
  declarerContract: number
  declarerTricksWon: number
  handSize?: number
  // primes tracked as counts (ordinary primes) for each side
  declarerPrimesCount: number
  defenderPrimesCount: number
  cachePrimes?: number
  previousBags?: number
  // cache winner if cache was contested
  cacheWinner?: CacheWinner
}

export type DuelSideBreakdown = {
  playerId: string
  primePoints: number
  cachePrimePoints: number
  totalDelta: number
}

export type DuelDeclarerBreakdown = DuelSideBreakdown & {
  contractPoints: number
  bagGain: number
  bagPenaltyApplied: boolean
  bagPenaltyPoints: number
  totalDelta: number
  newBagTotal: number
  contractMade: boolean
}

export type DuelHandResult = {
  handId: string
  declarer: DuelDeclarerBreakdown
  defender: DuelSideBreakdown
}

// ---- Session and history ----

export type HandHistoryEntry = {
  handId: string
  mode: GameMode
  timestamp: string // ISO
  input: MultiplayerHandInput | DuelHandInput
  result?: MultiplayerHandResult | DuelHandResult
}

export type GameSession = {
  id: string
  mode: GameMode
  players: SessionPlayerState[]
  history: HandHistoryEntry[]
}
