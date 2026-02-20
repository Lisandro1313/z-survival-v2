/**
 * NPC Handlers - Sistema de interacción con NPCs
 * - Diálogos con NPCs
 * - Donación de recursos a NPCs
 * - Comercio con NPCs
 * 
 * Comandos: 5
 * - talk, give, giveResource, npc:give_resource, trade
 */

export function createNPCHandlers({ WORLD, rateLimiter, giveXP, broadcast, sendSuccess, sendError, createHandler }) {
    return {

        'talk': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            const npc = WORLD.npcs[msg.npcId];
            if (!npc || !npc.vivo) {
                return sendError(ws, 'NPC no disponible');
            }

            if (npc.locacion !== player.locacion && npc.locacion !== 'refugio') {
                return sendError(ws, 'No puedes hablar con ese NPC desde aquí');
            }

            let dialogo = npc.dialogo || 'Hola...';
            if (npc.dialogos && npc.dialogos.length > 0) {
                dialogo = npc.dialogos[Math.floor(Math.random() * npc.dialogos.length)];
            }

            const saludos = ['Hola', 'Hey', 'Buenas', 'Qué tal'];
            const despedidas = ['Adiós', 'Nos vemos', 'Hasta luego', 'Cuídate'];

            let sonido = 'npc_charla';
            if (saludos.some(s => dialogo.includes(s))) {
                sonido = 'npc_saludo';
            } else if (despedidas.some(s => dialogo.includes(s))) {
                sonido = 'npc_despedida';
            }

            sendSuccess(ws, {
                type: 'npc:talk',
                npcId: msg.npcId,
                npcName: npc.nombre,
                dialogo: dialogo,
                playSound: sonido
            });

            console.log(`💬 ${player.nombre} habla con ${npc.nombre}: "${dialogo}"`);
        }),

        'give': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 10 donaciones a NPCs por minuto
            const rateLimit = rateLimiter.check(playerId, 'give', 10, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiadas donaciones. Espera ${segundos}s`);
            }

            const npcId = msg.npcId;
            const recurso = msg.item || msg.recurso || msg.resource;
            const cantidad = msg.cantidad || 1;

            const npc = WORLD.npcs[npcId];
            if (!npc || !npc.vivo) {
                return sendError(ws, 'NPC no disponible');
            }

            if (!player.inventario[recurso] || player.inventario[recurso] < cantidad) {
                return sendError(ws, `No tienes suficiente ${recurso}`);
            }

            player.inventario[recurso] -= cantidad;

            if (recurso === 'comida') {
                npc.hambre = Math.max(0, npc.hambre - 20 * cantidad);
                npc.moral = Math.min(100, npc.moral + 10);
            } else if (recurso === 'medicinas') {
                npc.salud = Math.min(100, npc.salud + 25 * cantidad);
                npc.moral = Math.min(100, npc.moral + 15);
            } else {
                npc.moral = Math.min(100, npc.moral + 5);
            }

            giveXP(player, 20, ws);
            player.stats.reputacion = (player.stats.reputacion || 0) + 5;

            const respuestas = [
                '¡Muchas gracias! Esto me ayuda mucho.',
                '¡Eres muy amable! Gracias.',
                'No olvidaré esto. Gracias.',
                'Esto significa mucho para mí. Gracias.'
            ];

            sendSuccess(ws, {
                type: 'npc:talk',
                npcId: npcId,
                npcName: npc.nombre,
                dialogo: respuestas[Math.floor(Math.random() * respuestas.length)],
                playSound: 'npc_charla',
                inventario: player.inventario,
                npcState: npc
            });

            console.log(`💝 ${player.nombre} dio ${cantidad} ${recurso} a ${npc.nombre}`);
        }),

        'giveResource': createHandler(async (msg, ws, playerId) => {
            // Alias para 'give'
            msg.type = 'give';
            const messageHandlers = createNPCHandlers({ WORLD, rateLimiter, giveXP, broadcast, sendSuccess, sendError, createHandler });
            await messageHandlers['give'](msg, ws, playerId);
        }),

        'npc:give_resource': createHandler(async (msg, ws, playerId) => {
            // Alias para 'give'
            msg.type = 'give';
            const messageHandlers = createNPCHandlers({ WORLD, rateLimiter, giveXP, broadcast, sendSuccess, sendError, createHandler });
            await messageHandlers['give'](msg, ws, playerId);
        }),

        'trade': createHandler(async (msg, ws, playerId) => {
            const player = WORLD.players[playerId];
            if (!player) return sendError(ws, 'Jugador no encontrado');

            // Rate limiting: max 5 comercios por minuto
            const rateLimit = rateLimiter.check(playerId, 'trade', 5, 60000);
            if (!rateLimit.allowed) {
                const segundos = Math.ceil(rateLimit.resetIn / 1000);
                return sendError(ws, `⏱️ Demasiados comercios. Espera ${segundos}s`);
            }

            const npc = WORLD.npcs.comerciante;
            if (!npc || !npc.vivo) {
                return sendError(ws, 'Jorge no está disponible');
            }

            const { ofreces, pides } = msg;

            if (!player.inventario[ofreces.item] || player.inventario[ofreces.item] < ofreces.cant) {
                return sendError(ws, 'No tienes suficiente para comerciar');
            }

            if (!npc.inventario[pides.item] || npc.inventario[pides.item] < pides.cant) {
                return sendError(ws, 'Jorge no tiene eso');
            }

            // Realizar intercambio
            player.inventario[ofreces.item] -= ofreces.cant;
            player.inventario[pides.item] = (player.inventario[pides.item] || 0) + pides.cant;
            npc.inventario[ofreces.item] = (npc.inventario[ofreces.item] || 0) + ofreces.cant;
            npc.inventario[pides.item] -= pides.cant;

            sendSuccess(ws, {
                type: 'trade:success',
                message: `Intercambiaste ${ofreces.cant} ${ofreces.item} por ${pides.cant} ${pides.item}`,
                inventario: player.inventario,
                comercianteInventario: npc.inventario
            });
        }),

    };
}
