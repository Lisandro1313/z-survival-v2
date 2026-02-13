import survivalDB from '../db/survivalDB.js';

/**
 * 🏗️ CONSTRUCTION SYSTEM - FASE 12
 * 
 * Sistema cooperativo de construcción de estructuras en el refugio:
 * - Muros Defensivos: +10% defensa refugio
 * - Huerto: Genera 5 comida/hora
 * - Torre de Vigilancia: Alerta temprana de hordas
 * - Taller de Crafteo: -20% costo de crafteo
 * - Enfermería: Curación pasiva +1 HP/minuto
 * 
 * Características:
 * - Construcción cooperativa (todos pueden contribuir)
 * - Progreso persistente
 * - Beneficios permanentes para el refugio
 * - Límite por tipo de estructura
 * 
 * FASE 12 - Q1 2026
 */

class ConstructionSystem {
    constructor() {
        this.activeProjects = new Map(); // structureId -> project data
        this.completedStructures = new Map(); // structureId -> structure
        this.broadcastCallback = null;
        
        // Definición de estructuras disponibles
        this.structures = {
            defensive_wall: {
                id: 'defensive_wall',
                name: 'Muros Defensivos',
                icon: '🧱',
                description: 'Refuerza las defensas del refugio contra zombies',
                cost: {
                    madera: 300,
                    metal: 200,
                    herramientas: 5
                },
                buildTime: 7200000, // 2 horas en ms
                maxLevel: 3,
                effects: {
                    defense: 10,
                    zombieSpawnReduction: 5
                },
                category: 'defense'
            },
            
            garden: {
                id: 'garden',
                name: 'Huerto Comunitario',
                icon: '🌱',
                description: 'Genera comida pasivamente cada hora',
                cost: {
                    madera: 150,
                    agua: 50,
                    semillas: 10
                },
                buildTime: 3600000, // 1 hora
                maxLevel: 5,
                effects: {
                    foodPerHour: 5
                },
                category: 'resource'
            },
            
            watch_tower: {
                id: 'watch_tower',
                name: 'Torre de Vigilancia',
                icon: '🗼',
                description: 'Alerta temprana de hordas y eventos peligrosos',
                cost: {
                    madera: 400,
                    metal: 100,
                    herramientas: 8
                },
                buildTime: 5400000, // 1.5 horas
                maxLevel: 2,
                effects: {
                    hordeWarningTime: 600000, // 10 min antes
                    visionRadius: 2
                },
                category: 'utility'
            },
            
            workshop: {
                id: 'workshop',
                name: 'Taller Avanzado',
                icon: '🛠️',
                description: 'Reduce el costo de crafteo en un 20%',
                cost: {
                    madera: 500,
                    metal: 300,
                    herramientas: 15
                },
                buildTime: 7200000, // 2 horas
                maxLevel: 2,
                effects: {
                    craftingCostReduction: 20,
                    craftingSpeedBonus: 10
                },
                category: 'crafting'
            },
            
            infirmary: {
                id: 'infirmary',
                name: 'Enfermería',
                icon: '⚕️',
                description: 'Regeneración pasiva de salud en el refugio',
                cost: {
                    madera: 200,
                    medicinas: 100,
                    herramientas: 5
                },
                buildTime: 3600000, // 1 hora
                maxLevel: 3,
                effects: {
                    hpRegenPerMinute: 1,
                    healingEfficiency: 25
                },
                category: 'medical'
            },
            
            storage: {
                id: 'storage',
                name: 'Almacén Ampliado',
                icon: '📦',
                description: 'Aumenta capacidad de almacenamiento del refugio',
                cost: {
                    madera: 250,
                    metal: 150,
                    herramientas: 3
                },
                buildTime: 3600000, // 1 hora
                maxLevel: 5,
                effects: {
                    storageCapacity: 50,
                    resourceDecayReduction: 10
                },
                category: 'storage'
            },
            
            radio_tower: {
                id: 'radio_tower',
                name: 'Torre de Radio',
                icon: '📡',
                description: 'Permite comercio con otros refugios y llamadas de ayuda',
                cost: {
                    metal: 300,
                    componentes_electronicos: 20,
                    herramientas: 10
                },
                buildTime: 5400000, // 1.5 horas
                maxLevel: 1,
                effects: {
                    tradeRange: 5,
                    backupCallChance: 15
                },
                category: 'communication'
            },
            
            training_ground: {
                id: 'training_ground',
                name: 'Campo de Entrenamiento',
                icon: '🎯',
                description: 'Aumenta velocidad de ganancia de XP',
                cost: {
                    madera: 200,
                    metal: 100,
                    herramientas: 5
                },
                buildTime: 3600000, // 1 hora
                maxLevel: 3,
                effects: {
                    xpBonus: 10,
                    skillTrainingSpeed: 15
                },
                category: 'training'
            }
        };
        
        console.log('🏗️ Construction System initialized');
        this.initializeDatabase();
        this.loadExistingProjects();
    }
    
