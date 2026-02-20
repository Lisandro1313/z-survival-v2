import { ReactNode, CSSProperties } from 'react'
import './Card.css'

interface CardProps {
  children: ReactNode
  title?: string
  footer?: ReactNode
  variant?: 'default' | 'glass' | 'danger' | 'success'
  onClick?: (e?: React.MouseEvent) => void
  style?: CSSProperties
  className?: string
}

export function Card({
  children,
  title,
  footer,
  variant = 'default',
  onClick,
  style,
  className
}: CardProps) {
  return (
    <div 
      className={`card card-${variant} ${onClick ? 'card-clickable' : ''} ${className || ''}`}
      onClick={onClick}
      style={style}
    >
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  )
}
