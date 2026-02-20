/**
 * SISTEMA DE CRAFTEO AVANZADO
 * Permite crear, mejorar y modificar armas y armadura
 */

export class AdvancedCraftingSystem {
    constructor() {
        this.initializeRecipes();
        this.initializeUpgrades();
        this.initializeModifiers();
        this.initializeWorkbenches();
    }

    /**
     * RECETAS DE CRAFTEO
     */
    initializeRecipes() {
        this.recipes = {
            // ===== ARMAS CUERPO A CUERPO =====
            cuchillo: {
                nombre: 'Cuchillo',
                tipo: 'weapon',
                requisitos: {
                    nivel: 1,
                    workbench: 'básico'
                },
                materiales: {
                    metal: 2,
                    madera: 1
                },
                tiempo: 30, // segundos
                resultado: {
                    item: 'cuchillo',
                    cantidad: 1
                },
                xp: 10,
                icono: '🔪',
                descripción: 'Un cuchillo simple pero efectivo'
            },
            bate: {
                nombre: 'Bate de Béisbol',
                tipo: 'weapon',
                requisitos: {
                    nivel: 2,
                    workbench: 'básico'
                },
                materiales: {
                    madera: 5,
                    metal: 1
                },
                tiempo: 45,
                resultado: {
                    item: 'bate',
                    cantidad: 1
                },
                xp: 15,
                icono: '⚾',
                descripción: 'Arma contundente de madera reforzada'
            },
            machete: {
                nombre: 'Machete',
                tipo: 'weapon',
                requisitos: {
                    nivel: 3,
                    workbench: 'avanzado',
                    skill_herrería: 2
                },
                materiales: {
                    metal: 8,
                    madera: 3,
                    cuero: 2
                },
                tiempo: 120,
                resultado: {
                    item: 'machete',
                    cantidad: 1
                },
                xp: 30,
                icono: '🗡️',
                descripción: 'Hoja afilada de acero, equilibrada y letal'
            },
            katana: {
                nombre: 'Katana',
                tipo: 'weapon',
                requisitos: {
                    nivel: 5,
                    workbench: 'maestro',
                    skill_herrería: 5
                },
                materiales: {
                    acero_refinado: 10,
                    cuero: 5,
                    componentes_raros: 3
                },
                tiempo: 300,
                resultado: {
                    item: 'katana',
                    cantidad: 1
                },
                xp: 100,
                icono: '⚔️',
                descripción: 'Obra maestra de la forja. Extremadamente afilada.'
            },
            sierra_electrica: {
                nombre: 'Sierra Eléctrica',
                tipo: 'weapon',
                requisitos: {
                    nivel: 6,
                    workbench: 'industrial',
                    skill_mecánica: 4
                },
                materiales: {
                    motor: 1,
                    metal: 15,
                    batería: 2,
                    cadena: 1
                },
                tiempo: 240,
                resultado: {
                    item: 'sierra_electrica',
                    cantidad: 1
                },
                xp: 150,
                icono: '🪚',
                descripción: 'Arma devastadora que consume combustible'
            },

            // ===== ARMAS A DISTANCIA =====
            ballesta: {
                nombre: 'Ballesta',
                tipo: 'weapon',
                requisitos: {
                    nivel: 3,
                    workbench: 'avanzado'
                },
                materiales: {
                    madera: 10,
                    metal: 5,
                    cuerda: 3,
                    resortes: 2
                },
                tiempo: 180,
                resultado: {
                    item: 'ballesta',
                    cantidad: 1,
                    munición: 10
                },
                xp: 50,
                icono: '🏹',
                descripción: 'Arma silenciosa de precisión'
            },
            escopeta_artesanal: {
                nombre: 'Escopeta Artesanal',
                tipo: 'weapon',
                requisitos: {
                    nivel: 4,
                    workbench: 'armero',
                    skill_armería: 3
                },
                materiales: {
                    tubo_metal: 2,
                    madera: 5,
                    resortes: 3,
                    gatillo: 1
                },
                tiempo: 200,
                resultado: {
                    item: 'escopeta',
                    cantidad: 1
                },
                xp: 80,
                icono: '🔫',
                descripción: 'Escopeta improvisada pero funcional'
            },

            // ===== ARMADURA =====
            ropa_reforzada: {
                nombre: 'Ropa Reforzada',
                tipo: 'armor',
                requisitos: {
                    nivel: 1,
                    workbench: 'básico'
                },
                materiales: {
                    tela: 8,
                    cuero: 4
                },
                tiempo: 60,
                resultado: {
                    item: 'ropa_reforzada',
                    cantidad: 1
                },
                xp: 15,
                icono: '🧥',
                descripción: 'Ropa con refuerzos de cuero'
            },
            chaleco_antibalas: {
                nombre: 'Chaleco Antibalas',
                tipo: 'armor',
                requisitos: {
                    nivel: 2,
                    workbench: 'avanzado'
                },
                materiales: {
                    kevlar: 6,
                    placas_metal: 4,
                    tela: 5
                },
                tiempo: 120,
                resultado: {
                    item: 'chaleco_antibalas',
                    cantidad: 1
                },
                xp: 40,
                icono: '🦺',
                descripción: 'Protección balística estándar'
            },
            armadura_policial: {
                nombre: 'Armadura Policial',
                tipo: 'armor',
                requisitos: {
                    nivel: 3,
                    workbench: 'avanzado',
                    skill_armería: 2
                },
                materiales: {
                    kevlar: 10,
                    placas_metal: 8,
                    acolchado: 6
                },
                tiempo: 180,
                resultado: {
                    item: 'armadura_policial',
                    cantidad: 1
                },
                xp: 60,
                icono: '👮',
                descripción: 'Armadura completa antidisturbios'
            },
            armadura_militar: {
                nombre: 'Armadura Militar',
                tipo: 'armor',
                requisitos: {
                    nivel: 5,
                    workbench: 'militar',
                    skill_armería: 4
                },
                materiales: {
                    placas_cerámicas: 8,
                    kevlar: 15,
                    metal_reforzado: 10,
                    acolchado: 8
                },
                tiempo: 300,
                resultado: {
                    item: 'armadura_militar',
                    cantidad: 1
                },
                xp: 120,
                icono: '🪖',
                descripción: 'Armadura de combate de grado militar'
            },

            // ===== MUNICIÓN =====
            balas_9mm: {
                nombre: 'Balas 9mm',
                tipo: 'ammo',
                requisitos: {
                    nivel: 2,
                    workbench: 'armero'
                },
                materiales: {
                    pólvora: 1,
                    casquillos: 10,
                    plomo: 2
                },
                tiempo: 30,
                resultado: {
                    item: 'munición_pistola',
                    cantidad: 10
                },
                xp: 5,
                icono: '🔹',
                descripción: 'Munición estándar para pistolas'
            },
            cartuchos_escopeta: {
                nombre: 'Cartuchos de Escopeta',
                tipo: 'ammo',
                requisitos: {
                    nivel: 3,
                    workbench: 'armero'
                },
                materiales: {
                    pólvora: 2,
                    casquillos_escopeta: 8,
                    perdigones: 3
                },
                tiempo: 40,
                resultado: {
                    item: 'munición_escopeta',
                    cantidad: 8
                },
                xp: 8,
                icono: '🔸',
                descripción: 'Munición para escopetas'
            },
            flechas: {
                nombre: 'Flechas',
                tipo: 'ammo',
                requisitos: {
                    nivel: 2,
                    workbench: 'básico'
                },
                materiales: {
                    madera: 2,
                    metal: 1,
                    plumas: 3
                },
                tiempo: 20,
                resultado: {
                    item: 'munición_ballesta',
                    cantidad: 5
                },
                xp: 3,
                icono: '➡️',
                descripción: 'Flechas para ballesta'
            },

            // ===== CONSUMIBLES =====
            vendaje_avanzado: {
                nombre: 'Vendaje Avanzado',
                tipo: 'consumable',
                requisitos: {
                    nivel: 2,
                    workbench: 'médico'
                },
                materiales: {
                    tela: 3,
                    alcohol: 1,
                    hierbas_medicinales: 2
                },
                tiempo: 20,
                resultado: {
                    item: 'vendaje_avanzado',
                    cantidad: 1
                },
                xp: 10,
                icono: '🩹',
                descripción: 'Cura 50 HP + detiene sangrado'
            },
            botiquín: {
                nombre: 'Botiquín',
                tipo: 'consumable',
                requisitos: {
                    nivel: 3,
                    workbench: 'médico',
                    skill_medicina: 2
                },
                materiales: {
                    vendaje_avanzado: 3,
                    medicinas: 2,
                    antibióticos: 1
                },
                tiempo: 45,
                resultado: {
                    item: 'botiquín',
                    cantidad: 1
                },
                xp: 25,
                icono: '🏥',
                descripción: 'Cura 100 HP + cura todos los efectos'
            },
            antídoto: {
                nombre: 'Antídoto',
                tipo: 'consumable',
                requisitos: {
                    nivel: 3,
                    workbench: 'médico',
                    skill_medicina: 3
                },
                materiales: {
                    hierbas_medicinales: 5,
                    muestra_tóxica: 1,
                    alcohol: 2
                },
                tiempo: 60,
                resultado: {
                    item: 'antídoto',
                    cantidad: 1
                },
                xp: 30,
                icono: '💉',
                descripción: 'Cura envenenamiento inmediatamente'
            },

            // ===== EXPLOSIVOS =====
            granada_artesanal: {
                nombre: 'Granada Artesanal',
                tipo: 'explosive',
                requisitos: {
                    nivel: 4,
                    workbench: 'industrial',
                    skill_química: 3
                },
                materiales: {
                    pólvora: 5,
                    metal: 3,
                    mecha: 1,
                    clavos: 10
                },
                tiempo: 90,
                resultado: {
                    item: 'granada',
                    cantidad: 1
                },
                xp: 50,
                icono: '💣',
                descripción: 'Explosivo de fragmentación. Daña área'
            },
            molotov: {
                nombre: 'Cóctel Molotov',
                tipo: 'explosive',
                requisitos: {
                    nivel: 1,
                    workbench: 'básico'
                },
                materiales: {
                    botella: 1,
                    gasolina: 2,
                    trapo: 1
                },
                tiempo: 15,
                resultado: {
                    item: 'molotov',
                    cantidad: 1
                },
                xp: 8,
                icono: '🍾',
                descripción: 'Incendia área, causa quemaduras'
            },

            // ===== UTILIDADES =====
            trampa_osos: {
                nombre: 'Trampa para Osos',
                tipo: 'utility',
                requisitos: {
                    nivel: 2,
                    workbench: 'básico'
                },
                materiales: {
                    metal: 8,
                    resortes: 4,
                    cadena: 2
                },
                tiempo: 60,
                resultado: {
                    item: 'trampa_osos',
                    cantidad: 1
                },
                xp: 20,
                icono: '🪤',
                descripción: 'Atrapa zombies, causa 40 daño'
            },
            barricada: {
                nombre: 'Barricada',
                tipo: 'utility',
                requisitos: {
                    nivel: 1,
                    workbench: 'básico'
                },
                materiales: {
                    madera: 10,
                    clavos: 20
                },
                tiempo: 90,
                resultado: {
                    item: 'barricada',
                    cantidad: 1
                },
                xp: 15,
                icono: '🚧',
                descripción: 'Bloquea una entrada, 200 HP'
            }
        };
    }

