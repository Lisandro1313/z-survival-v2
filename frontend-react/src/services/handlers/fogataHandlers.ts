import { useUIStore } from '../../store/uiStore'

export function onFogataPosts(payload: { posts?: unknown[] }) {
  console.log('[Fogata] Posts received:', payload)
  // Update social store when implemented
}

interface Post {
  id: string
  [key: string]: unknown
}

export function onLikeAdded(payload: { post: Post; liker?: string }) {
  const { post } = payload
  console.log('[Fogata] Like added to post:', post.id)
  // Update post in social store
}

interface Comment {
  text: string
  [key: string]: unknown
}

export function onCommentAdded(payload: { post?: Post; comment: Comment }) {
  const { comment } = payload
  console.log('[Fogata] Comment added:', comment.text)
  // Update post in social store
}

interface Player {
  name: string
  isMe?: boolean
  [key: string]: unknown
}

interface Game {
  type: string
  [key: string]: unknown
}

export function onGameJoined(payload: { game: Game; player: Player }) {
  const { game, player } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${player.name} se unió al juego ${game.type}`
  })
}

export function onGameStarted(payload: { game: Game }) {
  const { game } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `¡Juego iniciado! ${game.type}`
  })
}

interface Rewards {
  caps: number
  [key: string]: unknown
}

export function onGameFinished(payload: { game?: Game; winner: Player; rewards: Rewards }) {
  const { winner, rewards } = payload
  useUIStore.getState().addNotification({
    type: winner.isMe ? 'success' : 'info',
    message: winner.isMe ? `¡Ganaste! +${rewards.caps} caps` : `${winner.name} ganó`
  })
}
