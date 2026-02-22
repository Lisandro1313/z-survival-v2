import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { useSocialStore } from '../../store/socialStore'
import { socialActions } from '../../services/socialActions'
import './Social.css'

// TODO: Temporal hasta implementar auth
const TEMP_PLAYER_ID = 'player_demo_1'

export default function Social() {
  const navigate = useNavigate()
  const [postText, setPostText] = useState('')
  
  // Store state
  const sortedPosts = useSocialStore(state => state.getSortedPosts())
  const onlinePlayers = useSocialStore(state => Object.values(state.onlinePlayers))
  const toggleLike = useSocialStore(state => state.toggleLike)
  
  // Cargar datos al montar
  useEffect(() => {
    socialActions.fogata.loadPosts('recent')
    socialActions.presence.requestOnlinePlayers()
  }, [])
  
  const handleCreatePost = () => {
    if (!postText.trim()) return
    socialActions.fogata.createPost(
      'Post desde la fogata',
      postText,
      'general',
      TEMP_PLAYER_ID
    )
    setPostText('')
  }
  
  const handleToggleLike = (postId: string) => {
    toggleLike(postId, TEMP_PLAYER_ID)
    socialActions.fogata.toggleLike(postId, TEMP_PLAYER_ID)
  }
  
  return (
    <div className="social-container">
      <header className="social-header">
        <h1>TABERNA / FOGATA</h1>
        <Button variant="ghost" onClick={() => navigate('/')}>Volver</Button>
      </header>
      
      <div className="social-content">
        <section className="social-main">
          <Card title="Nueva Publicación">
            <textarea 
              className="post-composer"
              placeholder="¿Qué está pasando?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              maxLength={280}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span className="char-count">{postText.length}/280</span>
              <Button onClick={handleCreatePost} disabled={!postText.trim()}>
                Publicar
              </Button>
            </div>
          </Card>
          
          <div className="posts-feed">
            {sortedPosts.length === 0 ? (
              <Card variant="default">
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No hay publicaciones todavía. ¡Sé el primero en publicar!
                </p>
              </Card>
            ) : (
              sortedPosts.map(post => (
                <Card key={post.id} variant="default" style={{ marginBottom: '12px' }}>
                  <div className="post">
                    <div className="post-header">
                      <strong>{post.authorName || 'Anónimo'}</strong>
                      <span className="post-time">
                        {formatTime(post.timestamp)}
                      </span>
                    </div>
                    {post.title && (
                      <h4 style={{ margin: '8px 0', fontSize: '16px' }}>{post.title}</h4>
                    )}
                    <p className="post-content">{post.content}</p>
                    <div className="post-meta" style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      marginTop: '8px' 
                    }}>
                      {post.category && `#${post.category}`}
                    </div>
                    <div className="post-actions">
                      <button 
                        className="post-action"
                        onClick={() => handleToggleLike(post.id)}
                        style={{ 
                          fontWeight: (Array.isArray(post.likes) && post.likes.includes(TEMP_PLAYER_ID)) ? 'bold' : 'normal'
                        }}
                      >
                        ❤️ {Array.isArray(post.likes) ? post.likes.length : 0}
                      </button>
                      <button className="post-action">💬 {post.commentCount}</button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
        
        <aside className="social-sidebar">
          <Card title="Juegos Activos">
            <div className="games-list">
              <div className="game-item">
                <span>🎲 Dados</span>
                <Button size="sm" variant="secondary">Unirse</Button>
              </div>
              <div className="game-item">
                <span>🃏 Póker</span>
                <Button size="sm" variant="secondary">Unirse</Button>
              </div>
            </div>
            <Button variant="primary" size="sm" style={{ marginTop: '12px', width: '100%' }}>
              Crear Juego
            </Button>
          </Card>
          
          <Card title="Jugadores Online" style={{ marginTop: '12px' }}>
            <div className="players-list">
              {onlinePlayers.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                  No hay jugadores conectados
                </p>
              ) : (
                onlinePlayers.map(player => (
                  <div key={player.id} className="player-item" title={player.nodeId || 'Ubicación desconocida'}>
                    <span>👤 {player.name}</span>
                    <span style={{ 
                      fontSize: '11px', 
                      color: 'var(--text-secondary)',
                      marginLeft: '8px'
                    }}>
                      Lv.{player.level || 1}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}

// Helper: Formatear timestamp como tiempo relativo
function formatTime(timestamp: number): string {
  const now = Date.now()
  const then = timestamp
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  return `Hace ${diffDays}d`
}