    /**
     * SISTEMA DE MEJORAS (UPGRADES)
     */
    initializeUpgrades() {
        this.upgrades = {
            // MEJORAS DE ARMAS CUERPO A CUERPO
            'cuchillo': [
                {
                    nivel: 1,
                    nombre: 'Cuchillo Afilado',
                    materiales: { piedra_afilar: 1, aceite: 1 },
                    mejoras: { dañoMin: +2, dañoMax: +3, crítico: +0.05 },
                    tiempo: 30
                },
                {
                    nivel: 2,
                    nombre: 'Cuchillo Reforzado',
                    materiales: { metal: 3, cuero: 2 },
                    mejoras: { dañoMin: +4, dañoMax: +5, durabilidad: +20 },
                    tiempo: 45
                }
            ],
            'machete': [
                {
                    nivel: 1,
                    nombre: 'Machete Afilado',
                    materiales: { piedra_afilar: 2, aceite: 2 },
                    mejoras: { dañoMin: +5, dañoMax: +8, crítico: +0.05 },
                    tiempo: 45
                },
                {
                    nivel: 2,
                    nombre: 'Machete de Combate',
                    materiales: { metal_reforzado: 5, cuero: 3 },
                    mejoras: { dañoMin: +10, dañoMax: +12, velocidad: +0.1 },
                    tiempo: 90
                }
            ],
            'katana': [
                {
                    nivel: 1,
                    nombre: 'Katana Templada',
                    materiales: { acero_refinado: 5, aceite_especial: 2 },
                    mejoras: { dañoMin: +8, dañoMax: +12, crítico: +0.10 },
                    tiempo: 120
                }
            ],

            // MEJORAS DE ARMAS A DISTANCIA
            'pistola': [
                {
                    nivel: 1,
                    nombre: 'Pistola con Mira',
                    materiales: { mira_láser: 1, tornillos: 5 },
                    mejoras: { precisión: +0.10 },
                    tiempo: 30
                },
                {
                    nivel: 2,
                    nombre: 'Pistola Mejorada',
                    materiales: { cañón_reforzado: 1, resortes: 3 },
                    mejoras: { dañoMin: +5, dañoMax: +8, velocidad: +0.2 },
                    tiempo: 60
                }
            ],
            'rifle': [
                {
                    nivel: 1,
                    nombre: 'Rifle con Mira',
                    materiales: { mira_telescópica: 1, tornillos: 8 },
                    mejoras: { precisión: +0.08, crítico: +0.05 },
                    tiempo: 45
                },
                {
                    nivel: 2,
                    nombre: 'Rifle Táctico',
                    materiales: { kit_táctico: 1, metal: 5 },
                    mejoras: { dañoMin: +10, dañoMax: +15, precisión: +0.05 },
                    tiempo: 90
                }
            ],

            // MEJORAS DE ARMADURA
            'chaleco_antibalas': [
                {
                    nivel: 1,
                    nombre: 'Chaleco Reforzado',
                    materiales: { placas_metal: 4, kevlar: 3 },
                    mejoras: { defensa: +5, reducción: +0.05 },
                    tiempo: 60
                }
            ],
            'armadura_policial': [
                {
                    nivel: 1,
                    nombre: 'Armadura Mejorada',
                    materiales: { placas_cerámicas: 4, kevlar: 5 },
                    mejoras: { defensa: +10, reducción: +0.08 },
                    tiempo: 90
                }
            ],
            'armadura_militar': [
                {
                    nivel: 1,
                    nombre: 'Armadura Blindada',
                    materiales: { placas_cerámicas: 8, titanio: 5 },
                    mejoras: { defensa: +15, reducción: +0.10 },
                    tiempo: 120
                }
            ]
        };
    }

