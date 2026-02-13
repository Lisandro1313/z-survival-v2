/**
 * Sistema de Achievements - Logros visuales
 */

class AchievementSystem {
    constructor() {
        this.achievements = this.getAchievementDefinitions();
        this.unlockedAchievements = new Set(this.loadUnlockedAchievements());
        this.init();
    }

    init() {
        // Crear contenedor de achievements
        const container = document.createElement('div');
        container.id = 'achievement-popup';
        container.className = 'achievement-popup';
        document.body.appendChild(container);

        // Crear panel de achievements
        this.createAchievementsPanel();
    }

    getAchievementDefinitions() {
        return {
            // Exploración
            'first_move': {
                id: 'first_move',
                name: 'Primeros Pasos',
                description: 'Moverte a otra locación por primera vez',
                icon: '🚶',
                rarity: 'common'
            },
            'explorer': {
                id: 'explorer',
                name: 'Explorador',
                description: 'Visitar 5 locaciones diferentes',
                icon: '🗺️',
                rarity: 'uncommon'
            },

            // Combate
            'first_blood': {
                id: 'first_blood',
                name: 'Primera Sangre',
                description: 'Matar tu primer zombie',
                icon: '🧟',
                rarity: 'common'
            },
            'zombie_slayer': {
                id: 'zombie_slayer',
                name: 'Cazador de Zombies',
                description: 'Matar 25 zombies',
                icon: '⚔️',
                rarity: 'rare'
            },
            'zombie_legend': {
                id: 'zombie_legend',
                name: 'Leyenda Zombie',
                description: 'Matar 100 zombies',
                icon: '👑',
                rarity: 'epic'
            },

            // Supervivencia
            'survivor': {
                id: 'survivor',
                name: 'Superviviente',
                description: 'Sobrevivir 24 horas de juego',
                icon: '❤️',
                rarity: 'uncommon'
            },
            'near_death': {
                id: 'near_death',
                name: 'Cerca de la Muerte',
                description: 'Sobrevivir con menos de 10 HP',
                icon: '💀',
                rarity: 'rare'
            },

            // Recursos
            'scavenger': {
                id: 'scavenger',
                name: 'Carroñero',
                description: 'Recolectar 100 items',
                icon: '📦',
                rarity: 'uncommon'
            },
            'hoarder': {
                id: 'hoarder',
                name: 'Acaparador',
                description: 'Tener 50 unidades de un recurso',
                icon: '💰',
                rarity: 'rare'
            },

            // Social
            'friendly': {
                id: 'friendly',
                name: 'Amistoso',
                description: 'Alcanzar nivel de relación 75 con un NPC',
                icon: '🤝',
                rarity: 'uncommon'
            },
            'trader': {
                id: 'trader',
                name: 'Comerciante',
                description: 'Realizar 20 intercambios',
                icon: '💱',
                rarity: 'rare'
            }
        };
    }

    loadUnlockedAchievements() {
        try {
            const saved = localStorage.getItem('achievements');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    }

    saveUnlockedAchievements() {
        localStorage.setItem('achievements', JSON.stringify([...this.unlockedAchievements]));
    }

    unlock(achievementId) {
        if (this.unlockedAchievements.has(achievementId)) {
            return false; // Ya desbloqueado
        }

        const achievement = this.achievements[achievementId];
        if (!achievement) {
            console.warn(`Achievement ${achievementId} no encontrado`);
            return false;
        }

        this.unlockedAchievements.add(achievementId);
        this.saveUnlockedAchievements();
        this.showAchievementPopup(achievement);

        // Reproducir sonido
        if (window.playSound) {
            window.playSound('achievement');
        }

        return true;
    }

    showAchievementPopup(achievement) {
        const container = document.getElementById('achievement-popup');

        const popup = document.createElement('div');
        popup.className = `achievement-card rarity-${achievement.rarity}`;
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-header">🏆 ¡Logro Desbloqueado!</div>
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;

        container.appendChild(popup);

        // Animación de entrada
        setTimeout(() => popup.classList.add('show'), 10);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            popup.classList.remove('show');
            setTimeout(() => popup.remove(), 500);
        }, 5000);
    }

    createAchievementsPanel() {
        // Este método se podría usar para crear un panel completo en el UI
        // Por ahora solo notificamos popups
    }

    check(player) {
        const stats = player.stats || {};

        // Exploración
        if (stats.locaciones_visitadas >= 1) this.unlock('first_move');
        if (stats.locaciones_visitadas >= 5) this.unlock('explorer');

        // Combate
        if (stats.zombies_matados >= 1) this.unlock('first_blood');
        if (stats.zombies_matados >= 25) this.unlock('zombie_slayer');
        if (stats.zombies_matados >= 100) this.unlock('zombie_legend');

        // Recursos
        if (stats.recursos_recolectados >= 100) this.unlock('scavenger');

        // Supervivencia
        if (player.salud <= 10 && player.salud > 0) this.unlock('near_death');

        // Inventario
        const inv = player.inventario || {};
        for (const [item, cantidad] of Object.entries(inv)) {
            if (cantidad >= 50) this.unlock('hoarder');
        }
    }

    getProgress() {
        const total = Object.keys(this.achievements).length;
        const unlocked = this.unlockedAchievements.size;
        return {
            unlocked,
            total,
            percentage: Math.floor((unlocked / total) * 100)
        };
    }
}

