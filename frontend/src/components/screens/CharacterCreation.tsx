/**
 * 🎨 CHARACTER CREATION - Sistema completo de creación por pasos
 */

import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import { api } from '../../services/api';
import './CharacterCreation.css';

interface CharacterData {
  nombre: string;
  clase: string;
  fuerza: number;
  resistencia: number;
  agilidad: number;
  inteligencia: number;
  avatar: string;
  color: string;
}

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

const CLASES = [
  {
    id: 'soldado',
    icon: '🎖️',
    nombre: 'SOLDADO',
    descripcion: 'Veterano de combate. Experto en armas.',
    bonus: '+2 Fuerza | +2 Combate'
  },
  {
    id: 'medico',
    icon: '⚕️',
    nombre: 'MÉDICO',
    descripcion: 'Salva vidas. Conoce medicina.',
    bonus: '+2 Inteligencia | +2 Medicina'
  },
  {
    id: 'ingeniero',
    icon: '🔧',
    nombre: 'INGENIERO',
    descripcion: 'Construye y repara. Crafteo maestro.',
    bonus: '+1 Inteligencia | +3 Mecánica'
  },
  {
    id: 'superviviente',
    icon: '🎒',
    nombre: 'SUPERVIVIENTE',
    descripcion: 'Adaptable. Maestro del sigilo.',
    bonus: '+1 Agilidad | +2 Supervivencia | +1 Sigilo'
  }
];

const AVATARES = ['👤', '👨', '👩', '🧔', '👴', '👵', '🧑', '👨‍🦱', '👩‍🦱', '👨‍🦰', '👩‍🦰', '🧑‍🦰'];
const COLORES = ['#00ff00', '#00ffff', '#ff00ff', '#ffff00', '#ff8800', '#ff0000', '#8800ff', '#ffffff'];

