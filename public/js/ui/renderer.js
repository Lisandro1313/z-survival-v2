/**
 * Sistema de renderizado de UI
 */

import { cachedRender } from '../utils/helpers.js';

/**
 * Renderiza todo el juego
 */
export function renderGame() {
    const { player, world } = window.gameState || {};

    console.log('🎨 renderGame llamado', {
        hasPlayer: !!player,
        hasWorld: !!world,
        playerName: player?.nombre,
        playerLocation: player?.locacion,
        worldLocations: world ? Object.keys(world.locations || {}).length : 0
    });

    if (!player || !world) {
        console.warn('⚠️ No hay player o world para renderizar', { player: !!player, world: !!world });
        return;
    }

    // Renders principales (pestaña JUEGO)
    renderPlayerStats();
    renderLocation();
    renderInventory();
    renderWorldTime();
    renderLocations();

    // Renders de otras pestañas
    renderMissions();
    renderQuests();
    renderEvents();
    renderWorldStats();

    console.log('✅ Renderizado completo');
}

/**
 * Renderiza lista de jugadores online
 */
export function renderOnlinePlayers(players) {
    const onlineCount = document.getElementById('onlineCount');
    const onlinePlayers = document.getElementById('onlinePlayers');

    if (!players || players.length === 0) {
        if (onlineCount) onlineCount.textContent = '0';
        if (onlinePlayers) onlinePlayers.innerHTML = '<em style="color: #888;">Sin jugadores conectados</em>';
        return;
    }

    if (onlineCount) onlineCount.textContent = players.length;

    const html = players.map(p => {
        const { player } = window.gameState || {};
        const isMe = p.id === player?.id;
        const locationName = window.gameState?.world?.locations?.[p.locacion]?.nombre || p.locacion;

        return `
      <div style="padding: 8px; margin: 5px 0; background: ${isMe ? '#004400' : '#1a1a1a'}; border-left: 3px solid ${isMe ? '#ffff00' : '#00ff00'}; border-radius: 3px;">
        <div style="font-weight: bold; color: ${isMe ? '#ffff00' : '#00ff00'};">
          ${isMe ? '⭐ ' : ''}${p.nombre}${isMe ? ' (Tú)' : ''}
        </div>
        <div style="font-size: 11px; color: #888; margin-top: 3px;">
          📍 ${locationName} | Nv.${p.nivel || 1}
        </div>
      </div>
    `;
    }).join('');

    if (onlinePlayers) onlinePlayers.innerHTML = html;
}

/**
 * Renderiza locaciones disponibles
 */
function renderLocations() {
    const { player, world } = window.gameState || {};
    if (!player || !world || !world.locations) return;

    const locationsEl = document.getElementById('locations');
    if (!locationsEl) return;

    const currentLoc = world.locations[player.locacion];
    if (!currentLoc || !currentLoc.conectado_a) return;

    const html = currentLoc.conectado_a.map(locId => {
        const loc = world.locations[locId];
        if (!loc) return '';

        return `
      <button onclick="window.move('${locId}')" style="width: 100%; text-align: left; margin: 5px 0; padding: 10px; background: #1a1a1a; border: 1px solid #00ff00;">
        📍 ${loc.nombre}
        ${loc.zombies > 0 ? `<br><small style="color: #ff8888;">⚠️ ${loc.zombies} zombies</small>` : ''}
      </button>
    `;
    }).join('');

    locationsEl.innerHTML = html || '<em style="color: #888;">No hay rutas disponibles</em>';
}

// Exponer globalmente para compatibilidad
if (typeof window !== 'undefined') {
    window.renderOnlinePlayers = renderOnlinePlayers;
}

/**
 * Renderiza estadísticas del jugador
 */
