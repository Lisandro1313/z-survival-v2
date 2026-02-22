import React, { useState } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { Card } from '../ui/Card';
import './Inventory.css';

interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  weight: number;
  type: 'weapon' | 'armor' | 'consumable' | 'resource' | 'misc' | 'quest';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  equipped?: boolean;
  durability?: number;
  max_durability?: number;
}

export interface InventoryProps {
  onUseItem?: (itemId: string) => void;
  onDropItem?: (itemId: string, quantity: number) => void;
  onEquipItem?: (itemId: string) => void;
  compact?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({
  onUseItem,
  onDropItem,
  onEquipItem,
  compact = false
}) => {
  const inventory = usePlayerStore((state) => state.player.inventory);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items
  const filteredItems = inventory.filter((item: InventoryItem) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate weight
  const totalWeight = inventory.reduce((sum: number, item: InventoryItem) => 
    sum + (item.weight * item.quantity), 0
  );
  const maxWeight = usePlayerStore((state) => state.player.stats.carry_capacity || 100);

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleUseItem = () => {
    if (selectedItem && onUseItem) {
      onUseItem(selectedItem.id);
      setSelectedItem(null);
    }
  };

  const handleEquipItem = () => {
    if (selectedItem && onEquipItem) {
      onEquipItem(selectedItem.id);
      setSelectedItem(null);
    }
  };

  const handleDropItem = () => {
    if (selectedItem && onDropItem) {
      const quantity = prompt(`¿Cuántos ${selectedItem.name} quieres soltar?`, '1');
      if (quantity && parseInt(quantity) > 0) {
        onDropItem(selectedItem.id, parseInt(quantity));
        setSelectedItem(null);
      }
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'var(--legendary, #ff6b00)';
      case 'epic': return 'var(--epic, #a855f7)';
      case 'rare': return 'var(--rare, #3b82f6)';
      case 'uncommon': return 'var(--uncommon, #10b981)';
      default: return 'var(--text-muted)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumable': return '🍎';
      case 'resource': return '📦';
      case 'quest': return '📜';
      default: return '❓';
    }
  };

  if (compact) {
    return (
      <div className="inventory inventory--compact">
        <div className="inventory__grid">
          {filteredItems.slice(0, 12).map((item: InventoryItem) => (
            <div
              key={item.id}
              className={`inventory__slot ${selectedItem?.id === item.id ? 'inventory__slot--selected' : ''}`}
              onClick={() => handleItemClick(item)}
              title={`${item.name} (x${item.quantity})`}
            >
              <span className="inventory__icon">{getTypeIcon(item.type)}</span>
              {item.quantity > 1 && (
                <span className="inventory__quantity">{item.quantity}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="inventory">
      {/* Header */}
      <div className="inventory__header">
        <h3>Inventario</h3>
        <div className="inventory__weight">
          <span className={totalWeight > maxWeight ? 'inventory__weight--overweight' : ''}>
            {totalWeight.toFixed(1)} / {maxWeight} kg
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="inventory__filters">
        <input
          type="text"
          className="inventory__search"
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="inventory__type-filters">
          {['all', 'weapon', 'armor', 'consumable', 'resource', 'quest', 'misc'].map((type) => (
            <button
              key={type}
              className={`inventory__filter-btn ${filterType === type ? 'inventory__filter-btn--active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'all' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      <div className="inventory__content">
        <div className="inventory__grid">
          {filteredItems.map((item: InventoryItem) => (
            <div
              key={item.id}
              className={`inventory__item ${selectedItem?.id === item.id ? 'inventory__item--selected' : ''} ${item.equipped ? 'inventory__item--equipped' : ''}`}
              onClick={() => handleItemClick(item)}
              style={{ borderColor: getRarityColor(item.rarity) }}
            >
              <div className="inventory__item-icon">
                {getTypeIcon(item.type)}
              </div>
              <div className="inventory__item-info">
                <span className="inventory__item-name">{item.name}</span>
                <span className="inventory__item-quantity">x{item.quantity}</span>
              </div>
              {item.durability !== undefined && (
                <div className="inventory__item-durability">
                  <div 
                    className="inventory__durability-bar"
                    style={{ width: `${(item.durability / (item.max_durability || 100)) * 100}%` }}
                  />
                </div>
              )}
              {item.equipped && (
                <span className="inventory__equipped-badge">E</span>
              )}
            </div>
          ))}
        </div>

        {/* Item details panel */}
        {selectedItem && (
          <div className="inventory__details">
            <h4 style={{ color: getRarityColor(selectedItem.rarity) }}>
              {selectedItem.name}
            </h4>
            <p className="inventory__item-type">
              {getTypeIcon(selectedItem.type)} {selectedItem.type}
            </p>
            {selectedItem.description && (
              <p className="inventory__item-description">{selectedItem.description}</p>
            )}
            <div className="inventory__item-stats">
              <div>Cantidad: {selectedItem.quantity}</div>
              <div>Peso: {(selectedItem.weight * selectedItem.quantity).toFixed(1)} kg</div>
              {selectedItem.durability !== undefined && (
                <div>
                  Durabilidad: {selectedItem.durability}/{selectedItem.max_durability}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="inventory__actions">
              {selectedItem.type === 'consumable' && onUseItem && (
                <button className="btn btn--primary btn--sm" onClick={handleUseItem}>
                  Usar
                </button>
              )}
              {(selectedItem.type === 'weapon' || selectedItem.type === 'armor') && onEquipItem && (
                <button className="btn btn--primary btn--sm" onClick={handleEquipItem}>
                  {selectedItem.equipped ? 'Desequipar' : 'Equipar'}
                </button>
              )}
              {onDropItem && (
                <button className="btn btn--danger btn--sm" onClick={handleDropItem}>
                  Soltar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {filteredItems.length === 0 && (
        <div className="inventory__empty">
          <p>No hay items que coincidan con tu búsqueda</p>
        </div>
      )}
    </Card>
  );
};

