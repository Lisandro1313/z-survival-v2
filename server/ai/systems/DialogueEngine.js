// ============================================================================
// DIALOGUE ENGINE - Generador de diálogos contextuales y emergentes
// ============================================================================

class DialogueEngine {
    constructor(worker) {
        this.worker = worker;
        this.templates = this.initTemplates();
    }

    /**
     * Inicializar templates de diálogo
     */
    initTemplates() {
        return {
            // 🌑 Oscuridad nocturna / Paranoia
            night_paranoia: {
                conditions: { timeOfDay: 'night', paranoia: 70 },
                templates: [
                    "¿No sentís que nos observan?",
                    "No escuches el silencio…",
                    "Algo camina cuando nadie mira.",
                    "¿Escuchaste eso? Sonó como… no, nada.",
                    "A veces siento que alguien respira detrás de la puerta.",
                    "Las sombras se mueven cuando no las mirás.",
                    "¿Vos también sentís que alguien está parado atrás tuyo?",
                    "No mires hacia el bosque de noche.",
                    "Creo que algunos no son lo que parecen."
                ]
            },

            // 🕒 3AM específico (terror temporal)
            late_night_dread: {
                conditions: { hour: [3, 4, 5], insomnia: 50 },
                templates: [
                    "Es extraño estar despierto a esta hora…",
                    "¿No te da miedo la oscuridad?",
                    "A veces siento que alguien golpea la ventana.",
                    "¿Vos también escuchás los pasos?",
                    "Las 3 de la mañana… la hora de los muertos.",
                    "Se supone que no deberíamos estar despiertos ahora.",
                    "¿Sentís que te observan desde atrás?"
                ]
            },

            // ❤️ Enamoramiento
            romantic_approach: {
                conditions: { affection: 60, sexualAttraction: 50 },
                templates: [
                    "Me gusta estar cerca tuyo…",
                    "¿Te puedo acompañar?",
                    "Sos diferente a los demás…",
                    "Pensé en vos hoy.",
                    "Me siento seguro cuando estás cerca."
                ]
            },

            // 😠 Celos
            jealous_confrontation: {
                conditions: { jealousy: 70 },
                templates: [
                    "¿Quién era ese?",
                    "No me gusta cómo te mira…",
                    "¿Por qué estabas hablando con {targetName}?",
                    "Yo también puedo hacer eso…",
                    "No me dejés solo otra vez.",
                    "Vi cómo lo mirabas."
                ]
            },

            // 😨 Miedo extremo
            extreme_fear: {
                conditions: { sanity: 30, safety: 80 },
                templates: [
                    "No puedo más… necesito salir de acá.",
                    "Están viniendo…",
                    "Escucho voces que no están.",
                    "¿Vos también los ves?",
                    "No estamos solos."
                ]
            },

            // 🤝 Social normal
            social: {
                conditions: {},
                templates: [
                    "¿Cómo estás?",
                    "¿Viste algo útil por ahí?",
                    "Este lugar es raro…",
                    "¿Tenés algo para comerciar?",
                    "Hay que cuidarnos entre nosotros."
                ]
            },

            // 🩸 Post-violencia (trauma)
            post_violence: {
                conditions: { traumaProfile_violenceExposure: 70 },
                templates: [
                    "No puedo sacarme esa imagen de la cabeza…",
                    "Hice lo que tenía que hacer.",
                    "A veces me pregunto si ya perdí mi humanidad.",
                    "No me mires así. Vos harías lo mismo."
                ]
            }
        };
    }

    /**
     * Generar diálogo para un agente
     */
    generate(agent, target, context) {
        const hour = new Date().getHours();
        const timeOfDay = (hour >= 22 || hour <= 5) ? 'night' : 'day';

        // Buscar template que matchee condiciones
        for (const [key, template] of Object.entries(this.templates)) {
            if (this.matchesConditions(agent, target, template.conditions, { hour, timeOfDay })) {
                const text = this.selectTemplate(template.templates, target);
                return text;
            }
        }

        // Fallback: diálogo social genérico
        return this.selectTemplate(this.templates.social.templates, target);
    }

    /**
     * Check if conditions match
     */
    matchesConditions(agent, target, conditions, context) {
        for (const [key, threshold] of Object.entries(conditions)) {
            if (key === 'timeOfDay') {
                if (context.timeOfDay !== threshold) return false;
            }
            else if (key === 'hour') {
                if (!threshold.includes(context.hour)) return false;
            }
            else if (key === 'paranoia') {
                if (agent.personality.paranoia < threshold) return false;
            }
            else if (key === 'insomnia') {
                if (agent.traumaProfile.insomnia < threshold) return false;
            }
            else if (key === 'affection' && target) {
                const rel = agent.relationships[target.id];
                if (!rel || rel.affection < threshold) return false;
            }
            else if (key === 'sexualAttraction' && target) {
                const rel = agent.relationships[target.id];
                if (!rel || rel.sexualAttraction < threshold) return false;
            }
            else if (key === 'jealousy' && target) {
                const rel = agent.relationships[target.id];
                if (!rel || rel.jealousy < threshold) return false;
            }
            else if (key === 'sanity') {
                if (agent.stats.sanity > threshold) return false;
            }
            else if (key === 'safety') {
                if (agent.needs.safety < threshold) return false;
            }
            else if (key.startsWith('traumaProfile_')) {
                const traumaKey = key.replace('traumaProfile_', '');
                if (agent.traumaProfile[traumaKey] < threshold) return false;
            }
        }

        return true;
    }

    /**
     * Seleccionar template aleatorio
     */
    selectTemplate(templates, target) {
        const selected = templates[Math.floor(Math.random() * templates.length)];

        // Replace placeholders
        if (target) {
            return selected.replace('{targetName}', target.name);
        }

        return selected;
    }

    /**
     * Generar diálogo con LLM (futuro)
     */
    async generateWithLLM(agent, context) {
        // TODO: Integration with OpenAI/Claude
        // For now, return templated dialogue
        return this.generate(agent, null, context);
    }

    /**
     * Aplicar filtro de contenido
     */
    applyContentFilter(text) {
        // Block explicit sexual content
        const blockedPatterns = [
            /\bsex\b/i,
            /\bfuck\b/i,
            /\bporn\b/i,
            // Add more as needed
        ];

        for (const pattern of blockedPatterns) {
            if (pattern.test(text)) {
                return "[Content filtered]";
            }
        }

        return text;
    }
}

export default DialogueEngine;