function renderPlayerStats() {
    const { player } = window.gameState || {};
    if (!player) return;

    const saludColor = player.salud < 30 ? '#ff0000' : player.salud < 50 ? '#ffaa00' : '#00ff00';
    const hambreColor = player.hambre < 30 ? '#ff0000' : player.hambre < 50 ? '#ffaa00' : '#88ff88';

    const html = `
    <div style="text-align: center; margin-bottom: 10px;">
      ${(player.avatar && player.avatar.startsWith('data:image'))
            ? `<img src="${player.avatar}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid ${player.color || '#00ff00'};">`
            : `<div style="font-size: 60px; color: ${player.color || '#00ff00'};">${player.avatar || '👤'}</div>`
        }
    </div>
    <div class="stat" style="color: #888;">
      <strong style="color: #00ff00;">Nombre:</strong> ${player.nombre}
    </div>
    <div class="stat" style="color: #ffaa00;">
      <strong>Clase:</strong> ${(player.clase || 'superviviente').toUpperCase()}
    </div>
    <div class="stat" style="color: #888;">
      ⭐ Nivel: ${player.nivel || 1} | XP: ${player.xp || 0}/${player.xpParaSiguienteNivel || 100}
      <div class="stat-bar">
        <div class="stat-fill" style="width: ${((player.xp || 0) / (player.xpParaSiguienteNivel || 100) * 100)}%; background: #ffaa00;"></div>
      </div>
    </div>
    <div class="stat" style="color: #666;">
      💪 Fuerza: ${player.atributos?.fuerza || player.fuerza || 5} | 🛡️ Resistencia: ${player.atributos?.resistencia || player.resistencia || 5}
    </div>
    <div class="stat" style="color: #666;">
      ⚡ Agilidad: ${player.atributos?.agilidad || player.agilidad || 5} | 🧠 Inteligencia: ${player.atributos?.inteligencia || player.inteligencia || 5}
    </div>
    <div class="stat">
      <strong style="color: ${saludColor};">❤️ Salud: ${player.salud}/${player.saludMaxima || 100}</strong>
      ${player.salud < 30 ? ' <span style="color: #ff0000; font-weight: bold;">⚠️ CRÍTICO</span>' : ''}
      <div class="stat-bar">
        <div class="stat-fill salud" style="width: ${(player.salud / (player.saludMaxima || 100)) * 100}%; background: ${saludColor};"></div>
      </div>
    </div>
    <div class="stat">
      <strong style="color: ${hambreColor};">🍖 Hambre: ${player.hambre}/100</strong>
      ${player.hambre < 30 ? ' <span style="color: #ff0000; font-weight: bold;">⚠️ HAMBRIENTO</span>' : ''}
      <div class="stat-bar">
        <div class="stat-fill hambre" style="width: ${player.hambre}%; background: ${hambreColor};"></div>
      </div>
    </div>
  `;

    const el = document.getElementById('playerStats');
    if (el) el.innerHTML = html;
}

/**
 * Renderiza inventario
 */
function renderInventory() {
    const { player } = window.gameState || {};
    if (!player) return;

    const html = Object.entries(player.inventario || {})
        .map(([item, cant]) => `<div>${item}: ${cant}</div>`)
        .join('');

    const el = document.getElementById('inventory');
    if (el) el.innerHTML = html || '<em>Vacío</em>';
}

/**
 * Renderiza locación actual
 */
