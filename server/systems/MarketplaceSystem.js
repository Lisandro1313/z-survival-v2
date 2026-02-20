/**
 * SISTEMA DE MERCADO/AUCTION HOUSE  
 * Permite a los jugadores publicar ofertas de venta al público
 */

export default class MarketplaceSystem {
    constructor(economySystem) {
        this.economy = economySystem;
        this.listings = new Map(); // listingId -> listing data
        this.playerListings = new Map(); // playerId -> Set<listingId>
        this.nextListingId = 1;
        this.maxListingsPerPlayer = 10;
        this.listingDuration = 86400000; // 24 horas en milisegundos
    }

    /**
     * Publicar un item en el mercado
     */
    createListing(seller, itemKey, quantity, price, type = 'sell') {
        // Validaciones
        if (!seller || !seller.id) {
            return {
                success: false,
                error: 'Vendedor inválido'
            };
        }

        if (quantity <= 0) {
            return {
                success: false,
                error: 'Cantidad inválida'
            };
        }

        if (price <= 0) {
            return {
                success: false,
                error: 'Precio inválido'
            };
        }

        // Verificar que tiene el item
        if (!seller.inventario[itemKey] || seller.inventario[itemKey] < quantity) {
            return {
                success: false,
                error: 'No tienes suficientes items'
            };
        }

        // Verificar límite de listings
        const playerListings = this.playerListings.get(seller.id) || new Set();
        if (playerListings.size >= this.maxListingsPerPlayer) {
            return {
                success: false,
                error: `Máximo ${this.maxListingsPerPlayer} publicaciones activas`
            };
        }

        // Remover item del inventario (en escrow)
        seller.inventario[itemKey] -= quantity;
        if (seller.inventario[itemKey] <= 0) {
            delete seller.inventario[itemKey];
        }

        // Crear listing
        const listingId = `listing_${this.nextListingId++}_${Date.now()}`;

        const listing = {
            id: listingId,
            sellerId: seller.id,
            sellerName: seller.nombre,
            itemKey,
            quantity,
            price,
            pricePerUnit: Math.floor(price / quantity),
            type, // 'sell' o 'auction'
            status: 'active', // active, sold, cancelled, expired
            createdAt: Date.now(),
            expiresAt: Date.now() + this.listingDuration,
            views: 0,

            // Para subastas
            bids: [],
            currentBid: type === 'auction' ? price : null, // precio inicial
            minBidIncrement: type === 'auction' ? Math.max(Math.floor(price * 0.05), 1) : null
        };

        this.listings.set(listingId, listing);

        // Indexar por jugador
        if (!this.playerListings.has(seller.id)) {
            this.playerListings.set(seller.id, new Set());
        }
        this.playerListings.get(seller.id).add(listingId);

        console.log(`🏪 Nueva publicación: ${seller.nombre} vende ${itemKey} x${quantity} por ${price} caps`);

        return {
            success: true,
            listing,
            message: 'Item publicado en el mercado'
        };
    }

