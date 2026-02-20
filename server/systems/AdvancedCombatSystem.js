/**
 * SISTEMA DE COMBATE AVANZADO
 * Incluye tipos de zombies, armas, armadura, habilidades y efectos de estado
 */

export class AdvancedCombatSystem {
    constructor() {
        this.initializeWeapons();
        this.initializeArmor();
        this.initializeZombieTypes();
        this.initializeAbilities();
        this.initializeLootTables();
    }

    /**
     * SISTEMA DE ARMAS CON STATS
     */
    initializeWeapons() {
        this.weapons = {
            // ARMAS CUERPO A CUERPO
            puños: {
                nombre: 'Puños',
                tipo: 'melee',
                dañoMin: 3,
                dañoMax: 8,
                crítico: 0.05,
                precisión: 0.85,
                velocidad: 1.2,
                durabilidad: Infinity,
                rareza: 'común',
                nivel: 1,
                icono: '✊',
                descripción: 'Tus propias manos. Poco daño pero siempre disponibles.'
            },
            cuchillo: {
                nombre: 'Cuchillo',
                tipo: 'melee',
                dañoMin: 8,
                dañoMax: 15,
                crítico: 0.15,
                precisión: 0.90,
                velocidad: 1.5,
                durabilidad: 50,
                rareza: 'común',
                nivel: 1,
                icono: '🔪',
                descripción: 'Rápido y silencioso. Buena chance de crítico.',
                efectoEspecial: { tipo: 'sangrado', chance: 0.20 }
            },
            bate: {
                nombre: 'Bate de Béisbol',
                tipo: 'melee',
                dañoMin: 15,
                dañoMax: 25,
                crítico: 0.10,
                precisión: 0.80,
                velocidad: 0.9,
                durabilidad: 40,
                rareza: 'común',
                nivel: 2,
                icono: '⚾',
                descripción: 'Buen daño pero un poco lento.',
                efectoEspecial: { tipo: 'aturdimiento', chance: 0.15 }
            },
            machete: {
                nombre: 'Machete',
                tipo: 'melee',
                dañoMin: 20,
                dañoMax: 35,
                crítico: 0.20,
                precisión: 0.85,
                velocidad: 1.0,
                durabilidad: 60,
                rareza: 'poco_común',
                nivel: 3,
                icono: '🗡️',
                descripción: 'Arma equilibrada con buen daño y críticos.',
                efectoEspecial: { tipo: 'sangrado', chance: 0.30 }
            },
            katana: {
                nombre: 'Katana',
                tipo: 'melee',
                dañoMin: 30,
                dañoMax: 50,
                crítico: 0.30,
                precisión: 0.92,
                velocidad: 1.3,
                durabilidad: 80,
                rareza: 'rara',
                nivel: 5,
                icono: '⚔️',
                descripción: 'Arma exótica extremadamente afilada. Alta chance de crítico.',
                efectoEspecial: { tipo: 'desmembramiento', chance: 0.25 }
            },
            sierra_electrica: {
                nombre: 'Sierra Eléctrica',
                tipo: 'melee',
                dañoMin: 40,
                dañoMax: 70,
                crítico: 0.15,
                precisión: 0.75,
                velocidad: 0.8,
                durabilidad: 30,
                rareza: 'épica',
                nivel: 6,
                icono: '🪚',
                descripción: 'Devastadora pero consume combustible rápido.',
                efectoEspecial: { tipo: 'mutilación', chance: 0.40, dañoExtra: 20 }
            },

            // ARMAS A DISTANCIA
            pistola: {
                nombre: 'Pistola',
                tipo: 'ranged',
                dañoMin: 20,
                dañoMax: 30,
                crítico: 0.12,
                precisión: 0.75,
                velocidad: 1.2,
                munición: 12,
                alcance: 'corto',
                durabilidad: 100,
                rareza: 'común',
                nivel: 2,
                icono: '🔫',
                descripción: 'Arma de fuego básica. Hace ruido.',
                ruido: 70
            },
            escopeta: {
                nombre: 'Escopeta',
                tipo: 'ranged',
                dañoMin: 40,
                dañoMax: 60,
                crítico: 0.08,
                precisión: 0.65,
                velocidad: 0.7,
                munición: 8,
                alcance: 'corto',
                durabilidad: 80,
                rareza: 'poco_común',
                nivel: 3,
                icono: '🔫',
                descripción: 'Gran daño a corta distancia. Muy ruidosa.',
                ruido: 90,
                efectoEspecial: { tipo: 'dispersión', targets: 2 }
            },
            rifle: {
                nombre: 'Rifle de Asalto',
                tipo: 'ranged',
                dañoMin: 25,
                dañoMax: 40,
                crítico: 0.15,
                precisión: 0.85,
                velocidad: 1.5,
                munición: 30,
                alcance: 'largo',
                durabilidad: 120,
                rareza: 'rara',
                nivel: 4,
                icono: '🔫',
                descripción: 'Versátil y precisa. Puede disparar ráfagas.',
                ruido: 80,
                efectoEspecial: { tipo: 'ráfaga', disparos: 3 }
            },
            francotirador: {
                nombre: 'Rifle Francotirador',
                tipo: 'ranged',
                dañoMin: 60,
                dañoMax: 100,
                crítico: 0.50,
                precisión: 0.95,
                velocidad: 0.5,
                munición: 5,
                alcance: 'largo',
                durabilidad: 100,
                rareza: 'épica',
                nivel: 6,
                icono: '🎯',
                descripción: 'Daño masivo y alta chance de crítico. Muy lenta.',
                ruido: 100,
                efectoEspecial: { tipo: 'perforación', ignoraArmadura: 0.5 }
            },
            ballesta: {
                nombre: 'Ballesta',
                tipo: 'ranged',
                dañoMin: 30,
                dañoMax: 45,
                crítico: 0.20,
                precisión: 0.80,
                velocidad: 0.8,
                munición: 15,
                alcance: 'medio',
                durabilidad: 60,
                rareza: 'poco_común',
                nivel: 3,
                icono: '🏹',
                descripción: 'Silenciosa y letal. No hace ruido.',
                ruido: 10,
                efectoEspecial: { tipo: 'sangrado', chance: 0.30 }
            },
            lanzallamas: {
                nombre: 'Lanzallamas',
                tipo: 'ranged',
                dañoMin: 35,
                dañoMax: 55,
                crítico: 0.05,
                precisión: 0.90,
                velocidad: 1.0,
                munición: 20,
                alcance: 'corto',
                durabilidad: 40,
                rareza: 'legendaria',
                nivel: 7,
                icono: '🔥',
                descripción: 'Quema grupos de zombies. Daño sobre tiempo.',
                ruido: 60,
                efectoEspecial: { tipo: 'quemadura', daño_tiempo: 5, duración: 3, targets: 3 }
            }
        };
    }