    /**
     * MODIFICADORES DE ARMAS
     */
    initializeModifiers() {
        this.modifiers = {
            // MODIFICADORES PARA ARMAS A DISTANCIA
            silenciador: {
                nombre: 'Silenciador',
                tipo: 'ranged',
                requisitos: { nivel: 3, skill_armería: 2 },
                materiales: { tubo_metal: 2, algodón: 5, tornillos: 3 },
                efectos: { ruido: -60, velocidad: -0.1 },
                tiempo: 45,
                icono: '🔇',
                descripción: 'Reduce el ruido del disparo un 60%'
            },
            mira_láser: {
                nombre: 'Mira Láser',
                tipo: 'ranged',
                requisitos: { nivel: 2, skill_armería: 1 },
                materiales: { láser: 1, batería: 1, tornillos: 2 },
                efectos: { precisión: +0.10 },
                tiempo: 30,
                icono: '🔴',
                descripción: 'Aumenta la precisión un 10%'
            },
            cargador_extendido: {
                nombre: 'Cargador Extendido',
                tipo: 'ranged',
                requisitos: { nivel: 3, skill_armería: 2 },
                materiales: { metal: 4, resortes: 3 },
                efectos: { munición: +10 },
                tiempo: 40,
                icono: '📦',
                descripción: '+10 balas de capacidad'
            },
            culata_reforzada: {
                nombre: 'Culata Reforzada',
                tipo: 'ranged',
                requisitos: { nivel: 2 },
                materiales: { madera: 5, cuero: 3 },
                efectos: { precisión: +0.05, velocidad: +0.1 },
                tiempo: 35,
                icono: '🪵',
                descripción: 'Mejora control del arma'
            },

            // MODIFICADORES PARA ARMAS CUERPO A CUERPO
            empuñadura_ergonómica: {
                nombre: 'Empuñadura Ergonómica',
                tipo: 'melee',
                requisitos: { nivel: 2 },
                materiales: { cuero: 4, goma: 2 },
                efectos: { velocidad: +0.2, precisión: +0.05 },
                tiempo: 25,
                icono: '✋',
                descripción: 'Mejora la velocidad y control'
            },
            hoja_dentada: {
                nombre: 'Hoja Dentada',
                tipo: 'melee',
                requisitos: { nivel: 3, skill_herrería: 2 },
                materiales: { metal: 5, lima: 1 },
                efectos: { sangrado_chance: +0.15, dañoMin: +3 },
                tiempo: 50,
                icono: '🔪',
                descripción: 'Aumenta chance de sangrado'
            },
            púas: {
                nombre: 'Púas',
                tipo: 'melee',
                requisitos: { nivel: 2 },
                materiales: { clavos: 15, soldadura: 1 },
                efectos: { dañoMin: +2, dañoMax: +5, contraataque: 3 },
                tiempo: 40,
                icono: '📍',
                descripción: 'Daña al enemigo cuando te golpea'
            },

            // MODIFICADORES DE ARMADURA
            placas_extra: {
                nombre: 'Placas Extra',
                tipo: 'armor',
                requisitos: { nivel: 3 },
                materiales: { placas_metal: 6, tornillos: 10 },
                efectos: { defensa: +10, agilidad: -0.10 },
                tiempo: 60,
                icono: '🔲',
                descripción: '+10 defensa pero -10% agilidad'
            },
            acolchado_balístico: {
                nombre: 'Acolchado Balístico',
                tipo: 'armor',
                requisitos: { nivel: 2 },
                materiales: { kevlar: 5, espuma: 4 },
                efectos: { reducción: +0.05 },
                tiempo: 45,
                icono: '🧶',
                descripción: '+5% reducción de daño'
            },
            refuerzos_ligeros: {
                nombre: 'Refuerzos Ligeros',
                tipo: 'armor',
                requisitos: { nivel: 3, skill_armería: 2 },
                materiales: { titanio: 4, fibra_carbono: 3 },
                efectos: { defensa: +5, agilidad: +0.05 },
                tiempo: 70,
                icono: '⚡',
                descripción: '+5 defensa sin perder agilidad'
            }
        };
    }

