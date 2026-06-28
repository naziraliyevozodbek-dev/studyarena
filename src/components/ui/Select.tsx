import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal } from './Modal';

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (e: any) => void;
  value?: string | number | readonly string[];
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className = '', label, error, children, onChange, value, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Extract options from children
    const options: { value: string, label: React.ReactNode }[] = [];
    let placeholder = 'Tanlang...';

    React.Children.forEach(children, (child) => {
      if (React.isValidElement<React.ComponentProps<'option'>>(child) && child.type === 'option') {
        if (child.props.disabled && child.props.value === "") {
          placeholder = child.props.children as string;
        } else if (!child.props.disabled) {
          options.push({
            value: String(child.props.value),
            label: child.props.children
          });
        }
      }
    });

    const selectedOption = options.find(o => o.value === String(value));

    const handleSelect = (val: string) => {
      if (onChange) {
        onChange({ target: { value: val } });
      }
      setIsOpen(false);
    };

    return (
      <div className="flex flex-col gap-1.5 w-full relative" ref={ref}>
        {label && (
          <label className="text-sm font-medium text-text-main ml-1">
            {label}
          </label>
        )}
        
        <div 
          className={`
            w-full px-4 py-3.5 bg-bg-secondary border border-border rounded-[var(--radius-input)] 
            text-text-main text-base outline-none transition-colors flex justify-between items-center cursor-pointer active:scale-[0.98]
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          onClick={() => setIsOpen(true)}
        >
          <span className={selectedOption ? 'text-text-main font-semibold' : 'text-text-tertiary'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown size={20} className="text-text-tertiary" />
        </div>

        {error && (
          <span className="text-xs text-red-500 ml-1">{error}</span>
        )}

        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={label || 'Tanlang'}>
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`p-4 rounded-xl text-left transition-colors font-medium text-base active:scale-[0.98] ${opt.value === String(value) ? 'bg-primary text-white shadow-md' : 'bg-bg-secondary hover:bg-border text-text-main'}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            {options.length === 0 && (
              <div className="text-center py-4 text-text-tertiary">Variantlar yo'q</div>
            )}
          </div>
        </Modal>
      </div>
    );
  }
);

Select.displayName = 'Select';
