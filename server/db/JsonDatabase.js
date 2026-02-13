/**
 * 💾 JSON DATABASE
 * Sistema de persistencia simple con archivos JSON
 * No requiere dependencias nativas como SQLite
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class JsonDatabase {
  constructor() {
    this.dataDir = path.join(__dirname, 'data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.playersFile = path.join(this.dataDir, 'players.json');
    
    this.data = {
      users: [],
      players: []
    };
    
    this.init();
  }

  init() {
    // Crear directorio si no existe
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log('📁 Directorio de datos creado');
    }

    // Cargar datos existentes
    this.load();
    console.log('✅ JsonDatabase inicializada');
    console.log(`   👥 ${this.data.users.length} usuarios cargados`);
    console.log(`   🎮 ${this.data.players.length} personajes cargados`);
  }

  load() {
    try {
      // Cargar usuarios
      if (fs.existsSync(this.usersFile)) {
        const usersData = fs.readFileSync(this.usersFile, 'utf8');
        this.data.users = JSON.parse(usersData);
      }

      // Cargar personajes
      if (fs.existsSync(this.playersFile)) {
        const playersData = fs.readFileSync(this.playersFile, 'utf8');
        this.data.players = JSON.parse(playersData);
      }
    } catch (error) {
      console.error('❌ Error cargando datos:', error.message);
      this.data = { users: [], players: [] };
    }
  }

  save() {
    try {
      // Guardar usuarios
      fs.writeFileSync(
        this.usersFile,
        JSON.stringify(this.data.users, null, 2),
        'utf8'
      );

      // Guardar personajes
      fs.writeFileSync(
        this.playersFile,
        JSON.stringify(this.data.players, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Error guardando datos:', error.message);
    }
  }

  // ===== USUARIOS =====

  createUser(username, password) {
    // Verificar si existe
    const existing = this.data.users.find(u => u.username === username);
    if (existing) {
      throw new Error('Usuario ya existe');
    }

    const id = this.data.users.length > 0 
      ? Math.max(...this.data.users.map(u => u.id)) + 1 
      : 1;

    const user = {
      id,
      username,
      password,
      created_at: new Date().toISOString()
    };

    this.data.users.push(user);
    this.save();

    return id;
  }

  getUserByUsername(username) {
    return this.data.users.find(u => u.username === username) || null;
  }

  getUserById(userId) {
    return this.data.users.find(u => u.id === userId) || null;
  }

  // ===== PERSONAJES =====

  createPlayer(playerData) {
    const id = this.data.players.length > 0
      ? Math.max(...this.data.players.map(p => p.id)) + 1
      : 1;

    const player = {
      id,
      ...playerData,
      created_at: new Date().toISOString()
    };

    this.data.players.push(player);
    this.save();

    return id;
  }

  getPlayersByUserId(usuarioId) {
    // Convertir a número para comparación
    const userId = parseInt(usuarioId);
    return this.data.players.filter(p => parseInt(p.usuarioId) === userId);
  }

  getPlayerById(playerId) {
    return this.data.players.find(p => p.id === playerId) || null;
  }

  getPlayerByName(nombre) {
    return this.data.players.find(p => p.nombre === nombre) || null;
  }

  updatePlayer(playerId, updates) {
    const index = this.data.players.findIndex(p => p.id === playerId);
    if (index === -1) {
      return false;
    }

    this.data.players[index] = {
      ...this.data.players[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.save();
    return true;
  }

  deletePlayer(playerId) {
    const index = this.data.players.findIndex(p => p.id === playerId);
    if (index === -1) {
      return false;
    }

    this.data.players.splice(index, 1);
    this.save();
    return true;
  }

  // ===== STATS =====

  getAllUsers() {
    return this.data.users;
  }

  getAllPlayers() {
    return this.data.players;
  }
}

// Singleton
const jsonDB = new JsonDatabase();

export default jsonDB;
