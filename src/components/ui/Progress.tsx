import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
  height?: 'thin' | 'normal' | 'thick';
  indeterminate?: boolean;
}

export interface ProgressCircularProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

export function ProgressBar({ 
  value, 
  className = '', 
  color = 'primary',
  height = 'normal',
  indeterminate = false 
}: ProgressBarProps) {
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden';
  
  const heightClasses = {
    thin: 'h-1',
    normal: 'h-2',
    thick: 'h-4'
  };
  
  const colorClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    error: 'bg-red-600'
  };
  
  const combinedClasses = `${baseClasses} ${heightClasses[height]} ${className}`;
  const progressClasses = `h-full transition-all duration-300 ${colorClasses[color]}`;

  if (indeterminate) {
    return (
      <div className={combinedClasses}>
        <div className={`${progressClasses} w-full animate-pulse`} />
      </div>
    );
  }

  return (
    <div className={combinedClasses}>
      <div 
        className={progressClasses}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function ProgressCircular({ 
  size = 'medium', 
  className = '', 
  color = 'primary' 
}: ProgressCircularProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };
  
  const colorClasses = {
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-500',
    error: 'text-red-600'
  };
  
  const combinedClasses = `animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <svg className={combinedClasses} fill="none" viewBox="0 0 24 24">
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Volume level progress bar for microphone testing
export interface VolumeProgressProps {
  level: number; // 0-100
  className?: string;
}

export function VolumeProgress({ level, className = '' }: VolumeProgressProps) {
  const normalizedLevel = Math.min(100, Math.max(0, level));
  let color: ProgressBarProps['color'] = 'primary';
  
  if (normalizedLevel < 10) {
    color = 'error';
  } else if (normalizedLevel < 30) {
    color = 'warning';
  } else {
    color = 'success';
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm text-gray-600">
        <span>Volume Level</span>
        <span>{normalizedLevel}%</span>
      </div>
      <ProgressBar 
        value={normalizedLevel} 
        color={color}
        height="normal"
      />
      {normalizedLevel < 10 && (
        <p className="text-xs text-red-600">Volume too low - speak louder</p>
      )}
    </div>
  );
}

export default { ProgressBar, ProgressCircular, VolumeProgress };