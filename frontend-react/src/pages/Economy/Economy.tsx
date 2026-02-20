import React, { useEffect, useState } from 'react';
import { useEconomyStore } from '../../store/economyStore';
import { usePlayerStore } from '../../store/playerStore';
import { useUIStore } from '../../store/uiStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ws } from '../../services/websocket';
import './Economy.css';

export const Economy: React.FC = () => {
  const player = usePlayerStore((state) => state.player);
  const {
    playerCaps,
    shopItems,
    selectedShopItem,
    selectShopItem,
    shopCategory,
    setShopCategory,
    shopSearchQuery,
    setShopSearchQuery,
    getFilteredShopItems,
    cartItems,
    addToCart,
    removeFromCart,
    getCartTotal,
    clearCart,
    canAfford,
    transactions
  } = useEconomyStore();
  const addNotification = useUIStore((state) => state.addNotification);
  
  const [activeTab, setActiveTab] = useState<'shop' | 'market'>('shop');

  useEffect(() => {
    // Request shop data on mount
    ws.send('economy:get_data', {});
    ws.send('market:get_listings', {});
  }, []);

  const filteredShopItems = getFilteredShopItems();
  const cartTotal = getCartTotal();

  const handlePurchase = (itemId: string, quantity: number = 1) => {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    const totalPrice = item.price_caps * quantity;
    
    if (!canAfford(totalPrice)) {
      addNotification({
        message: 'No tienes suficientes caps',
        type: 'error'
      });
      return;
    }

    if (quantity > item.stock) {
      addNotification({
        message: 'Stock insuficiente',
        type: 'warning'
      });
      return;
    }

    ws.send('economy:purchase', {
      item_id: itemId,
      quantity
    });

    addNotification({
      message: `Compraste ${quantity}x ${item.name}`,
      type: 'success'
    });
  };

  const handleAddToCart = (itemId: string) => {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    addToCart(item, 1);
    addNotification({
      message: `${item.name} agregado al carrito`,
      type: 'info'
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    if (!canAfford(cartTotal)) {
      addNotification({
        message: 'No tienes suficientes caps para completar la compra',
        type: 'error'
      });
      return;
    }

    cartItems.forEach(({ item, quantity }) => {
      ws.send('economy:purchase', {
        item_id: item.id,
        quantity
      });
    });

    clearCart();
    addNotification({
      message: `Compra completada: ${cartItems.length} items`,
      type: 'success'
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ff6b00';
      case 'epic': return '#a855f7';
      case 'rare': return '#3b82f6';
      case 'uncommon': return '#10b981';
      default: return 'var(--text-muted)';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weapons': return '⚔️';
      case 'armor': return '🛡️';
      case 'consumables': return '💊';
      case 'resources': return '📦';
      case 'tools': return '🔧';
      case 'ammo': return '🔫';
      default: return '🏪';
    }
  };

  return (
    <div className="economy-page">
      {/* Header */}
      <div className="economy-page__header">
        <h1>💰 Centro Económico</h1>
        <div className="economy-page__balance">
          <Card variant="glass" className="economy-page__balance-card">
            <span className="label">Tus Caps</span>
            <span className="value">{playerCaps} 💰</span>
          </Card>
          <Card variant="glass" className="economy-page__balance-card">
            <span className="label">Nivel de Comercio</span>
            <span className="value">{player.level}</span>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <div className="economy-page__tabs">
        <button
          className={`economy-page__tab ${activeTab === 'shop' ? 'economy-page__tab--active' : ''}`}
          onClick={() => setActiveTab('shop')}
        >
          🏪 Tienda
        </button>
        <button
          className={`economy-page__tab ${activeTab === 'market' ? 'economy-page__tab--active' : ''}`}
          onClick={() => setActiveTab('market')}
        >
          🏛️ Mercado (Próximamente)
        </button>
      </div>

      {/* Content */}
      <div className="economy-page__content">
        {activeTab === 'shop' && (
          <>
            {/* Shop */}
            <div className="economy-page__shop">
              <Card>
                {/* Filters */}
                <div className="economy-page__filters">
                  <input
                    type="text"
                    className="economy-page__search"
                    placeholder="Buscar items..."
                    value={shopSearchQuery}
                    onChange={(e) => setShopSearchQuery(e.target.value)}
                  />
                  <div className="economy-page__categories">
                    {['all', 'weapons', 'armor', 'consumables', 'resources', 'tools', 'ammo'].map((cat) => (
                      <button
                        key={cat}
                        className={`economy-page__category-btn ${shopCategory === cat ? 'economy-page__category-btn--active' : ''}`}
                        onClick={() => setShopCategory(cat)}
                      >
                        {cat === 'all' ? 'Todos' : getCategoryIcon(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items grid */}
                <div className="economy-page__items-grid">
                  {filteredShopItems.map((item) => {
                    const finalPrice = item.discount 
                      ? item.price_caps * (1 - item.discount / 100)
                      : item.price_caps;
                    
                    const canBuy = canAfford(finalPrice) && item.stock > 0;

                    return (
                      <Card
                        key={item.id}
                        variant="default"
                        className={`economy-page__item ${selectedShopItem?.id === item.id ? 'economy-page__item--selected' : ''}`}
                        onClick={() => selectShopItem(item)}
                      >
                        <div className="economy-page__item-header">
                          <span className="economy-page__item-category">
                            {getCategoryIcon(item.category)}
                          </span>
                          {item.discount && (
                            <span className="economy-page__item-discount">
                              -{item.discount}%
                            </span>
                          )}
                        </div>
                        
                        <h4 style={{ color: getRarityColor(item.rarity) }}>
                          {item.name}
                        </h4>
                        
                        <p className="economy-page__item-description">
                          {item.description}
                        </p>

                        <div className="economy-page__item-stock">
                          <ProgressBar
                            current={item.stock}
                            max={item.max_stock}
                            variant={item.stock < item.max_stock * 0.2 ? 'danger' : 'progress'}
                            showValues
                            size="sm"
                            label="Stock"
                          />
                        </div>

                        <div className="economy-page__item-footer">
                          <div className="economy-page__item-price">
                            {item.discount && (
                              <span className="economy-page__item-price-old">
                                {item.price_caps}
                              </span>
                            )}
                            <span className="economy-page__item-price-current">
                              {Math.floor(finalPrice)} 💰
                            </span>
                          </div>
                          
                          <div className="economy-page__item-actions">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(item.id);
                              }}
                              disabled={!canBuy}
                            >
                              🛒
                            </Button>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchase(item.id, 1);
                              }}
                              disabled={!canBuy}
                            >
                              Comprar
                            </Button>
                          </div>
                        </div>

                        {item.level_required > player.level && (
                          <div className="economy-page__item-locked">
                            🔒 Nivel {item.level_required}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>

                {filteredShopItems.length === 0 && (
                  <div className="economy-page__empty">
                    No se encontraron items
                  </div>
                )}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="economy-page__sidebar">
              {/* Cart */}
              <Card className="economy-page__cart">
                <h3>🛒 Carrito ({cartItems.length})</h3>
                
                {cartItems.length > 0 ? (
                  <>
                    <div className="economy-page__cart-items">
                      {cartItems.map(({ item, quantity }) => (
                        <div key={item.id} className="economy-page__cart-item">
                          <div>
                            <div className="economy-page__cart-item-name">
                              {item.name}
                            </div>
                            <div className="economy-page__cart-item-qty">
                              x{quantity}
                            </div>
                          </div>
                          <div className="economy-page__cart-item-right">
                            <div className="economy-page__cart-item-price">
                              {item.price_caps * quantity} 💰
                            </div>
                            <button
                              className="economy-page__cart-item-remove"
                              onClick={() => removeFromCart(item.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="economy-page__cart-total">
                      <span>Total:</span>
                      <span className="value">{Math.floor(cartTotal)} 💰</span>
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleCheckout}
                      disabled={!canAfford(cartTotal)}
                    >
                      Comprar Todo
                    </Button>
                    
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={clearCart}
                      size="sm"
                    >
                      Vaciar Carrito
                    </Button>
                  </>
                ) : (
                  <div className="economy-page__cart-empty">
                    Carrito vacío
                  </div>
                )}
              </Card>

              {/* Recent transactions */}
              <Card className="economy-page__transactions">
                <h3>📜 Transacciones Recientes</h3>
                {transactions.length > 0 ? (
                  <div className="economy-page__transaction-list">
                    {transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="economy-page__transaction">
                        <div>
                          <div className="economy-page__transaction-item">
                            {tx.item_name}
                          </div>
                          <div className="economy-page__transaction-meta">
                            {tx.type} • x{tx.quantity}
                          </div>
                        </div>
                        <div className={`economy-page__transaction-price ${tx.type === 'sale' ? 'economy-page__transaction-price--gain' : ''}`}>
                          {tx.type === 'sale' ? '+' : '-'}{tx.price} 💰
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="economy-page__transactions-empty">
                    Sin transacciones
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
