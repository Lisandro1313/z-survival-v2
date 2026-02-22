import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorldStore } from '../../store/worldStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './NodeView.css'

export default function NodeView() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const entities = useWorldStore(state => Object.values(state.entities))
  const currentNode = useWorldStore(state => state.currentNode)
  const node = useWorldStore(state => state.graph.nodes[currentNode || ''])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    
    // Clear canvas
    ctx.fillStyle = '#0d0d0d'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    
    for (let x = 0; x < canvas.width; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y < canvas.height; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    // Draw entities
    entities.forEach(entity => {
      const x = (entity.x / 100) * canvas.width
      const y = (entity.y / 100) * canvas.height
      
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      if (entity.type === 'player') {
        ctx.fillText('👤', x, y)
      } else if (entity.type === 'npc') {
        ctx.fillText('🧍', x, y)
      } else if (entity.type === 'zombie') {
        ctx.fillText('🧟', x, y)
      } else if (entity.type === 'loot') {
        ctx.fillText('📦', x, y)
      }
      
      // Draw name/HP if available
      if (entity.name || entity.hp) {
        ctx.font = '10px sans-serif'
        ctx.fillStyle = '#14ff83'
        if (entity.name) {
          ctx.fillText(entity.name, x, y - 20)
        }
        if (entity.hp && entity.maxHp) {
          ctx.fillText(`${entity.hp}/${entity.maxHp}`, x, y + 20)
        }
      }
    })
  }, [entities])
  
  return (
    <div className="node-view">
      <div className="node-scene">
        <Card title={node?.name || 'Nodo'}>
          <canvas ref={canvasRef} className="scene-canvas" />
          <div className="scene-controls">
            <Button variant="secondary" onClick={() => navigate('/')}>
              ← Volver
            </Button>
            <Button variant="primary">
              Scavenge (Buscar recursos)
            </Button>
          </div>
        </Card>
      </div>
      
      <aside className="node-panel">
        <Card title="Panel Contextual" variant="glass">
          {node ? (
            <>
              <div className="node-info">
                <div className="info-row">
                  <span>Tipo:</span>
                  <span className={`node-type-${node.type}`}>{node.type}</span>
                </div>
                <div className="info-row">
                  <span>Peligro:</span>
                  <span>{node.dangerLevel}/10</span>
                </div>
                <div className="info-row">
                  <span>Tipo:</span>
                  <span>{node.type}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted">Cargando nodo...</p>
          )}
        </Card>
      </aside>
    </div>
  )
}