function CharacterCreation({ onComplete, onCancel }: Props) {
  const [paso, setPaso] = useState(1);
  const [characterData, setCharacterData] = useState<CharacterData>({
    nombre: '',
    clase: '',
    fuerza: 5,
    resistencia: 5,
    agilidad: 5,
    inteligencia: 5,
    avatar: '👤',
    color: '#00ff00'
  });
  const [puntosRestantes, setPuntosRestantes] = useState(10);
  const [isCreating, setIsCreating] = useState(false);

  const { user } = useAuthStore();
  const { addNotification } = useGameStore();

  const cambiarAtributo = (atributo: keyof CharacterData, cambio: number) => {
    const valorActual = characterData[atributo] as number;
    const nuevoValor = valorActual + cambio;

    // Validaciones
    if (nuevoValor < 5 || nuevoValor > 10) return;
    if (cambio > 0 && puntosRestantes === 0) return;

    setCharacterData({ ...characterData, [atributo]: nuevoValor });
    setPuntosRestantes(puntosRestantes - cambio);
  };

  const handleCrearPersonaje = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      await api.character.create({
        usuarioId: user.id,
        nombre: characterData.nombre.trim(),
        clase: characterData.clase,
        fuerza: characterData.fuerza,
        resistencia: characterData.resistencia,
        agilidad: characterData.agilidad,
        inteligencia: characterData.inteligencia,
        avatar: characterData.avatar,
        color: characterData.color
      });

      addNotification({
        type: 'success',
        message: `✨ Personaje "${characterData.nombre}" creado exitosamente!`
      });

      onComplete();
    } catch (error: any) {
      console.error('Error creando personaje:', error);
      addNotification({
        type: 'error',
        message: error.message || 'Error al crear personaje'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const validarPaso = (siguientePaso: number): boolean => {
    if (siguientePaso === 2) {
      if (!characterData.nombre.trim()) {
        addNotification({ type: 'warning', message: 'Ingresa un nombre para tu personaje' });
        return false;
      }
      if (!characterData.clase) {
        addNotification({ type: 'warning', message: 'Selecciona una clase' });
        return false;
      }
    }
    if (siguientePaso === 3) {
      if (puntosRestantes > 0) {
        addNotification({ type: 'warning', message: 'Distribuye todos los puntos de atributos' });
        return false;
      }
    }
    return true;
  };

  const irAPaso = (nuevoPaso: number) => {
    if (nuevoPaso > paso && !validarPaso(nuevoPaso)) return;
    setPaso(nuevoPaso);
  };

  return (
    <div className="character-creation">
      <div className="creation-header">
        <h1>⭐ Crear Personaje</h1>
        <div className="steps-indicator">
          <div className={`step ${paso >= 1 ? 'active' : ''}`}>1. Info</div>
          <div className={`step ${paso >= 2 ? 'active' : ''}`}>2. Atributos</div>
          <div className={`step ${paso >= 3 ? 'active' : ''}`}>3. Apariencia</div>
        </div>
      </div>

      {/* PASO 1: Nombre y Clase */}
      {paso === 1 && (
        <div className="creation-step">
          <div className="form-group">
            <label>Nombre del personaje</label>
            <input
              type="text"
              value={characterData.nombre}
              onChange={(e) => setCharacterData({ ...characterData, nombre: e.target.value })}
              placeholder="Nombre del personaje"
              maxLength={20}
              autoFocus
            />
          </div>

          <h3>Elige tu clase:</h3>
          <div className="clase-grid">
            {CLASES.map(clase => (
              <div
                key={clase.id}
                className={`clase-card ${characterData.clase === clase.id ? 'selected' : ''}`}
                onClick={() => setCharacterData({ ...characterData, clase: clase.id })}
              >
                <div className="clase-icon">{clase.icon}</div>
                <div className="clase-name">{clase.nombre}</div>
                <div className="clase-desc">{clase.descripcion}</div>
                <div className="clase-bonus">{clase.bonus}</div>
              </div>
            ))}
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={() => irAPaso(2)}>
              Continuar →
            </button>
            <button className="btn-secondary" onClick={onCancel}>
              ← Cancelar
            </button>
          </div>
        </div>
      )}

      {/* PASO 2: Atributos */}
      {paso === 2 && (
        <div className="creation-step">
          <div className="puntos-restantes">
            Puntos restantes: <span className="puntos-numero">{puntosRestantes}</span>
          </div>

          <div className="atributos-list">
            <div className="atributo">
              <div className="atributo-nombre">💪 FUERZA <span className="atributo-desc">(Daño físico)</span></div>
              <div className="atributo-control">
                <button onClick={() => cambiarAtributo('fuerza', -1)}>−</button>
                <span className="atributo-valor">{characterData.fuerza}</span>
                <button onClick={() => cambiarAtributo('fuerza', 1)}>+</button>
              </div>
            </div>

            <div className="atributo">
              <div className="atributo-nombre">🛡️ RESISTENCIA <span className="atributo-desc">(Salud máxima)</span></div>
              <div className="atributo-control">
                <button onClick={() => cambiarAtributo('resistencia', -1)}>−</button>
                <span className="atributo-valor">{characterData.resistencia}</span>
                <button onClick={() => cambiarAtributo('resistencia', 1)}>+</button>
              </div>
            </div>

            <div className="atributo">
              <div className="atributo-nombre">⚡ AGILIDAD <span className="atributo-desc">(Evasión y sigilo)</span></div>
              <div className="atributo-control">
                <button onClick={() => cambiarAtributo('agilidad', -1)}>−</button>
                <span className="atributo-valor">{characterData.agilidad}</span>
                <button onClick={() => cambiarAtributo('agilidad', 1)}>+</button>
              </div>
            </div>

            <div className="atributo">
              <div className="atributo-nombre">🧠 INTELIGENCIA <span className="atributo-desc">(Crafteo y medicina)</span></div>
              <div className="atributo-control">
                <button onClick={() => cambiarAtributo('inteligencia', -1)}>−</button>
                <span className="atributo-valor">{characterData.inteligencia}</span>
                <button onClick={() => cambiarAtributo('inteligencia', 1)}>+</button>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={() => irAPaso(3)}>
              Continuar →
            </button>
            <button className="btn-secondary" onClick={() => setPaso(1)}>
              ← Atrás
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Apariencia */}
      {paso === 3 && (
        <div className="creation-step">
          <h3>Elige un avatar:</h3>
          <div className="avatar-grid">
            {AVATARES.map(avatar => (
              <div
                key={avatar}
                className={`avatar-option ${characterData.avatar === avatar ? 'selected' : ''}`}
                onClick={() => setCharacterData({ ...characterData, avatar })}
              >
                {avatar}
              </div>
            ))}
          </div>

          <h3>Color de identificación:</h3>
          <div className="color-grid">
            {COLORES.map(color => (
              <div
                key={color}
                className={`color-option ${characterData.color === color ? 'selected' : ''}`}
                onClick={() => setCharacterData({ ...characterData, color })}
                style={{ background: color }}
              />
            ))}
          </div>

          <div className="character-preview">
            <div className="preview-avatar" style={{ color: characterData.color }}>
              {characterData.avatar}
            </div>
            <div className="preview-name">{characterData.nombre}</div>
            <div className="preview-clase">{CLASES.find(c => c.id === characterData.clase)?.nombre}</div>
          </div>

          <div className="button-group">
            <button className="btn-primary" onClick={handleCrearPersonaje} disabled={isCreating}>
              {isCreating ? 'Creando...' : '✨ Crear y Jugar'}
            </button>
            <button className="btn-secondary" onClick={() => setPaso(2)} disabled={isCreating}>
              ← Atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CharacterCreation;
