/**
 * HANDLERS DE MARKETPLACE/COMERCIO (FASE 15)
 * Extraído de survival_mvp.js para mejor organización
 */

export function createMarketHandlers({
    WORLD,
    marketplaceSystem,
    connections,
    sendSuccess,
    sendError,
    createHandler,
    broadcast
}) {
    // Helper para obtener websocket de un jugador
    const getPlayerWs = (playerId) => {
        return connections ? connections.get(playerId) : null;
    };

    return {
        // ===== SISTEMA DE MERCADO (FASE 15) =====

        'market:create_listing': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const { itemKey, quantity, price, type = 'sell' } = msg;

            const result = marketplaceSystem.createListing(player, itemKey, quantity, price, type);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'market:listing_created',
                listing: result.listing,
                inventario: player.inventario,
                message: result.message
            });

            // Broadcast al mundo
            broadcast({
                type: 'market:new_listing',
                listing: result.listing
            });

            console.log(`🏪 ${player.nombre} publicó ${itemKey} x${quantity} por ${price} caps`);
        }),

        'market:buy_listing': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const { listingId } = msg;

            const result = marketplaceSystem.buyListing(player, listingId);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'market:purchase_complete',
                listing: result.listing,
                totalCost: result.totalCost,
                tax: result.tax,
                currency: player.currency,
                inventario: player.inventario,
                message: result.message
            });

            // Notificar al vendedor (si está online)
            const sellerId = result.listing.sellerId;
            if (WORLD.players[sellerId]) {
                const sellerWs = getPlayerWs(sellerId);
                if (sellerWs) {
                    sellerWs.send(JSON.stringify({
                        type: 'market:item_sold',
                        listing: result.listing,
                        buyer: player.nombre,
                        amount: result.listing.price
                    }));
                }
            }

            console.log(`💰 ${player.nombre} compró listing ${listingId} por ${result.totalCost} caps`);
        }),

        'market:place_bid': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const { listingId, bidAmount } = msg;

            const result = marketplaceSystem.placeBid(player, listingId, bidAmount);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            sendSuccess(ws, {
                type: 'market:bid_placed',
                bid: result.bid,
                currentBid: result.currentBid,
                currency: player.currency,
                message: result.message
            });

            console.log(`🔨 ${player.nombre} ofertó ${bidAmount} caps en listing ${listingId}`);
        }),

        'market:cancel_listing': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const { listingId } = msg;

            const result = marketplaceSystem.cancelListing(playerId, listingId);

            if (!result.success) {
                return sendError(ws, result.error);
            }

            // Devolver item al inventario
            if (!player.inventario[result.listing.itemKey]) player.inventario[result.listing.itemKey] = 0;
            player.inventario[result.listing.itemKey] += result.listing.quantity;

            sendSuccess(ws, {
                type: 'market:listing_cancelled',
                listing: result.listing,
                inventario: player.inventario,
                message: result.message
            });

            console.log(`❌ ${player.nombre} canceló listing ${listingId}`);
        }),

        'market:search': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const filters = msg.filters || {};

            const result = marketplaceSystem.searchListings(filters);

            sendSuccess(ws, {
                type: 'market:search_results',
                listings: result.listings,
                total: result.total
            });
        }),

        'market:get_my_listings': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const result = marketplaceSystem.getPlayerListings(playerId);

            sendSuccess(ws, {
                type: 'market:my_listings',
                listings: result.listings,
                total: result.total
            });
        }),

        'market:get_stats': createHandler(async (msg, ws, playerId) => {
            if (!marketplaceSystem) {
                return sendError(ws, 'Sistema de mercado no disponible');
            }

            const stats = marketplaceSystem.getMarketplaceStats();

            sendSuccess(ws, {
                type: 'market:stats',
                stats
            });
        })
    };
}
