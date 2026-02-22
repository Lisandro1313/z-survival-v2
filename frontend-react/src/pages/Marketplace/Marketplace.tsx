import React, { useState, useEffect } from 'react'
import { usePlayerStore } from '../../store/playerStore'
import { ws } from '../../services/websocket'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import './Marketplace.css'

interface Listing {
  id: string
  sellerId: string
  sellerName: string
  itemId: string
  itemName: string
  itemType: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  rarity?: string
  description?: string
  postedAt: number
  expiresAt?: number
}

interface Auction {
  id: string
  sellerId: string
  sellerName: string
  itemId: string
  itemName: string
  itemType: string
  quantity: number
  startingBid: number
  currentBid: number
  highestBidder?: string
  highestBidderName?: string
  bids: number
  endsAt: number
  status: 'active' | 'ended' | 'sold'
}

export const Marketplace: React.FC = () => {
  const player = usePlayerStore((state) => state.player)
  const inventory = usePlayerStore((state) => state.inventory)
  const [activeTab, setActiveTab] = useState<'buy' | 'auctions' | 'myListings'>('buy')
  const [listings, setListings] = useState<Listing[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myAuctions, setMyAuctions] = useState<Auction[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAuctionModal, setShowAuctionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [listingPrice, setListingPrice] = useState('')
  const [listingQuantity, setListingQuantity] = useState(1)
  const [auctionStartPrice, setAuctionStartPrice] = useState('')
  const [auctionDuration, setAuctionDuration] = useState(24)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'weapons' | 'armor' | 'consumables' | 'resources'>('all')

  useEffect(() => {
    ws.send('market:get_listings')
    ws.send('market:get_auctions')
    ws.send('market:get_my_listings')
    
    const interval = setInterval(() => {
      if (activeTab === 'buy') {
        ws.send('market:get_listings')
      } else if (activeTab === 'auctions') {
        ws.send('market:get_auctions')
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [activeTab])

  const handleBuyItem = (listingId: string, price: number) => {
    if (window.confirm(`¿Comprar este item por ${price} caps?`)) {
      ws.send('market:buy', { listingId })
    }
  }

  const handlePlaceBid = (auctionId: string) => {
    const auction = auctions.find(a => a.id === auctionId)
    if (!auction) return

    const minBid = auction.currentBid > 0 ? auction.currentBid + 10 : auction.startingBid
    const bidAmount = prompt(`Ingresa tu oferta (mínimo ${minBid} caps):`)
    
    if (bidAmount && parseInt(bidAmount) >= minBid) {
      ws.send('market:bid', { 
        auctionId, 
        amount: parseInt(bidAmount) 
      })
    }
  }

  const handleCreateListing = () => {
    if (selectedItem && listingPrice && listingQuantity > 0) {
      ws.send('market:create_listing', {
        itemId: selectedItem.id,
        quantity: listingQuantity,
        pricePerUnit: parseInt(listingPrice)
      })
      setShowCreateModal(false)
      resetForm()
    }
  }

  const handleCreateAuction = () => {
    if (selectedItem && auctionStartPrice && auctionDuration > 0) {
      ws.send('market:create_auction', {
        itemId: selectedItem.id,
        quantity: listingQuantity,
        startingBid: parseInt(auctionStartPrice),
        duration: auctionDuration
      })
      setShowAuctionModal(false)
      resetForm()
    }
  }

  const handleCancelListing = (listingId: string) => {
    if (window.confirm('¿Cancelar esta venta?')) {
      ws.send('market:cancel_listing', { listingId })
    }
  }

  const resetForm = () => {
    setSelectedItem(null)
    setListingPrice('')
    setListingQuantity(1)
    setAuctionStartPrice('')
    setAuctionDuration(24)
  }

  const getRarityColor = (rarity?: string) => {
    const colors: Record<string, string> = {
      common: '#9ca3af',
      uncommon: '#22c55e',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#fbbf24'
    }
    return colors[rarity || 'common'] || '#9ca3af'
  }

  const filteredListings = listings.filter(l => {
    const matchesSearch = l.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || l.itemType === filter
    return matchesSearch && matchesFilter
  })

  const filteredAuctions = auctions.filter(a => {
    const matchesSearch = a.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || a.itemType === filter
    return matchesSearch && matchesFilter
  })

  const getTimeRemaining = (timestamp: number) => {
    const diff = timestamp - Date.now()
    if (diff <= 0) return 'Expirado'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      return `${Math.floor(hours / 24)}d ${hours % 24}h`
    }
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="marketplace-page">
      {/* Header */}
      <div className="marketplace-header">
        <h1>🏪 Marketplace</h1>
        <div className="player-caps">
          💰 {player?.caps || 0} caps
        </div>
      </div>

      {/* Tabs */}
      <div className="marketplace-tabs">
        <button 
          className={activeTab === 'buy' ? 'active' : ''}
          onClick={() => setActiveTab('buy')}
        >
          🛒 Comprar
        </button>
        <button 
          className={activeTab === 'auctions' ? 'active' : ''}
          onClick={() => setActiveTab('auctions')}
        >
          🔨 Subastas
        </button>
        <button 
          className={activeTab === 'myListings' ? 'active' : ''}
          onClick={() => setActiveTab('myListings')}
        >
          📦 Mis Ventas
        </button>
      </div>

      {/* Filters and Search */}
      {(activeTab === 'buy' || activeTab === 'auctions') && (
        <div className="marketplace-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar items..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Todo
            </button>
            <button 
              className={filter === 'weapons' ? 'active' : ''}
              onClick={() => setFilter('weapons')}
            >
              ⚔️ Armas
            </button>
            <button 
              className={filter === 'armor' ? 'active' : ''}
              onClick={() => setFilter('armor')}
            >
              🛡️ Armadura
            </button>
            <button 
              className={filter === 'consumables' ? 'active' : ''}
              onClick={() => setFilter('consumables')}
            >
              💊 Consumibles
            </button>
            <button 
              className={filter === 'resources' ? 'active' : ''}
              onClick={() => setFilter('resources')}
            >
              📦 Recursos
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="marketplace-content">
        {/* Buy Tab */}
        {activeTab === 'buy' && (
          <div className="listings-grid">
            {filteredListings.length === 0 ? (
              <Card>
                <p className="no-items">No hay items en venta en este momento.</p>
              </Card>
            ) : (
              filteredListings.map(listing => (
                <Card key={listing.id} className="listing-card">
                  <div className="listing-header">
                    <h3 style={{ color: getRarityColor(listing.rarity) }}>
                      {listing.itemName}
                    </h3>
                    {listing.rarity && (
                      <span 
                        className="rarity-badge"
                        style={{ backgroundColor: getRarityColor(listing.rarity) }}
                      >
                        {listing.rarity}
                      </span>
                    )}
                  </div>

                  <div className="listing-info">
                    <p className="seller">Vendedor: {listing.sellerName}</p>
                    <p className="quantity">Cantidad: {listing.quantity}</p>
                    {listing.description && (
                      <p className="description">{listing.description}</p>
                    )}
                  </div>

                  <div className="listing-price">
                    <div className="price-info">
                      <span className="label">Precio unitario:</span>
                      <span className="value">💰 {listing.pricePerUnit} caps</span>
                    </div>
                    <div className="price-info total">
                      <span className="label">Total:</span>
                      <span className="value">💰 {listing.totalPrice} caps</span>
                    </div>
                  </div>

                  {listing.expiresAt && (
                    <div className="listing-expires">
                      ⏱️ Expira en: {getTimeRemaining(listing.expiresAt)}
                    </div>
                  )}

                  <Button 
                    onClick={() => handleBuyItem(listing.id, listing.totalPrice)}
                    disabled={listing.sellerId === player?.id || (player?.caps || 0) < listing.totalPrice}
                  >
                    {listing.sellerId === player?.id ? 'Tu listing' : 'Comprar'}
                  </Button>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === 'auctions' && (
          <div className="auctions-grid">
            {filteredAuctions.length === 0 ? (
              <Card>
                <p className="no-items">No hay subastas activas en este momento.</p>
              </Card>
            ) : (
              filteredAuctions.map(auction => (
                <Card key={auction.id} className="auction-card">
                  <div className="auction-header">
                    <h3>{auction.itemName}</h3>
                    <span className={`status-badge ${auction.status}`}>
                      {auction.status}
                    </span>
                  </div>

                  <div className="auction-info">
                    <p className="seller">Vendedor: {auction.sellerName}</p>
                    <p className="quantity">Cantidad: {auction.quantity}</p>
                    <p className="bids">Ofertas: {auction.bids}</p>
                  </div>

                  <div className="auction-pricing">
                    <div className="price-row">
                      <span>Precio inicial:</span>
                      <span>💰 {auction.startingBid} caps</span>
                    </div>
                    <div className="price-row current">
                      <span>Oferta actual:</span>
                      <span>💰 {auction.currentBid || auction.startingBid} caps</span>
                    </div>
                    {auction.highestBidderName && (
                      <div className="highest-bidder">
                        Mejor oferta: {auction.highestBidderName}
                      </div>
                    )}
                  </div>

                  <div className="auction-time">
                    ⏱️ Termina en: {getTimeRemaining(auction.endsAt)}
                  </div>

                  <Button 
                    onClick={() => handlePlaceBid(auction.id)}
                    disabled={
                      auction.status !== 'active' || 
                      auction.sellerId === player?.id ||
                      auction.highestBidder === player?.id
                    }
                  >
                    {auction.highestBidder === player?.id ? 'Eres el mejor postor' : 'Ofertar'}
                  </Button>
                </Card>
              ))
            )}
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'myListings' && (
          <div className="my-listings-section">
            <div className="section-header">
              <h2>Mis Ventas</h2>
              <div className="create-buttons">
                <Button onClick={() => setShowCreateModal(true)}>
                  ➕ Vender Item
                </Button>
                <Button onClick={() => setShowAuctionModal(true)}>
                  🔨 Crear Subasta
                </Button>
              </div>
            </div>

            <div className="my-listings-grid">
              <div className="my-listings-column">
                <h3>Ventas Directas</h3>
                {myListings.length === 0 ? (
                  <Card>
                    <p className="no-items">No tienes ventas activas.</p>
                  </Card>
                ) : (
                  myListings.map(listing => (
                    <Card key={listing.id} className="my-listing-card">
                      <div className="my-listing-info">
                        <h4>{listing.itemName}</h4>
                        <p>Cantidad: {listing.quantity}</p>
                        <p>Precio: 💰 {listing.totalPrice} caps</p>
                        {listing.expiresAt && (
                          <p className="expires">Expira: {getTimeRemaining(listing.expiresAt)}</p>
                        )}
                      </div>
                      <Button 
                        onClick={() => handleCancelListing(listing.id)}
                        variant="danger"
                        size="small"
                      >
                        Cancelar
                      </Button>
                    </Card>
                  ))
                )}
              </div>

              <div className="my-auctions-column">
                <h3>Mis Subastas</h3>
                {myAuctions.length === 0 ? (
                  <Card>
                    <p className="no-items">No tienes subastas activas.</p>
                  </Card>
                ) : (
                  myAuctions.map(auction => (
                    <Card key={auction.id} className="my-auction-card">
                      <div className="my-auction-info">
                        <h4>{auction.itemName}</h4>
                        <p>Cantidad: {auction.quantity}</p>
                        <p>Precio inicial: 💰 {auction.startingBid} caps</p>
                        <p>Oferta actual: 💰 {auction.currentBid || 0} caps</p>
                        <p>Ofertas: {auction.bids}</p>
                        <p className="expires">Termina: {getTimeRemaining(auction.endsAt)}</p>
                      </div>
                      <span className={`status ${auction.status}`}>
                        {auction.status}
                      </span>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Vender Item</h2>
            
            <div className="form-group">
              <label>Selecciona un item:</label>
              <select 
                value={selectedItem?.id || ''}
                onChange={e => {
                  const item = inventory.find(i => i.id === e.target.value)
                  setSelectedItem(item)
                  setListingQuantity(1)
                }}
              >
                <option value="">-- Selecciona --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (x{item.quantity})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <>
                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={listingQuantity}
                    onChange={e => setListingQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.quantity))}
                  />
                </div>

                <div className="form-group">
                  <label>Precio por unidad (caps):</label>
                  <input
                    type="number"
                    min="1"
                    value={listingPrice}
                    onChange={e => setListingPrice(e.target.value)}
                    placeholder="100"
                  />
                </div>

                {listingPrice && (
                  <div className="total-preview">
                    <strong>Total:</strong> 💰 {parseInt(listingPrice) * listingQuantity} caps
                  </div>
                )}

                <div className="form-info">
                  <p>📝 La venta expirará en 7 días.</p>
                  <p>💸 Comisión del 5% al venderse.</p>
                </div>
              </>
            )}

            <div className="form-actions">
              <Button 
                onClick={handleCreateListing}
                disabled={!selectedItem || !listingPrice || listingQuantity < 1}
              >
                Publicar Venta
              </Button>
              <Button onClick={() => setShowCreateModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Auction Modal */}
      {showAuctionModal && (
        <div className="modal-overlay" onClick={() => setShowAuctionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Crear Subasta</h2>
            
            <div className="form-group">
              <label>Selecciona un item:</label>
              <select 
                value={selectedItem?.id || ''}
                onChange={e => {
                  const item = inventory.find(i => i.id === e.target.value)
                  setSelectedItem(item)
                  setListingQuantity(1)
                }}
              >
                <option value="">-- Selecciona --</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} (x{item.quantity})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <>
                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={listingQuantity}
                    onChange={e => setListingQuantity(Math.min(parseInt(e.target.value) || 1, selectedItem.quantity))}
                  />
                </div>

                <div className="form-group">
                  <label>Precio inicial (caps):</label>
                  <input
                    type="number"
                    min="1"
                    value={auctionStartPrice}
                    onChange={e => setAuctionStartPrice(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div className="form-group">
                  <label>Duración (horas):</label>
                  <select 
                    value={auctionDuration}
                    onChange={e => setAuctionDuration(parseInt(e.target.value))}
                  >
                    <option value="6">6 horas</option>
                    <option value="12">12 horas</option>
                    <option value="24">24 horas</option>
                    <option value="48">48 horas</option>
                    <option value="72">72 horas</option>
                  </select>
                </div>

                <div className="form-info">
                  <p>🔨 Las ofertas incrementan en mínimo 10 caps.</p>
                  <p>💸 Comisión del 10% al venderse.</p>
                </div>
              </>
            )}

            <div className="form-actions">
              <Button 
                onClick={handleCreateAuction}
                disabled={!selectedItem || !auctionStartPrice || listingQuantity < 1}
              >
                Crear Subasta
              </Button>
              <Button onClick={() => setShowAuctionModal(false)} variant="danger">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


