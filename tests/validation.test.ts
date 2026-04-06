import { describe, expect, it } from 'vitest'
import { validateDuelHandInput, validateMultiplayerHandInput } from '../src/engine/validation'

describe('validation', () => {
  it('rejects negative bid', () => {
    const input = {
      handId: 'h1',
      handSize: 3,
      players: [
        { playerId: 'p1', bid: -1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0 },
      ],
    }

    const result = validateMultiplayerHandInput(input)

    expect(result).toEqual({
      ok: false,
      errors: ['players[0].bid must be integer >= 0'],
    })
  })

  it('rejects fractional tricks', () => {
    const input = {
      handId: 'h1',
      handSize: 3,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 1.5, primesCount: 0 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0 },
      ],
    }

    const result = validateMultiplayerHandInput(input)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors).toContain('players[0].tricksWon must be integer >= 0')
    }
  })

  it('rejects multiplayer trick-total mismatch', () => {
    const input = {
      handId: 'h1',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 2, primesCount: 0 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0 },
      ],
    }

    const result = validateMultiplayerHandInput(input)

    expect(result).toEqual({
      ok: false,
      errors: ['total tricks (4) does not equal handSize (5)'],
    })
  })

  it('rejects negative primes', () => {
    const input = {
      handId: 'h1',
      handSize: 3,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 1, primesCount: -1 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 1, primesCount: 0 },
      ],
    }

    const result = validateMultiplayerHandInput(input)

    expect(result).toEqual({
      ok: false,
      errors: ['players[0].primesCount must be integer >= 0'],
    })
  })

  it('rejects invalid cache values', () => {
    const duel = {
      handId: 'd1',
      declarerId: 'p1',
      defenderId: 'p2',
      declarerContract: 5,
      declarerTricksWon: 3,
      declarerPrimesCount: 1,
      defenderPrimesCount: 0,
      cachePrimes: -2,
      previousBags: 0,
      handSize: 5,
    }

    const result = validateDuelHandInput(duel)

    expect(result).toEqual({
      ok: false,
      errors: ['cachePrimes must be integer >= 0'],
    })
  })

  it('accepts valid multiplayer example', () => {
    const input = {
      handId: 'h1',
      handSize: 5,
      players: [
        { playerId: 'p1', bid: 1, tricksWon: 2, primesCount: 0 },
        { playerId: 'p2', bid: 1, tricksWon: 1, primesCount: 0 },
        { playerId: 'p3', bid: 1, tricksWon: 2, primesCount: 0 },
      ],
    }

    expect(validateMultiplayerHandInput(input)).toEqual({ ok: true })
  })

  it('accepts valid duel example', () => {
    const duel = {
      handId: 'd1',
      declarerId: 'p1',
      defenderId: 'p2',
      declarerContract: 5,
      declarerTricksWon: 3,
      declarerPrimesCount: 1,
      defenderPrimesCount: 0,
      cachePrimes: 2,
      previousBags: 1,
      handSize: 5,
    }

    expect(validateDuelHandInput(duel)).toEqual({ ok: true })
  })
})
