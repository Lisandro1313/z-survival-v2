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

// Layout
import GameShell from './components/layout/GameShell';

// UI Components
import Notifications from './components/ui/Notifications';

// Game Modules (placeholders para las rutas)
import Inventory from './components/game/Inventory';
import Crafting from './components/game/Crafting';
import Social from './components/social/Social';
import Missions from './components/game/Missions';
import Refuge from './components/game/Refuge';
import Clan from './components/game/Clan';
import Trade from './components/game/Trade';
import Raid from './components/game/Raid';
import Radio from './components/game/Radio';
import Narrative from './components/game/Narrative';

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
      <Notifications />
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
          path="/game/*" 
          element={
            isAuthenticated && player 
              ? (
                <GameShell>
                  <Routes>
                    <Route path="/" element={<GameScreen />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/crafting" element={<Crafting />} />
                    <Route path="/social" element={<Social />} />
                    <Route path="/missions" element={<Missions />} />
                    <Route path="/refuge" element={<Refuge />} />
                    <Route path="/clan" element={<Clan />} />
                    <Route path="/trade" element={<Trade />} />
                    <Route path="/raid" element={<Raid />} />
                    <Route path="/radio" element={<Radio />} />
                    <Route path="/narrative" element={<Narrative />} />
                  </Routes>
                </GameShell>
              )
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

