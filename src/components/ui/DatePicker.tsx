import React, { useState } from 'react';
import { Modal } from './Modal';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

export function DatePicker({ value, onChange, label, error }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Parse value or use current date
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i);

  const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

  const pad = (n: number) => n.toString().padStart(2, '0');

  const handleSelect = (day: number) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  return (
    <div className="flex flex-col gap-1.5 w-full relative">
      {label && <label className="text-sm font-medium text-text-main ml-1">{label}</label>}
      <div 
        className={`w-full px-4 py-3.5 bg-bg-secondary border border-border rounded-[var(--radius-input)] text-text-main text-base outline-none flex justify-between items-center cursor-pointer active:scale-[0.98] ${error ? 'border-red-500' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <span className={value ? 'text-text-main font-semibold' : 'text-text-tertiary'}>
          {value || 'Sanani tanlang...'}
        </span>
        <CalendarIcon size={20} className="text-text-tertiary" />
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Sana tanlash">
        <div className="flex justify-between items-center mb-4 px-2">
          <button type="button" onClick={prevMonth} className="p-2 bg-bg-secondary rounded-full hover:bg-border transition-colors"><ChevronLeft size={20}/></button>
          <span className="font-bold text-lg">{monthNames[month]} {year}</span>
          <button type="button" onClick={nextMonth} className="p-2 bg-bg-secondary rounded-full hover:bg-border transition-colors"><ChevronRight size={20}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(d => (
            <div key={d} className="text-xs font-bold text-text-tertiary py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map(b => <div key={`blank-${b}`} className="p-2"/>)}
          {days.map(d => {
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const isSelected = value === dateStr;
            const isToday = todayStr === dateStr;
            return (
              <button 
                type="button"
                key={d} 
                onClick={() => handleSelect(d)}
                className={`
                  aspect-square flex items-center justify-center rounded-full text-sm font-medium transition-colors
                  ${isSelected ? 'bg-primary text-white font-bold shadow-md' : 
                    isToday ? 'bg-primary/10 text-primary font-bold border border-primary/20' : 
                    'hover:bg-bg-secondary active:bg-border text-text-main'}
                `}
              >
                {d}
              </button>
            )
          })}
        </div>
      </Modal>
    </div>
  );
}
