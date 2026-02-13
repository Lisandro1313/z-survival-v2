/**
 * test-new-architecture.js
 * Script de prueba para la nueva arquitectura
 * 
 * Ejecutar: node server/src/test-new-architecture.js
 */

import { initializeNewEngine, getLegacyAPI, EventBus } from './integrationBridge.js';
import { start as startLoop, stop as stopLoop } from './engine/SimulationLoop.js';

console.log('🧪 Iniciando test de nueva arquitectura...\n');

// 1. Inicializar motor
const { engine, world } = initializeNewEngine();
const api = getLegacyAPI(engine, world);

// 2. Escuchar eventos interesantes
EventBus.on('time:new_day', (data) => {
    console.log(`🌅 ¡Nuevo día! Día ${data.day}`);
});

EventBus.on('zombie:respawn', (data) => {
    console.log(`🧟 Zombies respawnearon en ${data.location}: ${data.count}`);
});

EventBus.on('npc:ate', (data) => {
    console.log(`🍖 ${data.name} comió (hambre: ${data.hunger})`);
});

EventBus.on('zombie:killed', (data) => {
    console.log(`⚔️ ${data.killed} zombies eliminados en ${data.location} (quedan: ${data.remaining}/${data.max})`);
});

// 3. Agregar algunos NPCs de prueba
world.npcs = {
    npc_test_1: {
        id: 'npc_test_1',
        nombre: 'Carlos el Superviviente',
        rol: 'civil',
        locacion: 'refugio',
        salud: 80,
        hambre: 40,
        moral: 70,
        vivo: true,
        estado: 'activo'
    },
    npc_test_2: {
        id: 'npc_test_2',
        nombre: 'Ana la Médica',
        rol: 'medico',
        locacion: 'refugio',
        salud: 100,
        hambre: 20,
        moral: 85,
        vivo: true,
        estado: 'activo'
    }
};

console.log('✅ NPCs de prueba agregados\n');

// 4. Probar API
console.log('--- PRUEBAS DE API ---\n');

// Matar zombies
console.log('1. Matando 3 zombies en supermercado...');
const killed = api.killZombie('supermercado', 3);
console.log(`   Resultado: ${killed} zombies eliminados\n`);

// Agregar ruido
console.log('2. Agregando ruido en hospital...');
api.addNoise('hospital', 75);
const hospitalData = api.getLocation('hospital');
console.log(`   Ruido actual: ${hospitalData.nivelRuido}/100\n`);

// Curar NPC
console.log('3. Curando a Carlos...');
api.healNpc('npc_test_1', 20);
const carlos = api.getNpc('npc_test_1');
console.log(`   Salud de Carlos: ${carlos.salud}/100\n`);

// Obtener stats de zombies
console.log('4. Stats de zombies por ubicación:');
const zombieStats = api.getZombieStats();
Object.entries(zombieStats).forEach(([loc, stats]) => {
    if (stats.max > 0) {
        console.log(`   ${loc}: ${stats.current}/${stats.max} (ruido: ${stats.noise})`);
    }
});
console.log('');

// 5. Ejecutar algunos ticks manualmente
console.log('--- SIMULANDO 5 TICKS ---\n');
for (let i = 0; i < 5; i++) {
    console.log(`Tick ${i + 1}:`);
    engine.tick();
    const time = api.getTime();
    console.log(`  Hora: ${time.hour}:00 | Día: ${time.day} | ${time.isNight ? '🌙 Noche' : '☀️ Día'}\n`);
}

// 6. Mostrar métricas finales
console.log('--- MÉTRICAS FINALES ---');
const metrics = api.getMetrics();
console.log(metrics);

console.log('\n✅ Test completado exitosamente!');
console.log('\n📝 Para usar con el servidor real:');
console.log('   1. Importar initializeNewEngine en survival_mvp.js');
console.log('   2. Llamar tickNewArchitecture() en el setInterval');
console.log('   3. Usar newAPI en lugar de tocar WORLD directamente');
console.log('\n🎯 Próximos pasos: Migrar más sistemas del survival_mvp.js');
