import { describe, expect, it } from 'vitest'
import { createSessionState, sessionReducer } from '../src/engine/sessionReducer'

describe('sessionReducer', () => {
  it('creates a new session with scores, bags, rung state, and dealer seat', () => {
    const session = createSessionState({
      id: 'session-1',
      mode: 'multiplayer',
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
        { id: 'p3', name: 'C' },
      ],
      dealerSeat: 1,
    })

    expect(session).toMatchObject({
      id: 'session-1',
      mode: 'multiplayer',
      rungSequence: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
      currentRungIndex: 0,
      currentHandSize: 3,
      dealerSeat: 1,
      isComplete: false,
    })
    expect(session.scoresByPlayer).toEqual({ p1: 0, p2: 0, p3: 0 })
    expect(session.bagsByPlayer).toEqual({ p1: 0, p2: 0, p3: 0 })
  })

  it('applies a multiplayer hand result and advances the session', () => {
    const session = createSessionState({
      id: 'session-1',
      mode: 'multiplayer',
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
        { id: 'p3', name: 'C' },
      ],
    })

    const nextState = sessionReducer(session, {
      type: 'APPLY_MULTIPLAYER_HAND',
      payload: {
        timestamp: '2026-04-06T10:00:00.000Z',
        input: {
          handId: 'h1',
          players: [],
        },
        result: {
          handId: 'h1',
          breakdowns: [
            {
              playerId: 'p1',
              contractPoints: 6,
              primePoints: 1,
              bagGain: 1,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: 7,
              newBagTotal: 1,
            },
            {
              playerId: 'p2',
              contractPoints: -3,
              primePoints: 0,
              bagGain: 0,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: -3,
              newBagTotal: 0,
            },
            {
              playerId: 'p3',
              contractPoints: 3,
              primePoints: 0,
              bagGain: 0,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: 3,
              newBagTotal: 0,
            },
          ],
          updatedTotals: {
            p1: { totalPoints: 7, bags: 1 },
            p2: { totalPoints: -3, bags: 0 },
            p3: { totalPoints: 3, bags: 0 },
          },
        },
      },
    })

    expect(nextState.scoresByPlayer).toEqual({ p1: 7, p2: -3, p3: 3 })
    expect(nextState.bagsByPlayer).toEqual({ p1: 1, p2: 0, p3: 0 })
    expect(nextState.history).toHaveLength(1)
    expect(nextState.history[0].summary).toBe('Multiplayer hand h1 completed')
    expect(nextState.currentRungIndex).toBe(1)
    expect(nextState.currentHandSize).toBe(4)
    expect(nextState.dealerSeat).toBe(1)
  })

  it('applies a duel hand result and updates only the declarer bags', () => {
    const session = createSessionState({
      id: 'session-2',
      mode: 'duel',
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
    })

    const nextState = sessionReducer(session, {
      type: 'APPLY_DUEL_HAND',
      payload: {
        timestamp: '2026-04-06T10:05:00.000Z',
        input: {
          handId: 'd1',
          declarerId: 'p1',
          defenderId: 'p2',
          declarerContract: 3,
          declarerTricksWon: 4,
          declarerPrimesCount: 1,
          defenderPrimesCount: 2,
        },
        result: {
          handId: 'd1',
          declarer: {
            playerId: 'p1',
            contractPoints: 9,
            primePoints: 1,
            cachePrimePoints: 0,
            bagGain: 1,
            bagPenaltyApplied: false,
            bagPenaltyPoints: 0,
            totalDelta: 10,
            newBagTotal: 1,
            contractMade: true,
          },
          defender: {
            playerId: 'p2',
            primePoints: 2,
            cachePrimePoints: 0,
            totalDelta: 2,
          },
        },
      },
    })

    expect(nextState.scoresByPlayer).toEqual({ p1: 10, p2: 2 })
    expect(nextState.bagsByPlayer).toEqual({ p1: 1, p2: 0 })
    expect(nextState.history[0].summary).toBe('Duel hand d1 completed')
    expect(nextState.currentRungIndex).toBe(1)
    expect(nextState.dealerSeat).toBe(1)
  })

  it('marks the session complete after the final rung is finished', () => {
    const session = createSessionState({
      id: 'session-3',
      mode: 'multiplayer',
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
        { id: 'p3', name: 'C' },
      ],
    })

    const finalRungState = {
      ...session,
      currentRungIndex: session.rungSequence.length - 1,
      currentHandSize: session.rungSequence[session.rungSequence.length - 1],
      dealerSeat: 2,
    }

    const nextState = sessionReducer(finalRungState, {
      type: 'APPLY_MULTIPLAYER_HAND',
      payload: {
        timestamp: '2026-04-06T10:10:00.000Z',
        input: {
          handId: 'h-final',
          players: [],
        },
        result: {
          handId: 'h-final',
          breakdowns: [
            {
              playerId: 'p1',
              contractPoints: 0,
              primePoints: 0,
              bagGain: 0,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: 0,
              newBagTotal: 0,
            },
            {
              playerId: 'p2',
              contractPoints: 0,
              primePoints: 0,
              bagGain: 0,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: 0,
              newBagTotal: 0,
            },
            {
              playerId: 'p3',
              contractPoints: 0,
              primePoints: 0,
              bagGain: 0,
              bagPenaltyApplied: false,
              bagPenaltyPoints: 0,
              totalDelta: 0,
              newBagTotal: 0,
            },
          ],
          updatedTotals: {
            p1: { totalPoints: 0, bags: 0 },
            p2: { totalPoints: 0, bags: 0 },
            p3: { totalPoints: 0, bags: 0 },
          },
        },
      },
    })

    expect(nextState.isComplete).toBe(true)
    expect(nextState.currentHandSize).toBeNull()
    expect(nextState.dealerSeat).toBe(0)
  })
})