    /**
     * TIPOS DE WORKBENCHES
     */
    initializeWorkbenches() {
        this.workbenches = {
            básico: {
                nombre: 'Banco de Trabajo Básico',
                nivel: 1,
                costo: {
                    madera: 20,
                    clavos: 30
                },
                descripción: 'Permite craftear items básicos',
                icono: '🔨',
                multiplicador_tiempo: 1.0
            },
            avanzado: {
                nombre: 'Banco de Trabajo Avanzado',
                nivel: 2,
                costo: {
                    madera: 40,
                    metal: 20,
                    tornillos: 25
                },
                descripción: 'Permite craftear items avanzados',
                icono: '⚒️',
                multiplicador_tiempo: 0.9,
                requiere: 'básico'
            },
            armero: {
                nombre: 'Banco de Armero',
                nivel: 3,
                costo: {
                    metal: 50,
                    madera: 30,
                    herramientas: 10
                },
                descripción: 'Especializado en armas de fuego',
                icono: '🔫',
                multiplicador_tiempo: 0.8,
                requiere: 'avanzado'
            },
            industrial: {
                nombre: 'Banco Industrial',
                nivel: 4,
                costo: {
                    metal: 80,
                    componentes_electrónicos: 20,
                    herramientas: 15
                },
                descripción: 'Para items complejos y explosivos',
                icono: '⚙️',
                multiplicador_tiempo: 0.7,
                requiere: 'avanzado'
            },
            maestro: {
                nombre: 'Banco de Maestro Artesano',
                nivel: 5,
                costo: {
                    metal_reforzado: 50,
                    madera_noble: 30,
                    herramientas_maestras: 10,
                    componentes_raros: 5
                },
                descripción: 'Para las mejores armas y armaduras',
                icono: '⚔️',
                multiplicador_tiempo: 0.6,
                requiere: 'avanzado'
            },
            médico: {
                nombre: 'Estación Médica',
                nivel: 2,
                costo: {
                    madera: 30,
                    metal: 15,
                    instrumental_médico: 8
                },
                descripción: 'Para crear medicinas y consumibles',
                icono: '🏥',
                multiplicador_tiempo: 0.9,
                requiere: 'básico'
            },
            militar: {
                nombre: 'Estación Militar',
                nivel: 6,
                costo: {
                    metal_reforzado: 100,
                    componentes_militares: 30,
                    herramientas_especializadas: 20
                },
                descripción: 'Equipo de grado militar',
                icono: '🪖',
                multiplicador_tiempo: 0.5,
                requiere: 'armero'
            }
        };
    }

