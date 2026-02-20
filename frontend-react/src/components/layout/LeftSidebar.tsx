import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  icon: string;
  label: string;
  badge?: number;
}

const LeftSidebar: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/game', icon: '🗺️', label: 'Mapa' },
    { path: '/inventory', icon: '🎒', label: 'Inventario' },
    { path: '/crafting', icon: '🔨', label: 'Crafteo' },
    { path: '/social', icon: '👥', label: 'Social' },
    { path: '/missions', icon: '📜', label: 'Misiones' },
    { path: '/refuge', icon: '🏠', label: 'Refugio' },
    { path: '/clan', icon: '⚔️', label: 'Clan' },
    { path: '/trade', icon: '💰', label: 'Comercio' },
    { path: '/raid', icon: '🚨', label: 'Raids' },
    { path: '/radio', icon: '📻', label: 'Radio' },
    { path: '/narrative', icon: '📖', label: 'Historia' },
  ];

  return (
    <div className="left-sidebar-content">
      <nav className="nav-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className="settings-link">
          ⚙️ Configuración
        </Link>
      </div>
    </div>
  );
};

export default LeftSidebar;
