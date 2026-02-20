import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { useEconomyStore, type ShopItem } from '../../store/economyStore'

interface EconomyData {
  shop_items?: ShopItem[]
  player_caps?: number
}

export function onEconomyData(payload: EconomyData) {
  const { shop_items, player_caps } = payload
  if (shop_items && Array.isArray(shop_items)) {
    useEconomyStore.getState().setShopItems(shop_items)
  }
  if (player_caps !== undefined) {
    useEconomyStore.getState().setCaps(player_caps)
    usePlayerStore.getState().updateCaps(0) // Sync with player store
  }
  console.log('[Economy] Data loaded:', shop_items?.length, 'items')
}

interface PurchaseSuccessPayload {
  item: { id: string; name: string; type?: string; quantity?: number }
  cost: number
  quantity?: number
}

export function onPurchaseSuccess(payload: PurchaseSuccessPayload) {
  const { item, cost, quantity = 1 } = payload
  usePlayerStore.getState().updateCaps(-cost)
  useEconomyStore.getState().removeCaps(cost)
  
  // Add item with all required InventoryItem properties
  usePlayerStore.getState().addItem({
    id: item.id,
    name: item.name,
    type: item.type || 'misc',
    quantity
  })
  
  useEconomyStore.getState().addTransaction({
    id: Date.now(),
    type: 'purchase',
    item_name: item.name,
    quantity,
    price: cost,
    timestamp: new Date().toISOString(),
    success: true
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Compraste: ${item.name} x${quantity} por ${cost} caps`
  })
}

interface SaleSuccessPayload {
  item: { id: string; name: string }
  price: number
  quantity?: number
}

export function onSaleSuccess(payload: SaleSuccessPayload) {
  const { item, price, quantity = 1 } = payload
  usePlayerStore.getState().updateCaps(price)
  useEconomyStore.getState().addCaps(price)
  usePlayerStore.getState().removeItem(item.id, quantity)
  
  useEconomyStore.getState().addTransaction({
    id: Date.now(),
    type: 'sale',
    item_name: item.name,
    quantity,
    price,
    timestamp: new Date().toISOString(),
    success: true
  })
  
  useUIStore.getState().addNotification({
    type: 'success',
    message: `Vendiste: ${item.name} x${quantity} por ${price} caps`
  })
}

interface CapsUpdatedPayload {
  caps?: number
  delta?: number
}

export function onCapsUpdated(payload: CapsUpdatedPayload) {
  const { caps, delta } = payload
  if (caps !== undefined) {
    useEconomyStore.getState().setCaps(caps)
    usePlayerStore.getState().updateCaps(0) // Sync
  } else if (delta) {
    usePlayerStore.getState().updateCaps(delta)
    useEconomyStore.getState().addCaps(delta)
  }
  
  if (delta && delta > 0) {
    useUIStore.getState().addNotification({
      type: 'info',
      message: `+${delta} caps`
    })
  }
}
