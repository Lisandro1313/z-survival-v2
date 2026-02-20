import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import './Refuge.css'

export default function Refuge() {
  const navigate = useNavigate()
  
  return (
    <div className="refuge-container">
      <header className="refuge-header">
        <h1>REFUGIO CENTRAL</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>Volver</Button>
      </header>
      
      <div className="refuge-kpis">
        <Card variant="default">
          <div className="kpi">
            <span className="kpi-label">Moral</span>
            <div className="kpi-bar">
              <div className="kpi-fill" style={{ width: '78%', background: 'var(--neon)' }}></div>
            </div>
            <span className="kpi-value">78%</span>
          </div>
        </Card>
        
        <Card variant="default">
          <div className="kpi">
            <span className="kpi-label">Seguridad</span>
            <div className="kpi-bar">
              <div className="kpi-fill" style={{ width: '45%', background: 'var(--warn)' }}></div>
            </div>
            <span className="kpi-value">45%</span>
          </div>
        </Card>
        
        <Card variant="default">
          <div className="kpi">
            <span className="kpi-label">Cohesión</span>
            <div className="kpi-bar">
              <div className="kpi-fill" style={{ width: '62%', background: 'var(--neon)' }}></div>
            </div>
            <span className="kpi-value">62%</span>
          </div>
        </Card>
        
        <Card variant="default">
          <div className="kpi">
            <span className="kpi-label">Recursos</span>
            <div className="kpi-bar">
              <div className="kpi-fill" style={{ width: '34%', background: 'var(--danger)' }}></div>
            </div>
            <span className="kpi-value">34%</span>
          </div>
        </Card>
      </div>
      
      <div className="refuge-content">
        <section className="refuge-section">
          <h2>Estructuras</h2>
          <div className="structures-grid">
            <Card title="Muralla" footer={<Button>Mejorar (500 caps)</Button>}>
              <p>Nivel 2</p>
              <p>Defensa: +25%</p>
            </Card>
            
            <Card title="Torre de Vigilancia" footer={<Button>Construir (800 caps)</Button>}>
              <p>No construida</p>
              <p>Detección temprana de raids</p>
            </Card>
            
            <Card title="Jardín" footer={<Button>Mejorar (300 caps)</Button>}>
              <p>Nivel 1</p>
              <p>Producción: +5 comida/día</p>
            </Card>
            
            <Card title="Taller" footer={<Button>Construir (1000 caps)</Button>}>
              <p>No construido</p>
              <p>Crafteo avanzado</p>
            </Card>
          </div>
        </section>
        
        <aside className="refuge-sidebar">
          <Card title="Defensas Activas">
            <div className="defense-list">
              <div className="defense-item">🔥 Trampa de Fuego x3</div>
              <div className="defense-item">⚡ Cerca Eléctrica x2</div>
              <div className="defense-item">🗼 Torre x1</div>
            </div>
            <Button variant="primary" size="sm" style={{ marginTop: '12px' }}>
              Gestionar Defensas
            </Button>
          </Card>
          
          <Card title="Actividad Reciente" style={{ marginTop: '12px' }}>
            <div className="activity-log">
              <div className="activity-item">✅ Muralla mejorada a lvl 2</div>
              <div className="activity-item">➕ Juan contribuyó 200 madera</div>
              <div className="activity-item">🔨 Jardín completado</div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
