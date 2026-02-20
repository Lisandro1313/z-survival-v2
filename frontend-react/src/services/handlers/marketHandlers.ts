import { useUIStore } from '../../store/uiStore'

export function onMarketListings(payload: { listings?: unknown[] }) {
  console.log('[Market] Listings received:', payload)
  // Update marketplace store when implemented
}

interface Listing {
  item: { name: string }
  [key: string]: unknown
}

export function onListingCreated(payload: { listing: Listing }) {
  const { listing } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Tu listing fue creado: ${listing.item.name}`
  })
}

export function onPurchaseSuccess(payload: { listing: Listing; buyer?: string }) {
  const { listing } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Compraste: ${listing.item.name}`
  })
}

export function onBidPlaced(payload: { listing: Listing; amount: number; bidder?: string }) {
  const { listing, amount } = payload
  useUIStore.getState().addNotification({
    type: 'info',
    message: `Nueva puja: ${amount} caps por ${listing.item.name}`
  })
}

export function onAuctionWon(payload: { listing: Listing; winner?: string }) {
  const { listing } = payload
  useUIStore.getState().addNotification({
    type: 'success',
    message: `¡Ganaste la subasta! ${listing.item.name}`
  })
}