    /**
     * Comprar un item del mercado (compra instantánea)
     */
    buyListing(buyer, listingId) {
        const listing = this.listings.get(listingId);

        if (!listing) {
            return {
                success: false,
                error: 'Publicación no encontrada'
            };
        }

        if (listing.status !== 'active') {
            return {
                success: false,
                error: 'Esta publicación ya no está disponible'
            };
        }

        if (listing.type === 'auction') {
            return {
                success: false,
                error: 'No puedes comprar una subasta directamente. Debes hacer una oferta.'
            };
        }

        if (listing.sellerId === buyer.id) {
            return {
                success: false,
                error: 'No puedes comprar tu propia publicación'
            };
        }

        // Calcular precio con impuesto
        const tax = this.economy.calculateMarketplaceTax(listing.price);
        const totalCost = listing.price + tax;

        // Verificar fondos
        if (!buyer.currency || buyer.currency < totalCost) {
            return {
                success: false,
                error: `Necesitas ${totalCost} caps (${listing.price} + ${tax} impuesto)`,
                needed: totalCost,
                current: buyer.currency || 0
            };
        }

        // Ejecutar transacción
        try {
            // Quitar moneda al comprador
            buyer.currency -= totalCost;

            // Dar item al comprador
            if (!buyer.inventario[listing.itemKey]) buyer.inventario[listing.itemKey] = 0;
            buyer.inventario[listing.itemKey] += listing.quantity;

            // Dar moneda al vendedor (sin impuesto)
            // Nota: el vendedor puede estar offline, guardar para próxima conexión
            const sellerId = listing.sellerId;
            if (!this.pendingPayments) this.pendingPayments = new Map();
            if (!this.pendingPayments.has(sellerId)) {
                this.pendingPayments.set(sellerId, 0);
            }
            this.pendingPayments.set(sellerId, this.pendingPayments.get(sellerId) + listing.price);

            // Marcar como vendido
            listing.status = 'sold';
            listing.soldAt = Date.now();
            listing.buyerId = buyer.id;
            listing.buyerName = buyer.nombre;

            // Remover de listings activos
            const sellerListings = this.playerListings.get(sellerId);
            if (sellerListings) {
                sellerListings.delete(listingId);
            }

            // Estadísticas
            if (!buyer.stats.market_purchases) buyer.stats.market_purchases = 0;
            buyer.stats.market_purchases++;

            console.log(`💰 Venta completada: ${buyer.nombre} compró ${listing.itemKey} x${listing.quantity} por ${listing.price} caps`);

            return {
                success: true,
                listing,
                totalCost,
                tax,
                message: `Compraste ${listing.itemKey} x${listing.quantity}`
            };

        } catch (error) {
            console.error('Error al procesar compra:', error);
            return {
                success: false,
                error: 'Error al procesar la compra'
            };
        }
    }

    /**
     * Hacer una oferta en una subasta
     */
    placeBid(bidder, listingId, bidAmount) {
        const listing = this.listings.get(listingId);

        if (!listing) {
            return {
                success: false,
                error: 'Subasta no encontrada'
            };
        }

        if (listing.status !== 'active') {
            return {
                success: false,
                error: 'Esta subasta ya no está activa'
            };
        }

        if (listing.type !== 'auction') {
            return {
                success: false,
                error: 'Esto no es una subasta'
            };
        }

        if (listing.sellerId === bidder.id) {
            return {
                success: false,
                error: 'No puedes ofertar en tu propia subasta'
            };
        }

        // Validar que la oferta sea suficiente
        const minBid = listing.currentBid + listing.minBidIncrement;
        if (bidAmount < minBid) {
            return {
                success: false,
                error: `La oferta mínima es ${minBid} caps`
            };
        }

        // Verificar fondos
        if (!bidder.currency || bidder.currency < bidAmount) {
            return {
                success: false,
                error: 'No tienes suficiente moneda'
            };
        }

        // Si ya había ofertado, devolver oferta anterior
        const previousBid = listing.bids.find(b => b.bidderId === bidder.id);
        if (previousBid) {
            bidder.currency += previousBid.amount; // Devolver oferta anterior
        }

        // Registrar nueva oferta
        const bid = {
            bidderId: bidder.id,
            bidderName: bidder.nombre,
            amount: bidAmount,
            timestamp: Date.now()
        };

        // Devolver oferta al anterior mejor postor
        if (listing.bids.length > 0) {
            const previousBest = listing.bids[listing.bids.length - 1];
            if (previousBest.bidderId !== bidder.id) {
                // Guardar para devolución cuando el jugador se conecte
                if (!this.pendingRefunds) this.pendingRefunds = new Map();
                if (!this.pendingRefunds.has(previousBest.bidderId)) {
                    this.pendingRefunds.set(previousBest.bidderId, 0);
                }
                this.pendingRefunds.set(previousBest.bidderId,
                    this.pendingRefunds.get(previousBest.bidderId) + previousBest.amount);
            }
        }

        // Bloquear moneda del nuevo postor
        bidder.currency -= bidAmount;

        // Agregar oferta
        listing.bids.push(bid);
        listing.currentBid = bidAmount;

        console.log(`🔨 Nueva oferta: ${bidder.nombre} ofreció ${bidAmount} caps en ${listing.itemKey}`);

        return {
            success: true,
            bid,
            currentBid: listing.currentBid,
            message: `Oferta de ${bidAmount} caps registrada`
        };
    }

