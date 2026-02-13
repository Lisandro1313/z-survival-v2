import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useGameStore } from './stores/gameStore';
import { useWebSocket } from './hooks/useWebSocket';

// Screens
import LoginScreen from './components/screens/LoginScreen';
import CharacterScreen from './components/screens/CharacterScreen';
import GameScreen from './components/screens/GameScreen';
import LoadingScreen from './components/screens/LoadingScreen';

function App() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { player } = useGameStore();
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    // Conectar WebSocket cuando se autentica y tiene player
    if (isAuthenticated && player) {
      connect();
    }

    return () => disconnect();
  }, [isAuthenticated, player, connect, disconnect]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Login - Solo si NO está autenticado */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginScreen /> : <Navigate to="/character" />} 
        />
        
        {/* Character Selection - Solo si está autenticado pero sin personaje */}
        <Route 
          path="/character" 
          element={
            isAuthenticated 
              ? (player ? <Navigate to="/game" /> : <CharacterScreen />)
              : <Navigate to="/login" />
          } 
        />
        
        {/* Game - Solo si está autenticado Y tiene personaje */}
        <Route 
          path="/game" 
          element={
            isAuthenticated && player 
              ? <GameScreen /> 
              : <Navigate to={isAuthenticated ? "/character" : "/login"} />
          } 
        />
        
        {/* Root - Redirige según estado */}
        <Route 
          path="/" 
          element={
            <Navigate to={
              isAuthenticated 
                ? (player ? "/game" : "/character")
                : "/login"
            } />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