    /**
     * VERIFICAR SI EL JUGADOR PUEDE CRAFTEAR
     */
    canCraft(player, recipeKey) {
        const recipe = this.recipes[recipeKey];
        if (!recipe) {
            return { can: false, reason: 'Receta no encontrada' };
        }

        // Verificar nivel
        if (recipe.requisitos.nivel && (player.nivel || 1) < recipe.requisitos.nivel) {
            return { can: false, reason: `Necesitas nivel ${recipe.requisitos.nivel}` };
        }

        // Verificar workbench
        if (recipe.requisitos.workbench) {
            const hasWorkbench = player.workbenches && player.workbenches[recipe.requisitos.workbench];
            if (!hasWorkbench) {
                return { can: false, reason: `Necesitas ${this.workbenches[recipe.requisitos.workbench].nombre}` };
            }
        }

        // Verificar skills
        for (const [skill, nivelRequerido] of Object.entries(recipe.requisitos)) {
            if (skill.startsWith('skill_')) {
                const skillName = skill.replace('skill_', '');
                const playerSkill = player.skills?.[skillName] || 0;
                if (playerSkill < nivelRequerido) {
                    return { can: false, reason: `Necesitas ${skillName} nivel ${nivelRequerido}` };
                }
            }
        }

        // Verificar materiales
        const missing = [];
        for (const [material, cantidad] of Object.entries(recipe.materiales)) {
            const playerHas = player.inventario?.[material] || 0;
            if (playerHas < cantidad) {
                missing.push(`${material} (${cantidad} requerido, ${playerHas} disponible)`);
            }
        }

        if (missing.length > 0) {
            return { can: false, reason: `Materiales faltantes: ${missing.join(', ')}` };
        }

        return { can: true };
    }