/**
 * Sistema de animaciones para stats
 */
export class AnimatedStatsRenderer {
    constructor() {
        this.previousStats = {};
        this.animationQueue = [];
    }

    /**
     * Renderiza stats con animaciones cuando cambian
     */
    renderWithAnimations(player) {
        if (!player) return;

        const currentStats = {
            salud: player.salud,
            hambre: player.hambre,
            xp: player.xp,
            nivel: player.nivel
        };

        // Detectar cambios
        Object.keys(currentStats).forEach(stat => {
            const current = currentStats[stat];
            const previous = this.previousStats[stat];

            if (previous !== undefined && current !== previous) {
                this.animateStat(stat, previous, current);
            }
        });

        this.previousStats = { ...currentStats };
    }

    animateStat(statName, oldValue, newValue) {
        const diff = newValue - oldValue;
        const el = document.querySelector(`[data-stat="${statName}"]`);

        if (!el) return;

        // Crear indicador flotante
        const indicator = document.createElement('div');
        indicator.className = 'stat-change-indicator';
        indicator.style.cssText = `
            position: absolute;
            font-weight: bold;
            font-size: 18px;
            animation: floatUp 1s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
        `;

        if (diff > 0) {
            indicator.textContent = `+${diff}`;
            indicator.style.color = '#00ff00';
        } else {
            indicator.textContent = diff;
            indicator.style.color = '#ff0000';
        }

        // Posicionar relativo al elemento
        const rect = el.getBoundingClientRect();
        indicator.style.position = 'fixed';
        indicator.style.left = `${rect.right + 10}px`;
        indicator.style.top = `${rect.top}px`;

        document.body.appendChild(indicator);

        // Remover después de la animación
        setTimeout(() => indicator.remove(), 1000);

        // Shake effect en el elemento
        el.classList.add('stat-shake');
        setTimeout(() => el.classList.remove('stat-shake'), 500);
    }

    /**
     * Efecto de partículas para eventos importantes
     */
    createParticleEffect(x, y, type = 'star') {
        const colors = {
            star: ['#ffff00', '#ffa500'],
            health: ['#00ff00', '#88ff88'],
            damage: ['#ff0000', '#ff8888'],
            xp: ['#00ffff', '#88ffff']
        };

        const particleColors = colors[type] || colors.star;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${particleColors[Math.floor(Math.random() * particleColors.length)]};
                pointer-events: none;
                z-index: 10000;
                left: ${x}px;
                top: ${y}px;
            `;

            const angle = (Math.PI * 2 * i) / 15;
            const velocity = 50 + Math.random() * 50;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity;

            document.body.appendChild(particle);

            let px = x;
            let py = y;
            let opacity = 1;
            const gravity = 2;
            let vy_current = vy;

            const animate = () => {
                px += vx * 0.016;
                py += vy_current * 0.016;
                vy_current += gravity;
                opacity -= 0.02;

                particle.style.left = px + 'px';
                particle.style.top = py + 'px';
                particle.style.opacity = opacity;

                if (opacity > 0) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };

            animate();
        }
    }
}

// Instancia global
export const achievementSystem = new AchievementSystem();
export const statsRenderer = new AnimatedStatsRenderer();

// Backward compatibility
window.achievementSystem = achievementSystem;
window.statsRenderer = statsRenderer;