    // ========================================
    // CONFIGURACIÓN
    // ========================================
    
    setBroadcastCallback(callback) {
        this.broadcastCallback = callback;
    }
    
    broadcast(message) {
        if (this.broadcastCallback) {
            this.broadcastCallback(message);
        }
    }
    
    initializeDatabase() {
        const db = survivalDB.db;
        
        if (!db) {
            console.log('⚠️ Construction: Using mock mode (no persistence)');
            return;
        }
        
        try {
            // Tabla de proyectos de construcción
            db.exec(`
                CREATE TABLE IF NOT EXISTS construction_projects (
                    id TEXT PRIMARY KEY,
                    structure_id TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    progress REAL DEFAULT 0,
                    contributions TEXT DEFAULT '{}',
                    started_at INTEGER,
                    completed_at INTEGER,
                    status TEXT DEFAULT 'in_progress',
                    created_by TEXT
                )
            `);
            
            // Tabla de estructuras completadas
            db.exec(`
                CREATE TABLE IF NOT EXISTS completed_structures (
                    id TEXT PRIMARY KEY,
                    structure_id TEXT NOT NULL,
                    level INTEGER DEFAULT 1,
                    built_at INTEGER,
                    contributors TEXT DEFAULT '[]',
                    effects TEXT
                )
            `);
            
            console.log('✅ Construction database tables initialized');
        } catch (error) {
            console.error('❌ Error initializing construction database:', error);
        }
    }
    
    loadExistingProjects() {
        const db = survivalDB.db;
        
        if (!db) {
            return;
        }
        
        try {
            // Cargar proyectos activos
            const projects = db.prepare(`
                SELECT * FROM construction_projects 
                WHERE status = 'in_progress'
            `).all();
            
            projects.forEach(project => {
                this.activeProjects.set(project.id, {
                    ...project,
                    contributions: JSON.parse(project.contributions)
                });
            });
            
            // Cargar estructuras completadas
            const completed = db.prepare(`
                SELECT * FROM completed_structures
            `).all();
            
            completed.forEach(structure => {
                this.completedStructures.set(structure.id, {
                    ...structure,
                    contributors: JSON.parse(structure.contributors),
                    effects: JSON.parse(structure.effects)
                });
            });
            
            console.log(`🏗️ Loaded ${projects.length} active projects, ${completed.length} completed structures`);
        } catch (error) {
            console.error('❌ Error loading construction data:', error);
        }
    }
    
    // ========================================
    // GESTIÓN DE CONSTRUCCIÓN
    // ========================================
    