    /**
     * CRAFTEAR ITEM
     */
    craft(player, recipeKey) {
        const canCraft = this.canCraft(player, recipeKey);
        if (!canCraft.can) {
            return { success: false, message: canCraft.reason };
        }

        const recipe = this.recipes[recipeKey];

        // Consumir materiales
        for (const [material, cantidad] of Object.entries(recipe.materiales)) {
            player.inventario[material] -= cantidad;
        }

        // Dar resultado
        const resultado = recipe.resultado.item;
        const cantidad = recipe.resultado.cantidad;
        player.inventario[resultado] = (player.inventario[resultado] || 0) + cantidad;

        // Dar XP
        if (recipe.xp) {
            player.xp = (player.xp || 0) + recipe.xp;
        }

        // Aumentar skill relevante
        if (recipe.tipo === 'weapon') {
            if (recipe.requisitos.skill_herrería) {
                player.skills.herrería = Math.min(10, (player.skills?.herrería || 0) + 0.1);
            }
            if (recipe.requisitos.skill_armería) {
                player.skills.armería = Math.min(10, (player.skills?.armería || 0) + 0.1);
            }
        }

        return {
            success: true,
            message: `✅ ${recipe.icono} Crafteaste: ${recipe.nombre}`,
            item: resultado,
            cantidad,
            xp: recipe.xp
        };
    }

    /**
     * MEJORAR ITEM
     */
    upgrade(player, itemKey, upgradeLevel) {
        const upgrades = this.upgrades[itemKey];
        if (!upgrades || !upgrades[upgradeLevel - 1]) {
            return { success: false, message: 'Mejora no disponible' };
        }

        const upgrade = upgrades[upgradeLevel - 1];

        // Verificar si el jugador tiene el item
        if (!player.inventario[itemKey] || player.inventario[itemKey] < 1) {
            return { success: false, message: 'No tienes ese item' };
        }

        // Verificar materiales
        const missing = [];
        for (const [material, cantidad] of Object.entries(upgrade.materiales)) {
            const playerHas = player.inventario?.[material] || 0;
            if (playerHas < cantidad) {
                missing.push(`${material} (${cantidad} requerido)`);
            }
        }

        if (missing.length > 0) {
            return { success: false, message: `Materiales faltantes: ${missing.join(', ')}` };
        }

        // Consumir materiales
        for (const [material, cantidad] of Object.entries(upgrade.materiales)) {
            player.inventario[material] -= cantidad;
        }

        // Aplicar mejoras
        const itemUpgradado = `${itemKey}_+${upgradeLevel}`;
        player.inventario[itemKey]--;
        player.inventario[itemUpgradado] = (player.inventario[itemUpgradado] || 0) + 1;

        return {
            success: true,
            message: `✨ Mejoraste: ${upgrade.nombre}`,
            item: itemUpgradado,
            mejoras: upgrade.mejoras
        };
    }

