/**
 * 📝 CHARACTER SELECTION SCREEN
 * 
 * Pantalla para crear/seleccionar personaje después del login
 */

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/api';

interface Character {
  id: number;
  nombre: string;
  userId: number;
}

function CharacterScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();
  const { setPlayer, addNotification } = useGameStore();

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  const loadCharacters = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const chars = await api.character.list(user.userId);
      setCharacters(chars);
      
      // Si no tiene personajes, mostrar creación automáticamente
      if (chars.length === 0) {
        setIsCreating(true);
      }
    } catch (error) {
      console.error('Error loading characters:', error);
      addNotification({
        type: 'error',
        message: 'Error al cargar personajes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharacter = async () => {
    if (!user || !newCharName.trim()) {
      addNotification({
        type: 'warning',
        message: 'Ingresa un nombre para el personaje',
      });
      return;
    }

    try {
      await api.character.create({
        userId: user.userId,
        nombre: newCharName.trim(),
      });

      addNotification({
        type: 'success',
        message: `Personaje "${newCharName}" creado`,
      });

      setNewCharName('');
      setIsCreating(false);
      await loadCharacters();

    } catch (error: any) {
      addNotification({
        type: 'error',
        message: error.message || 'Error al crear personaje',
      });
    }
  };

  const handleSelectCharacter = async (char: Character) => {
    try {
      const result = await api.character.load(char.id);
      
      // Actualizar player en gameStore
      setPlayer({
        id: result.personajeId,
        userId: char.userId,
        username: char.nombre,
        currentNodeId: result.nodeId,
        equippedRadio: null,
      });

      addNotification({
        type: 'success',
        message: `¡Bienvenido, ${char.nombre}!`,
      });

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
        <h1>🎮 Selecciona tu Personaje</h1>

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
          <div className="character-create">
            <h2>Crear Personaje</h2>
            
            <input
              type="text"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="Nombre del personaje"
              maxLength={20}
              autoFocus
            />

            <div className="button-group">
              <button
                className="btn-primary"
                onClick={handleCreateCharacter}
              >
                Crear
              </button>
              
              {characters.length > 0 && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setIsCreating(false);
                    setNewCharName('');
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .character-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%);
          color: #fff;
          padding: 2rem;
        }

        .character-container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 3rem;
          max-width: 600px;
          width: 100%;
        }

        h1 {
          margin: 0 0 2rem 0;
          text-align: center;
        }

        .character-list {
          display: grid;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .character-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1.1rem;
        }

        .character-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #4ade80;
          transform: translateY(-2px);
        }

        .character-icon {
          font-size: 2rem;
        }

        .character-name {
          font-weight: 600;
        }

        .character-create {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .character-create h2 {
          margin: 0;
          text-align: center;
        }

        input {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: #4ade80;
        }

        .button-group {
          display: flex;
          gap: 1rem;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #4ade80;
          color: #1a1a2e;
        }

        .btn-primary:hover {
          background: #22c55e;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

export default CharacterScreen;
