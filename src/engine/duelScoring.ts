import type { CacheWinner, DuelHandInput, DuelHandResult } from '../models/orixe'
import { validateDuelHandInput } from './validation'

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function getValidationErrors(input: DuelHandInput): string[] {
  const baseValidation = validateDuelHandInput(input)
  const errors = baseValidation.ok ? [] : [...baseValidation.errors]

  if (!isInteger(input.declarerContract) || input.declarerContract < 0) {
    errors.push('declarerContract must be integer >= 0')
  }

  return errors
}

function getContractMade(declarerTricksWon: number, declarerContract: number): boolean {
  return declarerTricksWon >= declarerContract
}

function getContractPoints(contractMade: boolean, declarerContract: number): number {
  const contractValue = 3 * declarerContract
  return contractMade ? contractValue : -contractValue
}

function getBagGain(declarerTricksWon: number, declarerContract: number): number {
  return Math.max(0, declarerTricksWon - declarerContract)
}

function applyBagPenalty(previousBags: number, bagGain: number): {
  bagPenaltyApplied: boolean
  bagPenaltyPoints: number
  newBagTotal: number
} {
  const rawBagTotal = previousBags + bagGain

  if (rawBagTotal >= 7) {
    return {
      bagPenaltyApplied: true,
      bagPenaltyPoints: -21,
      newBagTotal: rawBagTotal - 7,
    }
  }

  return {
    bagPenaltyApplied: false,
    bagPenaltyPoints: 0,
    newBagTotal: rawBagTotal,
  }
}

function getCachePrimePoints(params: {
  cacheWinner: CacheWinner | undefined
  cachePrimes: number
  contractMade: boolean
}): { declarer: number; defender: number } {
  const { cacheWinner, cachePrimes, contractMade } = params

  if (cacheWinner === 'Defender') {
    return { declarer: 0, defender: cachePrimes }
  }

  if (cacheWinner === 'Declarer') {
    return { declarer: contractMade ? cachePrimes : 0, defender: 0 }
  }

  return { declarer: 0, defender: 0 }
}

function assertValidDuelInput(input: DuelHandInput): asserts input is DuelHandInput & {
  handSize: number
} {
  const errors = getValidationErrors(input)
  if (errors.length > 0) {
    throw new Error(`Invalid duel hand input: ${errors.join('; ')}`)
  }
}

export function scoreDuelHand(input: DuelHandInput): DuelHandResult {
  assertValidDuelInput(input)

  const contractMade = getContractMade(input.declarerTricksWon, input.declarerContract)
  const contractPoints = getContractPoints(contractMade, input.declarerContract)
  const bagGain = getBagGain(input.declarerTricksWon, input.declarerContract)
  const { bagPenaltyApplied, bagPenaltyPoints, newBagTotal } = applyBagPenalty(
    input.previousBags ?? 0,
    bagGain,
  )
  const cachePrimePoints = getCachePrimePoints({
    cacheWinner: input.cacheWinner,
    cachePrimes: input.cachePrimes ?? 0,
    contractMade,
  })

  const declarerPrimePoints = contractMade ? input.declarerPrimesCount : 0
  const defenderPrimePoints = input.defenderPrimesCount
  const declarerTotalDelta =
    contractPoints + declarerPrimePoints + cachePrimePoints.declarer + bagPenaltyPoints
  const defenderTotalDelta = defenderPrimePoints + cachePrimePoints.defender

  return {
    handId: input.handId,
    declarer: {
      playerId: input.declarerId,
      contractPoints,
      primePoints: declarerPrimePoints,
      cachePrimePoints: cachePrimePoints.declarer,
      bagGain,
      bagPenaltyApplied,
      bagPenaltyPoints,
      totalDelta: declarerTotalDelta,
      newBagTotal,
      contractMade,
    },
    defender: {
      playerId: input.defenderId,
      primePoints: defenderPrimePoints,
      cachePrimePoints: cachePrimePoints.defender,
      totalDelta: defenderTotalDelta,
    },
  }
}
