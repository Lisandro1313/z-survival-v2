/**
 * Script de migración para Fase 15: Sistema de Economía
 * Ejecuta las migraciones SQL de manera segura
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let Database;
try {
    const module = await import('better-sqlite3');
    Database = module.default;
} catch (err) {
    console.error('❌ better-sqlite3 no disponible. La migración requiere SQLite.');
    process.exit(1);
}

const dbPath = path.join(__dirname, 'survival.db');
const migrationPath = path.join(__dirname, 'migration_fase15_economy.sql');

// Verificar que la base de datos existe
if (!fs.existsSync(dbPath)) {
    console.error(`❌ Base de datos no encontrada en: ${dbPath}`);
    console.log('💡 Tip: La base de datos se creará automáticamente al iniciar el servidor.');
    process.exit(1);
}

// Leer script de migración
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('🔄 Iniciando migración Fase 15: Sistema de Economía...\n');

try {
    const db = new Database(dbPath);

    // Ejecutar migración
    console.log('📝 Ejecutando script de migración...');
    db.exec(migrationSQL);

    // Verificar que las columnas se añadieron
    console.log('\n✅ Migración completada. Verificando...');

    const tableInfo = db.prepare('PRAGMA table_info(personajes)').all();
    const hasEconomyColumns = tableInfo.some(col => col.name === 'currency') &&
        tableInfo.some(col => col.name === 'lastDailyReward') &&
        tableInfo.some(col => col.name === 'loginStreak');

    if (hasEconomyColumns) {
        console.log('✅ Columnas de economía añadidas correctamente:');
        console.log('   • currency (INTEGER)');
        console.log('   • lastDailyReward (TEXT)');
        console.log('   • loginStreak (INTEGER)');
    } else {
        console.warn('⚠️ Algunas columnas pueden no haberse añadido. Revisa manualmente.');
    }

    // Mostrar estadísticas
    const personajes = db.prepare('SELECT COUNT(*) as count FROM personajes').get();
    console.log(`\n📊 Personajes actualizados: ${personajes.count}`);

    if (personajes.count > 0) {
        const sample = db.prepare('SELECT nombre, currency, loginStreak FROM personajes LIMIT 3').all();
        console.log('\n📋 Muestra de personajes:');
        sample.forEach(p => {
            console.log(`   • ${p.nombre}: ${p.currency} caps, racha de ${p.loginStreak} días`);
        });
    }

    db.close();
    console.log('\n✅ Migración completada exitosamente.');

} catch (error) {
    console.error('\n❌ Error durante la migración:');
    console.error(error.message);
    console.error('\nDetalles:', error);
    process.exit(1);
}
