import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorldStore } from '../../store/worldStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './Map.css'

export default function Map() {
  const navigate = useNavigate()
  const nodes = useWorldStore(s => s.graph.nodes)
  
  const nodesList = Object.values(nodes)
  
  return (
    <div className="map-container">
      <header className="map-header">
        <h1>MAPA GLOBAL</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>Volver</Button>
      </header>
      
      <div className="map-content">
        <div className="map-canvas">
          <div className="map-grid">
            {nodesList.length === 0 && (
              <div className="map-empty">Cargando mapa...</div>
            )}
            {nodesList.map((node: any) => (
              <div 
                key={node.id} 
                className={`map-node ${node.type || 'unknown'}`}
                onClick={() => console.log('Navigate to', node.id)}
              >
                <span className="map-node-icon">
                  {node.type === 'refuge' && '🏠'}
                  {node.type === 'abandoned' && '🏚️'}
                  {node.type === 'military' && '🎖️'}
                  {node.type === 'hospital' && '🏥'}
                  {node.type === 'store' && '🏪'}
                  {!node.type && '📍'}
                </span>
                <span className="map-node-name">{node.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <aside className="map-sidebar">
          <Card title="Leyenda">
            <div className="legend">
              <div className="legend-item">
                <span className="legend-icon">🏠</span>
                <span>Refugio</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🏚️</span>
                <span>Abandonado</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🎖️</span>
                <span>Militar</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🏥</span>
                <span>Hospital</span>
              </div>
              <div className="legend-item">
                <span className="legend-icon">🏪</span>
                <span>Tienda</span>
              </div>
            </div>
          </Card>
          
          <Card title="Filtros" style={{ marginTop: '12px' }}>
            <div className="filters">
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Mostrar refugios</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Mostrar peligros</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" defaultChecked />
                <span>Mostrar jugadores</span>
              </label>
              <label className="filter-checkbox">
                <input type="checkbox" />
                <span>Solo reclamables</span>
              </label>
            </div>
          </Card>
          
          <Card title="Estadísticas" style={{ marginTop: '12px' }}>
            <div className="map-stats">
              <div className="stat-row">
                <span>Nodos totales:</span>
                <strong>{nodesList.length}</strong>
              </div>
              <div className="stat-row">
                <span>Reclamados:</span>
                <strong>3</strong>
              </div>
              <div className="stat-row">
                <span>Disputados:</span>
                <strong className="text-warn">2</strong>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
