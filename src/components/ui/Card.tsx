import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export function Card({
  className = '',
  padding = 'md',
  interactive = false,
  children,
  ...props
}: CardProps) {
  const baseStyles = 'bg-bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--app-shadow-card)] overflow-hidden';
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const interactiveStyles = interactive ? 'transition-transform active:scale-[0.98] cursor-pointer hover:border-text-tertiary' : '';

  return (
    <div
      className={`${baseStyles} ${paddings[padding]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
