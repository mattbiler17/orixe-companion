import { describe, expect, it } from 'vitest'
import type { CompletedGameRecord } from '../src/models/stats'
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