    /**
     * Inicia un nuevo proyecto de construcción
     */
    startConstruction(structureId, playerId, playerName) {
        // Verificar si la estructura existe
        const structure = this.structures[structureId];
        if (!structure) {
            return { 
                success: false, 
                message: 'Estructura no válida' 
            };
        }
        
        // Verificar si ya existe un proyecto activo para esta estructura
        const existingProject = Array.from(this.activeProjects.values())
            .find(p => p.structure_id === structureId && p.status === 'in_progress');
        
        if (existingProject) {
            return { 
                success: false, 
                message: 'Ya hay un proyecto de construcción activo para esta estructura',
                project: existingProject
            };
        }
        
        // Verificar límite de nivel
        const existingStructure = this.completedStructures.get(structureId);
        if (existingStructure && existingStructure.level >= structure.maxLevel) {
            return { 
                success: false, 
                message: `${structure.name} ya está en nivel máximo (${structure.maxLevel})` 
            };
        }
        
        // Crear proyecto
        const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const level = existingStructure ? existingStructure.level + 1 : 1;
        
        const project = {
            id: projectId,
            structure_id: structureId,
            level,
            progress: 0,
            contributions: {},
            started_at: Date.now(),
            status: 'in_progress',
            created_by: playerId
        };
        
        this.activeProjects.set(projectId, project);
        this.saveProjectToDB(project);
        
        // Broadcast
        this.broadcast({
            type: 'construction:started',
            project: {
                ...project,
                structure: structure
            },
            message: `📢 ${playerName} inició la construcción de ${structure.icon} ${structure.name} (Nivel ${level})`
        });
        
        console.log(`🏗️ Construcción iniciada: ${structure.name} (Nivel ${level}) por ${playerName}`);
        
        return { 
            success: true, 
            project,
            structure
        };
    }
    
    /**
     * Contribuir recursos a un proyecto
     */
    contribute(projectId, playerId, playerName, resources) {
        const project = this.activeProjects.get(projectId);
        
        if (!project) {
            return { 
                success: false, 
                message: 'Proyecto no encontrado' 
            };
        }
        
        if (project.status !== 'in_progress') {
            return { 
                success: false, 
                message: 'Este proyecto ya fue completado' 
            };
        }
        
        const structure = this.structures[project.structure_id];
        if (!structure) {
            return { 
                success: false, 
                message: 'Estructura no válida' 
            };
        }
        
        // Calcular progreso de la contribución
        const totalCost = Object.values(structure.cost).reduce((a, b) => a + b, 0);
        const contributionValue = Object.entries(resources)
            .reduce((total, [resource, amount]) => {
                if (structure.cost[resource]) {
                    return total + amount;
                }
                return total;
            }, 0);
        
        const progressIncrease = (contributionValue / totalCost) * 100;
        project.progress = Math.min(100, project.progress + progressIncrease);
        
        // Registrar contribución
        if (!project.contributions[playerId]) {
            project.contributions[playerId] = {
                name: playerName,
                resources: {},
                totalValue: 0
            };
        }
        
        for (const [resource, amount] of Object.entries(resources)) {
            project.contributions[playerId].resources[resource] = 
                (project.contributions[playerId].resources[resource] || 0) + amount;
        }
        project.contributions[playerId].totalValue += contributionValue;
        
        // Actualizar en DB
        this.updateProjectProgress(projectId, project);
        
        // Verificar si se completó
        if (project.progress >= 100) {
            return this.completeConstruction(projectId);
        }
        
        // Broadcast progreso
        this.broadcast({
            type: 'construction:progress',
            projectId,
            progress: project.progress,
            contributor: playerName,
            message: `${playerName} contribuyó a ${structure.name} (+${progressIncrease.toFixed(1)}% progreso)`
        });
        
        console.log(`🔨 ${playerName} contribuyó a ${structure.name}: ${project.progress.toFixed(1)}%`);
        
        return { 
            success: true, 
            project,
            progress: project.progress,
            message: `Contribución agregada. Progreso: ${project.progress.toFixed(1)}%`
        };
    }
    
    /**
     * Completar construcción
     */
    completeConstruction(projectId) {
        const project = this.activeProjects.get(projectId);
        
        if (!project) {
            return { 
                success: false, 
                message: 'Proyecto no encontrado' 
            };
        }
        
        const structure = this.structures[project.structure_id];
        if (!structure) {
            return { 
                success: false, 
                message: 'Estructura no válida' 
            };
        }
        
        // Marcar como completado
        project.status = 'completed';
        project.completed_at = Date.now();
        project.progress = 100;
        
        // Guardar estructura completada
        const completedStructure = {
            id: project.structure_id,
            structure_id: project.structure_id,
            level: project.level,
            built_at: Date.now(),
            contributors: Object.keys(project.contributions),
            effects: structure.effects
        };
        
        this.completedStructures.set(project.structure_id, completedStructure);
        this.saveCompletedStructure(completedStructure);
        
        // Actualizar proyecto en DB
        this.updateProjectProgress(projectId, project);
        
        // Remover de proyectos activos
        this.activeProjects.delete(projectId);
        
        // Broadcast completado
        this.broadcast({
            type: 'construction:completed',
            structure: {
                ...completedStructure,
                ...structure
            },
            contributors: Object.values(project.contributions).map(c => c.name),
            message: `🎉 ¡${structure.icon} ${structure.name} (Nivel ${project.level}) completado! Beneficios activos.`
        });
        
        console.log(`✅ Construcción completada: ${structure.name} (Nivel ${project.level})`);
        
        return { 
            success: true, 
            structure: completedStructure,
            message: `¡${structure.name} completado!`,
            effects: structure.effects
        };
    }
    
