import { describe, expect, it } from 'vitest'
import { scoreMultiplayerHand } from '../src/engine/multiplayerScoring'

describe('multiplayerScoring', () => {
  it('scores a made positive bid', () => {
    const result = scoreMultiplayerHand({
      handId: 'h1',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p2', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0]).toEqual({
      playerId: 'p1',
      contractPoints: 6,
      primePoints: 0,
      bagGain: 0,
      bagPenaltyApplied: false,
      bagPenaltyPoints: 0,
      totalDelta: 6,
      newBagTotal: 0,
    })
  })

  it('scores a failed positive bid', () => {
    const result = scoreMultiplayerHand({
      handId: 'h2',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 2, tricksWon: 1, primesCount: 2, previousBags: 0 },
        { playerId: 'p2', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 2, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0].contractPoints).toBe(-6)
    expect(result.breakdowns[0].primePoints).toBe(0)
    expect(result.breakdowns[0].totalDelta).toBe(-6)
  })

  it('scores a successful zero bid', () => {
    const result = scoreMultiplayerHand({
      handId: 'h3',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 0, tricksWon: 0, primesCount: 2, previousBags: 0 },
        { playerId: 'p2', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 3, tricksWon: 3, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0].contractPoints).toBe(5)
    expect(result.breakdowns[0].primePoints).toBe(0)
  })

  it('scores a failed zero bid', () => {
    const result = scoreMultiplayerHand({
      handId: 'h4',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 0, tricksWon: 1, primesCount: 0, previousBags: 0 },
        { playerId: 'p2', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 3, tricksWon: 2, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0].contractPoints).toBe(-5)
  })

  it('turns overtricks into bags', () => {
    const result = scoreMultiplayerHand({
      handId: 'h5',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 3, primesCount: 0, previousBags: 1 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0].bagGain).toBe(2)
    expect(result.breakdowns[0].newBagTotal).toBe(3)
  })

  it('applies a bag penalty at exactly 7', () => {
    const result = scoreMultiplayerHand({
      handId: 'h6',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 2, primesCount: 0, previousBags: 6 },
        { playerId: 'p2', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0 },
      ],
    } as any)

    expect(result.breakdowns[0]).toMatchObject({
      bagGain: 1,
      bagPenaltyApplied: true,
      bagPenaltyPoints: -21,
      newBagTotal: 0,
    })
  })

  it('applies only one bag penalty when bags overshoot 7', () => {
    const result = scoreMultiplayerHand({
      handId: 'h7',
      handSize: 10,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 10, primesCount: 0, previousBags: 6 },
      ],
    } as any)

    expect(result.breakdowns[0]).toMatchObject({
      bagGain: 9,
      bagPenaltyApplied: true,
      bagPenaltyPoints: -21,
      newBagTotal: 8,
    })
  })

  it('adds prime points to the total delta', () => {
    const result = scoreMultiplayerHand({
      handId: 'h8',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 2, tricksWon: 2, primesCount: 3, previousBags: 0, previousTotalPoints: 10 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0, previousTotalPoints: 0 },
        { playerId: 'p3', bid: 2, tricksWon: 2, primesCount: 0, previousBags: 0, previousTotalPoints: 0 },
      ],
    } as any)

    expect(result.breakdowns[0]).toMatchObject({
      contractPoints: 6,
      primePoints: 3,
      totalDelta: 9,
    })
    expect(result.updatedTotals.p1).toEqual({ totalPoints: 19, bags: 0 })
  })

  it('rejects invalid input', () => {
    expect(() =>
      scoreMultiplayerHand({
        handId: 'invalid',
        handSize: 5,
        players: [
          { playerId: 'p1', bid: -1, tricksWon: 2, primesCount: 0, previousBags: 0 },
          { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0, previousBags: 0 },
          { playerId: 'p3', bid: 1, tricksWon: 2, primesCount: 0, previousBags: 0 },
        ],
      } as any),
    ).toThrowError(/Invalid multiplayer hand input/)
  })
})