    /**
     * SISTEMA DE ARMADURA
     */
    initializeArmor() {
        this.armor = {
            sin_armadura: {
                nombre: 'Sin Armadura',
                defensa: 0,
                reducción: 0,
                peso: 0,
                agilidad: 0,
                durabilidad: Infinity,
                rareza: 'común',
                icono: '👕',
                descripción: 'Sin protección alguna.'
            },
            ropa_reforzada: {
                nombre: 'Ropa Reforzada',
                defensa: 5,
                reducción: 0.05,
                peso: 2,
                agilidad: -0.05,
                durabilidad: 30,
                rareza: 'común',
                nivel: 1,
                icono: '🧥',
                descripción: 'Chaqueta de cuero con refuerzos. 5% reducción de daño.'
            },
            chaleco_antibalas: {
                nombre: 'Chaleco Antibalas',
                defensa: 15,
                reducción: 0.15,
                peso: 5,
                agilidad: -0.10,
                durabilidad: 50,
                rareza: 'poco_común',
                nivel: 2,
                icono: '🦺',
                descripción: 'Protección militar estándar. 15% reducción de daño.'
            },
            armadura_policial: {
                nombre: 'Armadura Policial',
                defensa: 25,
                reducción: 0.25,
                peso: 8,
                agilidad: -0.15,
                durabilidad: 70,
                rareza: 'rara',
                nivel: 3,
                icono: '👮',
                descripción: 'Armadura completa de policía antidisturbios. 25% reducción.'
            },
            armadura_militar: {
                nombre: 'Armadura Militar',
                defensa: 40,
                reducción: 0.40,
                peso: 12,
                agilidad: -0.25,
                durabilidad: 100,
                rareza: 'épica',
                nivel: 5,
                icono: '🪖',
                descripción: 'Armadura de combate del ejército. 40% reducción de daño.'
            },
            traje_antidisturbios: {
                nombre: 'Traje Antidisturbios',
                defensa: 60,
                reducción: 0.50,
                peso: 20,
                agilidad: -0.40,
                durabilidad: 150,
                rareza: 'legendaria',
                nivel: 7,
                icono: '🛡️',
                descripción: 'Protección máxima. 50% reducción pero reduce agilidad.'
            }
        };
    }