    /**
     * APLICAR MODIFICADOR
     */
    applyModifier(player, itemKey, modifierKey) {
        const modifier = this.modifiers[modifierKey];
        if (!modifier) {
            return { success: false, message: 'Modificador no encontrado' };
        }

        // Verificar si el jugador tiene el item
        if (!player.inventario[itemKey] || player.inventario[itemKey] < 1) {
            return { success: false, message: 'No tienes ese item' };
        }

        // Verificar requisitos
        if (modifier.requisitos.nivel && (player.nivel || 1) < modifier.requisitos.nivel) {
            return { success: false, message: `Necesitas nivel ${modifier.requisitos.nivel}` };
        }

        // Verificar skills
        for (const [skill, nivel] of Object.entries(modifier.requisitos)) {
            if (skill.startsWith('skill_')) {
                const skillName = skill.replace('skill_', '');
                if ((player.skills?.[skillName] || 0) < nivel) {
                    return { success: false, message: `Necesitas ${skillName} nivel ${nivel}` };
                }
            }
        }

        // Verificar materiales
        const missing = [];
        for (const [material, cantidad] of Object.entries(modifier.materiales)) {
            const playerHas = player.inventario?.[material] || 0;
            if (playerHas < cantidad) {
                missing.push(`${material} (${cantidad} requerido)`);
            }
        }

        if (missing.length > 0) {
            return { success: false, message: `Materiales faltantes: ${missing.join(', ')}` };
        }

        // Consumir materiales
        for (const [material, cantidad] of Object.entries(modifier.materiales)) {
            player.inventario[material] -= cantidad;
        }

        // Crear item modificado
        const itemModificado = `${itemKey}_${modifierKey}`;
        player.inventario[itemKey]--;
        player.inventario[itemModificado] = (player.inventario[itemModificado] || 0) + 1;

        return {
            success: true,
            message: `🔧 Aplicaste: ${modifier.nombre}`,
            item: itemModificado,
            efectos: modifier.efectos
        };
    }

    /**
     * CONSTRUIR WORKBENCH
     */
    buildWorkbench(player, workbenchKey) {
        const workbench = this.workbenches[workbenchKey];
        if (!workbench) {
            return { success: false, message: 'Workbench no encontrado' };
        }

        // Verificar nivel
        if ((player.nivel || 1) < workbench.nivel) {
            return { success: false, message: `Necesitas nivel ${workbench.nivel}` };
        }

        // Verificar prerequisitos
        if (workbench.requiere && !player.workbenches?.[workbench.requiere]) {
            return { success: false, message: `Necesitas ${this.workbenches[workbench.requiere].nombre} primero` };
        }

        // Verificar si ya lo tiene
        if (player.workbenches?.[workbenchKey]) {
            return { success: false, message: 'Ya tienes este workbench' };
        }

        // Verificar materiales
        const missing = [];
        for (const [material, cantidad] of Object.entries(workbench.costo)) {
            const playerHas = player.inventario?.[material] || 0;
            if (playerHas < cantidad) {
                missing.push(`${material} (${cantidad} requerido)`);
            }
        }

        if (missing.length > 0) {
            return { success: false, message: `Materiales faltantes: ${missing.join(', ')}` };
        }

        // Consumir materiales
        for (const [material, cantidad] of Object.entries(workbench.costo)) {
            player.inventario[material] -= cantidad;
        }

        // Construir workbench
        if (!player.workbenches) player.workbenches = {};
        player.workbenches[workbenchKey] = true;

        return {
            success: true,
            message: `🔨 Construiste: ${workbench.nombre}`,
            workbench: workbenchKey
        };
    }

    /**
     * OBTENER RECETAS DISPONIBLES
     */
    getAvailableRecipes(player) {
        const available = [];

        for (const [key, recipe] of Object.entries(this.recipes)) {
            const canCraft = this.canCraft(player, key);
            available.push({
                key,
                ...recipe,
                canCraft: canCraft.can,
                reason: canCraft.reason
            });
        }

        return available;
    }
}

export default AdvancedCraftingSystem;
