import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { JewelBox, JewelButton, JewelChoiceButton, NumericInput } from '../../components/ui'
import { normalizeWholeNumberInput } from '../../components/ui/NumericInput.utils'
import { sessionReducer, type CurrentDuelHandDraft, type CurrentMultiplayerHandDraft } from '../../engine/sessionReducer'
import type { Suit } from '../../models/orixe'
import { SUITS } from '../../models/orixe'
import { nextId } from '../../lib/ids'
import useSession from '../../hooks/useSession'

function parseWholeNumber(value: string): number {
  if (value.trim() === '') {
    return Number.NaN
  }

  return Number(value)
}

function createBidDrafts(playerCount: number): string[] {
  return Array.from({ length: playerCount }, () => '')
}

export default function BidEntryScreen() {
  const navigate = useNavigate()
  const session = useSession((state) => state.session)
  const setSession = useSession((state) => state.setSession)
  const existingMultiplayerHand = session.currentHand?.mode === 'multiplayer' ? session.currentHand : null
  const existingDuelHand = session.currentHand?.mode === 'duel' ? session.currentHand : null
  const [trump, setTrump] = useState<Suit | ''>(session.currentHand?.trump ?? '')
  const [multiplayerBids, setMultiplayerBids] = useState<string[]>(
    existingMultiplayerHand?.players.map((player) => String(player.bid)) ?? createBidDrafts(session.players.length),
  )
  const [declarerId, setDeclarerId] = useState<string>(
    existingDuelHand?.declarerId ?? session.players[0]?.id ?? '',
  )
  const [declarerContract, setDeclarerContract] = useState<string>(
    existingDuelHand ? String(existingDuelHand.declarerContract) : '',
  )
  const [error, setError] = useState<string | null>(null)

  if (!session.id || session.players.length === 0 || session.currentHandSize === null) {
    return (
      <section className="app-screen">
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Ready</h2>
          </div>
        </div>
      </section>
    )
  }

  const handSize = session.currentHandSize
  const dealerId = session.players[session.dealerSeat]?.id
  const defender = session.players.find((player) => player.id !== declarerId) ?? null

  function saveMultiplayerPreHand() {
    if (!trump) {
      setError('Choose Trump before saving bids.')
      return
    }

    try {
      const draft: CurrentMultiplayerHandDraft = {
        mode: 'multiplayer',
        handId: existingMultiplayerHand?.handId ?? nextId('hand'),
        handSize,
        dealerId,
        trump,
        players: session.players.map((player, index) => ({
          playerId: player.id,
          bid: parseWholeNumber(multiplayerBids[index] ?? ''),
        })),
      }

      const nextSession = sessionReducer(session, {
        type: 'SAVE_CURRENT_HAND',
        payload: draft,
      })

      setSession(nextSession)
      navigate('/results')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save bids.')
    }
  }

  function saveDuelPreHand() {
    if (!trump) {
      setError('Choose Trump before saving the hand.')
      return
    }

    if (!defender) {
      setError('Duel mode requires two players.')
      return
    }

    try {
      const draft: CurrentDuelHandDraft = {
        mode: 'duel',
        handId: existingDuelHand?.handId ?? nextId('hand'),
        handSize,
        dealerId,
        trump,
        declarerId,
        defenderId: defender.id,
        declarerContract: parseWholeNumber(declarerContract),
      }

      const nextSession = sessionReducer(session, {
        type: 'SAVE_CURRENT_HAND',
        payload: draft,
      })

      setSession(nextSession)
      navigate('/results')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to save pre-hand details.')
    }
  }

  return (
    <section className="app-screen">
      <JewelBox className="orixe-prehand-header">
        <div className="app-stack">
          <p className="app-kicker">Pre-Hand</p>
          <h2 className="app-section-title">Lock The Bid</h2>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Mode {session.mode}</span>
            <span className="orixe-meta-chip">Hand Size {session.currentHandSize}</span>
          </div>
        </div>
      </JewelBox>

      <JewelBox>
        <div className="app-stack">
          <JewelBox className="orixe-prehand-title-box" fullWidth={false}>
            <p className="orixe-prehand-title">TRUMP</p>
          </JewelBox>
          <div className="orixe-prehand-suit-grid">
            {SUITS.map((suit) => (
              <JewelChoiceButton
                key={suit}
                onClick={() => setTrump(suit)}
                isSelected={trump === suit}
                className={`orixe-suit-jewel suit-${suit}`}
              >
                <span className={`orixe-suit-jewel-name suit-${suit}`}>{suit}</span>
              </JewelChoiceButton>
            ))}
          </div>
        </div>
      </JewelBox>

      {session.mode === 'multiplayer' ? (
        <JewelBox>
          <div className="app-stack">
            <div className="orixe-prehand-list">
              {session.players.map((player, index) => (
                <JewelBox key={player.id} className="orixe-prehand-row">
                  <div className="orixe-prehand-row-grid">
                    <div className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Player</span>
                      <strong className="orixe-entry-player">{player.name}</strong>
                    </div>
                    <label className="orixe-jewel-subbox">
                      <span className="orixe-jewel-subbox-label">Bid</span>
                      <NumericInput
                        aria-label={`${player.name} bid`}
                        placeholder="0"
                        value={multiplayerBids[index] ?? ''}
                        onValueChange={(value) =>
                          setMultiplayerBids((currentBids) =>
                            currentBids.map((currentBid, currentIndex) =>
                              currentIndex === index ? value : currentBid,
                            ),
                          )
                        }
                        normalizeOnBlur={normalizeWholeNumberInput}
                        className="orixe-input orixe-input-jewel orixe-entry-value"
                      />
                    </label>
                  </div>
                </JewelBox>
              ))}
            </div>
          </div>
        </JewelBox>
      ) : (
        <JewelBox>
          <div className="app-stack">
            <div className="orixe-prehand-duel-grid">
              <div className="orixe-jewel-subbox">
                <span className="orixe-jewel-subbox-label">Declarer</span>
                <select value={declarerId} onChange={(event) => setDeclarerId(event.target.value)} className="orixe-select orixe-input-jewel">
                  {session.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="orixe-jewel-subbox">
                <span className="orixe-jewel-subbox-label">Bid</span>
                <NumericInput
                  aria-label="Declarer bid"
                  placeholder="0"
                  value={declarerContract}
                  onValueChange={setDeclarerContract}
                  normalizeOnBlur={normalizeWholeNumberInput}
                  className="orixe-input orixe-input-jewel orixe-entry-value"
                />
              </div>
            </div>
          </div>
        </JewelBox>
      )}

      <JewelButton onClick={session.mode === 'multiplayer' ? saveMultiplayerPreHand : saveDuelPreHand}>Lock Bid</JewelButton>

      {error ? (
        <div className="orixe-panel">
          <div className="orixe-panel-body">
            <p className="orixe-error app-copy">{error}</p>
          </div>
        </div>
      ) : null}
    </section>
  )
}
