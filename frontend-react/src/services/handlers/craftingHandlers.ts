import { usePlayerStore } from '../../store/playerStore'
import { useUIStore } from '../../store/uiStore'
import { useCraftingStore } from '../../store/craftingStore'

export function onCraftingRecipes(payload: any) {
  const { recipes } = payload
  if (recipes && Array.isArray(recipes)) {
    useCraftingStore.getState().setRecipes(recipes)
  }
  console.log('[Crafting] Recipes loaded:', recipes?.length)
}

export function onCraftingSuccess(payload: any) {
  const { recipe_id, item, quantity } = payload
  usePlayerStore.getState().addItem(item, quantity || 1)
  useCraftingStore.getState().completeCrafting(recipe_id)
  useUIStore.getState().addNotification({
    id: Date.now().toString(),
    type: 'success',
    message: `Crafteaste: ${item.name} x${quantity || 1}`
  })
}

export function onCraftingFailed(payload: any) {
  const { recipe_id, reason } = payload
  if (recipe_id) {
    useCraftingStore.getState().cancelCrafting(recipe_id)
  }
  useUIStore.getState().addNotification({
    id: Date.now().toString(),
    type: 'error',
    message: `Crafteo fallido: ${reason || 'Error desconocido'}`
  })
}
