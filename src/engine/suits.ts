import { SUITS as SUIT_ORDER, SUIT_PAIRINGS } from '../models/orixe'
import type { Suit } from '../models/orixe'

export { SUIT_ORDER }

export function getPartnerSuit(trump: Suit): Suit {
  const partner = SUIT_PAIRINGS[trump]
  return partner
}

export function isValidSuit(value: string): value is Suit {
  return (SUIT_ORDER as readonly string[]).includes(value)
}

/**
 * Wild hierarchy: SUIT_ORDER defines increasing order. A wild can advance
 * only strictly upward in the SUIT_ORDER (to a suit with a higher index).
 */
export function canAdvanceWild(from: Suit, to: Suit): boolean {
  const order = SUIT_ORDER as readonly Suit[]
  const fromIdx = order.indexOf(from)
  const toIdx = order.indexOf(to)
  if (fromIdx === -1 || toIdx === -1) return false
  return toIdx > fromIdx
}
