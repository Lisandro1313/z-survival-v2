/**
 * Acciones del jugador
 */

import { send } from '../systems/websocket.js';
import * as Combat from '../systems/combat.js';
import { log } from '../utils/helpers.js';
import { notify } from './notifications.js';

/**
 * Buscar recursos en la locación actual
 */
export function scavenge() {
    const btn = event?.target;
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }

    if (!send({ type: 'scavenge' })) {
        notify.error('No conectado al servidor');
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    // Re-enable después de 1 segundo (rate limit del servidor)
    setTimeout(() => {
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }, 1000);
}

/**
 * Atacar zombies
 */
export function attack(attackType = 'melee') {
    const { player } = window.gameState || {};

    if (!player) return;

    // Si ya estamos en combate, atacar directamente
    if (player.inCombat) {
        Combat.attack(attackType);
        return;
    }

    // Iniciar nuevo combate con modal personalizado
    let confirmMsg = '';
    if (attackType === 'shoot') confirmMsg = '¿Iniciar combate con disparo? <br><small style="color: #f59e0b;">Consume 1 arma</small>';
    else if (attackType === 'melee') confirmMsg = '¿Iniciar combate cuerpo a cuerpo?';

    notify.confirm(confirmMsg, () => {
        send({ type: 'attack', attackType });
    });
}

/**
 * Huir del combate
 */
export function fleeCombat() {
    Combat.flee();
}

/**
 * Moverse a otra locación
 */
export function move(targetId) {
    if (!send({ type: 'move', targetId })) {
        notify.error('No conectado al servidor');
    }
}

/**
 * Craftear un item
 */
export function craft(item) {
    const btn = event?.target;
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }

    if (!send({ type: 'craft', item })) {
        notify.error('No conectado al servidor');
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    setTimeout(() => {
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }, 800);
}

/**
 * Hablar con NPC
 */
export function talk(npcId) {
    if (!send({ type: 'talk', npcId })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Comerciar con NPC
 */
export function trade(npcId, recurso, cantidad, tipo) {
    if (!send({ type: 'trade', npcId, recurso, cantidad, tipo })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Consumir comida
 */
export function eat() {
    const { player } = window.gameState || {};
    if (!player || !player.inventario?.comida || player.inventario.comida < 1) {
        notify.warning('No tienes comida en tu inventario');
        return;
    }

    if (!send({ type: 'eat' })) {
        notify.error('No conectado al servidor');
    }
}

/**
 * Usar medicina
 */
export function heal() {
    const { player } = window.gameState || {};
    if (!player || !player.inventario?.medicinas || player.inventario.medicinas < 1) {
        notify.warning('No tienes medicinas en tu inventario');
        return;
    }

    const btn = event?.target;
    if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
    }

    if (!send({ type: 'heal' })) {
        notify.error('No conectado al servidor');
        if (btn) {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    } else {
        setTimeout(() => {
            if (btn) {
                btn.classList.remove('loading');
                btn.disabled = false;
            }
        }, 500);
    }
}

/**
 * Crear grupo
 */
export function createGroup() {
    const groupName = prompt('Nombre del grupo:');
    if (!groupName || !groupName.trim()) return;

    if (!send({ type: 'group:create', name: groupName.trim() })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Enviar mensaje al chat global
 */
export function sendChat() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;

    const message = input.value.trim();
    if (!send({ type: 'chat:global', message })) {
        log('No conectado al servidor', 'warning');
        return;
    }

    input.value = '';
}

/**
 * Dar item a NPC
 */
export function giveItem(npcId, item) {
    if (!send({ type: 'give', npcId, item, cantidad: 1 })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Aceptar quest
 */
export function acceptQuest(questId) {
    if (!send({ type: 'aceptarQuest', questId })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Seleccionar opción de diálogo
 */
export function selectDialogueOption(npcId, optionIndex) {
    if (!send({ type: 'dialogue:select', npcId, option: optionIndex })) {
        log('No conectado al servidor', 'warning');
    }
}

/**
 * Cambiar pestaña de crafteo
 */
export function switchCraftTab(tabName) {
    // Ocultar todos los tabs de crafteo
    document.querySelectorAll('[id^="craft-"]').forEach(tab => {
        if (tab.id.startsWith('craft-')) {
            tab.style.display = 'none';
        }
    });

    // Desactivar todos los botones
    document.querySelectorAll('.craft-tab').forEach(btn => {
        btn.style.background = '#2a2a2a';
        btn.style.color = '#00ff00';
    });

    // Mostrar tab seleccionado
    const targetTab = document.getElementById(`craft-${tabName}`);
    if (targetTab) {
        targetTab.style.display = 'grid';
    }

    // Activar botón seleccionado
    const targetBtn = document.getElementById(`craft-tab-${tabName}`);
    if (targetBtn) {
        targetBtn.style.background = '#00ff00';
        targetBtn.style.color = '#000';
    }
}

// Exponer globalmente para botones HTML
if (typeof window !== 'undefined') {
    window.scavenge = scavenge;
    window.attack = attack;
    window.fleeCombat = fleeCombat;
    window.move = move;
    window.craft = craft;
    window.talk = talk;
    window.trade = trade;
    window.eat = eat;
    window.heal = heal;
    window.createGroup = createGroup;
    window.sendChat = sendChat;
    window.giveItem = giveItem;
    window.acceptQuest = acceptQuest;
    window.selectDialogueOption = selectDialogueOption;
    window.switchCraftTab = switchCraftTab;
}
