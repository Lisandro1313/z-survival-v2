import { useNavigate } from 'react-router-dom'
import { useWorldStore } from '../../store/worldStore'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const currentNode = useWorldStore(state => state.currentNode)
  const node = useWorldStore(state => state.graph.nodes[currentNode || ''])
  const events = useWorldStore(state => Object.values(state.events))
  
  return (
    <div className="dashboard">
     <div className="dashboard-main">
        <Card variant="glass">
          <div className="welcome-section">
            <h1>{node?.name || 'REFUGIO CENTRAL'}</h1>
            <p className="text-muted">
              {node?.description || 'Estás a salvo aquí. ¿Qué hacés ahora?'}
            </p>
          </div>
          
          <div className="action-buttons">
            <Button 
              variant="primary" 
              size="lg" 
              fullWidth
              onClick={() => navigate('/node')}
            >
              🗺️ EXPLORAR
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              fullWidth
              onClick={() => navigate('/quests')}
            >
              📋 MISIONES
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              fullWidth
              onClick={() => navigate('/refuge')}
            >
              🏠 GESTIÓN REFUGIO
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              fullWidth
              onClick={() => navigate('/social')}
            >
              🔥 FOGATA / SOCIAL
            </Button>
          </div>
        </Card>
      </div>
      
      <aside className="dashboard-sidebar">
        <Card title="Eventos Activos" variant="glass">
          {events.length > 0 ? (
            <div className="events-list">
              {events.slice(0, 3).map(event => (
                <div key={event.id} className="event-item">
                  <div className="event-type">{event.type}</div>
                  <div className="event-desc">{event.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">No hay eventos activos</p>
          )}
        </Card>
        
        <Card title="Noticias" variant="glass">
          <div className="news-item">
            <p>— Airdrop detectado en Zona Norte</p>
          </div>
          <div className="news-item">
            <p>— Comerciante visitará el refugio</p>
          </div>
        </Card>
      </aside>
    </div>
  )
}

