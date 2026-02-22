import * as playerHandlers from './playerHandlers'
import * as worldHandlers from './worldHandlers'
import * as combatHandlers from './combatHandlers'
import * as radioHandlers from './radioHandlers'
import * as craftingHandlers from './craftingHandlers'
import * as economyHandlers from './economyHandlers'
import * as marketHandlers from './marketHandlers'
import * as constructionHandlers from './constructionHandlers'
import * as clanHandlers from './clanHandlers'
import * as raidHandlers from './raidHandlers'
import * as bossRaidHandlers from './bossRaidHandlers'
import * as pvpHandlers from './pvpHandlers'
import * as fogataHandlers from './fogataHandlers'
import * as narrativeHandlers from './narrativeHandlers'
import * as questHandlers from './questHandlers'
import * as trustHandlers from './trustHandlers'
import { socialHandlers } from './socialHandlers'

type MessageHandler = (payload: unknown) => void

export function getHandlers(): Record<string, MessageHandler> {
  return {
    // Player handlers
    'player:data': playerHandlers.onPlayerData,
    'player:update': playerHandlers.onPlayerUpdate,
    'player:levelup': playerHandlers.onPlayerLevelUp,
    
    // World handlers
    'world:state': worldHandlers.onWorldState,
    'world:update': worldHandlers.onWorldUpdate,
    'world:nodes': worldHandlers.onWorldNodes,
    'moved': worldHandlers.onMoved,
    'entity.update': worldHandlers.onEntityUpdate,
    'active_events': worldHandlers.onActiveEvents,
    
    // Combat handlers
    'combat': combatHandlers.onCombatStarted,
    'combat:started': combatHandlers.onCombatStarted,
    'combat:turn_result': combatHandlers.onCombatTurnResult,
    'combat:victory': combatHandlers.onCombatVictory,
    'combat:defeat': combatHandlers.onCombatDefeat,
    'combat:flee': combatHandlers.onCombatFlee,
    
    // Crafting handlers
    'crafting:recipes': craftingHandlers.onCraftingRecipes,
    'crafting:success': craftingHandlers.onCraftingSuccess,
    'crafting:failed': craftingHandlers.onCraftingFailed,
    
    // Economy handlers
    'economy:data': economyHandlers.onEconomyData as MessageHandler,
    'economy:purchase_success': economyHandlers.onPurchaseSuccess as MessageHandler,
    'economy:sale_success': economyHandlers.onSaleSuccess as MessageHandler,
    'economy:caps_updated': economyHandlers.onCapsUpdated as MessageHandler,
    
    // Marketplace handlers
    'market:listings': marketHandlers.onMarketListings as MessageHandler,
    'market:listing_created': marketHandlers.onListingCreated as MessageHandler,
    'market:purchase_success': marketHandlers.onPurchaseSuccess as MessageHandler,
    'market:bid_placed': marketHandlers.onBidPlaced as MessageHandler,
    'market:auction_won': marketHandlers.onAuctionWon as MessageHandler,
    
    // Construction handlers
    'construction:started': constructionHandlers.onConstructionStarted as MessageHandler,
    'construction:progress': constructionHandlers.onConstructionProgress as MessageHandler,
    'construction:completed': constructionHandlers.onConstructionCompleted as MessageHandler,
    'construction_contributed': constructionHandlers.onConstructionContributed as MessageHandler,
    
    // Clan handlers
    'clan:my_info': clanHandlers.onClanMyInfo as MessageHandler,
    'clan:created': clanHandlers.onClanCreated as MessageHandler,
    'clan:joined': clanHandlers.onClanJoined as MessageHandler,
    'clan:left': clanHandlers.onClanLeft as MessageHandler,
    'clan:recruiting_list': clanHandlers.onClanRecruitingList as MessageHandler,
    'clan:invite_received': clanHandlers.onClanInviteReceived as MessageHandler,
    'clan:member_joined': clanHandlers.onClanMemberJoined as MessageHandler,
    'clan:storage_updated': clanHandlers.onClanStorageUpdated as MessageHandler,
    
    // Raid handlers
    'raid:started': raidHandlers.onRaidStarted as MessageHandler,
    'raid:wave': raidHandlers.onRaidWave as MessageHandler,
    'raid:defense_triggered': raidHandlers.onRaidDefenseTriggered as MessageHandler,
    'raid:completed': raidHandlers.onRaidCompleted as MessageHandler,
    'raid:failed': raidHandlers.onRaidFailed,
    
    // Boss Raid handlers
    'bossraid:bosses_list': bossRaidHandlers.onBosseslist as MessageHandler,
    'bossraid:active_raids': bossRaidHandlers.onActiveRaids as MessageHandler,
    'bossraid:boss_spawned': bossRaidHandlers.onBossSpawned as MessageHandler,
    'bossraid:player_joined': bossRaidHandlers.onPlayerJoined as MessageHandler,
    'bossraid:attack_result': bossRaidHandlers.onAttackResult as MessageHandler,
    'bossraid:phase_change': bossRaidHandlers.onPhaseChange as MessageHandler,
    'bossraid:victory': bossRaidHandlers.onVictory,
    'bossraid:leaderboard': bossRaidHandlers.onLeaderboard as MessageHandler,
    'bossraid:achievements': bossRaidHandlers.onAchievements as MessageHandler,
    
    // PvP handlers
    'pvp:duel_invitation': pvpHandlers.onDuelInvitation as MessageHandler,
    'pvp:duel_started': pvpHandlers.onDuelStarted as MessageHandler,
    'pvp:duel_round_result': pvpHandlers.onDuelRoundResult as MessageHandler,
    'pvp:duel_ended': pvpHandlers.onDuelEnded as MessageHandler,
    'pvp:karma_data': pvpHandlers.onKarmaData as MessageHandler,
    'pvp:ranking': pvpHandlers.onRanking as MessageHandler,
    
    // Social/Fogata handlers (legacy)
    'fogata:posts': fogataHandlers.onFogataPosts as MessageHandler,
    'fogata:like_added': fogataHandlers.onLikeAdded as MessageHandler,
    'fogata:comment_added': fogataHandlers.onCommentAdded as MessageHandler,
    'game:joined': fogataHandlers.onGameJoined as MessageHandler,
    'game:started': fogataHandlers.onGameStarted as MessageHandler,
    'game:finished': fogataHandlers.onGameFinished as MessageHandler,
    
    // Narrative handlers
    'narrative:missions': narrativeHandlers.onNarrativeMissions as MessageHandler,
    'narrative:started': narrativeHandlers.onNarrativeStarted as MessageHandler,
    'narrative:nextStep': narrativeHandlers.onNarrativeNextStep as MessageHandler,
    'narrative:completed': narrativeHandlers.onNarrativeCompleted as MessageHandler,
    
    // Quest handlers
    'missions:list': questHandlers.onMissionsList as MessageHandler,
    'mission:new': questHandlers.onMissionNew as MessageHandler,
    'mission:accepted': questHandlers.onMissionAccepted as MessageHandler,
    'mission:completed': questHandlers.onMissionCompleted as MessageHandler,
    'mission:expired': questHandlers.onMissionExpired as MessageHandler,
    
    // Trust handlers
    'trust:data': trustHandlers.onTrustData as MessageHandler,
    'trust:all_data': trustHandlers.onTrustAllData as MessageHandler,
    'trust:updated': trustHandlers.onTrustUpdated as MessageHandler,
    'trust:gift_given': trustHandlers.onTrustGiftGiven as MessageHandler,
    
    // Radio handlers
    'radio:receive': radioHandlers.onRadioReceive,
    'radio:joined': radioHandlers.onRadioJoined,
    
    // Social handlers (NUEVO - sistema completo)
    ...socialHandlers,
    
    // Error handler
    'error': (payload: any) => {
      console.error('[WS] Server error:', payload?.message || payload)
    }
  }
}

// Export all handlers for adding more dynamically
export { 
  playerHandlers, 
  worldHandlers, 
  combatHandlers, 
  radioHandlers,
  craftingHandlers,
  economyHandlers,
  marketHandlers,
  constructionHandlers,
  clanHandlers,
  raidHandlers,
  bossRaidHandlers,
  pvpHandlers,
  fogataHandlers,
  narrativeHandlers,
  questHandlers,
  trustHandlers,
  socialHandlers
}
