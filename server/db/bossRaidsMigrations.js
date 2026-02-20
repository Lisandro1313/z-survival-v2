/**
 * Boss Raids Migrations
 * Aplica el schema de base de datos para el sistema de Boss Raids (Fase 21)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function applyBossRaidsMigrations(db) {
    try {
        console.log('🐉 Aplicando migraciones de Boss Raids...');

        const sqlPath = path.join(__dirname, 'migration_fase21_boss_raids.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

        // Separar por statements (separados por punto y coma)
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                db.exec(statement + ';');
            } catch (error) {
                // Ignorar errores de tablas/índices ya existentes
                if (!error.message.includes('already exists')) {
                    console.error('❌ Error ejecutando statement:', error.message);
                }
            }
        }

        console.log('✅ Migraciones de Boss Raids aplicadas correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error aplicando migraciones de Boss Raids:', error);
        return false;
    }
}

export default { applyBossRaidsMigrations };