    /**
     * Cancelar una publicación (si no se ha vendido)
     */
    cancelListing(playerId, listingId) {
        const listing = this.listings.get(listingId);

        if (!listing) {
            return {
                success: false,
                error: 'Publicación no encontrada'
            };
        }

        if (listing.sellerId !== playerId) {
            return {
                success: false,
                error: 'No eres el dueño de esta publicación'
            };
        }

        if (listing.status !== 'active') {
            return {
                success: false,
                error: 'Esta publicación ya no está activa'
            };
        }

        // Si es subasta y tiene ofertas, no se puede cancelar
        if (listing.type === 'auction' && listing.bids.length > 0) {
            return {
                success: false,
                error: 'No puedes cancelar una subasta con ofertas'
            };
        }

        // Devolver item al vendedor (necesita acceso al objeto player)
        // Se manejará en el handler del servidor

        listing.status = 'cancelled';
        listing.cancelledAt = Date.now();

        // Remover de listings activos
        const sellerListings = this.playerListings.get(playerId);
        if (sellerListings) {
            sellerListings.delete(listingId);
        }

        console.log(`❌ Publicación cancelada: ${listingId}`);

        return {
            success: true,
            listing,
            message: 'Publicación cancelada'
        };
    }

    /**
     * Buscar listings en el mercado
     */
    searchListings(filters = {}) {
        const {
            itemKey = null,
            minPrice = null,
            maxPrice = null,
            seller = null,
            type = null, // 'sell' o 'auction'
            sortBy = 'newest', // 'newest', 'oldest', 'price_low', 'price_high'
            limit = 50
        } = filters;

        let results = [];

        // Filtrar listings activos
        for (const listing of this.listings.values()) {
            if (listing.status !== 'active') continue;
            if (listing.expiresAt < Date.now()) {
                this.expireListing(listing.id);
                continue;
            }

            // Aplicar filtros
            if (itemKey && listing.itemKey !== itemKey) continue;
            if (minPrice && listing.price < minPrice) continue;
            if (maxPrice && listing.price > maxPrice) continue;
            if (seller && listing.sellerName.toLowerCase().indexOf(seller.toLowerCase()) === -1) continue;
            if (type && listing.type !== type) continue;

            results.push(listing);
        }

        // Ordenar
        switch (sortBy) {
            case 'newest':
                results.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'oldest':
                results.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'price_low':
                results.sort((a, b) => a.pricePerUnit - b.pricePerUnit);
                break;
            case 'price_high':
                results.sort((a, b) => b.pricePerUnit - a.pricePerUnit);
                break;
        }

        // Limitar resultados
        results = results.slice(0, limit);

        return {
            success: true,
            listings: results,
            total: results.length
        };
    }

    /**
     * Obtener publicaciones de un jugador
     */
    getPlayerListings(playerId) {
        const listingIds = this.playerListings.get(playerId) || new Set();
        const listings = [];

        for (const listingId of listingIds) {
            const listing = this.listings.get(listingId);
            if (listing && listing.status === 'active') {
                listings.push(listing);
            }
        }

        return {
            success: true,
            listings,
            total: listings.length
        };
    }

