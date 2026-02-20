import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  showValues?: boolean;
  variant?: 'health' | 'hunger' | 'stamina' | 'xp' | 'progress' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = false,
  showValues = false,
  variant = 'progress',
  size = 'md',
  animated = false,
  className = ''
}) => {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const percentageRounded = Math.floor(percentage);

  return (
    <div className={`progress-bar-wrapper progress-bar-wrapper--${size} ${className}`}>
      {(label || showPercentage || showValues) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          <span className="progress-bar__values">
            {showValues && (
              <span className="progress-bar__numbers">
                {Math.floor(current)}/{max}
              </span>
            )}
            {showPercentage && (
              <span className="progress-bar__percentage">
                {percentageRounded}%
              </span>
            )}
          </span>
        </div>
      )}
      
      <div className={`progress-bar progress-bar--${variant}`}>
        <div 
          className={`progress-bar__fill ${animated ? 'progress-bar__fill--animated' : ''}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentageRounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {animated && <div className="progress-bar__shimmer" />}
        </div>
      </div>
    </div>
  );
};
