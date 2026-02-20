/**
 * Chat Handlers - Sistema de Comunicación y Social
 * 
 * Gestiona la comunicación entre jugadores y donaciones al refugio:
 * - Sistema de donaciones al refugio con XP
 * - Chat global con comandos especiales (/help, /stats, etc)
 * - Mensajes directos entre jugadores
 * - Rate limiting para prevenir spam
 * 
 * Comandos: 3
 * - donate
 * - chat
 * - dm
 */

export function createChatHandlers({ 
    WORLD,
    connections,
    rateLimiter,
    broadcast,
    getConnectedPlayers,
    sendSuccess, 
    sendError, 
    createHandler 
}) {
    return {
        /**
         * Donar recursos al refugio
         * - Rate limiting: 10 donaciones por minuto
         * - Gana XP por donación
         * - Actualiza recursos del refugio
         */
        'donate': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 10 donaciones por minuto
            const rateLimit = rateLimiter.check(playerId, 'donate', 10, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiadas donaciones. Espera ${segundos}s`);
            }

            const item = msg.item;
            const cantidad = msg.cantidad || 1;

            if (!player.inventario[item] || player.inventario[item] < cantidad) {
                return sendError(ws, 'No tienes suficiente');
            }

            player.inventario[item] -= cantidad;

            if (!WORLD.locations.refugio.recursos[item]) {
                WORLD.locations.refugio.recursos[item] = 0;
            }
            WORLD.locations.refugio.recursos[item] += cantidad;

            const xpGain = cantidad * 5;
            player.xp += xpGain;

            sendSuccess(ws, {
                type: 'donate:success',
                item,
                cantidad,
                inventario: player.inventario,
                xpGain
            });

            broadcast({
                type: 'world:event',
                message: `💝 ${player.nombre} donó ${cantidad} ${item} al refugio`,
                category: 'resource'
            });

            broadcast({
                type: 'refugio:recursos',
                recursos: WORLD.locations.refugio.recursos
            });
        }),

        /**
         * Chat global con comandos especiales
         * - Rate limiting: 20 mensajes por minuto
         * - Comandos: /help, /stats, /online, /loc, /skills
         * - Broadcast de mensajes a todos
         */
        'chat': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 20 mensajes por minuto
            const rateLimit = rateLimiter.check(playerId, 'chat', 20, 60000);
            if (!rateLimit.allowed) {
                return sendError(ws, '⏱️ Demasiados mensajes. Espera un momento.');
            }

            const mensaje = msg.mensaje.trim();

            // Comandos especiales
            if (mensaje.startsWith('/')) {
                const comando = mensaje.toLowerCase().split(' ')[0];

                if (comando === '/help') {
                    return sendSuccess(ws, {
                        type: 'chat:system',
                        mensaje: '📋 Comandos disponibles:\n/help - Muestra esta ayuda\n/stats - Estadísticas del servidor\n/online - Jugadores conectados\n/loc - Tu ubicación actual\n/skills - Tus habilidades'
                    });
                }

                if (comando === '/stats') {
                    const totalZombies = Object.values(WORLD.locations).reduce((sum, loc) => sum + loc.zombies, 0);
                    const npcsVivos = Object.values(WORLD.npcs).filter(npc => npc.vivo).length;
                    return sendSuccess(ws, {
                        type: 'chat:system',
                        mensaje: `📊 Estadísticas:\n🧟 Zombies: ${totalZombies}\n👥 NPCs vivos: ${npcsVivos}\n🛡️ Defensas refugio: ${WORLD.locations.refugio.defensas}\n🌍 Jugadores: ${connections.size}`
                    });
                }

                if (comando === '/online') {
                    const onlinePlayers = getConnectedPlayers();
                    const lista = onlinePlayers.map(p => `${p.nombre} (Nv.${p.nivel}) - ${WORLD.locations[p.locacion]?.nombre || p.locacion}`).join('\n');
                    return sendSuccess(ws, {
                        type: 'chat:system',
                        mensaje: `👥 Jugadores conectados (${onlinePlayers.length}):\n${lista}`
                    });
                }

                if (comando === '/loc') {
                    const loc = WORLD.locations[player.locacion];
                    return sendSuccess(ws, {
                        type: 'chat:system',
                        mensaje: `📍 Estás en: ${loc.nombre}\n🧟 Zombies: ${loc.zombies}\n📦 Recursos disponibles: ${Object.entries(loc.recursos).map(([k, v]) => `${k}:${v}`).join(', ')}`
                    });
                }

                if (comando === '/skills') {
                    const skills = Object.entries(player.skills || {}).map(([k, v]) => `${k}: ${v.toFixed(1)}`).join(', ');
                    return sendSuccess(ws, {
                        type: 'chat:system',
                        mensaje: `🎯 Tus habilidades:\n${skills}`
                    });
                }

                return sendSuccess(ws, {
                    type: 'chat:system',
                    mensaje: '❌ Comando desconocido. Usa /help para ver comandos disponibles.'
                });
            }

            // Mensaje normal de chat
            const chatMessage = {
                type: 'chat:message',
                playerId: player.id,
                nombre: player.nombre,
                mensaje: mensaje,
                timestamp: Date.now()
            };

            broadcast(chatMessage);
        }),

        /**
         * Mensajes directos (DM) entre jugadores
         * Envía mensaje privado a un jugador específico
         */
        'dm': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const targetPlayer = WORLD.players[msg.targetId];
            if (!targetPlayer) {
                return sendError(ws, 'Jugador no encontrado');
            }

            const targetWs = Array.from(connections.entries())
                .find(([ws, id]) => id === msg.targetId)?.[0];

            if (!targetWs) {
                return sendError(ws, 'Jugador no está conectado');
            }

            targetWs.send(JSON.stringify({
                type: 'dm:received',
                from: playerId,
                fromName: player.nombre,
                message: msg.mensaje,
                timestamp: Date.now()
            }));

            sendSuccess(ws, {
                type: 'dm:sent',
                to: msg.targetId,
                message: msg.mensaje
            });

            console.log(`💌 DM: ${player.nombre} → ${targetPlayer.nombre}: ${msg.mensaje}`);
        }),
    };
}
