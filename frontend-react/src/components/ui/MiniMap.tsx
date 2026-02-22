import React from 'react'
import { useWorldStore } from '../../store/worldStore'
import { usePlayerStore } from '../../store/playerStore'
import './MiniMap.css'

export default function MiniMap() {
  const nodes = useWorldStore(s => s.nodes)
  const currentNodeId = usePlayerStore(s => s.nodeId)
  
  // Get nearby nodes (simplified - in real app would use distance calculation)
  const nearbyNodes = Object.values(nodes).slice(0, 9)
  
  return (
    <div className="minimap">
      <div className="minimap-grid">
        {nearbyNodes.length === 0 && (
          <div className="minimap-empty">Cargando mapa...</div>
        )}
        {nearbyNodes.map((node: any) => (
          <div 
            key={node.id} 
            className={`minimap-node ${node.id === currentNodeId ? 'current' : ''}`}
            title={node.name}
          >
            {node.id === currentNodeId && '📍'}
          </div>
        ))}
      </div>
    </div>
  )
}

