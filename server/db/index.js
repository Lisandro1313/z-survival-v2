/**
 * Database Module - ES Module version con Promises
 * Usa better-sqlite3 con wrappers async para compatibilidad
 * Funciona en modo mock si better-sqlite3 no está disponible
 */

let Database;
try {
    const module = await import('better-sqlite3');
    Database = module.default;
} catch (err) {
    console.warn('⚠️ better-sqlite3 no disponible, usando mock en memoria');
    Database = null;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../manolitri_v2.db');
const db = Database ? new Database(dbPath) : null;

// Mock database para cuando better-sqlite3 no está disponible
const mockDB = {
    data: new Map(),
    get(key) { return this.data.get(key); },
    set(key, value) { this.data.set(key, value); },
    all() { return Array.from(this.data.values()); }
};

// Habilitar foreign keys
if (db) {
    db.pragma('foreign_keys = ON');
}

// Wrapper para promisificar operaciones
const dbAsync = {
    // SELECT que devuelve una fila
    get(sql, params = []) {
        if (!db) return Promise.resolve(null);
        return Promise.resolve(db.prepare(sql).get(params));
    },

    // SELECT que devuelve todas las filas
    all(sql, params = []) {
        if (!db) return Promise.resolve([]);
        return Promise.resolve(db.prepare(sql).all(params));
    },

    // INSERT, UPDATE, DELETE
    run(sql, params = []) {
        if (!db) return Promise.resolve({ changes: 0, lastInsertRowid: 0 });
        return Promise.resolve(db.prepare(sql).run(params));
    },

    // Ejecutar SQL directo (para CREATE TABLE, etc)
    exec(sql) {
        if (!db) return Promise.resolve();
        return Promise.resolve(db.exec(sql));
    },

    // Preparar statement (para uso avanzado)
    prepare(sql) {
        if (!db) return { get: () => null, all: () => [], run: () => ({ changes: 0 }) };
        return db.prepare(sql);
    },

    // Cerrar base de datos
    close() {
        if (!db) return Promise.resolve();
        return Promise.resolve(db.close());
    }
};

// Inicializar base de datos
async function initialize() {
    console.log('📦 Inicializando base de datos...');

    if (!db) {
        console.log('⚠️ Database en modo mock (sin persistencia)');
        return;
    }

    try {
        // Cargar schema principal (con todas las tablas para mundo vivo)
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);
        console.log('✓ Schema cargado (locations, npcs, relationships, world_events)');

        // schema.sql ya incluye datos iniciales, no necesitamos data.sql
        // const dataPath = path.join(__dirname, 'data.sql');
        // if (fs.existsSync(dataPath)) {
        //     const data = fs.readFileSync(dataPath, 'utf-8');
        //     db.exec(data);
        //     console.log('✓ Datos adicionales cargados');
        // }

        // Cargar expansión de mundo vivo (NPCs + Locaciones + Relaciones)
        const expansionPath = path.join(__dirname, 'expansion_mundo_vivo.sql');
        if (fs.existsSync(expansionPath)) {
            const expansion = fs.readFileSync(expansionPath, 'utf-8');
            db.exec(expansion);
            console.log('✓ Expansión de Mundo Vivo cargada (15 NPCs, 9 locaciones, relaciones)');
        }

        console.log('✅ Base de datos inicializada correctamente');

    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error);
        throw error;
    }
}

export default dbAsync;
export { initialize };