    /**
     * TIPOS DE ZOMBIES MEJORADOS
     */
    initializeZombieTypes() {
        this.zombieTypes = {
            normal: {
                nombre: 'Zombie Normal',
                icono: '🧟',
                hp: 30,
                dañoMin: 8,
                dañoMax: 15,
                defensa: 0,
                velocidad: 1,
                xp: 10,
                nivel: 1,
                habilidades: [],
                rareza: 0.50,
                descripción: 'Zombie común y corriente. Lento pero peligroso.'
            },
            corredor: {
                nombre: 'Corredor Infectado',
                icono: '🧟‍♂️',
                hp: 20,
                dañoMin: 12,
                dañoMax: 20,
                defensa: 0,
                velocidad: 2.5,
                xp: 15,
                nivel: 2,
                habilidades: ['ataque_doble'],
                rareza: 0.25,
                descripción: 'Extremadamente rápido. Puede atacar dos veces.'
            },
            tanque: {
                nombre: 'Zombie Tanque',
                icono: '💪',
                hp: 100,
                dañoMin: 20,
                dañoMax: 35,
                defensa: 20,
                velocidad: 0.5,
                xp: 50,
                nivel: 4,
                habilidades: ['resistencia', 'golpe_aturdidor'],
                rareza: 0.08,
                descripción: 'Enorme y resistente. Sus golpes aturden.'
            },
            gritón: {
                nombre: 'Gritón',
                icono: '😱',
                hp: 15,
                dañoMin: 5,
                dañoMax: 10,
                defensa: 0,
                velocidad: 1.2,
                xp: 20,
                nivel: 2,
                habilidades: ['llamar_refuerzos'],
                rareza: 0.15,
                descripción: 'Grita al morir, atrayendo más zombies.'
            },
            explosivo: {
                nombre: 'Explosivo',
                icono: '💥',
                hp: 25,
                dañoMin: 10,
                dañoMax: 15,
                defensa: 0,
                velocidad: 1,
                xp: 25,
                nivel: 3,
                habilidades: ['explosión_muerte'],
                rareza: 0.12,
                descripción: 'Explota al morir, causando daño masivo.'
            },
            tóxico: {
                nombre: 'Zombie Tóxico',
                icono: '☣️',
                hp: 35,
                dañoMin: 10,
                dañoMax: 18,
                defensa: 5,
                velocidad: 0.8,
                xp: 30,
                nivel: 3,
                habilidades: ['veneno'],
                rareza: 0.10,
                descripción: 'Sus ataques envenenan, causando daño continuo.'
            },
            radiactivo: {
                nombre: 'Zombie Radiactivo',
                icono: '☢️',
                hp: 40,
                dañoMin: 15,
                dañoMax: 25,
                defensa: 10,
                velocidad: 1.0,
                xp: 40,
                nivel: 4,
                habilidades: ['radiación', 'regeneración'],
                rareza: 0.07,
                descripción: 'Emite radiación y se regenera lentamente.'
            },
            cazador: {
                nombre: 'Cazador',
                icono: '🐺',
                hp: 45,
                dañoMin: 20,
                dañoMax: 30,
                defensa: 5,
                velocidad: 2.0,
                xp: 45,
                nivel: 5,
                habilidades: ['emboscada', 'garras_afiladas'],
                rareza: 0.06,
                descripción: 'Ágil y letal. Causa daño crítico extra.'
            },
            berserker: {
                nombre: 'Berserker',
                icono: '😡',
                hp: 80,
                dañoMin: 25,
                dañoMax: 40,
                defensa: 10,
                velocidad: 1.5,
                xp: 60,
                nivel: 5,
                habilidades: ['furia', 'embestida'],
                rareza: 0.05,
                descripción: 'Se vuelve más peligroso al estar herido.'
            },
            abominación: {
                nombre: 'Abominación',
                icono: '👹',
                hp: 150,
                dañoMin: 30,
                dañoMax: 50,
                defensa: 25,
                velocidad: 0.7,
                xp: 100,
                nivel: 6,
                habilidades: ['regeneración', 'golpe_devastador', 'resistencia'],
                rareza: 0.03,
                descripción: 'Mini-boss. Extremadamente peligroso.'
            }
        };
    }

