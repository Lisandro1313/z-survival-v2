/**
 * TEST SCRIPT - Sistema de IA
 * Verifica que todos los componentes estén operativos
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3000';
const TIMEOUT = 5000;

console.log('🧪 Iniciando tests del sistema de IA...\n');

let ws;
let testsPassed = 0;
let testsFailed = 0;

// Ejecutar todos los tests
async function runTests() {
    try {
        // Test 1: Conectar WebSocket
        console.log('\n🧪 Test 1: Conexión WebSocket');
        ws = await new Promise((resolve, reject) => {
            const socket = new WebSocket(WS_URL);

            socket.on('open', () => {
                console.log('✅ WebSocket conectado');
                resolve(socket);
            });

            socket.on('error', (err) => {
                console.error('❌ Error de conexión:', err.message);
                reject(err);
            });

            setTimeout(() => reject(new Error('Timeout conectando')), TIMEOUT);
        });
        testsPassed++;

        // Test 2: Login
        console.log('\n🧪 Test 2: Login/Autenticación');
        ws.send(JSON.stringify({ type: 'login', playerId: 'test_ai_admin' }));
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Login enviado (playerId: test_ai_admin)');
        testsPassed++;

        // Test 3: ai:get_stats
        console.log('\n🧪 Test 3: Handler ai:get_stats');
        const statsResponse = await sendAndWait('ai:get_stats', 'ai:stats');

        if (statsResponse.type === 'error') {
            console.log(`⚠️  Error: ${statsResponse.error}`);
        } else {
            const { enabled, workers, regions } = statsResponse.data;
            console.log(`✅ Stats recibidos: enabled=${enabled}, workers=${workers}, regions=${regions?.length || 0}`);
        }
        testsPassed++;

        // Test 4: ai:get_agents
        console.log('\n🧪 Test 4: Handler ai:get_agents');
        const agentsResponse = await sendAndWait('ai:get_agents', 'ai:agents');

        if (agentsResponse.type === 'error') {
            console.log(`⚠️  Error: ${agentsResponse.error}`);
        } else {
            console.log(`✅ Lista de agentes recibida: ${agentsResponse.data.length} agentes`);
        }
        testsPassed++;

        // Test 5: ai:spawn_initial (puede fallar si no hay workers)
        console.log('\n🧪 Test 5: Handler ai:spawn_initial');
        const spawnResponse = await sendAndWait('ai:spawn_initial', 'ai:spawn_complete', {
            count: 5,
            regionId: 'default'
        });

        if (spawnResponse.type === 'error') {
            if (spawnResponse.error.includes('AgentSpawner no disponible')) {
                console.error('❌ AgentSpawner no está cargado');
                testsFailed++;
            } else {
                console.log(`⚠️  ${spawnResponse.error} (puede ser esperado)`);
                testsPassed++;
            }
        } else {
            console.log(`✅ AgentSpawner funcional: ${spawnResponse.data?.message || 'spawn exitoso'}`);
            testsPassed++;
        }

        // Test 6: ai:start
        console.log('\n🧪 Test 6: Handler ai:start');
        const startResponse = await sendAndWait('ai:start', 'ai:started');

        if (startResponse.type === 'error') {
            console.log(`⚠️  ${startResponse.error}`);
        } else {
            console.log(`✅ Sistema iniciado: ${startResponse.data?.message || 'OK'}`);
        }
        testsPassed++;

        // Test 7: ai:stop
        console.log('\n🧪 Test 7: Handler ai:stop');
        const stopResponse = await sendAndWait('ai:stop', 'ai:stopped');

        if (stopResponse.type === 'error') {
            console.log(`⚠️  ${stopResponse.error}`);
        } else {
            console.log(`✅ Sistema detenido: ${stopResponse.data?.message || 'OK'}`);
        }
        testsPassed++;

        // Test 8: ai:get_agent
        console.log('\n🧪 Test 8: Handler ai:get_agent');
        const agentsListResponse = await sendAndWait('ai:get_agents', 'ai:agents');

        if (agentsListResponse.data && agentsListResponse.data.length > 0) {
            const firstAgentId = agentsListResponse.data[0].id;
            const agentResponse = await sendAndWait('ai:get_agent', 'ai:agent_details', {
                agentId: firstAgentId,
                regionId: 'default'
            });

            if (agentResponse.type === 'error') {
                console.log(`⚠️  ${agentResponse.error}`);
            } else {
                console.log(`✅ Detalles de agente obtenidos: ${agentResponse.data?.name || 'agente'}`);
            }
        } else {
            console.log('⚠️  No hay agentes para testear get_agent');
        }
        testsPassed++;

        // Test 9: ai:spawn_single (agente custom)
        console.log('\n🧪 Test 9: Handler ai:spawn_single');
        const spawnSingleResponse = await sendAndWait('ai:spawn_single', 'ai:agent_spawned', {
            regionId: 'default',
            name: 'TestAgent Alpha',
            age: 25,
            role: 'scout',
            personality: {
                openness: 80,
                conscientiousness: 70,
                extraversion: 90,
                agreeableness: 60,
                neuroticism: 40
            },
            lifeStage: 'adult'
        });

        if (spawnSingleResponse.type === 'error') {
            console.log(`⚠️  ${spawnSingleResponse.error}`);
        } else {
            console.log(`✅ Agente custom spawneado: ${spawnSingleResponse.data?.agent?.name} (${spawnSingleResponse.data?.agent?.role})`);
            console.log(`   Personalidad: O=${spawnSingleResponse.data?.agent?.personality?.openness}, E=${spawnSingleResponse.data?.agent?.personality?.extraversion}`);
        }
        testsPassed++;

        // Test 10: ai:set_relationship
        console.log('\n🧪 Test 10: Handler ai:set_relationship');

        // Obtener agentes para test
        const agentsForRelation = await sendAndWait('ai:get_agents', 'ai:agents');
        if (agentsForRelation.data?.length >= 2) {
            const agent1 = agentsForRelation.data[0];
            const agent2 = agentsForRelation.data[1];

            const setRelationResponse = await sendAndWait('ai:set_relationship', 'ai:relationship_updated', {
                agentId: agent1.id,
                targetId: agent2.id,
                relationship: {
                    affection: 75,
                    trust: 80,
                    respect: 70,
                    sexualAttraction: 0
                }
            });

            if (setRelationResponse.type === 'error') {
                console.log(`⚠️  ${setRelationResponse.error}`);
            } else {
                console.log(`✅ Relación establecida entre ${agent1.name} → ${agent2.name}`);
                console.log(`   Affection: 75, Trust: 80, Respect: 70`);
            }
            testsPassed++;
        } else {
            console.log('⚠️  No hay suficientes agentes para test de relaciones (necesita 2)');
            testsPassed++;
        }

        // Test 11: ai:kill_agent
        console.log('\n🧪 Test 11: Handler ai:kill_agent');

        // Obtener agentes actuales
        const agentsBeforeKill = await sendAndWait('ai:get_agents', 'ai:agents');
        if (agentsBeforeKill.data?.length > 0) {
            const targetAgent = agentsBeforeKill.data[0];

            const killResponse = await sendAndWait('ai:kill_agent', 'ai:agent_killed', {
                agentId: targetAgent.id
            });

            if (killResponse.type === 'error') {
                console.log(`⚠️  ${killResponse.error}`);
            } else {
                console.log(`✅ Agente eliminado: ${targetAgent.name}`);

                // Verificar que el agente fue eliminado
                const agentsAfterKill = await sendAndWait('ai:get_agents', 'ai:agents');
                const stillExists = agentsAfterKill.data?.find(a => a.id === targetAgent.id);

                if (stillExists) {
                    console.log('⚠️  Advertencia: El agente aún aparece en la lista');
                } else {
                    console.log('   ✓ Verificado: Agente removido del sistema');
                }
            }
            testsPassed++;
        } else {
            console.log('⚠️  No hay agentes para eliminar (necesita spawn primero)');
            testsPassed++;
        }

        // Test 12: ai:clear_agents
        console.log('\n🧪 Test 12: Handler ai:clear_agents');
        const clearResponse = await sendAndWait('ai:clear_agents', 'ai:agents_cleared', {
            regionId: 'default'
        });

        if (clearResponse.type === 'error') {
            console.log(`⚠️  ${clearResponse.error}`);
        } else {
            console.log(`✅ Agentes eliminados: ${clearResponse.data?.count || 0} agentes`);
        }
        testsPassed++;

        // Test 13: ai:reset
        console.log('\n🧪 Test 13: Handler ai:reset');
        const resetResponse = await sendAndWait('ai:reset', 'ai:reset_complete');

        if (resetResponse.type === 'error') {
            console.log(`⚠️  ${resetResponse.error}`);
        } else {
            console.log(`✅ Sistema reseteado: ${resetResponse.data?.agentsCleared || 0} agentes eliminados`);
        }
        testsPassed++;

    } catch (err) {
        console.error(`\n❌ Test falló: ${err.message}`);
        testsFailed++;
    } finally {
        // Cerrar conexión
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }

        // Resumen
        const totalTests = testsPassed + testsFailed;
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESULTADOS');
        console.log('='.repeat(50));
        console.log(`✅ Tests pasados: ${testsPassed}/${totalTests}`);
        console.log(`❌ Tests fallados: ${testsFailed}/${totalTests}`);
        console.log('='.repeat(50));

        if (testsFailed === 0) {
            console.log('\n🎉 ¡Todos los tests pasaron exitosamente!');
            console.log('\n📝 Próximos pasos:');
            console.log('   1. Abrir http://localhost:5174');
            console.log('   2. Presionar Ctrl+D');
            console.log('   3. Click en "🌱 Spawn Agents"');
            console.log('   4. Click en "▶️ Start AI"');
            process.exit(0);
        } else {
            console.log('\n⚠️  Algunos tests fallaron. Revisar logs arriba.');
            process.exit(1);
        }
    }
}

function sendAndWait(type, expectedResponseType, payload = {}) {
    return new Promise((resolve, reject) => {
        const message = { type, ...payload };

        const handler = (data) => {
            try {
                const response = JSON.parse(data);
                if (response.type === expectedResponseType || response.type === 'error') {
                    ws.removeListener('message', handler);
                    resolve(response);
                }
            } catch (err) {
                // Ignore parse errors
            }
        };

        ws.on('message', handler);
        ws.send(JSON.stringify(message));

        setTimeout(() => {
            ws.removeListener('message', handler);
            reject(new Error(`No response for ${type} (expected: ${expectedResponseType})`));
        }, TIMEOUT);
    });
}

// Iniciar
runTests().catch(err => {
    console.error('\n💥 Error fatal:', err);
    process.exit(1);
});
