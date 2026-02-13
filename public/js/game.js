/**
 * Estado principal del juego y punto de entrada
 */

import * as WebSocketSystem from './systems/websocket.js';
import { messageHandlers, setGameState, getPlayer, getWorld } from './systems/messageHandlers.js';
import { log, worldLog, showNotification } from './utils/helpers.js';
import { preloadSounds, playSound, toggleSound, initAudio } from './utils/sounds.js';
import { notify } from './ui/notifications.js';
import { AchievementSystem, AnimatedStatsRenderer } from './ui/achievements.js';

// Estado global del juego
export const gameState = {
    player: null,
    world: null,
    allPlayers: {},
    gameStartTime: Date.now(),
    totalPlayTime: 0,
    renderGame: null, // Se asigna después de cargar UI
    achievementSystem: null, // Sistema de logros
    statsRenderer: null // Renderizador animado de stats
};

// Hacer accesible globalmente para compatibilidad
window.gameState = gameState;
window.log = log;
window.worldLog = worldLog;
window.showNotification = showNotification;
window.playSound = playSound;
window.toggleSoundSystem = toggleSound;
window.notify = notify;

// Proxy para sincronizar gameState con messageHandlers
const playerProxy = new Proxy(gameState, {
    set(target, property, value) {
        target[property] = value;
        if (property === 'player' || property === 'world') {
            setGameState(target.player, target.world);
        }
        return true;
    }
});

/**
 * Inicializa el juego
 */
export async function init() {
    console.log('🎮 Inicializando juego...');

    // Verificar playerId
    let playerId = localStorage.getItem('playerId');

    // Si el playerId tiene formato antiguo (con timestamp), limpiarlo
    if (playerId && playerId.includes('_') && playerId.split('_').length === 3) {
        console.warn('⚠️ Formato de playerId antiguo detectado, limpiando...');
        localStorage.removeItem('playerId');
        playerId = null;
    }

    if (!playerId) {
        window.location.href = '/index.html';
        return;
    }

    // Inicializar audio (requiere click del usuario)
    document.addEventListener('click', () => {
        initAudio();
    }, { once: true });

    // Precargar sonidos
    preloadSounds();

    // Cargar UI y renderizado PRIMERO
    const uiModule = await import('./ui/renderer.js');
    gameState.renderGame = uiModule.renderGame;

    // Inicializar sistema de logros y renderizador animado
    gameState.achievementSystem = new AchievementSystem();
    gameState.statsRenderer = new AnimatedStatsRenderer();

    // Exponer funciones de renderizado adicionales
    window.renderGame = uiModule.renderGame;
    window.renderMissions = uiModule.renderMissions;
    window.renderQuests = uiModule.renderQuests;
    window.renderEvents = uiModule.renderEvents;
    window.renderWorldStats = uiModule.renderWorldStats;
    window.renderOnlinePlayers = uiModule.renderOnlinePlayers;
    
    // Exponer sistema de logros globalmente
    window.achievementSystem = gameState.achievementSystem;
    window.statsRenderer = gameState.statsRenderer;

    console.log('✅ Funciones de renderizado cargadas');

    // Cargar acciones del jugador  
    await import('./ui/actions.js');

    // Registrar TODOS los handlers de mensajes
    WebSocketSystem.registerMessageHandlers(messageHandlers);

    // Conectar WebSocket
    WebSocketSystem.connect(playerId);

    // Exponer funciones globalmente para botones HTML
    window.gameState = gameState;

    console.log('✅ Juego inicializado');
}

/**
 * Limpia recursos al salir
 */
export function cleanup() {
    WebSocketSystem.disconnect();
}

// Iniciar automáticamente cuando se carga el módulo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Cleanup al salir
window.addEventListener('beforeunload', cleanup);
