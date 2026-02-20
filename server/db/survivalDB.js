/**
 * Database Manager para Survival Zombie
 * Maneja persistencia de usuarios y personajes
 * Usa JsonDatabase si better-sqlite3 no está disponible
 */

let Database;
let jsonDB;
try {
    const module = await import('better-sqlite3');
    Database = module.default;
} catch (err) {
    console.warn('⚠️ better-sqlite3 no disponible, usando JsonDatabase');
    const jsonModule = await import('./JsonDatabase.js');
    jsonDB = jsonModule.default;
    Database = null;
}

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'survival.db');
const db = Database ? new Database(dbPath) : null;

if (db) {
    // Cargar y ejecutar schema
    const schemaPath = path.join(__dirname, 'survival_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);

    // Cargar expansión de mundo vivo (NPCs + Locaciones + Relaciones)
    const expansionPath = path.join(__dirname, 'expansion_mundo_vivo.sql');
    if (fs.existsSync(expansionPath)) {
        try {
            const expansion = fs.readFileSync(expansionPath, 'utf8');
            db.exec(expansion);
            console.log('✅ Expansión de Mundo Vivo cargada');
        } catch (err) {
            console.error('❌ Error cargando expansión:', err.message);
        }
    }

    console.log('✅ Base de datos SQLite inicializada');
} else if (jsonDB) {
    console.log('✅ JsonDatabase inicializada (persistencia con archivos)');
}

// ===== USUARIOS =====

function crearUsuario(username, password) {
    if (jsonDB) {
        return jsonDB.createUser(username, password);
    }

    if (!db) {
        return { success: false, error: 'No hay base de datos disponible' };
    }

    try {
        const stmt = db.prepare('INSERT INTO usuarios (username, password) VALUES (?, ?)');
        const result = stmt.run(username, password);
        return { success: true, id: result.lastInsertRowid, message: 'Usuario creado exitosamente' };
    } catch (err) {
        return { success: false, error: 'Usuario ya existe' };
    }
}

function getUserByUsername(username) {
    if (jsonDB) {
        return jsonDB.getUserByUsername(username);
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ?');
    return stmt.get(username) || null;
}

function getUserById(userId) {
    if (jsonDB) {
        return jsonDB.getUserById(userId);
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM usuarios WHERE id = ?');
    return stmt.get(userId) || null;
}

function loginUsuario(username, password) {
    if (jsonDB) {
        const user = jsonDB.getUserByUsername(username);
        if (user && user.password === password) {
            return user;
        }
        return null;
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM usuarios WHERE username = ? AND password = ?');
    const user = stmt.get(username, password);
    return user || null;
}

// ===== PERSONAJES =====

function crearPersonaje(usuarioId, datos) {
    const {
        nombre,
        clase,
        fuerza = 5,
        resistencia = 5,
        agilidad = 5,
        inteligencia = 5,
        avatar = '👤',
        color = '#00ff00'
    } = datos;

    // Aplicar bonificaciones de clase
    const bonuses = {
        soldado: { fuerza: 2, combate: 2 },
        medico: { inteligencia: 2, medicina: 2 },
        ingeniero: { inteligencia: 1, mecanica: 3 },
        superviviente: { agilidad: 1, supervivencia: 2, sigilo: 1 }
    };

    const bonus = bonuses[clase] || {};
    const finalFuerza = fuerza + (bonus.fuerza || 0);
    const finalResistencia = resistencia + (bonus.resistencia || 0);
    const finalAgilidad = agilidad + (bonus.agilidad || 0);
    const finalInteligencia = inteligencia + (bonus.inteligencia || 0);

    // Skills base según clase
    const skills = {
        combate: 1 + (bonus.combate || 0),
        medicina: 1 + (bonus.medicina || 0),
        sigilo: 1 + (bonus.sigilo || 0),
        supervivencia: 1 + (bonus.supervivencia || 0),
        mecanica: 1 + (bonus.mecanica || 0)
    };

    if (jsonDB) {
        const id = jsonDB.createPlayer({
            usuarioId,
            nombre,
            clase,
            fuerza: finalFuerza,
            resistencia: finalResistencia,
            agilidad: finalAgilidad,
            inteligencia: finalInteligencia,
            avatar,
            color,
            skills: JSON.stringify(skills),
            inventario: '[]',
            nivel: 1,
            xp: 0,
            xp_siguiente_nivel: 100,
            salud: 100,
            hambre: 100,
            locacion: 'zona_segura'
        });
        return { success: true, id };
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare(`
        INSERT INTO personajes 
        (usuario_id, nombre, clase, fuerza, resistencia, agilidad, inteligencia, avatar, color, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
        const result = stmt.run(
            usuarioId,
            nombre,
            clase,
            finalFuerza,
            finalResistencia,
            finalAgilidad,
            finalInteligencia,
            avatar,
            color,
            JSON.stringify(skills)
        );

        // Crear estadísticas
        const statsStmt = db.prepare('INSERT INTO estadisticas (personaje_id) VALUES (?)');
        statsStmt.run(result.lastInsertRowid);

        return { success: true, id: result.lastInsertRowid };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function obtenerPersonajes(usuarioId) {
    if (jsonDB) {
        return jsonDB.getPlayersByUserId(usuarioId);
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM personajes WHERE usuario_id = ? ORDER BY ultima_conexion DESC');
    return stmt.all(usuarioId);
}

function obtenerPersonaje(personajeId) {
    if (jsonDB) {
        const personaje = jsonDB.getPlayerById(personajeId);
        if (personaje) {
            personaje.inventario = JSON.parse(personaje.inventario);
            personaje.skills = JSON.parse(personaje.skills);
        }
        return personaje;
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM personajes WHERE id = ?');
    const personaje = stmt.get(personajeId);

    if (personaje) {
        personaje.inventario = JSON.parse(personaje.inventario);
        personaje.skills = JSON.parse(personaje.skills);
    }

    return personaje;
}

function getPlayerByName(nombre) {
    if (jsonDB) {
        return jsonDB.getPlayerByName(nombre);
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare('SELECT * FROM personajes WHERE nombre = ?');
    return stmt.get(nombre) || null;
}

/**
 * Crear player directamente desde un objeto
 * (usado por AuthController)
 */
function createPlayer(playerData) {
    if (jsonDB) {
        const id = jsonDB.createPlayer(playerData);
        return id;
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    // Para SQLite, convertir a formato compatible
    const {
        usuarioId,
        nombre,
        clase,
        avatar = '👤',
        color = '#00ff00',
        nivel = 1,
        xp = 0,
        salud = 100,
        saludMax = 100,
        hambre = 100,
        stamina = 100,
        ubicacion = 'refugio',
        inventario = '{}',
        stats = '{}',
        skills = '{}'
    } = playerData;

    const stmt = db.prepare(`
        INSERT INTO personajes 
        (usuario_id, nombre, clase, avatar, color, nivel, xp, salud, hambre, inventario, skills)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
        const result = stmt.run(
            usuarioId,
            nombre,
            clase,
            avatar,
            color,
            nivel,
            xp,
            salud,
            hambre,
            inventario,
            skills
        );

        return result.lastInsertRowid;
    } catch (err) {
        throw new Error(err.message);
    }
}

function guardarProgreso(personajeId, datos) {
    const {
        nivel,
        xp,
        xp_siguiente_nivel,
        salud,
        hambre,
        locacion,
        inventario,
        skills,
        currency,
        lastDailyReward,
        loginStreak
    } = datos;

    if (jsonDB) {
        jsonDB.updatePlayer(personajeId, {
            nivel,
            xp,
            xp_siguiente_nivel,
            salud,
            hambre,
            locacion,
            inventario: JSON.stringify(inventario),
            skills: JSON.stringify(skills),
            currency,
            lastDailyReward,
            loginStreak
        });
        return;
    }

    if (!db) {
        throw new Error('No hay base de datos disponible');
    }

    const stmt = db.prepare(`
        UPDATE personajes 
        SET nivel = ?, xp = ?, xp_siguiente_nivel = ?, salud = ?, hambre = ?, 
            locacion = ?, inventario = ?, skills = ?, 
            currency = ?, lastDailyReward = ?, loginStreak = ?,
            ultima_conexion = CURRENT_TIMESTAMP
        WHERE id = ?
    `);

    stmt.run(
        nivel,
        xp,
        xp_siguiente_nivel,
        salud,
        hambre,
        locacion,
        JSON.stringify(inventario),
        JSON.stringify(skills),
        currency !== undefined ? currency : null,
        lastDailyReward !== undefined ? lastDailyReward : null,
        loginStreak !== undefined ? loginStreak : 0,
        personajeId
    );
}

function actualizarEstadisticas(personajeId, stats) {
    if (!db) return;

    const campos = Object.keys(stats).map(k => `${k} = ${k} + ?`).join(', ');
    const valores = Object.values(stats);

    const stmt = db.prepare(`UPDATE estadisticas SET ${campos} WHERE personaje_id = ?`);
    stmt.run(...valores, personajeId);
}

function obtenerEstadisticas(personajeId) {
    if (!db) return null;

    const stmt = db.prepare('SELECT * FROM estadisticas WHERE personaje_id = ?');
    return stmt.get(personajeId);
}

function initialize() {
    // La inicialización ya se hizo al cargar el módulo
    return Promise.resolve();
}

export default {
    initialize,
    createUser: crearUsuario,
    crearUsuario,  // Alias para compatibilidad
    getUserByUsername,
    getUserById,
    getPlayerByName,
    loginUsuario,
    crearPersonaje,
    createPlayer,
    obtenerPersonajes,
    getPlayersByUser: obtenerPersonajes,
    obtenerPersonaje,
    getPlayer: obtenerPersonaje,
    guardarProgreso,
    actualizarEstadisticas,
    obtenerEstadisticas,
    db,
    jsonDB
};
