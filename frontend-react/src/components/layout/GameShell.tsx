import React, { useState } from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightLogs from './RightLogs';
import AIDebugPanel from '../debug/AIDebugPanel';

interface GameShellProps {
  children: React.ReactNode;
}

const GameShell: React.FC<GameShellProps> = ({ children }) => {
  const [showAIDebug, setShowAIDebug] = useState(false);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightLogsOpen, setRightLogsOpen] = useState(true);
  
  const isDev = import.meta.env.DEV;

  // Toggle shortcut (Ctrl+D para Debug AI)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd' && isDev) {
        e.preventDefault();
        setShowAIDebug(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        setLeftSidebarOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        setRightLogsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDev]);

  return (
    <div className="game-shell">
      <TopBar />
      
      <div className="game-content">
        {/* Left Sidebar */}
        <div className={`left-sidebar ${leftSidebarOpen ? 'open' : 'closed'}`}>
          {leftSidebarOpen && <LeftSidebar />}
          <button 
            className="sidebar-toggle left"
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            title="Toggle Sidebar (Ctrl+Q)"
          >
            {leftSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Main Game Area */}
        <main className="game-main">
          {children}
        </main>

        {/* Right Logs */}
        <div className={`right-logs ${rightLogsOpen ? 'open' : 'closed'}`}>
          <button 
            className="sidebar-toggle right"
            onClick={() => setRightLogsOpen(!rightLogsOpen)}
            title="Toggle Logs (Ctrl+E)"
          >
            {rightLogsOpen ? '▶' : '◀'}
          </button>
          {rightLogsOpen && <RightLogs />}
        </div>
      </div>

      {/* AI Debug Panel (Dev only) */}
      {isDev && showAIDebug && (
        <AIDebugPanel onClose={() => setShowAIDebug(false)} />
      )}

      {/* Dev Tools Hint */}
      {isDev && !showAIDebug && (
        <div className="dev-hint">
          Press <kbd>Ctrl</kbd>+<kbd>D</kbd> for AI Debug
        </div>
      )}
    </div>
  );
};

export default GameShell;

