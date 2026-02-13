/**
 * ⏳ LOADING SCREEN
 */

import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <h2>🧟 Cargando...</h2>
        <p>Conectando con el mundo</p>
      </div>
    </div>
  );
}

export default LoadingScreen;
