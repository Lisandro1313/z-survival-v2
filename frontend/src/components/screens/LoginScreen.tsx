/**
 * 🔐 LOGIN SCREEN
 */

import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import './LoginScreen.css';

function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { addNotification } = useGameStore();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    clearError();
    
    if (!username || !password) {
      addNotification({
        type: 'warning',
        message: 'Completa todos los campos',
      });
      return;
    }

    if (password.length < 8) {
      addNotification({
        type: 'warning',
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }

    try {
      const success = isRegistering 
        ? await register(username, password)
        : await login(username, password);
      
      if (success) {
        addNotification({
          type: 'success',
          message: isRegistering ? '¡Registro exitoso!' : '¡Bienvenido!',
        });
      } else {
        addNotification({
          type: 'error',
          message: error || (isRegistering ? 'Error al registrarse' : 'Error al iniciar sesión'),
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      addNotification({
        type: 'error',
        message: 'Error de conexión con el servidor',
      });
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>🧟 Z-SURVIVAL v2.0</h1>
          <p>Sistema de supervivencia post-apocalíptico</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nombre de usuario"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              disabled={isLoading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
          >
            {isLoading ? 'Conectando...' : isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsRegistering(!isRegistering)}
            disabled={isLoading}
          >
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
          </button>
        </form>

        <div className="login-footer">
          <p>Nueva arquitectura escalable</p>
          <p>Sistema de radio con baterías 📻🔋</p>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
