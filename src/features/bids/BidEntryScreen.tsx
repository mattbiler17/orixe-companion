import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  return Array.from({ length: playerCount }, () => '0')
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
    existingDuelHand ? String(existingDuelHand.declarerContract) : '0',
  )
  const [error, setError] = useState<string | null>(null)

  if (!session.id || session.players.length === 0 || session.currentHandSize === null) {
    return (
      <section className="app-screen">
        <div className="orixe-braid-panel">
          <div className="orixe-panel-body app-stack">
            <h2 className="app-section-title">No Hand Ready</h2>
            <p className="app-copy">Create or resume a session before starting a hand.</p>
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
      <div className="orixe-braid-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Pre-Hand Entry</p>
          <h2 className="app-section-title">Name Trump And Lock The Bids</h2>
          <div className="orixe-inline-meta">
            <span className="orixe-meta-chip">Mode {session.mode}</span>
            <span className="orixe-meta-chip">Hand Size {session.currentHandSize}</span>
          </div>
        </div>
      </div>

      <div className="orixe-trump-panel">
        <div className="orixe-panel-body app-stack">
          <p className="app-kicker">Trump</p>
          <label className="orixe-field-group">
            <span className="orixe-label">Current Hand Trump</span>
            <select value={trump} onChange={(event) => setTrump(event.target.value as Suit | '')} className="orixe-select">
              <option value="">Choose Trump</option>
              {SUITS.map((suit) => (
                <option key={suit} value={suit}>
                  {suit}
                </option>
              ))}
            </select>
          </label>
          {trump ? (
            <div className="orixe-badge-row">
              <span className={`orixe-badge suit-badge suit-${trump}`}>Trump: {trump}</span>
            </div>
          ) : null}
        </div>
      </div>

      {session.mode === 'multiplayer' ? (
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Bids</p>
            <div className="orixe-list">
              {session.players.map((player, index) => (
                <div className="orixe-row-card orixe-compact-row" key={player.id}>
                  <div className="app-stack" style={{ gap: '6px' }}>
                    <strong>{player.name}</strong>
                    <span className="app-muted">Seat {index + 1}</span>
                  </div>
                  <label className="orixe-field-group">
                    <span className="orixe-label">Bid</span>
                    <input
                      inputMode="numeric"
                      value={multiplayerBids[index] ?? '0'}
                      onChange={(event) =>
                        setMultiplayerBids((currentBids) =>
                          currentBids.map((currentBid, currentIndex) =>
                            currentIndex === index ? event.target.value : currentBid,
                          ),
                        )
                      }
                      className="orixe-input"
                    />
                  </label>
                  <div className="orixe-badge-row">
                    <span className="orixe-badge">Durable score state stays on table</span>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={saveMultiplayerPreHand} className="orixe-button orixe-button-full">
              Save Trump And Bids
            </button>
          </div>
        </div>
      ) : (
        <div className="orixe-panel">
          <div className="orixe-panel-body app-stack">
            <p className="app-kicker">Duel Contract</p>
            <div className="orixe-field-grid">
              <label className="orixe-field-group">
                <span className="orixe-label">Declarer</span>
                <select value={declarerId} onChange={(event) => setDeclarerId(event.target.value)} className="orixe-select">
                  {session.players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="orixe-field-group">
                <span className="orixe-label">Declarer Contract</span>
                <input
                  inputMode="numeric"
                  value={declarerContract}
                  onChange={(event) => setDeclarerContract(event.target.value)}
                  className="orixe-input"
                />
              </label>
            </div>
            <p className="app-copy">
              TODO: if duel pre-hand bidding expands beyond the declarer contract, extend the stored hand draft here.
            </p>

            <button onClick={saveDuelPreHand} className="orixe-button orixe-button-full">
              Save Trump And Contract
            </button>
          </div>
        </div>
      )}

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
