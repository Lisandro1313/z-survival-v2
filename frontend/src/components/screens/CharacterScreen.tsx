/**
 * 📝 CHARACTER SELECTION SCREEN
 * 
 * Pantalla para crear/seleccionar personaje después del login
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/api';
import CharacterCreation from './CharacterCreation';
import './CharacterScreen.css';

interface Character {
  id: number;
  nombre: string;
  userId: number;
}

function CharacterScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { setPlayer, addNotification } = useGameStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  const loadCharacters = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await api.character.list(user.id);
      const chars = response.personajes || [];
      setCharacters(chars);
      
      // Si no tiene personajes, mostrar creación automáticamente
      if (chars.length === 0) {
        setIsCreating(true);
      }
    } catch (error) {
      console.error('❌ Error loading characters:', error);
      addNotification({
        type: 'error',
        message: 'Error al cargar personajes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = async (char: Character) => {
    try {
      const result = await api.character.load(char.id);
      
      if (!result.success || !result.player) {
        throw new Error('Error al cargar personaje');
      }

      const p = result.player;

      // Mapear datos del backend a la interfaz Player del frontend
      setPlayer({
        id: p.id,
        username: p.nombre,
        nombre: p.nombre,
        nivel: p.nivel || 1,
        clase: p.clase || 'Superviviente',
        xp: p.xp || 0,
        online: true,
        currentNode: p.locacion || 'refugio',
        currentRegion: 'ciudad',
        stats: {
          hp: p.salud || 100,
          maxHp: p.saludMaxima || 100,
          hambre: p.hambre || 100,
          sed: 100,
          stamina: 100,
          maxStamina: 100,
        },
        inventario: p.inventario || {},
        equippedRadio: null,
      });

      addNotification({
        type: 'success',
        message: `¡Bienvenido, ${p.nombre}!`,
      });

      // Navegar al juego
      navigate('/game');

    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error al cargar personaje',
      });
    }
  };

  if (loading) {
    return (
      <div className="character-screen">
        <div className="character-container">
          <p>Cargando personajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-screen">
      <div className="character-container">
        <div className="character-header">
          <h1>🎮 Selecciona tu Personaje</h1>
          <button className="btn-logout" onClick={handleLogout}>
            ↩️ Cerrar Sesión
          </button>
        </div>

        {!isCreating && (
          <>
            <div className="character-list">
              {characters.length === 0 ? (
                <p>No tienes personajes. ¡Crea uno!</p>
              ) : (
                characters.map((char) => (
                  <button
                    key={char.id}
                    className="character-card"
                    onClick={() => handleSelectCharacter(char)}
                  >
                    <span className="character-icon">👤</span>
                    <span className="character-name">{char.nombre}</span>
                  </button>
                ))
              )}
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsCreating(true)}
            >
              ➕ Crear Nuevo Personaje
            </button>
          </>
        )}

        {isCreating && (
          <CharacterCreation
            onComplete={() => {
              setIsCreating(false);
              loadCharacters(); // Recargar lista después de crear
            }}
            onCancel={() => setIsCreating(false)}
          />
        )}
      </div>
    </div>
  );
}

export default CharacterScreen;