    // ========================================
    // GETTERS Y QUERIES
    // ========================================
    
    getActiveProjects() {
        return Array.from(this.activeProjects.values()).map(project => ({
            ...project,
            structure: this.structures[project.structure_id]
        }));
    }
    
    getCompletedStructures() {
        return Array.from(this.completedStructures.values()).map(structure => ({
            ...structure,
            definition: this.structures[structure.structure_id]
        }));
    }
    
    getAvailableStructures() {
        return Object.values(this.structures).map(structure => {
            const completed = this.completedStructures.get(structure.id);
            const activeProject = Array.from(this.activeProjects.values())
                .find(p => p.structure_id === structure.id && p.status === 'in_progress');
            
            return {
                ...structure,
                currentLevel: completed ? completed.level : 0,
                maxLevel: structure.maxLevel,
                canBuild: !activeProject && (!completed || completed.level < structure.maxLevel),
                hasActiveProject: !!activeProject
            };
        });
    }
    
    getStructureEffects(structureId) {
        const completed = this.completedStructures.get(structureId);
        if (!completed) return null;
        
        const structure = this.structures[structureId];
        return {
            ...structure.effects,
            level: completed.level
        };
    }
    
    getTotalRefugeEffects() {
        const effects = {
            defense: 0,
            foodPerHour: 0,
            craftingCostReduction: 0,
            hpRegenPerMinute: 0,
            xpBonus: 0,
            storageCapacity: 0
        };
        
        for (const [structureId, completed] of this.completedStructures.entries()) {
            const structure = this.structures[structureId];
            if (!structure) continue;
            
            for (const [effect, value] of Object.entries(structure.effects)) {
                if (effects.hasOwnProperty(effect)) {
                    effects[effect] += value * completed.level;
                }
            }
        }
        
        return effects;
    }
    
    // ========================================
    // DATABASE
    // ========================================
    
    saveProjectToDB(project) {
        const db = survivalDB.db;
        
        try {
            db.prepare(`
                INSERT OR REPLACE INTO construction_projects 
                (id, structure_id, level, progress, contributions, started_at, completed_at, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                project.id,
                project.structure_id,
                project.level,
                project.progress,
                JSON.stringify(project.contributions),
                project.started_at,
                project.completed_at || null,
                project.status,
                project.created_by
            );
        } catch (error) {
            console.error('❌ Error saving project:', error);
        }
    }
    
    updateProjectProgress(projectId, project) {
        const db = survivalDB.db;
        
        try {
            db.prepare(`
                UPDATE construction_projects 
                SET progress = ?, contributions = ?, status = ?, completed_at = ?
                WHERE id = ?
            `).run(
                project.progress,
                JSON.stringify(project.contributions),
                project.status,
                project.completed_at || null,
                projectId
            );
        } catch (error) {
            console.error('❌ Error updating project:', error);
        }
    }
    
    saveCompletedStructure(structure) {
        const db = survivalDB.db;
        
        try {
            db.prepare(`
                INSERT OR REPLACE INTO completed_structures 
                (id, structure_id, level, built_at, contributors, effects)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                structure.id,
                structure.structure_id,
                structure.level,
                structure.built_at,
                JSON.stringify(structure.contributors),
                JSON.stringify(structure.effects)
            );
        } catch (error) {
            console.error('❌ Error saving completed structure:', error);
        }
    }
}

export default new ConstructionSystem();
