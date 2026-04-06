import { describe, it, expect } from 'vitest'
import { getRungSequence, getRungName } from '../src/engine/rungs'
import { getPartnerSuit, canAdvanceWild, SUIT_ORDER } from '../src/engine/suits'
import type { Suit } from '../src/models/orixe'

describe('rungs', ()=>{
  it('returns correct sequence for 3 players', ()=>{
    expect(getRungSequence(3)).toEqual([3,4,5,6,7,8,9,10,11,12,13])
  })

  it('returns correct sequence for 5 players', ()=>{
    expect(getRungSequence(5)).toEqual([3,4,5,6,7,8,9,10])
  })

  it('throws for unsupported player counts', ()=>{
    expect(()=>getRungSequence(1)).toThrow()
    expect(()=>getRungSequence(6)).toThrow()
  })

  it('provides user-facing rung names', ()=>{
    expect(getRungName(0)).toBe('First Rung')
    expect(getRungName(1)).toBe('Second Rung')
    expect(getRungName(12)).toBe('Thirteenth Rung')
    expect(getRungName(-1)).toBe('Unknown Rung')
  })
})

describe('suits and wild hierarchy', ()=>{
  it('returns correct partner suit', ()=>{
    const partner = getPartnerSuit('wheels' as Suit)
    expect(partner).toBe('shields')
  })

  it('enforces upward-only wild advancement', ()=>{
    const order = SUIT_ORDER as readonly Suit[]
    // ensure order is as expected
    expect(order).toEqual(['wheels','shields','swords','stars'])

    expect(canAdvanceWild('wheels' as Suit, 'shields' as Suit)).toBe(true)
    expect(canAdvanceWild('shields' as Suit, 'wheels' as Suit)).toBe(false)
    expect(canAdvanceWild('swords' as Suit, 'stars' as Suit)).toBe(true)
    expect(canAdvanceWild('wheels' as Suit, 'stars' as Suit)).toBe(true)
    expect(canAdvanceWild('stars' as Suit, 'stars' as Suit)).toBe(false)
  })
})
