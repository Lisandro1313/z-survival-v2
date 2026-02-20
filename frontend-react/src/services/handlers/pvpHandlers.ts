import { useUIStore } from '../../store/uiStore'

interface Player {
  name: string
  isMe?: boolean
  [key: string]: unknown
}

export function onDuelInvitation(payload: { from: Player; duelId?: string }) {
  const { from } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${from.name} te desafió a un duelo`
  })
  // Open duel modal
}

interface Duel {
  opponent: Player
  [key: string]: unknown
}

export function onDuelStarted(payload: { duel: Duel }) {
  const { duel } = payload
  useUIStore.getState().setMode('combat')
  useUIStore.getState().addNotification({
    type: 'warning',
    message: `Duelo iniciado contra ${duel.opponent.name}`
  })
}

interface Round {
  [key: string]: unknown
}

export function onDuelRoundResult(payload: { duel?: Duel; round: Round; winner?: Player }) {
  const { round, winner } = payload
  console.log('[PvP] Round result:', round, 'winner:', winner?.name)
  // Update combat log
}

export function onDuelEnded(payload: { duel?: Duel; winner: Player; loser?: Player }) {
  const { winner } = payload
  useUIStore.getState().addNotification({
    type: winner.isMe ? 'success' : 'error',
    message: winner.isMe ? '¡Ganaste el duelo!' : 'Perdiste el duelo'
  })
}

export function onKarmaData(payload: { karma?: unknown }) {
  console.log('[PvP] Karma data:', payload)
  // Update karma display
}

export function onRanking(payload: { ranking?: unknown[] }) {
  console.log('[PvP] Ranking:', payload)
  // Update PvP leaderboard
}