    /**
     * HABILIDADES ESPECIALES DEL JUGADOR
     */
    initializeAbilities() {
        this.abilities = {
            golpe_crítico: {
                nombre: 'Golpe Crítico',
                descripción: 'Tu próximo ataque hace el doble de daño',
                cooldown: 30,
                costo: { stamina: 20 },
                efecto: { crítico_garantizado: true, multiplicador: 2.0 },
                icono: '💥'
            },
            esquiva: {
                nombre: 'Esquiva Perfecta',
                descripción: 'Evita el próximo ataque enemigo',
                cooldown: 45,
                costo: { stamina: 25 },
                efecto: { esquiva_garantizada: true },
                icono: '🌀'
            },
            ráfaga: {
                nombre: 'Ráfaga de Disparos',
                descripción: 'Dispara 5 veces rápidamente (requiere arma)',
                cooldown: 60,
                costo: { stamina: 30, munición: 5 },
                efecto: { disparos: 5, daño_reducido: 0.6 },
                icono: '🔫'
            },
            grito_guerra: {
                nombre: 'Grito de Guerra',
                descripción: 'Aumenta tu daño un 50% por 3 turnos',
                cooldown: 90,
                costo: { stamina: 40 },
                efecto: { buff_daño: 1.5, duración: 3 },
                icono: '💪'
            },
            curación_rápida: {
                nombre: 'Curación de Emergencia',
                descripción: 'Recupera 30% de tu vida máxima',
                cooldown: 120,
                costo: { medicinas: 1 },
                efecto: { curación: 0.30 },
                icono: '💊'
            },
            golpe_aturdidor: {
                nombre: 'Golpe Aturdidor',
                descripción: 'Aturde al enemigo (pierde 1 turno)',
                cooldown: 40,
                costo: { stamina: 30 },
                efecto: { aturdimiento: 1 },
                icono: '🌟'
            },
            ejecución: {
                nombre: 'Ejecución',
                descripción: 'Mata instantáneamente a un enemigo con HP < 30%',
                cooldown: 180,
                costo: { stamina: 50 },
                efecto: { ejecución_threshold: 0.30 },
                icono: '☠️'
            },
            barrera: {
                nombre: 'Barrera Temporal',
                descripción: 'Reduce el daño recibido un 75% por 2 turnos',
                cooldown: 100,
                costo: { stamina: 35 },
                efecto: { reducción_daño: 0.75, duración: 2 },
                icono: '🛡️'
            }
        };
    }

