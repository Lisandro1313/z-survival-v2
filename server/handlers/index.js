/**
 * HANDLERS INDEX
 * Punto central de exportación de todos los handlers
 */

import { createAIHandlers } from './ai.handlers.js';
import { createCombatHandlers } from './combat.handlers.js';
import { createCraftingHandlers } from './crafting.handlers.js';
import { createMarketHandlers } from './market.handlers.js';
import { createRaidHandlers } from './raid.handlers.js';
import { createClanHandlers } from './clan.handlers.js';
import { createPvPHandlers } from './pvp.handlers.js';
import { createBossRaidHandlers } from './bossraid.handlers.js';
import { createNPCHandlers } from './npc.handlers.js';
import { createEconomyHandlers } from './economy.handlers.js';
import { createTrustHandlers } from './trust.handlers.js';
import { createQuestHandlers } from './quest.handlers.js';
import { createSurvivalHandlers } from './survival.handlers.js';
import { createNavigationHandlers } from './navigation.handlers.js';
import { createChatHandlers } from './chat.handlers.js';
import { createNarrativeHandlers } from './narrative.handlers.js';
import { createWorldEventsHandlers } from './worldevents.handlers.js';
import { createMissionsHandlers } from './missions.handlers.js';
import { createAdminUtilsHandlers } from './admin.handlers.js';

/**
 * Crea todos los handlers del sistema
 * @param {Object} dependencies - Dependencias compartidas
 * @returns {Object} Objeto con todos los handlers combinados
 */
export function createAllHandlers(dependencies) {
    const aiHandlers = createAIHandlers(dependencies);
    const combatHandlers = createCombatHandlers(dependencies);
    const craftingHandlers = createCraftingHandlers(dependencies);
    const marketHandlers = createMarketHandlers(dependencies);
    const raidHandlers = createRaidHandlers(dependencies);
    const clanHandlers = createClanHandlers(dependencies);
    const pvpHandlers = createPvPHandlers(dependencies);
    const bossRaidHandlers = createBossRaidHandlers(dependencies);
    const npcHandlers = createNPCHandlers(dependencies);
    const economyHandlers = createEconomyHandlers(dependencies);
    const trustHandlers = createTrustHandlers(dependencies);
    const questHandlers = createQuestHandlers(dependencies);
    const survivalHandlers = createSurvivalHandlers(dependencies);
    const navigationHandlers = createNavigationHandlers(dependencies);
    const chatHandlers = createChatHandlers(dependencies);
    const narrativeHandlers = createNarrativeHandlers(dependencies);
    const worldEventsHandlers = createWorldEventsHandlers(dependencies);
    const missionsHandlers = createMissionsHandlers(dependencies);
    const adminUtilsHandlers = createAdminUtilsHandlers(dependencies);

    // Combinar todos los handlers en un solo objeto
    return {
        ...aiHandlers,
        ...combatHandlers,
        ...craftingHandlers,
        ...marketHandlers,
        ...raidHandlers,
        ...clanHandlers,
        ...pvpHandlers,
        ...bossRaidHandlers,
        ...npcHandlers,
        ...economyHandlers,
        ...trustHandlers,
        ...questHandlers,
        ...survivalHandlers,
        ...navigationHandlers,
        ...chatHandlers,
        ...narrativeHandlers,
        ...worldEventsHandlers,
        ...missionsHandlers,
        ...adminUtilsHandlers,
        // Aquí se agregarán más handlers en el futuro:
        // etc.
    };
}
