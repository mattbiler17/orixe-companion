import type { DuelHandInput, MultiplayerHandInput, MultiplayerPlayerInput } from '../models/orixe'

export type ValidationResult = { ok: true } | { ok: false; errors: string[] }

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function validateNonNegativeInteger(value: unknown, fieldName: string): string[] {
  return isInteger(value) && value >= 0 ? [] : [`${fieldName} must be integer >= 0`]
}

function sumPlayerTricks(players: MultiplayerPlayerInput[]): number {
  return players.reduce((total, player) => total + player.tricksWon, 0)
}

function validateMultiplayerPlayer(player: MultiplayerPlayerInput, index: number): string[] {
  const prefix = `players[${index}]`

  return [
    ...validateNonNegativeInteger(player.bid, `${prefix}.bid`),
    ...validateNonNegativeInteger(player.tricksWon, `${prefix}.tricksWon`),
    ...validateNonNegativeInteger(player.primesCount, `${prefix}.primesCount`),
  ]
}

function validatePlayers(players: unknown): string[] {
  return Array.isArray(players) ? [] : ['players must be an array']
}

function validateMultiplayerTrickTotal(players: MultiplayerPlayerInput[], handSize: unknown): string[] {
  const handSizeErrors = validateNonNegativeInteger(handSize, 'handSize')
  if (handSizeErrors.length > 0) {
    return handSizeErrors
  }

  const totalTricks = sumPlayerTricks(players)
  return totalTricks === handSize
    ? []
    : [`total tricks (${totalTricks}) does not equal handSize (${handSize})`]
}

function validateDuelTrickRange(declarerTricksWon: unknown, handSize: unknown): string[] {
  const trickErrors = validateNonNegativeInteger(declarerTricksWon, 'declarerTricksWon')
  const handSizeErrors = validateNonNegativeInteger(handSize, 'handSize')

  if (trickErrors.length > 0 || handSizeErrors.length > 0) {
    return [...trickErrors, ...handSizeErrors]
  }

  const safeDeclarerTricksWon = declarerTricksWon as number
  const safeHandSize = handSize as number

  return safeDeclarerTricksWon <= safeHandSize
    ? []
    : [`declarerTricksWon (${safeDeclarerTricksWon}) must be between 0 and handSize (${safeHandSize})`]
}

export function validateMultiplayerHandInput(input: MultiplayerHandInput): ValidationResult {
  const playerErrors = validatePlayers(input?.players)
  if (playerErrors.length > 0) {
    return { ok: false, errors: playerErrors }
  }

  const errors = [
    ...input.players.flatMap(validateMultiplayerPlayer),
    ...validateMultiplayerTrickTotal(input.players, input.handSize),
  ]

  return errors.length > 0 ? { ok: false, errors } : { ok: true }
}

export function validateDuelHandInput(input: DuelHandInput): ValidationResult {
  if (!input) {
    return { ok: false, errors: ['invalid input'] }
  }

  const errors = [
    ...validateDuelTrickRange(input.declarerTricksWon, input.handSize),
    ...validateNonNegativeInteger(input.declarerPrimesCount, 'declarerPrimesCount'),
    ...validateNonNegativeInteger(input.defenderPrimesCount, 'defenderPrimesCount'),
    ...validateNonNegativeInteger(input.cachePrimes, 'cachePrimes'),
    ...validateNonNegativeInteger(input.previousBags, 'previousBags'),
  ]

  return errors.length > 0 ? { ok: false, errors } : { ok: true }
}
