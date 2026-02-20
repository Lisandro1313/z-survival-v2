import { useUIStore } from '../../store/uiStore'

export function onClanMyInfo(payload: { clan?: unknown }) {
  console.log('[Clan] My clan info:', payload)
  // Update clan store when implemented
}

interface Clan {
  name: string
  [key: string]: unknown
}

export function onClanCreated(payload: { clan: Clan }) {
  const { clan } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Clan creado: ${clan.name}`
  })
}

export function onClanJoined(payload: { clan: Clan; player?: unknown }) {
  const { clan } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Te uniste al clan: ${clan.name}`
  })
}

export function onClanLeft(payload: { clan: Clan; player?: unknown }) {
  const { clan } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `Dejaste el clan: ${clan.name}`
  })
}

export function onClanRecruitingList(payload: { clans?: unknown[] }) {
  console.log('[Clan] Recruiting list:', payload)
  // Update clan browser when implemented
}

interface Inviter {
  name: string
  [key: string]: unknown
}

export function onClanInviteReceived(payload: { clan: Clan; inviter: Inviter }) {
  const { clan, inviter } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${inviter.name} te invitó al clan ${clan.name}`
  })
}

interface Member {
  name: string
  [key: string]: unknown
}

export function onClanMemberJoined(payload: { clan: Clan; member: Member }) {
  const { member } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `${member.name} se unió al clan`
  })
}

export function onClanStorageUpdated(payload: { storage?: unknown }) {
  console.log('[Clan] Storage updated:', payload)
  // Update clan storage view when implemented
}
