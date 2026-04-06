import type {
  MultiplayerHandInput,
  MultiplayerHandResult,
  MultiplayerPlayerBreakdown,
} from '../models/orixe'
import { validateMultiplayerHandInput } from './validation'

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function getValidationErrors(input: MultiplayerHandInput): string[] {
  const baseValidation = validateMultiplayerHandInput(input)
  const errors = baseValidation.ok ? [] : [...baseValidation.errors]

  input.players.forEach((player, index) => {
    if (player.previousBags !== undefined && (!isInteger(player.previousBags) || player.previousBags < 0)) {
      errors.push(`players[${index}].previousBags must be integer >= 0`)
    }

    if (
      player.previousTotalPoints !== undefined &&
      !isFiniteNumber(player.previousTotalPoints)
    ) {
      errors.push(`players[${index}].previousTotalPoints must be a finite number`)
    }
  })

  return errors
}

function getContractPoints(bid: number, tricksWon: number, handSize: number): number {
  if (bid === 0) {
    return tricksWon === 0 ? handSize : -handSize
  }

  return tricksWon >= bid ? 3 * bid : -3 * bid
}

function getBagGain(bid: number, tricksWon: number): number {
  return Math.max(0, tricksWon - bid)
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

function scorePlayer(player: MultiplayerHandInput['players'][number], handSize: number): {
  breakdown: MultiplayerPlayerBreakdown
  updatedTotalPoints: number
  updatedBags: number
} {
  const previousBags = player.previousBags ?? 0
  const previousTotalPoints = player.previousTotalPoints ?? 0
  const contractPoints = getContractPoints(player.bid, player.tricksWon, handSize)
  const primePoints = player.primesCount
  const bagGain = getBagGain(player.bid, player.tricksWon)
  const { bagPenaltyApplied, bagPenaltyPoints, newBagTotal } = applyBagPenalty(previousBags, bagGain)
  const totalDelta = contractPoints + primePoints + bagPenaltyPoints
  const updatedTotalPoints = previousTotalPoints + totalDelta

  return {
    breakdown: {
      playerId: player.playerId,
      contractPoints,
      primePoints,
      bagGain,
      bagPenaltyApplied,
      bagPenaltyPoints,
      totalDelta,
      newBagTotal,
    },
    updatedTotalPoints,
    updatedBags: newBagTotal,
  }
}

function assertValidMultiplayerInput(input: MultiplayerHandInput): asserts input is MultiplayerHandInput & {
  handSize: number
} {
  const errors = getValidationErrors(input)
  if (errors.length > 0) {
    throw new Error(`Invalid multiplayer hand input: ${errors.join('; ')}`)
  }
}

export function scoreMultiplayerHand(input: MultiplayerHandInput): MultiplayerHandResult {
  assertValidMultiplayerInput(input)

  const scoredPlayers = input.players.map((player) => scorePlayer(player, input.handSize))

  return {
    handId: input.handId,
    breakdowns: scoredPlayers.map((entry) => entry.breakdown),
    updatedTotals: Object.fromEntries(
      scoredPlayers.map((entry) => [
        entry.breakdown.playerId,
        {
          totalPoints: entry.updatedTotalPoints,
          bags: entry.updatedBags,
        },
      ]),
    ),
  }
}
