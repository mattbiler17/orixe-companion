import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../src/engine/sessionReducer'
import type { CompletedGameRecord } from '../src/models/stats'
import {
  appendCompletedGameRecord,
  COMPLETED_GAMES_STORAGE_KEY,
  loadCompletedGameRecords,
  persistCompletedGameIfNeeded,
} from '../src/lib/completedGamesStorage'
import { getDuelPairKey, summarizeCompletedGames, summarizeDuelHeadToHead } from '../src/lib/stats'

function createRecord(input: Partial<CompletedGameRecord> & Pick<CompletedGameRecord, 'id'>): CompletedGameRecord {
  return {
    id: input.id,
    completedAt: input.completedAt ?? '2026-04-01T12:00:00.000Z',
    mode: input.mode ?? 'duel',
    playerCount: input.playerCount ?? 2,
    playerNames: input.playerNames ?? ['Ari', 'Bex'],
    winnerName: input.winnerName ?? 'Ari',
    finalScores: input.finalScores ?? { Ari: 20, Bex: 10 },
    finishingPositions: input.finishingPositions ?? [
      { name: 'Ari', score: 20, position: 1 },
      { name: 'Bex', score: 10, position: 2 },
    ],
    totalRungsPlayed: input.totalRungsPlayed ?? 8,
    durationMs: input.durationMs,
  }
}

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

function createCompletedSession(input: { isComplete: boolean }): Session {
  return {
    id: 'session-1',
    createdAt: '2026-04-01T12:00:00.000Z',
    mode: 'duel',
    players: [
      { id: 'ari', name: 'Ari' },
      { id: 'bex', name: 'Bex' },
    ],
    rungSequence: [1],
    currentRungIndex: 0,
    currentHandSize: input.isComplete ? null : 1,
    dealerSeat: 0,
    trump: null,
    currentHand: null,
    scoresByPlayer: { ari: 20, bex: 10 },
    bagsByPlayer: { ari: 0, bex: 0 },
    history: input.isComplete
      ? [
          {
            handId: 'hand-1',
            mode: 'duel',
            timestamp: '2026-04-01T12:10:00.000Z',
            summary: 'Duel hand hand-1 completed',
            input: {
              handId: 'hand-1',
              declarerId: 'ari',
              defenderId: 'bex',
              declarerContract: 1,
              declarerTricksWon: 1,
              declarerPrimesCount: 0,
              defenderPrimesCount: 0,
              cacheWinner: 'Declarer',
              cachePrimes: 0,
              previousBags: 0,
              handSize: 1,
              trump: 'wheels',
            },
            result: {
              declarer: {
                playerId: 'ari',
                bidScore: 10,
                primeScore: 0,
                cacheScore: 10,
                bagDelta: 0,
                bagPenalty: 0,
                totalDelta: 20,
                newBagTotal: 0,
                madeContract: true,
              },
              defender: {
                playerId: 'bex',
                trickScore: 10,
                primeScore: 0,
                cacheScore: 0,
                totalDelta: 10,
              },
            },
          },
        ]
      : [],
    isComplete: input.isComplete,
  }
}

describe('completedGamesStorage', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock())
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  it('loads an empty completed game array when no localStorage entry exists', () => {
    expect(loadCompletedGameRecords()).toEqual([])
  })

  it('uses the completedGames key for reads and writes', () => {
    const record = createRecord({ id: 'g1' })

    appendCompletedGameRecord(record)

    expect(localStorage.getItem(COMPLETED_GAMES_STORAGE_KEY)).toBe(JSON.stringify([record]))
    expect(localStorage.getItem('orixe-completed-games')).toBeNull()
  })

  it('appends completed games without overwriting existing records', () => {
    const firstRecord = createRecord({ id: 'g1' })
    const secondRecord = createRecord({ id: 'g2', winnerName: 'Bex' })

    appendCompletedGameRecord(firstRecord)
    appendCompletedGameRecord(secondRecord)

    expect(loadCompletedGameRecords()).toEqual([firstRecord, secondRecord])
  })

  it('saves exactly once when a session transitions to completed', () => {
    const previousSession = createCompletedSession({ isComplete: false })
    const nextSession = createCompletedSession({ isComplete: true })

    persistCompletedGameIfNeeded(previousSession, nextSession)
    persistCompletedGameIfNeeded(nextSession, nextSession)

    const records = loadCompletedGameRecords()

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: 'session-1',
      mode: 'duel',
      playerNames: ['Ari', 'Bex'],
      winnerName: 'Ari',
      finalScores: { Ari: 20, Bex: 10 },
    })
    expect(localStorage.getItem(COMPLETED_GAMES_STORAGE_KEY)).toBe(JSON.stringify(records))
    expect(consoleLogSpy).toHaveBeenCalledTimes(1)
    expect(consoleLogSpy).toHaveBeenCalledWith('SAVING GAME', records[0])
  })
})

