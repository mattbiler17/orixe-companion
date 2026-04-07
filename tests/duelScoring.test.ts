import { describe, expect, it } from 'vitest'
import { scoreDuelHand } from '../src/engine/duelScoring'

describe('duelScoring', () => {
  it('scores a made contract', () => {
    const result = scoreDuelHand({
      handId: 'd1',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 3,
      declarerTricksWon: 4,
      declarerPrimesCount: 1,
      defenderPrimesCount: 2,
      cacheWinner: 'None',
      cachePrimes: 0,
      previousBags: 0,
      handSize: 5,
    } as any)

    expect(result.declarer).toEqual({
      playerId: 'decl',
      contractPoints: 9,
      primePoints: 1,
      cachePrimePoints: 0,
      bagGain: 1,
      bagPenaltyApplied: false,
      bagPenaltyPoints: 0,
      totalDelta: 10,
      newBagTotal: 1,
      contractMade: true,
    })
  })

  it('scores a failed contract', () => {
    const result = scoreDuelHand({
      handId: 'd2',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 4,
      declarerTricksWon: 2,
      declarerPrimesCount: 1,
      defenderPrimesCount: 0,
      cachePrimes: 0,
      previousBags: 0,
      handSize: 5,
    } as any)

    expect(result.declarer.contractMade).toBe(false)
    expect(result.declarer.contractPoints).toBe(-12)
    expect(result.declarer.primePoints).toBe(0)
    expect(result.declarer.totalDelta).toBe(-12)
  })

  it('gives bags only to the declarer', () => {
    const result = scoreDuelHand({
      handId: 'd3',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 2,
      declarerTricksWon: 4,
      declarerPrimesCount: 0,
      defenderPrimesCount: 0,
      cachePrimes: 0,
      previousBags: 1,
      handSize: 5,
    } as any)

    expect(result.declarer.bagGain).toBe(2)
    expect(result.declarer.newBagTotal).toBe(3)
    expect(result.defender.totalDelta).toBe(0)
  })

  it('applies a declarer bag penalty at 7', () => {
    const result = scoreDuelHand({
      handId: 'd4',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 2,
      declarerTricksWon: 4,
      declarerPrimesCount: 0,
      defenderPrimesCount: 0,
      cachePrimes: 0,
      previousBags: 5,
      handSize: 5,
    } as any)

    expect(result.declarer).toMatchObject({
      bagGain: 2,
      bagPenaltyApplied: true,
      bagPenaltyPoints: -21,
      newBagTotal: 0,
    })
  })

  it('awards cache primes to the defender when defender wins cache', () => {
    const result = scoreDuelHand({
      handId: 'd5',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 3,
      declarerTricksWon: 3,
      declarerPrimesCount: 0,
      defenderPrimesCount: 1,
      cacheWinner: 'Defender',
      cachePrimes: 2,
      previousBags: 0,
      handSize: 5,
    } as any)

    expect(result.declarer.cachePrimePoints).toBe(0)
    expect(result.defender).toMatchObject({
      primePoints: 1,
      cachePrimePoints: 2,
      totalDelta: 3,
    })
  })

  it('awards cache primes to the declarer on a made contract', () => {
    const result = scoreDuelHand({
      handId: 'd6',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 3,
      declarerTricksWon: 3,
      declarerPrimesCount: 1,
      defenderPrimesCount: 0,
      cacheWinner: 'Declarer',
      cachePrimes: 2,
      previousBags: 0,
      handSize: 5,
    } as any)

    expect(result.declarer.cachePrimePoints).toBe(2)
    expect(result.declarer.totalDelta).toBe(12)
  })

  it('denies cache primes to the declarer on a failed contract', () => {
    const result = scoreDuelHand({
      handId: 'd7',
      declarerId: 'decl',
      defenderId: 'def',
      declarerContract: 4,
      declarerTricksWon: 2,
      declarerPrimesCount: 1,
      defenderPrimesCount: 0,
      cacheWinner: 'Declarer',
      cachePrimes: 3,
      previousBags: 0,
      handSize: 5,
    } as any)

    expect(result.declarer.cachePrimePoints).toBe(0)
    expect(result.declarer.primePoints).toBe(0)
    expect(result.declarer.totalDelta).toBe(-12)
  })

  it('rejects invalid input', () => {
    expect(() =>
      scoreDuelHand({
        handId: 'invalid',
        declarerId: 'decl',
        defenderId: 'def',
        declarerContract: 3,
        declarerTricksWon: 6,
        declarerPrimesCount: 0,
        defenderPrimesCount: 0,
        cachePrimes: 0,
        previousBags: 0,
        handSize: 5,
      } as any),
    ).toThrowError(/Invalid duel hand input/)
  })
})