    /**
     * TABLAS DE LOOT MEJORADAS
     */
    initializeLootTables() {
        this.lootTables = {
            normal: {
                común: [
                    { item: 'comida', cantidad: [1, 3], chance: 0.40 },
                    { item: 'materiales', cantidad: [1, 2], chance: 0.35 },
                    { item: 'cuchillo', cantidad: 1, chance: 0.15 },
                    { item: 'vendaje', cantidad: 1, chance: 0.20 }
                ],
                poco_común: [
                    { item: 'medicinas', cantidad: 1, chance: 0.10 },
                    { item: 'pistola', cantidad: 1, chance: 0.05 }
                ]
            },
            corredor: {
                común: [
                    { item: 'comida', cantidad: [2, 4], chance: 0.30 },
                    { item: 'zapatillas_velocidad', cantidad: 1, chance: 0.15 }
                ],
                poco_común: [
                    { item: 'medicinas', cantidad: [1, 2], chance: 0.20 }
                ]
            },
            tanque: {
                poco_común: [
                    { item: 'armadura_policial', cantidad: 1, chance: 0.15 },
                    { item: 'bate', cantidad: 1, chance: 0.20 }
                ],
                rara: [
                    { item: 'chaleco_antibalas', cantidad: 1, chance: 0.10 },
                    { item: 'escopeta', cantidad: 1, chance: 0.08 }
                ]
            },
            gritón: {
                común: [
                    { item: 'materiales', cantidad: [2, 4], chance: 0.40 }
                ],
                poco_común: [
                    { item: 'silenciador', cantidad: 1, chance: 0.12 }
                ]
            },
            explosivo: {
                poco_común: [
                    { item: 'granada', cantidad: [1, 2], chance: 0.30 },
                    { item: 'materiales', cantidad: [3, 5], chance: 0.25 }
                ],
                rara: [
                    { item: 'explosivo_c4', cantidad: 1, chance: 0.05 }
                ]
            },
            tóxico: {
                poco_común: [
                    { item: 'antídoto', cantidad: 1, chance: 0.25 },
                    { item: 'muestra_tóxica', cantidad: 1, chance: 0.15 }
                ]
            },
            radiactivo: {
                rara: [
                    { item: 'traje_hazmat', cantidad: 1, chance: 0.10 },
                    { item: 'cápsula_radiactiva', cantidad: 1, chance: 0.08 }
                ]
            },
            cazador: {
                poco_común: [
                    { item: 'machete', cantidad: 1, chance: 0.20 },
                    { item: 'garras', cantidad: 1, chance: 0.15 }
                ],
                rara: [
                    { item: 'katana', cantidad: 1, chance: 0.05 }
                ]
            },
            berserker: {
                rara: [
                    { item: 'armadura_militar', cantidad: 1, chance: 0.12 },
                    { item: 'rifle', cantidad: 1, chance: 0.10 }
                ],
                épica: [
                    { item: 'sierra_electrica', cantidad: 1, chance: 0.03 }
                ]
            },
            abominación: {
                rara: [
                    { item: 'rifle', cantidad: 1, chance: 0.40 },
                    { item: 'armadura_militar', cantidad: 1, chance: 0.35 }
                ],
                épica: [
                    { item: 'francotirador', cantidad: 1, chance: 0.15 },
                    { item: 'lanzallamas', cantidad: 1, chance: 0.10 }
                ],
                legendaria: [
                    { item: 'traje_antidisturbios', cantidad: 1, chance: 0.05 }
                ]
            }
        };
    }

    /**
     * GENERAR ZOMBIE SEGÚN NIVEL DEL JUGADOR
     */
    generateZombie(playerLevel = 1, forcedType = null) {
        if (forcedType && this.zombieTypes[forcedType]) {
            return this.createZombieInstance(forcedType);
        }

        // Calcular tipos disponibles según nivel
        const availableTypes = Object.entries(this.zombieTypes)
            .filter(([_, data]) => data.nivel <= playerLevel + 2);

        // Selección ponderada por rareza
        let roll = Math.random();
        for (const [tipo, data] of availableTypes) {
            roll -= data.rareza;
            if (roll <= 0) {
                return this.createZombieInstance(tipo);
            }
        }

        // Fallback a zombie normal
        return this.createZombieInstance('normal');
    }

    createZombieInstance(tipo) {
        const template = this.zombieTypes[tipo];
        return {
            tipo,
            ...template,
            hpActual: template.hp,
            hpMax: template.hp,
            efectosActivos: [],
            turnAturdido: 0
        };
    }

