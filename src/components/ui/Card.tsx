import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  color?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  
  const variantClasses = {
    default: 'border border-gray-200',
    elevated: 'shadow-md',
    outlined: 'border-2 border-gray-300'
  };
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', color = 'default' }: CardHeaderProps) {
  const baseClasses = 'px-6 py-4 border-b border-gray-200';
  
  const colorClasses = {
    default: 'bg-gray-50 text-gray-900',
    primary: 'bg-blue-600 text-white',
    info: 'bg-cyan-600 text-white',
    success: 'bg-green-600 text-white',
    warning: 'bg-yellow-500 text-white',
    error: 'bg-red-600 text-white'
  };
  
  const combinedClasses = `${baseClasses} ${colorClasses[color]} ${className}`;

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardContentProps) {
  const baseClasses = 'px-6 py-4';
  const combinedClasses = `${baseClasses} ${className}`;

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export function CardActions({ children, className = '', align = 'right' }: CardActionsProps) {
  const baseClasses = 'px-6 py-4 border-t border-gray-200 flex gap-2';
  
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };
  
  const combinedClasses = `${baseClasses} ${alignClasses[align]} ${className}`;

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}

export default Card;