import { WebSocketServer } from 'ws';
import db from './db/index.js';
import locationManager from './world/locations.js';
import eventManager from './world/events.js';
import npcManager from './world/npcs.js';
import statsManager from './systems/stats.js';
import enemyManager from './world/enemies.js';
import combatManager from './systems/combat.js';
import inventoryManager from './systems/inventory.js';
import questManager from './world/quests.js';
import questSystem from './systems/questSystem.js';
import worldSimulation from './world/simulation.js';
import itemSystem from './systems/itemSystem.js';
import globalEvents from './world/globalEvents.js';
import partyManager from './managers/PartyManager.js';
import dynamicQuests from './world/dynamicQuests.js';
import constructionSystem from './systems/ConstructionSystem.js';

class GameWebSocket {
    constructor() {
        this.clients = new Map(); // Map de playerId -> ws
        this.wss = null;
    }

    initialize(server) {
        this.wss = new WebSocketServer({ server });

        this.wss.on('connection', (ws) => {
            console.log('Nueva conexión WebSocket');

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(ws, message);
                } catch (error) {
                    console.error('Error procesando mensaje:', error);
                    ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Mensaje inválido' }));
                }
            });

            ws.on('close', () => {
                // Remover cliente
                for (const [playerId, client] of this.clients.entries()) {
                    if (client === ws) {
                        this.clients.delete(playerId);
                        console.log(`Jugador ${playerId} desconectado`);
                        break;
                    }
                }
            });
        });

        console.log('✓ WebSocket servidor inicializado');
    }

    handleMessage(ws, message) {
        const { tipo, data } = message;

        switch (tipo) {
            case 'login':
                this.handleLogin(ws, data);
                break;

            case 'chat':
                this.handleChat(ws, data);
                break;

            case 'mover':
                this.handleMove(ws, data);
                break;

            case 'accion_evento':
                this.handleEventAction(ws, data);
                break;

            case 'accion_social':
                this.handleSocialAction(ws, data);
                break;

            case 'solicitar_estado':
                this.handleRequestState(ws, data);
                break;

            // ===== COMBATE DESACTIVADO TEMPORALMENTE =====
            // case 'iniciar_combate':
            //     this.handleStartCombat(ws, data);
            //     break;

            // case 'atacar':
            //     this.handleAttack(ws, data);
            //     break;

            // case 'huir':
            // case 'huir_combate':
            //     this.handleFlee(ws, data);
            //     break;

            // ===== INVENTARIO DESACTIVADO TEMPORALMENTE =====
            // case 'obtener_inventario':
            //     this.handleGetInventory(ws, data);
            //     break;

            // case 'equipar_item':
            //     this.handleEquipItem(ws, data);
            //     break;

            // case 'usar_item':
            //     this.handleUseItem(ws, data);
            //     break;

            // Quests
            case 'obtener_misiones':
            case 'obtener_quests':
            case 'getQuests':
                this.handleGetQuests(ws, data);
                break;

            case 'aceptar_mision':
            case 'aceptar_quest':
            case 'acceptQuest':
                this.handleAcceptQuest(ws, data);
                break;

            case 'completar_mision':
            case 'completar_quest':
            case 'completeQuest':
                this.handleCompleteQuest(ws, data);
                break;

            case 'crear_mision_jugador':
            case 'crear_quest_jugador':
                this.handleCreatePlayerQuest(ws, data);
                break;

            // NPCs
            case 'hablar_npc':
                this.handleTalkToNPC(ws, data);
                break;

            case 'responder_dialogo':
                this.handleDialogueResponse(ws, data);
                break;

            // Inventario
            case 'obtener_inventario':
                this.handleGetInventory(ws, data);
                break;

            // Simulación del mundo
            case 'obtener_estado_mundo':
                this.handleGetWorldState(ws, data);
                break;

            case 'solicitar_datos_jugador':
                this.handleRefreshPlayerData(ws, data);
                break;

            // ===== PARTY/GRUPO =====
            case 'crear_party':
            case 'crear_grupo':
                this.handleCreateParty(ws, data);
                break;

            case 'invitar_party':
            case 'invitar_grupo':
                this.handleInviteToParty(ws, data);
                break;

            case 'aceptar_invitacion_party':
            case 'aceptar_party':
                this.handleAcceptPartyInvite(ws, data);
                break;

            case 'rechazar_invitacion_party':
            case 'rechazar_party':
                this.handleRejectPartyInvite(ws, data);
                break;

            case 'abandonar_party':
            case 'salir_grupo':
                this.handleLeaveParty(ws, data);
                break;

            case 'expulsar_party':
            case 'expulsar_miembro':
                this.handleKickFromParty(ws, data);
                break;

            case 'obtener_party':
            case 'obtener_grupo':
                this.handleGetParty(ws, data);
                break;

            case 'obtener_invitaciones':
                this.handleGetInvites(ws, data);
                break;

            // ===== CHAT AVANZADO =====
            case 'whisper':
            case 'mensaje_privado':
                this.handleWhisper(ws, data);
                break;

            case 'chat_party':
            case 'chat_grupo':
                this.handlePartyChat(ws, data);
                break;

            // ===== VOTACIONES =====
            case 'iniciar_votacion':
                this.handleStartVote(ws, data);
                break;

            case 'votar':
                this.handleVote(ws, data);
                break;

            // ===== FASE 11: EVENTOS GLOBALES =====
            case 'get_active_events':
            case 'obtener_eventos_globales':
                this.handleGetActiveEvents(ws, data);
                break;

            case 'claim_airdrop':
            case 'reclamar_airdrop':
                this.handleClaimAirdrop(ws, data);
                break;

            case 'buy_from_merchant':
            case 'comprar_comerciante':
                this.handleBuyFromMerchant(ws, data);
                break;

            // ===== FASE 11: MISIONES DINÁMICAS =====
            case 'get_dynamic_quests':
            case 'obtener_misiones_dinamicas':
                this.handleGetDynamicQuests(ws, data);
                break;

            case 'accept_dynamic_quest':
            case 'aceptar_mision_dinamica':
                this.handleAcceptDynamicQuest(ws, data);
                break;

            case 'complete_dynamic_quest':
            case 'completar_mision_dinamica':
                this.handleCompleteDynamicQuest(ws, data);
                break;

            // ===== FASE 12: SISTEMA DE CONSTRUCCIÓN =====
            case 'get_structures':
            case 'obtener_estructuras':
                this.handleGetStructures(ws, data);
                break;

            case 'get_construction_projects':
            case 'obtener_proyectos':
                this.handleGetConstructionProjects(ws, data);
                break;

            case 'start_construction':
            case 'iniciar_construccion':
                this.handleStartConstruction(ws, data);
                break;

            case 'contribute_construction':
            case 'contribuir_construccion':
                this.handleContributeConstruction(ws, data);
                break;

            case 'get_refuge_effects':
            case 'obtener_efectos_refugio':
                this.handleGetRefugeEffects(ws, data);
                break;

            default:
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Tipo de mensaje desconocido' }));
        }
    }

    // LOGIN
    handleLogin(ws, data) {
        const { alias } = data;

        if (!alias || alias.length < 3) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Alias debe tener al menos 3 caracteres' }));
            return;
        }

        // Buscar o crear jugador
        let player = db.prepare('SELECT * FROM players WHERE alias = ?').get(alias);

        if (!player) {
            // Crear nuevo jugador
            const result = db.prepare(`
        INSERT INTO players (alias, lugar_actual, stats, estado_emocional)
        VALUES (?, 'hospital', ?, ?)
      `).run(
                alias,
                JSON.stringify(statsManager.constructor.DEFAULT_STATS),
                JSON.stringify(statsManager.constructor.DEFAULT_EMOTIONS)
            );

            player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);

            // Dar misiones iniciales del Hospital Act 1
            const initialQuests = [100, 101, 105]; // Bienvenido, Conoce a los Supervivientes, Primer Día
            initialQuests.forEach(questId => {
                db.prepare(`
                    INSERT OR IGNORE INTO player_quests (player_id, quest_id, estado, progreso)
                    VALUES (?, ?, 'activa', '{}')
                `).run(player.id, questId);
            });
        }

        // Actualizar last_seen
        db.prepare('UPDATE players SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(player.id);

        // Registrar cliente
        this.clients.set(player.id, ws);

        // Parsear JSON
        player.stats = JSON.parse(player.stats);
        player.estado_emocional = JSON.parse(player.estado_emocional);

        // Enviar confirmación
        ws.send(JSON.stringify({
            tipo: 'login_exitoso',
            jugador: player
        }));

        // Enviar estado de locación
        const locationState = locationManager.getLocationState(player.lugar_actual);
        ws.send(JSON.stringify({
            tipo: 'estado_lugar',
            lugar: locationState
        }));

        // Notificar a otros en el lugar
        this.broadcastToLocation(player.lugar_actual, {
            tipo: 'jugador_entro',
            jugador: { id: player.id, alias: player.alias }
        }, player.id);

        // 🚨 VERIFICAR EVENTOS GLOBALES
        setTimeout(() => {
            const eventoGlobal = globalEvents.checkActiveGlobalEvents(player.id);
            if (eventoGlobal) {
                console.log(`🚨 Evento global detectado para ${player.alias}`);

                if (eventoGlobal.tipo === 'consulta_privada') {
                    // Ana consulta en privado
                    ws.send(JSON.stringify({
                        tipo: 'dialogo',
                        npc: eventoGlobal.npc,
                        dialogo: eventoGlobal.dialogo
                    }));
                } else if (eventoGlobal.tipo === 'anuncio_publico') {
                    // Anuncio público
                    ws.send(JSON.stringify({
                        tipo: 'evento_global',
                        mensaje: eventoGlobal.mensaje,
                        dialogo_siguiente: eventoGlobal.dialogo_siguiente
                    }));
                }
            }
        }, 2000); // 2 segundos después del login
    }

    // CHAT
    handleChat(ws, data) {
        const { playerId, mensaje } = data;

        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        if (!player) return;

        // Guardar mensaje
        db.prepare(`
      INSERT INTO messages (lugar, autor_id, autor_tipo, mensaje, tipo)
      VALUES (?, ?, 'player', ?, 'chat')
    `).run(player.lugar_actual, playerId, mensaje);

        // Broadcast a todos en el lugar
        this.broadcastToLocation(player.lugar_actual, {
            tipo: 'mensaje_chat',
            autor: player.alias,
            mensaje,
            timestamp: new Date().toISOString()
        });
    }

    // MOVER A OTRO LUGAR
    handleMove(ws, data) {
        const { playerId, destinoId } = data;

        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        if (!player) return;

        const lugarActual = locationManager.getLocation(player.lugar_actual);

        // Verificar que el destino esté conectado
        if (!lugarActual.conexiones.includes(destinoId)) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No puedes ir a ese lugar desde aquí' }));
            return;
        }

        // Notificar salida
        this.broadcastToLocation(player.lugar_actual, {
            tipo: 'jugador_salio',
            jugador: { id: player.id, alias: player.alias },
            destino: destinoId
        }, playerId);

        // Mover jugador
        const result = locationManager.movePlayer(playerId, destinoId);

        if (result.success) {
            // Enviar nuevo estado
            const locationState = locationManager.getLocationState(destinoId);
            ws.send(JSON.stringify({
                tipo: 'movimiento_exitoso',
                lugar: locationState
            }));

            // Notificar entrada
            this.broadcastToLocation(destinoId, {
                tipo: 'jugador_entro',
                jugador: { id: player.id, alias: player.alias }
            }, playerId);
        }
    }

    // ACCIÓN EN EVENTO
    async handleEventAction(ws, data) {
        const { playerId, eventoId, accionIndex } = data;

        const result = eventManager.playerChooseAction(eventoId, playerId, accionIndex);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Enviar confirmación
        ws.send(JSON.stringify({
            tipo: 'accion_registrada',
            eventoId,
            accion: result.accion
        }));

        // Notificar a otros en el lugar
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        this.broadcastToLocation(player.lugar_actual, {
            tipo: 'jugador_actuo',
            jugador: player.alias,
            eventoId
        }, playerId);
    }

    // ACCIÓN SOCIAL
    async handleSocialAction(ws, data) {
        const { playerId, targetId, targetType, accionTipo } = data;

        // Implementar lógica de acción social
        // Por ahora, enviar confirmación
        ws.send(JSON.stringify({
            tipo: 'accion_social_resultado',
            mensaje: 'Acción social procesada'
        }));
    }

    // SOLICITAR ESTADO ACTUAL
    handleRequestState(ws, data) {
        const { playerId } = data;

        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        if (!player) return;

        const locationState = locationManager.getLocationState(player.lugar_actual);

        ws.send(JSON.stringify({
            tipo: 'estado_lugar',
            lugar: locationState
        }));
    }

    // BROADCAST A UNA LOCACIÓN
    broadcastToLocation(locationId, message, excludePlayerId = null) {
        const playersInLocation = db.prepare('SELECT id FROM players WHERE lugar_actual = ?').all(locationId);

        for (const player of playersInLocation) {
            if (player.id === excludePlayerId) continue;

            const ws = this.clients.get(player.id);
            if (ws && ws.readyState === 1) { // 1 = OPEN
                ws.send(JSON.stringify(message));
            }
        }
    }

    // BROADCAST GLOBAL
    broadcastGlobal(message) {
        for (const ws of this.clients.values()) {
            if (ws.readyState === 1) {
                ws.send(JSON.stringify(message));
            }
        }
    }

    // ===== COMBATE =====

    handleStartCombat(ws, data) {
        const { playerId, enemyId } = data;
        const result = combatManager.startCombat(playerId, enemyId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'combate_iniciado',
            enemy: result.enemy,
            mensaje: result.mensaje
        }));

        // Notificar a otros en el lugar
        const player = db.prepare('SELECT lugar_actual FROM players WHERE id = ?').get(playerId);
        this.broadcastToLocation(player.lugar_actual, {
            tipo: 'jugador_entro_combate',
            playerId,
            enemyId
        }, playerId);
    }

    async handleAttack(ws, data) {
        const { playerId, enemyId } = data;
        const result = await combatManager.attackEnemy(playerId, enemyId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Actualizar stats del jugador
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        const updatedPlayer = {
            ...player,
            stats: JSON.parse(player.stats),
            estado_emocional: JSON.parse(player.estado_emocional)
        };

        ws.send(JSON.stringify({
            tipo: 'resultado_ataque',
            ...result,
            playerStats: updatedPlayer.stats
        }));

        // Si el enemigo murió, notificar a todos y actualizar estado
        if (result.enemyDied) {
            this.broadcastToLocation(player.lugar_actual, {
                tipo: 'enemigo_muerto',
                enemyId,
                playerId
            }, playerId);
            this.handleRequestState(ws, { playerId });
        }

        // Si el jugador murió
        if (result.playerDied) {
            // Mover al refugio
            db.prepare('UPDATE players SET lugar_actual = ? WHERE id = ?').run('refugio', playerId);
            this.handleRequestState(ws, { playerId });
        }
    }

    handleFlee(ws, data) {
        const { playerId, enemyId } = data;
        const result = combatManager.fleeCombat(playerId, enemyId);

        ws.send(JSON.stringify({
            tipo: 'resultado_huida',
            ...result
        }));

        if (result.escaped) {
            this.handleRequestState(ws, { playerId });
        }
    }

    // ===== INVENTARIO =====

    handleGetInventory(ws, data) {
        const { playerId } = data;
        const inventory = inventoryManager.getPlayerInventory(playerId);
        const gold = inventoryManager.getGold(playerId);
        const player = db.prepare('SELECT peso_actual, peso_maximo FROM players WHERE id = ?').get(playerId);

        ws.send(JSON.stringify({
            tipo: 'inventario',
            items: inventory,
            oro: gold,
            peso_actual: player.peso_actual,
            peso_maximo: player.peso_maximo
        }));
    }

    handleEquipItem(ws, data) {
        const { playerId, inventarioId } = data;
        const result = inventoryManager.equipItem(playerId, inventarioId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'item_equipado',
            mensaje: 'Item equipado correctamente'
        }));

        this.handleGetInventory(ws, { playerId });
    }

    handleUseItem(ws, data) {
        const { playerId, itemId } = data;
        const result = inventoryManager.useItem(playerId, itemId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Actualizar stats
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
        const updatedPlayer = {
            ...player,
            stats: JSON.parse(player.stats)
        };

        ws.send(JSON.stringify({
            tipo: 'item_usado',
            efecto: result.efecto,
            playerStats: updatedPlayer.stats
        }));

        this.handleGetInventory(ws, { playerId });
    }

    // ===== QUESTS =====

    handleGetQuests(ws, data) {
        const { playerId } = data;
        const player = db.prepare('SELECT lugar_actual FROM players WHERE id = ?').get(playerId);

        // Quests estáticas (de la DB)
        const available = questManager.getAvailableQuests(player.lugar_actual, playerId);
        const active = questManager.getActiveQuests(playerId);

        // Quests dinámicas (del mundo vivo)
        const dynamicAvailable = dynamicQuests.getActiveQuests().filter(q =>
            q.status === 'active' && !q.acceptedBy
        );

        // Combinar quests disponibles
        const allAvailable = [
            ...available,
            ...dynamicAvailable.map(q => ({
                id: q.id,
                titulo: q.title,
                descripcion: q.description,
                tipo: q.type,
                objetivos: q.objectives,
                recompensas: q.rewards,
                recompensa_oro: q.rewards?.oro || 0,
                recompensa_exp: q.rewards?.xp || 0,
                isDynamic: true,
                npcsInvolved: q.npcsInvolved
            }))
        ];

        ws.send(JSON.stringify({
            tipo: 'quests',
            disponibles: allAvailable,
            activas: active
        }));
    }

    handleAcceptQuest(ws, data) {
        const { playerId, questId } = data;

        // Verificar si es una quest dinámica
        const dynamicQuest = dynamicQuests.getQuestById(questId);
        if (dynamicQuest) {
            const success = dynamicQuests.acceptQuest(questId, playerId);
            if (success) {
                ws.send(JSON.stringify({
                    tipo: 'quest_aceptada',
                    quest: {
                        id: dynamicQuest.id,
                        titulo: dynamicQuest.title,
                        descripcion: dynamicQuest.description
                    },
                    mensaje: `Misión aceptada: ${dynamicQuest.title}`
                }));
                this.handleGetQuests(ws, { playerId });
                return;
            } else {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No se pudo aceptar la misión' }));
                return;
            }
        }

        // Quest estática
        const result = questManager.acceptQuest(playerId, questId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'quest_aceptada',
            quest: result.quest,
            mensaje: result.mensaje
        }));

        this.handleGetQuests(ws, { playerId });
    }

    handleCompleteQuest(ws, data) {
        const { playerId, questId } = data;

        // Verificar si es una quest dinámica
        const dynamicQuest = dynamicQuests.getQuestById(questId);
        if (dynamicQuest) {
            const result = dynamicQuests.completeQuest(questId, playerId, true);

            if (!result.success) {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: result.message }));
                return;
            }

            // Dar recompensas
            if (result.rewards) {
                if (result.rewards.oro) {
                    db.prepare('UPDATE players SET oro = oro + ? WHERE id = ?')
                        .run(result.rewards.oro, playerId);
                }
                if (result.rewards.xp) {
                    statsManager.addExperience(playerId, result.rewards.xp);
                }
            }

            ws.send(JSON.stringify({
                tipo: 'quest_completada',
                quest: {
                    id: result.quest.id,
                    titulo: result.quest.title
                },
                recompensas: {
                    oro: result.rewards?.oro || 0,
                    exp: result.rewards?.xp || 0
                },
                mensaje: result.message
            }));

            // Actualizar jugador
            this.handleRequestState(ws, { playerId });
            this.handleGetQuests(ws, { playerId });
            return;
        }

        // Quest estática
        const result = questManager.completeQuest(playerId, questId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'quest_completada',
            quest: result.quest,
            recompensas: result.recompensas,
            mensaje: result.mensaje
        }));

        // Actualizar jugador
        this.handleRequestState(ws, { playerId });
        this.handleGetQuests(ws, { playerId });
    }

    handleCreatePlayerQuest(ws, data) {
        const { playerId, titulo, descripcion, objetivos, recompensas, ubicacion } = data;
        const result = questManager.createPlayerQuest(playerId, titulo, descripcion, objetivos, recompensas, ubicacion);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'quest_creada',
            questId: result.questId,
            mensaje: result.mensaje
        }));

        // Notificar a jugadores en la ubicación
        this.broadcastToLocation(ubicacion, {
            tipo: 'nueva_quest_disponible',
            questId: result.questId
        }, playerId);
    }

    // ===== NPCs Y DIÁLOGOS =====

    // ===== DIÁLOGOS (NUEVO SISTEMA FLAG-BASED) =====

    handleTalkToNPC(ws, data) {
        const { playerId, npcId } = data;

        // Usar nuevo sistema DialogueEngine
        const dialogue = npcManager.startDialogueV2(npcId, playerId);

        if (!dialogue) {
            // NPC existe en DB pero no tiene diálogos definidos aún
            const npcData = db.prepare('SELECT * FROM npcs WHERE id = ?').get(npcId);
            if (npcData) {
                ws.send(JSON.stringify({
                    tipo: 'dialogo',
                    npc: { id: npcId, nombre: npcData.nombre },
                    dialogo: {
                        id: 'generico',
                        texto: `${npcData.nombre} no tiene nada que decir en este momento.`,
                        opciones: [{ texto: 'Adiós', consecuencias: {}, siguiente: null }]
                    }
                }));
            } else {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'NPC no encontrado' }));
            }
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'dialogo',
            ...dialogue
        }));
    }

    async handleDialogueResponse(ws, data) {
        const { playerId, npcId, dialogoId, opcionIndex } = data;

        console.log(`📝 Procesando respuesta de diálogo:`, {
            playerId,
            npcId,
            dialogoId,
            opcionIndex
        });

        // Usar nuevo sistema DialogueEngine
        const result = await npcManager.processDialogueResponseV2(
            npcId,
            playerId,
            opcionIndex,
            dialogoId
        );

        if (!result.success) {
            console.error(`❌ Error procesando diálogo: ${result.error}`);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error || 'Error al procesar diálogo' }));
            return;
        }

        console.log(`✅ Diálogo procesado correctamente`);

        ws.send(JSON.stringify({
            tipo: 'dialogo_respuesta',
            ...result
        }));

        // Si hay consecuencias que afectan quests, actualizar inventario
        if (result.consecuencias && result.consecuencias.length > 0) {
            this.handleGetInventory(ws, { playerId });
        }
    }

    // ===== INVENTARIO =====

    handleGetInventory(ws, data) {
        const { playerId } = data;

        if (!playerId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Player ID requerido' }));
            return;
        }

        const inventario = itemSystem.getInventory(playerId);

        ws.send(JSON.stringify({
            tipo: 'inventario',
            items: inventario
        }));
    }

    // ===== SIMULACIÓN DEL MUNDO =====

    handleGetWorldState(ws, data) {
        const worldState = worldSimulation.getWorldState();

        ws.send(JSON.stringify({
            tipo: 'estado_mundo',
            mundo: worldState
        }));
    }

    // ===== PARTY/GRUPO HANDLERS =====

    handleCreateParty(ws, data) {
        const { playerId } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        if (!player) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        const result = partyManager.createParty(playerId, player.alias);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        ws.send(JSON.stringify({
            tipo: 'party_creado',
            party: result.party
        }));
    }

    handleInviteToParty(ws, data) {
        const { playerId, targetAlias } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        if (!player) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        // Buscar el jugador objetivo
        const target = db.prepare('SELECT id, alias FROM players WHERE alias = ?').get(targetAlias);

        if (!target) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        const party = partyManager.getPlayerParty(playerId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No estás en ningún grupo' }));
            return;
        }

        const result = partyManager.invitePlayer(party.id, target.id, target.alias, playerId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Notificar al jugador que invitó
        ws.send(JSON.stringify({
            tipo: 'invitacion_enviada',
            targetAlias: target.alias
        }));

        // Notificar al jugador invitado
        const targetWs = this.clients.get(target.id);
        if (targetWs) {
            targetWs.send(JSON.stringify({
                tipo: 'invitacion_party',
                partyId: party.id,
                liderNombre: player.alias,
                mensaje: `${player.alias} te invita a unirte a su grupo`
            }));
        }
    }

    handleAcceptPartyInvite(ws, data) {
        const { playerId, partyId } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        if (!player) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        const result = partyManager.acceptInvite(partyId, playerId, player.alias);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Notificar al jugador que aceptó
        ws.send(JSON.stringify({
            tipo: 'party_unido',
            party: result.party
        }));

        // Notificar a todos los miembros del party
        result.party.miembros.forEach(member => {
            if (member.id !== playerId) {
                const memberWs = this.clients.get(member.id);
                if (memberWs) {
                    memberWs.send(JSON.stringify({
                        tipo: 'jugador_unio_party',
                        jugador: player.alias,
                        party: result.party
                    }));
                }
            }
        });
    }

    handleRejectPartyInvite(ws, data) {
        const { playerId, partyId } = data;

        const result = partyManager.rejectInvite(partyId, playerId);

        ws.send(JSON.stringify({
            tipo: 'invitacion_rechazada',
            success: result.success
        }));
    }

    handleLeaveParty(ws, data) {
        const { playerId } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        const party = partyManager.getPlayerParty(playerId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No estás en ningún grupo' }));
            return;
        }

        const result = partyManager.leaveParty(playerId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Notificar al jugador que salió
        ws.send(JSON.stringify({
            tipo: 'party_abandonado',
            disbanded: result.disbanded
        }));

        // Si el party no se disolvió, notificar a los demás miembros
        if (!result.disbanded && result.party) {
            result.party.miembros.forEach(member => {
                const memberWs = this.clients.get(member.id);
                if (memberWs) {
                    memberWs.send(JSON.stringify({
                        tipo: 'jugador_abandono_party',
                        jugador: player.alias,
                        party: result.party
                    }));
                }
            });
        }
    }

    handleKickFromParty(ws, data) {
        const { playerId, targetAlias } = data;
        const party = partyManager.getPlayerParty(playerId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No estás en ningún grupo' }));
            return;
        }

        const target = db.prepare('SELECT id, alias FROM players WHERE alias = ?').get(targetAlias);

        if (!target) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        const result = partyManager.kickPlayer(party.id, target.id, playerId);

        if (!result.success) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: result.error }));
            return;
        }

        // Notificar al líder
        ws.send(JSON.stringify({
            tipo: 'jugador_expulsado',
            targetAlias: target.alias,
            party: result.party
        }));

        // Notificar al jugador expulsado
        const targetWs = this.clients.get(target.id);
        if (targetWs) {
            targetWs.send(JSON.stringify({
                tipo: 'expulsado_party',
                mensaje: 'Has sido expulsado del grupo'
            }));
        }

        // Notificar a los demás miembros
        result.party.miembros.forEach(member => {
            if (member.id !== playerId) {
                const memberWs = this.clients.get(member.id);
                if (memberWs) {
                    memberWs.send(JSON.stringify({
                        tipo: 'jugador_expulsado_party',
                        jugador: target.alias,
                        party: result.party
                    }));
                }
            }
        });
    }

    handleGetParty(ws, data) {
        const { playerId } = data;
        const party = partyManager.getPlayerParty(playerId);
        const invites = partyManager.getPendingInvites(playerId);

        ws.send(JSON.stringify({
            tipo: 'info_party',
            party: party,
            invitaciones: invites
        }));
    }

    handleGetInvites(ws, data) {
        const { playerId } = data;
        const invites = partyManager.getPendingInvites(playerId);

        ws.send(JSON.stringify({
            tipo: 'lista_invitaciones',
            invitaciones: invites
        }));
    }

    // ===== CHAT AVANZADO =====

    handleWhisper(ws, data) {
        const { playerId, targetAlias, mensaje } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        if (!player) return;

        const target = db.prepare('SELECT id FROM players WHERE alias = ?').get(targetAlias);

        if (!target) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
            return;
        }

        const targetWs = this.clients.get(target.id);

        if (!targetWs) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no está conectado' }));
            return;
        }

        // Enviar mensaje al destinatario
        targetWs.send(JSON.stringify({
            tipo: 'whisper_recibido',
            de: player.alias,
            mensaje: mensaje,
            timestamp: new Date().toISOString()
        }));

        // Confirmar al emisor
        ws.send(JSON.stringify({
            tipo: 'whisper_enviado',
            a: targetAlias,
            mensaje: mensaje,
            timestamp: new Date().toISOString()
        }));
    }

    handlePartyChat(ws, data) {
        const { playerId, mensaje } = data;
        const player = db.prepare('SELECT alias FROM players WHERE id = ?').get(playerId);

        if (!player) return;

        const party = partyManager.getPlayerParty(playerId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No estás en un grupo' }));
            return;
        }

        // Enviar mensaje a todos los miembros del party
        party.miembros.forEach(member => {
            const memberWs = this.clients.get(member.id);
            if (memberWs) {
                memberWs.send(JSON.stringify({
                    tipo: 'mensaje_party',
                    autor: player.alias,
                    mensaje: mensaje,
                    timestamp: new Date().toISOString()
                }));
            }
        });
    }

    // ===== VOTACIONES =====

    handleStartVote(ws, data) {
        const { playerId, pregunta, opciones, tipo } = data;
        const player = db.prepare('SELECT alias, lugar_actual FROM players WHERE id = ?').get(playerId);

        if (!player) return;

        const party = partyManager.getPlayerParty(playerId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Solo puedes iniciar votaciones en grupo' }));
            return;
        }

        if (party.lider !== playerId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Solo el líder puede iniciar votaciones' }));
            return;
        }

        // Crear votación
        const voteId = `vote_${Date.now()}_${playerId}`;
        const votacion = {
            id: voteId,
            partyId: party.id,
            pregunta: pregunta,
            opciones: opciones,
            tipo: tipo || 'simple', // simple, unanime, mayoria
            votos: {},
            iniciada: new Date(),
            completada: false
        };

        // Guardar en memoria (podrías guardar en DB si quieres persistencia)
        if (!this.activeVotes) this.activeVotes = new Map();
        this.activeVotes.set(voteId, votacion);

        // Enviar votación a todos los miembros
        party.miembros.forEach(member => {
            const memberWs = this.clients.get(member.id);
            if (memberWs) {
                memberWs.send(JSON.stringify({
                    tipo: 'votacion_iniciada',
                    votacion: {
                        id: voteId,
                        pregunta: pregunta,
                        opciones: opciones,
                        tipo: tipo
                    }
                }));
            }
        });
    }

    handleVote(ws, data) {
        const { playerId, voteId, opcion } = data;

        if (!this.activeVotes) this.activeVotes = new Map();

        const votacion = this.activeVotes.get(voteId);

        if (!votacion) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Votación no encontrada' }));
            return;
        }

        if (votacion.completada) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Votación ya completada' }));
            return;
        }

        const party = partyManager.getPartyData(votacion.partyId);

        if (!party) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Grupo no encontrado' }));
            return;
        }

        // Verificar que el jugador esté en el party
        const isMember = party.miembros.some(m => m.id === playerId);

        if (!isMember) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'No eres miembro del grupo' }));
            return;
        }

        // Registrar voto
        votacion.votos[playerId] = opcion;

        // Contar votos
        const voteCounts = {};
        Object.values(votacion.votos).forEach(voto => {
            voteCounts[voto] = (voteCounts[voto] || 0) + 1;
        });

        const totalVotos = Object.keys(votacion.votos).length;
        const totalMiembros = party.miembros.length;

        // Confirmar voto al jugador
        ws.send(JSON.stringify({
            tipo: 'voto_registrado',
            voteId: voteId,
            opcion: opcion
        }));

        // Notificar progreso a todos
        party.miembros.forEach(member => {
            const memberWs = this.clients.get(member.id);
            if (memberWs) {
                memberWs.send(JSON.stringify({
                    tipo: 'votacion_progreso',
                    voteId: voteId,
                    votos: totalVotos,
                    total: totalMiembros
                }));
            }
        });

        // Verificar si todos votaron
        if (totalVotos === totalMiembros) {
            // Determinar ganador según tipo de votación
            let resultado = null;

            if (votacion.tipo === 'unanime') {
                const primeraOpcion = Object.values(votacion.votos)[0];
                const esUnanime = Object.values(votacion.votos).every(v => v === primeraOpcion);
                resultado = esUnanime ? { aprobado: true, opcion: primeraOpcion } : { aprobado: false };
            } else {
                // Mayoría simple
                let maxVotos = 0;
                let opcionGanadora = null;

                for (const [opcion, count] of Object.entries(voteCounts)) {
                    if (count > maxVotos) {
                        maxVotos = count;
                        opcionGanadora = opcion;
                    }
                }

                resultado = { aprobado: true, opcion: opcionGanadora, votos: voteCounts };
            }

            votacion.completada = true;
            votacion.resultado = resultado;

            // Notificar resultado a todos
            party.miembros.forEach(member => {
                const memberWs = this.clients.get(member.id);
                if (memberWs) {
                    memberWs.send(JSON.stringify({
                        tipo: 'votacion_completada',
                        voteId: voteId,
                        resultado: resultado
                    }));
                }
            });
        }
    }

    // ==============================================
    // FASE 11: EVENTOS GLOBALES
    // ==============================================

    handleGetActiveEvents(ws, data) {
        try {
            const activeEvents = globalEvents.getActiveEvents();

            ws.send(JSON.stringify({
                tipo: 'active_events',
                events: activeEvents.map(event => ({
                    id: event.id,
                    type: event.type,
                    title: event.title,
                    description: event.description,
                    endsAt: event.endsAt,
                    status: event.status,
                    effects: event.effects,
                    location: event.location,
                    inventory: event.inventory
                }))
            }));
        } catch (error) {
            console.error('Error obteniendo eventos globales:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al obtener eventos' }));
        }
    }

    handleClaimAirdrop(ws, data) {
        const { playerId, eventId } = data;

        if (!playerId || !eventId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            // Obtener ubicación del jugador
            const player = db.prepare('SELECT lugar_actual FROM players WHERE id = ?').get(playerId);

            if (!player) {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
                return;
            }

            const result = globalEvents.claimAirdrop(eventId, playerId, player.lugar_actual);

            if (result.success) {
                // Agregar loot al inventario del jugador
                const stmt = db.prepare('SELECT inventario FROM players WHERE id = ?');
                const playerData = stmt.get(playerId);
                const inventario = playerData.inventario ? JSON.parse(playerData.inventario) : {};

                // Agregar items del loot
                for (const [item, cantidad] of Object.entries(result.loot)) {
                    inventario[item] = (inventario[item] || 0) + cantidad;
                }

                // Actualizar inventario
                db.prepare('UPDATE players SET inventario = ? WHERE id = ?')
                    .run(JSON.stringify(inventario), playerId);

                ws.send(JSON.stringify({
                    tipo: 'airdrop_claimed',
                    loot: result.loot,
                    message: '¡Airdrop reclamado con éxito!'
                }));

                console.log(`📦 Jugador ${playerId} reclamó airdrop ${eventId}`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: result.message
                }));
            }
        } catch (error) {
            console.error('Error reclamando airdrop:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al reclamar airdrop' }));
        }
    }

    handleBuyFromMerchant(ws, data) {
        const { playerId, eventId, itemId } = data;

        if (!playerId || !eventId || !itemId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            // Obtener oro del jugador
            const playerData = db.prepare('SELECT oro FROM players WHERE id = ?').get(playerId);

            if (!playerData) {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
                return;
            }

            const result = globalEvents.buyFromMerchant(eventId, playerId, itemId, playerData.oro);

            if (result.success) {
                const item = result.item;

                // Restar oro
                const newOro = playerData.oro - item.precio;
                db.prepare('UPDATE players SET oro = ? WHERE id = ?').run(newOro, playerId);

                // Agregar item al inventario
                const inventarioData = db.prepare('SELECT inventario FROM players WHERE id = ?').get(playerId);
                const inventario = inventarioData.inventario ? JSON.parse(inventarioData.inventario) : {};
                inventario[item.item] = (inventario[item.item] || 0) + 1;
                db.prepare('UPDATE players SET inventario = ? WHERE id = ?')
                    .run(JSON.stringify(inventario), playerId);

                ws.send(JSON.stringify({
                    tipo: 'merchant_purchase_success',
                    item: item,
                    newOro: newOro,
                    message: `Compraste ${item.name} por ${item.precio} oro`
                }));

                console.log(`🛒 Jugador ${playerId} compró ${item.name} del comerciante`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: result.message
                }));
            }
        } catch (error) {
            console.error('Error comprando del comerciante:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al comprar' }));
        }
    }

    // ==============================================
    // FASE 11: MISIONES DINÁMICAS
    // ==============================================

    handleGetDynamicQuests(ws, data) {
        const { playerId } = data;

        try {
            const activeQuests = dynamicQuests.getActiveQuests();

            // Filtrar quests que el jugador puede aceptar
            const availableQuests = activeQuests.filter(q => !q.acceptedBy && q.status === 'active');
            const playerQuests = activeQuests.filter(q => q.acceptedBy === playerId);

            ws.send(JSON.stringify({
                tipo: 'dynamic_quests',
                available: availableQuests,
                accepted: playerQuests
            }));

            console.log(`🎯 Enviadas ${availableQuests.length} misiones dinámicas a jugador ${playerId}`);
        } catch (error) {
            console.error('Error obteniendo misiones dinámicas:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al obtener misiones' }));
        }
    }

    handleAcceptDynamicQuest(ws, data) {
        const { playerId, questId } = data;

        if (!playerId || !questId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            const success = dynamicQuests.acceptQuest(questId, playerId);

            if (success) {
                const quest = dynamicQuests.getQuestById(questId);
                ws.send(JSON.stringify({
                    tipo: 'quest_accepted',
                    quest: quest,
                    message: `Misión "${quest.title}" aceptada`
                }));

                console.log(`🎯 Jugador ${playerId} aceptó misión dinámica ${questId}`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: 'No se pudo aceptar la misión'
                }));
            }
        } catch (error) {
            console.error('Error aceptando misión dinámica:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al aceptar misión' }));
        }
    }

    handleCompleteDynamicQuest(ws, data) {
        const { playerId, questId, success = true } = data;

        if (!playerId || !questId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            const result = dynamicQuests.completeQuest(questId, playerId, success);

            if (result.success) {
                // Dar recompensas
                if (result.rewards) {
                    const playerData = db.prepare('SELECT nivel, xp, oro, reputacion FROM players WHERE id = ?')
                        .get(playerId);

                    if (playerData) {
                        const newXp = (playerData.xp || 0) + (result.rewards.xp || 0);
                        const newOro = (playerData.oro || 0) + (result.rewards.oro || 0);
                        const newReputacion = (playerData.reputacion || 0) + (result.rewards.reputacion || 0);

                        db.prepare(`
                            UPDATE players 
                            SET xp = ?, oro = ?, reputacion = ? 
                            WHERE id = ?
                        `).run(newXp, newOro, newReputacion, playerId);
                    }
                }

                ws.send(JSON.stringify({
                    tipo: 'quest_completed',
                    questId: questId,
                    rewards: result.rewards,
                    message: result.message
                }));

                // Actualizar lista de quests
                this.handleGetDynamicQuests(ws, { playerId });

                console.log(`✅ Jugador ${playerId} completó misión dinámica ${questId}`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: result.message
                }));
            }
        } catch (error) {
            console.error('Error completando misión dinámica:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al completar misión' }));
        }
    }

    // ==============================================
    // FASE 12: SISTEMA DE CONSTRUCCIÓN
    // ==============================================

    handleGetStructures(ws, data) {
        try {
            const available = constructionSystem.getAvailableStructures();
            const completed = constructionSystem.getCompletedStructures();

            ws.send(JSON.stringify({
                tipo: 'structures',
                available,
                completed
            }));
        } catch (error) {
            console.error('Error obteniendo estructuras:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al obtener estructuras' }));
        }
    }

    handleGetConstructionProjects(ws, data) {
        try {
            const projects = constructionSystem.getActiveProjects();

            ws.send(JSON.stringify({
                tipo: 'construction_projects',
                projects
            }));
        } catch (error) {
            console.error('Error obteniendo proyectos:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al obtener proyectos' }));
        }
    }

    handleStartConstruction(ws, data) {
        const { playerId, structureId, playerName } = data;

        if (!playerId || !structureId) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            const result = constructionSystem.startConstruction(structureId, playerId, playerName || 'Jugador');

            if (result.success) {
                ws.send(JSON.stringify({
                    tipo: 'construction_started',
                    project: result.project,
                    structure: result.structure,
                    message: `Construcción de ${result.structure.name} iniciada`
                }));

                console.log(`🏗️ Jugador ${playerId} inició construcción de ${result.structure.name}`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: result.message,
                    project: result.project
                }));
            }
        } catch (error) {
            console.error('Error iniciando construcción:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al iniciar construcción' }));
        }
    }

    handleContributeConstruction(ws, data) {
        const { playerId, projectId, resources, playerName } = data;

        if (!playerId || !projectId || !resources) {
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Faltan datos' }));
            return;
        }

        try {
            // Verificar que el jugador tenga los recursos
            const playerData = db.prepare('SELECT inventario FROM players WHERE id = ?').get(playerId);

            if (!playerData) {
                ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Jugador no encontrado' }));
                return;
            }

            const inventario = playerData.inventario ? JSON.parse(playerData.inventario) : {};

            // Verificar disponibilidad de recursos
            for (const [resource, amount] of Object.entries(resources)) {
                if ((inventario[resource] || 0) < amount) {
                    ws.send(JSON.stringify({
                        tipo: 'error',
                        mensaje: `No tienes suficiente ${resource}. Tienes: ${inventario[resource] || 0}, necesitas: ${amount}`
                    }));
                    return;
                }
            }

            // Restar recursos del inventario
            for (const [resource, amount] of Object.entries(resources)) {
                inventario[resource] -= amount;
                if (inventario[resource] <= 0) {
                    delete inventario[resource];
                }
            }

            db.prepare('UPDATE players SET inventario = ? WHERE id = ?')
                .run(JSON.stringify(inventario), playerId);

            // Contribuir al proyecto
            const result = constructionSystem.contribute(projectId, playerId, playerName || 'Jugador', resources);

            if (result.success) {
                if (result.structure) {
                    // Construcción completada
                    ws.send(JSON.stringify({
                        tipo: 'construction_completed',
                        structure: result.structure,
                        effects: result.effects,
                        message: result.message
                    }));
                } else {
                    // Progreso actualizado
                    ws.send(JSON.stringify({
                        tipo: 'construction_contributed',
                        project: result.project,
                        progress: result.progress,
                        message: result.message,
                        newInventory: inventario
                    }));
                }

                console.log(`🔨 Jugador ${playerId} contribuyó a proyecto ${projectId}`);
            } else {
                ws.send(JSON.stringify({
                    tipo: 'error',
                    mensaje: result.message
                }));
            }
        } catch (error) {
            console.error('Error contribuyendo a construcción:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al contribuir' }));
        }
    }

    handleGetRefugeEffects(ws, data) {
        try {
            const effects = constructionSystem.getTotalRefugeEffects();

            ws.send(JSON.stringify({
                tipo: 'refuge_effects',
                effects
            }));
        } catch (error) {
            console.error('Error obteniendo efectos del refugio:', error);
            ws.send(JSON.stringify({ tipo: 'error', mensaje: 'Error al obtener efectos' }));
        }
    }
}

export default new GameWebSocket();