    /**
     * CALCULAR DAÑO DEL JUGADOR
     */
    calculatePlayerDamage(player, zombie, weapon, useAbility = null) {
        const arma = this.weapons[weapon] || this.weapons.puños;

        // Daño base del arma
        let daño = Math.floor(
            Math.random() * (arma.dañoMax - arma.dañoMin + 1) + arma.dañoMin
        );

        // Bonificación de stats del jugador
        const fuerzaMod = (player.atributos?.fuerza || 5) * 0.5;
        daño += fuerzaMod;

        // Bonificación de habilidad de combate
        const combatSkill = (player.skills?.combate || 1) * 2;
        daño += combatSkill;

        // Chance de crítico
        let crítico = false;
        const chanceCrítico = arma.crítico + ((player.atributos?.suerte || 5) * 0.01);
        if (Math.random() < chanceCrítico) {
            crítico = true;
            daño *= 2.0;
        }

        // Aplicar habilidad especial si está activa
        if (useAbility && this.abilities[useAbility]) {
            const ability = this.abilities[useAbility];
            if (ability.efecto.crítico_garantizado) crítico = true;
            if (ability.efecto.multiplicador) daño *= ability.efecto.multiplicador;
        }

        // Chequear precisión
        const precisión = arma.precisión + ((player.atributos?.agilidad || 5) * 0.01);
        const hit = Math.random() < precisión;

        if (!hit) {
            return { daño: 0, crítico: false, miss: true, arma: arma.nombre };
        }

        // Reducción por defensa del zombie
        daño = Math.max(1, daño - zombie.defensa);

        return { daño: Math.floor(daño), crítico, miss: false, arma: arma.nombre };
    }

    /**
     * CALCULAR DAÑO DEL ZOMBIE
     */
    calculateZombieDamage(zombie, player) {
        // Zombie aturdido no ataca
        if (zombie.turnAturdido > 0) {
            zombie.turnAturdido--;
            return { daño: 0, esquiva: false, aturdido: true };
        }

        // Daño base del zombie
        let daño = Math.floor(
            Math.random() * (zombie.dañoMax - zombie.dañoMin + 1) + zombie.dañoMin
        );

        // Habilidades especiales del zombie
        if (zombie.habilidades.includes('ataque_doble') && Math.random() < 0.3) {
            daño *= 2;
        }

        if (zombie.habilidades.includes('furia') && zombie.hpActual < zombie.hpMax * 0.5) {
            daño *= 1.5; // +50% daño cuando está debajo del 50% HP
        }

        // Jugador puede esquivar
        const agilidad = player.atributos?.agilidad || 5;
        const chanceEsquiva = Math.min(0.35, 0.05 + (agilidad * 0.02));
        const esquivado = Math.random() < chanceEsquiva;

        if (esquivado) {
            return { daño: 0, esquiva: true, aturdido: false };
        }

        // Reducción por armadura del jugador
        const armor = player.equipamiento?.armadura || 'sin_armadura';
        const armorData = this.armor[armor] || this.armor.sin_armadura;
        daño = Math.floor(daño * (1 - armorData.reducción));

        // Reducción por resistencia
        const resistencia = player.atributos?.resistencia || 5;
        const reducciónResistencia = Math.min(0.30, resistencia * 0.02);
        daño = Math.floor(daño * (1 - reducciónResistencia));

        return { daño: Math.max(1, daño), esquiva: false, aturdido: false };
    }

