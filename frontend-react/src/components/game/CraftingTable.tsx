import React, { useEffect } from 'react';
import { useCraftingStore } from '../../store/craftingStore';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import './CraftingTable.css';

export interface CraftingTableProps {
  onCraft?: (recipeId: string) => void;
  onCancel?: (recipeId: string) => void;
  onRush?: (recipeId: string) => void;
}

export const CraftingTable: React.FC<CraftingTableProps> = ({
  onCraft,
  onCancel,
  onRush
}) => {
  const {
    selectedRecipe,
    selectRecipe,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    getFilteredRecipes,
    canCraft,
    currentCrafting,
    craftingQueue
  } = useCraftingStore();

  const filteredRecipes = getFilteredRecipes();

  useEffect(() => {
    // Auto-select first recipe if none selected
    if (!selectedRecipe && filteredRecipes.length > 0) {
      selectRecipe(filteredRecipes[0]);
    }
  }, [filteredRecipes, selectedRecipe, selectRecipe]);

  const handleCraft = () => {
    if (selectedRecipe && onCraft && canCraft(selectedRecipe.id)) {
      onCraft(selectedRecipe.id);
    }
  };

  const handleCancel = (recipeId: string) => {
    if (onCancel) {
      onCancel(recipeId);
    }
  };

  const handleRush = (recipeId: string) => {
    if (onRush) {
      onRush(recipeId);
    }
  };

  const getRarityColor = (category: string) => {
    switch (category) {
      case 'weapon': return '#ef4444';
      case 'armor': return '#3b82f6';
      case 'consumable': return '#10b981';
      case 'ammo': return '#f59e0b';
      case 'building': return '#8b5cf6';
      default: return 'var(--text-muted)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '💊';
      case 'tool': return '🔧';
      case 'building': return '🏗️';
      case 'ammo': return '🔫';
      default: return '📦';
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getRemainingTime = (endsAt: string) => {
    const now = new Date().getTime();
    const end = new Date(endsAt).getTime();
    const remaining = Math.max(0, Math.floor((end - now) / 1000));
    return formatTime(remaining);
  };

  return (
    <div className="crafting-table">
      {/* Current Crafting Status */}
      {(currentCrafting || craftingQueue.length > 0) && (
        <Card variant="glass" className="crafting-table__status">
          <h4>Estado de Crafteo</h4>
          
          {currentCrafting && (
            <div className="crafting-table__current">
              <div className="crafting-table__current-header">
                <span className="crafting-table__current-name">
                  {getCategoryIcon('misc')} {currentCrafting.recipe_name}
                </span>
                <span className="crafting-table__current-time">
                  {getRemainingTime(currentCrafting.ends_at)}
                </span>
              </div>
              <ProgressBar
                current={currentCrafting.progress}
                max={100}
                variant="progress"
                showPercentage
                animated
              />
              <div className="crafting-table__current-actions">
                {currentCrafting.can_rush && (
                  <button
                    className="btn btn--warning btn--sm"
                    onClick={() => handleRush(currentCrafting.recipe_id)}
                  >
                    Acelerar (5 caps)
                  </button>
                )}
                <button
                  className="btn btn--danger btn--sm"
                  onClick={() => handleCancel(currentCrafting.recipe_id)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {craftingQueue.length > 0 && (
            <div className="crafting-table__queue">
              <h5>Cola ({craftingQueue.length})</h5>
              {craftingQueue.slice(0, 3).map((session) => (
                <div key={session.recipe_id} className="crafting-table__queue-item">
                  <span>{session.recipe_name}</span>
                  <button
                    className="btn btn--danger btn--sm"
                    onClick={() => handleCancel(session.recipe_id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {craftingQueue.length > 3 && (
                <div className="crafting-table__queue-more">
                  +{craftingQueue.length - 3} más...
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Main content */}
      <div className="crafting-table__content">
        {/* Recipes list */}
        <div className="crafting-table__recipes">
          <Card>
            <div className="crafting-table__filters">
              <input
                type="text"
                className="crafting-table__search"
                placeholder="Buscar recetas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="crafting-table__categories">
                {['all', 'weapon', 'armor', 'consumable', 'tool', 'building', 'ammo'].map((cat) => (
                  <button
                    key={cat}
                    className={`crafting-table__category-btn ${filterCategory === cat ? 'crafting-table__category-btn--active' : ''}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat === 'all' ? 'Todos' : getCategoryIcon(cat)}
                  </button>
                ))}
              </div>
            </div>

            <div className="crafting-table__recipe-list">
              {filteredRecipes.map((recipe) => {
                const craftable = canCraft(recipe.id);
                const isSelected = selectedRecipe?.id === recipe.id;

                return (
                  <div
                    key={recipe.id}
                    className={`crafting-table__recipe-item ${isSelected ? 'crafting-table__recipe-item--selected' : ''} ${!craftable ? 'crafting-table__recipe-item--disabled' : ''}`}
                    onClick={() => selectRecipe(recipe)}
                  >
                    <span className="crafting-table__recipe-icon">
                      {getCategoryIcon(recipe.category)}
                    </span>
                    <div className="crafting-table__recipe-info">
                      <span 
                        className="crafting-table__recipe-name"
                        style={{ color: getRarityColor(recipe.category) }}
                      >
                        {recipe.name}
                      </span>
                      <span className="crafting-table__recipe-level">
                        Nivel {recipe.level_required}
                      </span>
                    </div>
                    {!craftable && (
                      <span className="crafting-table__recipe-status">🚫</span>
                    )}
                  </div>
                );
              })}

              {filteredRecipes.length === 0 && (
                <div className="crafting-table__empty">
                  No hay recetas disponibles
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recipe details */}
        {selectedRecipe && (
          <Card className="crafting-table__details">
            <h3 style={{ color: getRarityColor(selectedRecipe.category) }}>
              {getCategoryIcon(selectedRecipe.category)} {selectedRecipe.name}
            </h3>
            <p className="crafting-table__description">
              {selectedRecipe.description}
            </p>

            <div className="crafting-table__info">
              <div className="crafting-table__info-item">
                <span className="label">Categoría:</span>
                <span className="value">{selectedRecipe.category}</span>
              </div>
              <div className="crafting-table__info-item">
                <span className="label">Nivel requerido:</span>
                <span className="value">{selectedRecipe.level_required}</span>
              </div>
              <div className="crafting-table__info-item">
                <span className="label">Tiempo:</span>
                <span className="value">{formatTime(selectedRecipe.crafting_time)}</span>
              </div>
              <div className="crafting-table__info-item">
                <span className="label">XP:</span>
                <span className="value">+{selectedRecipe.xp_reward} XP</span>
              </div>
            </div>

            <div className="crafting-table__ingredients">
              <h4>Ingredientes</h4>
              {selectedRecipe.ingredients.map((ing) => {
                const hasEnough = ing.quantity_available >= ing.quantity_required;
                return (
                  <div 
                    key={ing.item_id} 
                    className={`crafting-table__ingredient ${!hasEnough ? 'crafting-table__ingredient--missing' : ''}`}
                  >
                    <span className="crafting-table__ingredient-name">
                      {ing.item_name}
                    </span>
                    <span className={`crafting-table__ingredient-qty ${!hasEnough ? 'crafting-table__ingredient-qty--missing' : ''}`}>
                      {ing.quantity_available} / {ing.quantity_required}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="crafting-table__result">
              <h4>Resultado</h4>
              <div className="crafting-table__result-item">
                📦 {selectedRecipe.result_quantity}x {selectedRecipe.name}
              </div>
            </div>

            <button
              className="btn btn--primary btn--lg"
              onClick={handleCraft}
              disabled={!canCraft(selectedRecipe.id)}
            >
              {canCraft(selectedRecipe.id) ? 'Craftear' : 'Ingredientes insuficientes'}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
};