function renderLocation() {
    const { player, world } = window.gameState || {};
    if (!player || !world || !world.locations) return;

    const loc = world.locations[player.locacion];
    if (!loc) return;

    const nameEl = document.getElementById('locationName');
    const descEl = document.getElementById('locationDesc');
    const actionsEl = document.getElementById('locationActions');

    if (nameEl) nameEl.textContent = `📍 ${loc.nombre}`;
    if (descEl) descEl.textContent = loc.descripcion;

    let actionsHtml = '';

    // Panel de combate activo
    if (player.inCombat) {
        actionsHtml = renderCombatPanel(player);
    }
    // Acciones normales
    else if (loc.tipo === 'loot') {
        actionsHtml += `
      <button onclick="window.scavenge()" style="width: 100%; padding: 15px; font-size: 16px; margin: 10px 0; background: #00aa00; cursor: pointer; border: 2px solid #00ff00;">
        🔍 BUSCAR RECURSOS (+XP)
      </button>
    `;

        if (loc.zombies > 0) {
            actionsHtml += `
        <div style="background: #2a1a1a; padding: 10px; margin: 10px 0; border: 2px solid #ff0000;">
          <div style="margin-bottom: 5px; font-weight: bold; color: #ff8888;">⚠️ ${loc.zombies} zombies aquí</div>
          ${player.inventario?.armas > 0 ? `
            <button onclick="window.attack('shoot')" style="width: 100%; padding: 10px; margin: 3px 0; background: #660000; border: 1px solid #ff0000; color: #fff; cursor: pointer;">
              🔫 DISPARAR (armas: ${player.inventario.armas})
            </button>
          ` : ''}
          <button onclick="window.attack('melee')" style="width: 100%; padding: 10px; margin: 3px 0; background: #664400; border: 1px solid #ffaa00; color: #fff; cursor: pointer;">
            🥊 MELEE
          </button>
        </div>
      `;
        }
    }

    if (actionsEl) actionsEl.innerHTML = actionsHtml;
}

/**
 * Renderiza panel de combate
 */
function renderCombatPanel(player) {
    const combat = player.inCombat;
    const zombieHPPercent = (combat.zombieHP / combat.zombieMaxHP) * 100;
    const playerHPPercent = (player.salud / (player.saludMaxima || 100)) * 100;

    return `
    <div style="background: #3a0000; padding: 15px; margin: 10px 0; border: 3px solid #ff0000; border-radius: 8px;">
      <div style="text-align: center; font-size: 20px; margin-bottom: 10px; color: #ff0000; font-weight: bold;">
        ⚔️ EN COMBATE
      </div>
      
      <div style="margin: 15px 0; padding: 10px; background: #1a1a1a; border-radius: 5px;">
        <div style="font-weight: bold; color: #00ff00; margin-bottom: 5px;">🧟 TÚ: ${player.nombre}</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: #333; height: 25px; border-radius: 5px; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, #ff0000, #00ff00); width: ${playerHPPercent}%; transition: width 0.3s;"></div>
          </div>
          <div style="color: #00ff00; font-weight: bold; min-width: 60px;">${player.salud}/${player.saludMaxima || 100}</div>
        </div>
      </div>
      
      <div style="margin: 15px 0; padding: 10px; background: #1a1a1a; border-radius: 5px;">
        <div style="font-weight: bold; color: #ff8888; margin-bottom: 5px;">🧟 ZOMBIE</div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: #333; height: 25px; border-radius: 5px; overflow: hidden;">
            <div style="height: 100%; background: linear-gradient(90deg, #ff0000, #ff8800); width: ${zombieHPPercent}%; transition: width 0.3s;"></div>
          </div>
          <div style="color: #ff8888; font-weight: bold; min-width: 60px;">${combat.zombieHP}/${combat.zombieMaxHP}</div>
        </div>
      </div>
      
      ${combat.turno === 'player' ? `
        <div style="margin-top: 15px;">
          <div style="color: #ffff00; font-weight: bold; text-align: center; margin-bottom: 10px;">
            ⭐ TU TURNO
          </div>
          ${player.inventario?.armas > 0 ? `
            <button onclick="window.attack('shoot')" style="width: 100%; padding: 12px; margin: 5px 0; background: #660000; border: 2px solid #ff0000; color: #fff; font-weight: bold; cursor: pointer; border-radius: 5px;">
              🔫 DISPARAR
            </button>
          ` : ''}
          <button onclick="window.attack('melee')" style="width: 100%; padding: 12px; margin: 5px 0; background: #664400; border: 2px solid #ffaa00; color: #fff; font-weight: bold; cursor: pointer; border-radius: 5px;">
            🥊 MELEE
          </button>
          <button onclick="window.fleeCombat()" style="width: 100%; padding: 10px; margin: 5px 0; background: #333; border: 2px solid #888; color: #fff; font-weight: bold; cursor: pointer; border-radius: 5px;">
            🏃 HUIR (${Math.floor(50 + (player.atributos?.agilidad || 5) * 2)}%)
          </button>
        </div>
      ` : `
        <div style="color: #ff8888; font-weight: bold; text-align: center; margin-top: 15px; padding: 10px; background: #1a0000; border-radius: 5px;">
          🧟 TURNO DEL ZOMBIE...
        </div>
      `}
    </div>
  `;
}

