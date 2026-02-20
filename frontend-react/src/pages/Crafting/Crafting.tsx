import React, { useEffect } from 'react';
import { useCraftingStore } from '../../store/craftingStore';
import { usePlayerStore } from '../../store/playerStore';
import { CraftingTable } from '../../components/game/CraftingTable';
import { Inventory } from '../../components/game/Inventory';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useUIStore } from '../../store/uiStore';
import { ws } from '../../services/websocket';
import './Crafting.css';

export const Crafting: React.FC = () => {
  const player = usePlayerStore((state) => state.player);
  const { recipes, currentCrafting, unlockedRecipes, lockedRecipes } = useCraftingStore();
  const addNotification = useUIStore((state) => state.addNotification);

  useEffect(() => {
    // Request crafting data on mount
    ws.send('crafting:get_recipes', {});
  }, []);

  const handleCraft = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // Check level requirement
    if (player.level < recipe.level_required) {
      addNotification({
        message: `Necesitas nivel ${recipe.level_required} para craftear esto`,
        type: 'warning'
      });
      return;
    }

    ws.send('crafting:craft', { recipe_id: recipeId });
    addNotification({
      message: `Crafteando ${recipe.name}...`,
      type: 'info'
    });
  };

  const handleCancelCrafting = (recipeId: string) => {
    ws.send('crafting:cancel', { recipe_id: recipeId });
    addNotification({
      message: 'Crafteo cancelado',
      type: 'warning'
    });
  };

  const handleRushCrafting = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    if (player.caps < 5) {
      addNotification({
        message: 'No tienes suficientes caps para acelerar',
        type: 'error'
      });
      return;
    }

    ws.send('crafting:rush', { recipe_id: recipeId });
  };

  const handleUseItem = (itemId: string) => {
    ws.send('player:use_item', { item_id: itemId });
  };

  const handleDropItem = (itemId: string, quantity: number) => {
    ws.send('player:drop_item', { item_id: itemId, quantity });
    addNotification({
      message: 'Item descartado',
      type: 'info'
    });
  };

  const handleEquipItem = (itemId: string) => {
    ws.send('player:equip', { item_id: itemId });
  };

  return (
    <div className="crafting-page">
      {/* Header */}
      <div className="crafting-page__header">
        <h1>Mesa de Crafteo</h1>
        <div className="crafting-page__stats">
          <Card variant="glass" className="crafting-page__stat">
            <span className="label">Nivel de Crafteo</span>
            <span className="value">{player.level}</span>
          </Card>
          <Card variant="glass" className="crafting-page__stat">
            <span className="label">Recetas Desbloqueadas</span>
            <span className="value">{unlockedRecipes.length}</span>
          </Card>
          <Card variant="glass" className="crafting-page__stat">
            <span className="label">Recetas Bloqueadas</span>
            <span className="value">{lockedRecipes.length}</span>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div className="crafting-page__content">
        {/* Crafting Table */}
        <div className="crafting-page__table">
          <CraftingTable
            onCraft={handleCraft}
            onCancel={handleCancelCrafting}
            onRush={handleRushCrafting}
          />
        </div>

        {/* Sidebar */}
        <div className="crafting-page__sidebar">
          {/* Player info */}
          <Card className="crafting-page__player-info">
            <h3>{player.nickname}</h3>
            <div className="crafting-page__player-stats">
              <ProgressBar
                label="Nivel"
                current={player.xp}
                max={player.xp_next_level}
                variant="xp"
                showValues
                size="sm"
              />
              <div className="crafting-page__caps">
                <span className="label">Caps:</span>
                <span className="value">{player.caps} 💰</span>
              </div>
            </div>
          </Card>

          {/* Quick tips */}
          <Card className="crafting-page__tips">
            <h4>💡 Consejos</h4>
            <ul>
              <li>Las recetas se desbloquean al subir de nivel</li>
              <li>Puedes acelerar el crafteo por 5 caps</li>
              <li>El crafteo te da experiencia</li>
              <li>Algunas recetas requieren estaciones especiales</li>
            </ul>
          </Card>

          {/* Compact inventory */}
          <div className="crafting-page__quick-inventory">
            <h4>Inventario Rápido</h4>
            <Inventory
              compact
              onUseItem={handleUseItem}
              onDropItem={handleDropItem}
              onEquipItem={handleEquipItem}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
