/**
 * Navigation Handlers - Sistema de Navegación y Movimiento
 * 
 * Gestiona la navegación básica del jugador:
 * - Sistema de ping/pong para latencia
 * - Lista de jugadores conectados (con caché)
 * - Movimiento entre locaciones con sistema de XP
 * - Cambio de sublocaciones dentro del refugio
 * 
 * Comandos: 4
 * - ping
 * - getPlayers
 * - move
 * - sublocation:change
 */

export function createNavigationHandlers({ 
    WORLD,
    connections,
    cache,
    movementService,
    updatePlayerStats,
    checkAchievements,
    giveXP,
    logHandlerAction,
    broadcast,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Ping para verificar conexión y latencia
         */
        'ping': createHandler(async (msg, ws) => {
            sendSuccess(ws, { type: 'pong' });
        }),

        /**
         * Obtener lista de jugadores conectados
         * Implementa caché de 2 segundos para optimizar
         */
        'getPlayers': createHandler(async (msg, ws) => {
            // Cachear lista de jugadores por 2 segundos
            const cacheKey = 'playersList';
            let connectedPlayers = cache.get(cacheKey);

            if (!connectedPlayers) {
                connectedPlayers = Array.from(connections.keys())
                    .filter(pid => WORLD.players[pid])
                    .map(pid => ({
                        id: pid,
                        nombre: WORLD.players[pid].nombre,
                        locacion: WORLD.players[pid].locacion,
                        nivel: WORLD.players[pid].nivel,
                        stats: WORLD.players[pid].stats || {}
                    }));

                cache.set(cacheKey, connectedPlayers, 2000);
            }

            sendSuccess(ws, {
                type: 'players:list',
                players: connectedPlayers
            });
        }),

        /**
         * Mover jugador entre locaciones
         * - Usa MovementService para validación
         * - Sistema de XP por descubrir nuevas locaciones
         * - Tracking de estadísticas y logros
         * - Broadcast del movimiento a otros jugadores
         */
        'move': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, '❌ Jugador no encontrado');

            // Usar MovementService para lógica de movimiento
            const result = movementService.move(player, msg.targetId);

            if (!result.success) {
                return sendError(ws, result.message);
            }

            // Trackear logros y stats
            if (result.isNewLocation) {
                updatePlayerStats(player, 'locaciones_visitadas', 1);
                checkAchievements(player, ws);

                if (result.xpBonus > 0) {
                    giveXP(player, result.xpBonus, ws);
                }
            }

            logHandlerAction(playerId, 'move', {
                from: result.previousLocation,
                to: msg.targetId,
                isNew: result.isNewLocation
            });

            sendSuccess(ws, {
                type: 'moved',
                location: result.location,
                message: result.message
            });

            broadcast({
                type: 'player:moved',
                playerId,
                locacion: msg.targetId,
                nombre: player.nombre
            }, playerId);

            broadcast({
                type: 'world:event',
                message: `🚶 ${player.nombre} se movió a ${result.location.nombre}`,
                category: 'player'
            }, playerId);
        }),

        /**
         * Cambiar sublocalización dentro del refugio
         * Permite moverse entre diferentes áreas del refugio:
         * - Hospital, Arsenal, Talleres, etc.
         */
        'sublocation:change': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            if (player.locacion !== 'refugio') {
                return sendError(ws, 'Solo puedes cambiar de sub-ubicación en el refugio');
            }

            const refugio = WORLD.locations.refugio;
            const subLoc = refugio.subLocations[msg.subLocationId];

            if (!subLoc) {
                return sendError(ws, 'Sub-ubicación inválida');
            }

            const targetSubLocation = msg.subLocationId;
            player.subLocation = targetSubLocation;

            sendSuccess(ws, {
                type: 'sublocation:changed',
                subLocation: targetSubLocation,
                subLocationData: subLoc
            });

            broadcast({
                type: 'player:subLocationChanged',
                playerId,
                nombre: player.nombre,
                subLocation: targetSubLocation
            }, playerId);
        }),
    };
}
