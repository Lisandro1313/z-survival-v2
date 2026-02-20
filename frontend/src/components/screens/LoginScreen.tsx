/**
 * 🔐 LOGIN SCREEN
 */

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import './LoginScreen.css';

function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  const navigate = useNavigate();
  const { login, register, isLoading, error, clearError } = useAuthStore();
  const { addNotification } = useGameStore();

  console.log('🔵 LoginScreen render', { username, isRegistering, isLoading });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 handleSubmit llamado', { username, password: '***', isRegistering });
    
    clearError();
    
    if (!username || !password) {
      console.log('⚠️ Campos incompletos');
      addNotification({
        type: 'warning',
        message: 'Completa todos los campos',
      });
      return;
    }

    if (password.length < 8) {
      console.log('⚠️ Password muy corto');
      addNotification({
        type: 'warning',
        message: 'La contraseña debe tener al menos 8 caracteres',
      });
      return;
    }

    console.log(`🚀 Intentando ${isRegistering ? 'registro' : 'login'}...`);
    
    try {
      const success = isRegistering 
        ? await register(username, password)
        : await login(username, password);
      
      console.log('✅ Respuesta recibida:', success);
      
      if (success) {
        addNotification({
          type: 'success',
          message: isRegistering ? '✅ ¡Registro exitoso!' : '✅ ¡Bienvenido!',
        });
        
        // Navegar a selección de personaje
        navigate('/character');
      } else {
        // Mostrar el error específico del servidor
        const errorMsg = error || (isRegistering ? 'Error al registrarse' : 'Error al iniciar sesión');
        console.log('⚠️ Mostrando error:', errorMsg);
        addNotification({
          type: 'error',
          message: errorMsg,
        });
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
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
            onClick={() => {
              console.log('🔄 Cambiando modo:', isRegistering ? 'Login' : 'Registro');
              setIsRegistering(!isRegistering);
            }}
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