    /**
     * APLICAR EFECTOS ESPECIALES
     */
    applySpecialEffects(zombie, player, damage) {
        const effects = [];

        // Efectos de arma
        const weapon = player.equipamiento?.arma_principal || 'puños';
        const weaponData = this.weapons[weapon];

        if (weaponData.efectoEspecial) {
            const efecto = weaponData.efectoEspecial;
            if (Math.random() < (efecto.chance || 1)) {
                switch (efecto.tipo) {
                    case 'sangrado':
                        zombie.efectosActivos.push({
                            tipo: 'sangrado',
                            daño: 3,
                            turnos: 3
                        });
                        effects.push('🩸 ¡SANGRADO!');
                        break;
                    case 'aturdimiento':
                        zombie.turnAturdido = 1;
                        effects.push('💫 ¡ATURDIDO!');
                        break;
                    case 'quemadura':
                        zombie.efectosActivos.push({
                            tipo: 'quemadura',
                            daño: efecto.daño_tiempo || 5,
                            turnos: efecto.duración || 3
                        });
                        effects.push('🔥 ¡EN LLAMAS!');
                        break;
                    case 'veneno':
                        player.efectosActivos = player.efectosActivos || [];
                        player.efectosActivos.push({
                            tipo: 'veneno',
                            daño: 2,
                            turnos: 4
                        });
                        effects.push('☠️ ¡ENVENENADO!');
                        break;
                }
            }
        }

        // Efectos de habilidades del zombie
        if (zombie.habilidades.includes('veneno') && damage > 0) {
            player.efectosActivos = player.efectosActivos || [];
            player.efectosActivos.push({
                tipo: 'veneno',
                daño: 3,
                turnos: 3
            });
            effects.push('☣️ ¡ENVENENADO POR ZOMBIE TÓXICO!');
        }

        return effects;
    }

    /**
     * PROCESAR EFECTOS SOBRE TIEMPO
     */
    processStatusEffects(entity) {
        if (!entity.efectosActivos || entity.efectosActivos.length === 0) {
            return { dañoTotal: 0, efectos: [] };
        }

        let dañoTotal = 0;
        const efectosActuales = [];

        entity.efectosActivos = entity.efectosActivos.filter(efecto => {
            efecto.turnos--;

            if (efecto.turnos > 0) {
                dañoTotal += efecto.daño;
                entity.hpActual = Math.max(0, entity.hpActual - efecto.daño);
                efectosActuales.push(`${efecto.tipo}: -${efecto.daño} HP`);
                return true;
            }

            return false;
        });

        return { dañoTotal, efectos: efectosActuales };
    }

    /**
     * GENERAR LOOT AL MATAR ZOMBIE
     */
    generateLoot(zombieType) {
        const loot = {};
        const lootTable = this.lootTables[zombieType] || this.lootTables.normal;

        for (const [rareza, items] of Object.entries(lootTable)) {
            for (const itemData of items) {
                if (Math.random() < itemData.chance) {
                    const cantidad = Array.isArray(itemData.cantidad)
                        ? Math.floor(Math.random() * (itemData.cantidad[1] - itemData.cantidad[0] + 1)) + itemData.cantidad[0]
                        : itemData.cantidad;

                    loot[itemData.item] = (loot[itemData.item] || 0) + cantidad;
                }
            }
        }

        return loot;
    }

    /**
     * OBTENER INFO DE ARMA
     */
    getWeaponInfo(weaponKey) {
        return this.weapons[weaponKey] || null;
    }

    /**
     * OBTENER INFO DE ARMADURA
     */
    getArmorInfo(armorKey) {
        return this.armor[armorKey] || null;
    }

    /**
     * VERIFICAR SI EL JUGADOR PUEDE USAR HABILIDAD
     */
    canUseAbility(player, abilityKey) {
        const ability = this.abilities[abilityKey];
        if (!ability) return { can: false, reason: 'Habilidad no existe' };

        // Verificar cooldown
        const cooldowns = player.abilityCooldowns || {};
        const now = Date.now();
        if (cooldowns[abilityKey] && now < cooldowns[abilityKey]) {
            const segundos = Math.ceil((cooldowns[abilityKey] - now) / 1000);
            return { can: false, reason: `En cooldown (${segundos}s)` };
        }

        // Verificar costos
        if (ability.costo.stamina && (player.stamina || 100) < ability.costo.stamina) {
            return { can: false, reason: 'No tienes suficiente stamina' };
        }

        if (ability.costo.medicinas && (player.inventario?.medicinas || 0) < ability.costo.medicinas) {
            return { can: false, reason: 'No tienes medicinas' };
        }

        if (ability.costo.munición) {
            const weapon = player.equipamiento?.arma_principal;
            const weaponData = this.weapons[weapon];
            if (!weaponData || weaponData.tipo !== 'ranged') {
                return { can: false, reason: 'Necesitas un arma de fuego equipada' };
            }
        }

        return { can: true };
    }
}

export default AdvancedCombatSystem;
