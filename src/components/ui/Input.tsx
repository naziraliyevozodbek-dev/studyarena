import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-text-main ml-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3.5 bg-bg-secondary border border-border rounded-[var(--radius-input)] 
            text-text-main text-base outline-none transition-colors
            placeholder:text-text-tertiary
            focus:border-primary focus:bg-bg-base
            disabled:opacity-50 disabled:bg-bg-secondary
            ${error ? 'border-red-500 focus:border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-500 ml-1">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