/**
 * Renderiza tiempo del mundo
 */
function renderWorldTime() {
    const { world } = window.gameState || {};
    if (!world) return;

    const timeEl = document.getElementById('worldTime');
    if (timeEl) {
        const hour = world.hora || 12;
        const day = world.dia || 1;
        const period = hour >= 18 || hour < 6 ? '🌙' : '☀️';

        timeEl.innerHTML = `
          <div class="stat" style="font-size: 16px; margin: 10px 0; text-align: center;">
            ${period} Día ${day} - ${hour}:00
          </div>
        `;
    }
}

/**
 * Renderiza misiones activas
 */
export function renderMissions() {
    console.log('🎯 renderMissions llamado');
    console.log('  gameState:', !!window.gameState);
    console.log('  player:', !!window.gameState?.player);

    const { player } = window.gameState || {};
    const missionsPanel = document.getElementById('missionsPanel');

    console.log('  missionsPanel encontrado:', !!missionsPanel);

    if (!missionsPanel) {
        console.warn('❌ No se encontró elemento #missionsPanel');
        return;
    }

    const missions = player?.misiones || [];
    console.log('  misiones encontradas:', missions.length);

    if (missions.length === 0) {
        missionsPanel.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Sin misiones disponibles<br><small>Las misiones aparecerán aquí cuando hables con NPCs</small></div>';
        return;
    }

    let html = '';
    missions.forEach(mission => {
        html += `
            <div style="background: #003300; padding: 15px; margin: 10px 0; border: 2px solid #006600; border-radius: 5px;">
                <div style="font-weight: bold; font-size: 14px; color: #00ff00; margin-bottom: 5px;">
                    ${mission.nombre || mission.title || 'Misión'}
                </div>
                <div style="color: #aaa; font-size: 11px; margin-bottom: 10px;">
                    ${mission.descripcion || mission.description || ''}
                </div>
                ${mission.progreso !== undefined ? `
                    <div style="margin-top: 10px;">
                        <div style="font-size: 10px; color: #888; margin-bottom: 3px;">
                            Progreso: ${mission.progreso}/${mission.objetivo || 100}
                        </div>
                        <div style="background: #222; height: 8px; border-radius: 4px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #00ff00, #00aa00); height: 100%; width: ${(mission.progreso / (mission.objetivo || 100)) * 100}%;"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    });

    missionsPanel.innerHTML = html;
}

/**
 * Renderiza quests disponibles
 */
export function renderQuests() {
    console.log('🎯 renderQuests llamado');
    const { player, world } = window.gameState || {};
    const questsEl = document.getElementById('quests');

    console.log('  quests elemento:', !!questsEl);

    if (!questsEl) {
        console.warn('❌ No se encontró elemento #quests');
        return;
    }

    const quests = player?.quests || world?.quests || [];
    console.log('  quests encontrados:', quests.length);

    if (quests.length === 0) {
        questsEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No hay quests disponibles<br><small>Explora el mundo para desbloquear quests</small></div>';
        return;
    }

    let html = '';
    quests.forEach(quest => {
        const status = quest.completada ? '✅' : quest.activa ? '🔵' : '⚪';
        html += `
            <div style="padding: 10px; margin: 5px 0; background: #222; border-left: 3px solid ${quest.completada ? '#00ff00' : quest.activa ? '#0088ff' : '#666'};">
                ${status} <strong>${quest.nombre || quest.title}</strong>
                ${quest.recompensa ? `<span style="color: #ffaa00; margin-left: 10px;">🎁 ${quest.recompensa}</span>` : ''}
            </div>
        `;
    });

    questsEl.innerHTML = html;
}