    /**
     * Expirar una publicación
     */
    expireListing(listingId) {
        const listing = this.listings.get(listingId);

        if (!listing || listing.status !== 'active') return;

        listing.status = 'expired';
        listing.expiredAt = Date.now();

        // Si es subasta con ofertas, vender al mejor postor
        if (listing.type === 'auction' && listing.bids.length > 0) {
            const winningBid = listing.bids[listing.bids.length - 1];

            // Dar moneda al vendedor
            if (!this.pendingPayments) this.pendingPayments = new Map();
            if (!this.pendingPayments.has(listing.sellerId)) {
                this.pendingPayments.set(listing.sellerId, 0);
            }

            const tax = this.economy.calculateMarketplaceTax(winningBid.amount);
            const sellerProceeds = winningBid.amount - tax;
            this.pendingPayments.set(listing.sellerId,
                this.pendingPayments.get(listing.sellerId) + sellerProceeds);

            // El item se entregará al ganador cuando se conecte
            if (!this.pendingItems) this.pendingItems = new Map();
            if (!this.pendingItems.has(winningBid.bidderId)) {
                this.pendingItems.set(winningBid.bidderId, []);
            }
            this.pendingItems.get(winningBid.bidderId).push({
                itemKey: listing.itemKey,
                quantity: listing.quantity,
                source: 'auction_win',
                listingId
            });

            listing.status = 'sold';
            listing.soldAt = Date.now();
            listing.buyerId = winningBid.bidderId;

            console.log(`🏆 Subasta ganada: ${winningBid.bidderName} ganó ${listing.itemKey} x${listing.quantity} por ${winningBid.amount} caps`);
        } else {
            // Sin ofertas, devolver item al vendedor
            if (!this.pendingItems) this.pendingItems = new Map();
            if (!this.pendingItems.has(listing.sellerId)) {
                this.pendingItems.set(listing.sellerId, []);
            }
            this.pendingItems.get(listing.sellerId).push({
                itemKey: listing.itemKey,
                quantity: listing.quantity,
                source: 'listing_expired',
                listingId
            });
        }

        // Remover de listings activos
        const sellerListings = this.playerListings.get(listing.sellerId);
        if (sellerListings) {
            sellerListings.delete(listingId);
        }

        console.log(`⏰ Publicación expirada: ${listingId}`);
    }

    /**
     * Entregar items/moneda pendientes a un jugador al conectarse
     */
    deliverPendingRewards(player) {
        const results = {
            items: [],
            currency: 0,
            refunds: 0
        };

        // Entregar items
        if (this.pendingItems && this.pendingItems.has(player.id)) {
            const items = this.pendingItems.get(player.id);
            for (const item of items) {
                if (!player.inventario[item.itemKey]) player.inventario[item.itemKey] = 0;
                player.inventario[item.itemKey] += item.quantity;
                results.items.push(item);
            }
            this.pendingItems.delete(player.id);
        }

        // Entregar moneda
        if (this.pendingPayments && this.pendingPayments.has(player.id)) {
            const payment = this.pendingPayments.get(player.id);
            if (!player.currency) player.currency = 0;
            player.currency += payment;
            results.currency = payment;
            this.pendingPayments.delete(player.id);
        }

        // Entregar reembolsos
        if (this.pendingRefunds && this.pendingRefunds.has(player.id)) {
            const refund = this.pendingRefunds.get(player.id);
            if (!player.currency) player.currency = 0;
            player.currency += refund;
            results.refunds = refund;
            this.pendingRefunds.delete(player.id);
        }

        if (results.items.length > 0 || results.currency > 0 || results.refunds > 0) {
            console.log(`📦 Entregados pendientes a ${player.nombre}:`, results);
        }

        return results;
    }

    /**
     * Limpiar listings expirados (ejecutar periódicamente)
     */
    cleanupExpiredListings() {
        const now = Date.now();
        let expired = 0;

        for (const listing of this.listings.values()) {
            if (listing.status === 'active' && listing.expiresAt <= now) {
                this.expireListing(listing.id);
                expired++;
            }
        }

        if (expired > 0) {
            console.log(`🧹 Expiradas ${expired} publicaciones del mercado`);
        }

        return expired;
    }

    /**
     * Obtener estadísticas del mercado
     */
    getMarketplaceStats() {
        let activeListings = 0;
        let activeSells = 0;
        let activeAuctions = 0;
        let totalValue = 0;

        for (const listing of this.listings.values()) {
            if (listing.status === 'active') {
                activeListings++;
                if (listing.type === 'sell') {
                    activeSells++;
                    totalValue += listing.price;
                } else {
                    activeAuctions++;
                    totalValue += listing.currentBid;
                }
            }
        }

        return {
            activeListings,
            activeSells,
            activeAuctions,
            totalValue,
            averagePrice: activeListings > 0 ? Math.floor(totalValue / activeListings) : 0
        };
    }
}