describe('summarizeDuelHeadToHead', () => {
  it('aggregates wins, rates, margins, and streaks by canonical named pair', () => {
    const records: CompletedGameRecord[] = [
      createRecord({ id: 'g1', completedAt: '2026-04-01T12:00:00.000Z', winnerName: 'Ari' }),
      createRecord({
        id: 'g2',
        completedAt: '2026-04-02T12:00:00.000Z',
        playerNames: ['Bex', 'Ari'],
        winnerName: 'Bex',
        finalScores: { Ari: 11, Bex: 19 },
        finishingPositions: [
          { name: 'Bex', score: 19, position: 1 },
          { name: 'Ari', score: 11, position: 2 },
        ],
      }),
      createRecord({
        id: 'g3',
        completedAt: '2026-04-03T12:00:00.000Z',
        winnerName: 'Bex',
        finalScores: { Ari: 8, Bex: 22 },
        finishingPositions: [
          { name: 'Bex', score: 22, position: 1 },
          { name: 'Ari', score: 8, position: 2 },
        ],
      }),
    ]

    const summary = summarizeDuelHeadToHead(records)[getDuelPairKey('Ari', 'Bex')]

    expect(summary.totalGames).toBe(3)
    expect(summary.winsByPlayer.Ari).toBe(1)
    expect(summary.winsByPlayer.Bex).toBe(2)
    expect(summary.winRateByPlayer.Ari).toBe(33.33)
    expect(summary.averageMargin).toBe(10.67)
    expect(summary.largestMargin).toBe(14)
    expect(summary.currentStreak).toEqual({ playerName: 'Bex', count: 2 })
    expect(summary.longestStreak).toEqual({ playerName: 'Bex', count: 2 })
    expect(summary.mostRecentWinner).toBe('Bex')
  })
})

describe('summarizeCompletedGames', () => {
  it('segments multiplayer summaries by player count', () => {
    const records: CompletedGameRecord[] = [
      createRecord({
        id: 'm3-1',
        mode: 'multiplayer',
        playerCount: 3,
        playerNames: ['Ari', 'Bex', 'Cy'],
        winnerName: 'Ari',
        finalScores: { Ari: 30, Bex: 20, Cy: 10 },
        finishingPositions: [
          { name: 'Ari', score: 30, position: 1 },
          { name: 'Bex', score: 20, position: 2 },
          { name: 'Cy', score: 10, position: 3 },
        ],
      }),
      createRecord({
        id: 'm3-2',
        mode: 'multiplayer',
        playerCount: 3,
        playerNames: ['Ari', 'Bex', 'Cy'],
        winnerName: 'Bex',
        finalScores: { Ari: 12, Bex: 18, Cy: 9 },
        finishingPositions: [
          { name: 'Bex', score: 18, position: 1 },
          { name: 'Ari', score: 12, position: 2 },
          { name: 'Cy', score: 9, position: 3 },
        ],
      }),
      createRecord({
        id: 'm4-1',
        mode: 'multiplayer',
        playerCount: 4,
        playerNames: ['Ari', 'Bex', 'Cy', 'Dee'],
        winnerName: 'Dee',
        finalScores: { Ari: 10, Bex: 11, Cy: 12, Dee: 25 },
        finishingPositions: [
          { name: 'Dee', score: 25, position: 1 },
          { name: 'Cy', score: 12, position: 2 },
          { name: 'Bex', score: 11, position: 3 },
          { name: 'Ari', score: 10, position: 4 },
        ],
      }),
    ]

    const summary = summarizeCompletedGames(records)

    expect(summary.totalGames).toBe(3)
    expect(summary.multiplayerByPlayerCount[3].totalGames).toBe(2)
    expect(summary.multiplayerByPlayerCount[4].totalGames).toBe(1)
    expect(summary.multiplayerByPlayerCount[5].totalGames).toBe(0)
    expect(summary.multiplayerByPlayerCount[3].players[0]).toMatchObject({
      playerName: 'Ari',
      totalGames: 2,
      wins: 1,
      winRate: 50,
      averageFinishingPosition: 1.5,
      averageScore: 21,
      bestScore: 30,
    })
  })
})