/**
 * Renderiza eventos especiales y NPCs
 */
export function renderEvents() {
    console.log('🎭 renderEvents llamado');
    console.log('  gameState:', !!window.gameState);
    console.log('  world:', !!window.gameState?.world);
    console.log('  player:', !!window.gameState?.player);

    const { world, player } = window.gameState || {};

    // Evento especial
    const specialEventEl = document.getElementById('specialEvent');
    console.log('  specialEvent elemento:', !!specialEventEl);
    if (specialEventEl) {
        const event = world?.eventoActual || world?.specialEvent;
        if (event) {
            specialEventEl.innerHTML = `
                <div style="background: #330033; padding: 20px; border: 2px solid #ff00ff; border-radius: 5px;">
                    <div style="font-size: 18px; font-weight: bold; color: #ff00ff; margin-bottom: 10px;">
                        ✨ ${event.nombre || event.name}
                    </div>
                    <div style="color: #ddd; margin-bottom: 10px;">
                        ${event.descripcion || event.description || ''}
                    </div>
                    ${event.tiempoRestante ? `
                        <div style="color: #ffaa00; font-size: 11px;">
                            ⏰ Tiempo restante: ${event.tiempoRestante}
                        </div>
                    ` : ''}
                </div>
            `;
        } else {
            specialEventEl.innerHTML = '<em style="color: #888;">Sin eventos activos</em>';
        }
    }

    // NPCs en la ubicación del jugador
    const npcsEl = document.getElementById('npcs');
    console.log('  npcs elemento:', !!npcsEl);
    console.log('  world.npcs:', world ? Object.keys(world.npcs || {}).length : 'no world');

    if (npcsEl && world && player) {
        // Buscar NPCs en la ubicación del jugador
        const playerLocation = player.locacion;
        const allNPCs = world.npcs || {};
        console.log('  total NPCs en mundo:', Object.keys(allNPCs).length);
        console.log('  ubicación del jugador:', playerLocation);

        const npcsInLocation = Object.values(allNPCs).filter(npc =>
            npc.locacion === playerLocation && npc.vivo
        );

        console.log('  👥 NPCs en ubicación:', npcsInLocation.length);
        console.log('  NPCs:', npcsInLocation.map(n => n.nombre));

        if (npcsInLocation.length === 0) {
            npcsEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">No hay NPCs en esta ubicación<br><small>Explora otras zonas para encontrar NPCs</small></div>';
        } else {
            let html = '';
            npcsInLocation.forEach(npc => {
                const emoji = npc.rol === 'medico' ? '👨‍⚕️' :
                    npc.rol === 'lider' ? '👮' :
                        npc.rol === 'comerciante' ? '🛒' :
                            npc.rol === 'ingeniero' ? '🔧' :
                                npc.rol === 'explorador' ? '🗺️' : '👤';

                const healthColor = npc.salud > 70 ? '#00ff00' :
                    npc.salud > 30 ? '#ffaa00' : '#ff0000';

                html += `
                    <div style="padding: 12px; margin: 8px 0; background: #003300; border: 1px solid #006600; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <div style="margin-bottom: 5px;">
                                <span style="font-size: 20px; margin-right: 8px;">${emoji}</span>
                                <strong style="font-size: 14px;">${npc.nombre}</strong>
                                <span style="color: #888; font-size: 11px; margin-left: 8px;">${npc.rol}</span>
                            </div>
                            <div style="font-size: 10px; color: #aaa;">
                                <span style="color: ${healthColor};">❤️ ${npc.salud}%</span>
                                <span style="margin-left: 10px; color: ${npc.hambre > 70 ? '#ff8888' : '#aaa'};">🍖 ${npc.hambre}%</span>
                                <span style="margin-left: 10px;">😊 ${npc.moral}%</span>
                            </div>
                            ${npc.dialogo ? `
                                <div style="margin-top: 5px; font-size: 11px; color: #bbb; font-style: italic;">
                                    "${npc.dialogo}"
                                </div>
                            ` : ''}
                        </div>
                        <button onclick="window.talk('${npc.id}')" style="padding: 8px 16px; background: #006600; border: 1px solid #00ff00; color: #fff; cursor: pointer; border-radius: 3px; font-size: 12px; white-space: nowrap;">
                            💬 Hablar
                        </button>
                    </div>
                `;
            });
            npcsEl.innerHTML = html;
        }
    } else {
        console.warn('⚠️ No se puede renderizar NPCs:', { npcsEl: !!npcsEl, world: !!world, player: !!player });
        if (npcsEl) {
            npcsEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff8888;">Error: No se pudo cargar NPCs<br><small>Refresca la página</small></div>';
        }
    }
}

/**
 * Renderiza estadísticas del mundo
 */
export function renderWorldStats() {
    console.log('🌍 renderWorldStats llamado');
    console.log('  world:', !!window.gameState?.world);

    const { world } = window.gameState || {};

    // Estadísticas globales
    const worldStatsEl = document.getElementById('worldStats');
    console.log('  worldStats elemento:', !!worldStatsEl);
    if (worldStatsEl && world) {
        const stats = world.stats || world.estadisticas || {};
        worldStatsEl.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                <div style="background: #222; padding: 10px; border-radius: 5px;">
                    <div style="color: #888; font-size: 10px;">JUGADORES VIVOS</div>
                    <div style="font-size: 18px; color: #00ff00; font-weight: bold;">${stats.jugadoresVivos || 0}</div>
                </div>
                <div style="background: #222; padding: 10px; border-radius: 5px;">
                    <div style="color: #888; font-size: 10px;">ZOMBIES ELIMINADOS</div>
                    <div style="font-size: 18px; color: #ff8888; font-weight: bold;">${stats.zombiesEliminados || 0}</div>
                </div>
                <div style="background: #222; padding: 10px; border-radius: 5px;">
                    <div style="color: #888; font-size: 10px;">RECURSOS TOTALES</div>
                    <div style="font-size: 18px; color: #ffaa00; font-weight: bold;">${stats.recursosRecolectados || 0}</div>
                </div>
                <div style="background: #222; padding: 10px; border-radius: 5px;">
                    <div style="color: #888; font-size: 10px;">DÍAS SOBREVIVIDOS</div>
                    <div style="font-size: 18px; color: #00aaff; font-weight: bold;">${world.dia || 1}</div>
                </div>
            </div>
        `;
    }

    // Amenaza zombie
    const zombieStatsEl = document.getElementById('zombieStats');
    if (zombieStatsEl && world) {
        const zombies = world.zombies || [];
        const totalZombies = zombies.length;
        const amenaza = totalZombies > 20 ? 'CRÍTICA' : totalZombies > 10 ? 'ALTA' : totalZombies > 5 ? 'MEDIA' : 'BAJA';
        const amenazaColor = totalZombies > 20 ? '#ff0000' : totalZombies > 10 ? '#ff8800' : totalZombies > 5 ? '#ffaa00' : '#00ff00';

        zombieStatsEl.innerHTML = `
            <div style="margin: 10px 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span>Zombies activos:</span>
                    <strong style="color: #ff8888;">${totalZombies}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span>Nivel de amenaza:</span>
                    <strong style="color: ${amenazaColor};">${amenaza}</strong>
                </div>
                <div style="background: #222; height: 10px; border-radius: 5px; overflow: hidden; margin-top: 10px;">
                    <div style="background: linear-gradient(90deg, ${amenazaColor}, #880000); height: 100%; width: ${Math.min((totalZombies / 30) * 100, 100)}%; transition: width 0.5s;"></div>
                </div>
            </div>
        `;
    }
}
