import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function DatePicker({ value, onChange, placeholder = "Sanani tanlang", className = "", label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate.getTime() - offset)).toISOString().split('T')[0];
    onChange(localISOTime);
    setIsOpen(false);
  };

  const days = [];
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  for (let i = 0; i < paddingDays; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const offset = dateObj.getTimezoneOffset() * 60000;
    const dateStr = (new Date(dateObj.getTime() - offset)).toISOString().split('T')[0];
    const todayObj = new Date();
    const todayStr = (new Date(todayObj.getTime() - todayObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    
    const isSelected = value === dateStr;
    const isToday = todayStr === dateStr;
    days.push(
      <button
        key={i}
        type="button"
        onClick={() => handleDateClick(i)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors ${
          isSelected 
            ? 'bg-primary text-white font-bold shadow-md' 
            : isToday 
              ? 'bg-primary/20 text-primary font-bold' 
              : 'text-text-main hover:bg-bg-secondary active:bg-bg-tertiary'
        }`}
      >
        {i}
      </button>
    );
  }

  const monthNames = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];

  return (
    <div className={`relative w-full flex flex-col ${className}`} ref={containerRef}>
      {label && <label className="text-sm font-medium text-text-secondary mb-1 block">{label}</label>}
      <div 
        className="flex items-center justify-between w-full bg-bg-secondary text-text-main px-4 py-3 rounded-xl border border-border cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-text-main" : "text-text-tertiary"}>
          {value || placeholder}
        </span>
        <Calendar size={18} className="text-text-secondary" />
      </div>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-[300px] bg-bg-card border border-border rounded-3xl shadow-2xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-bg-secondary rounded-full transition-colors text-text-secondary hover:text-text-main">
                <ChevronLeft size={20} />
              </button>
              <div className="font-bold text-lg text-text-main">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-bg-secondary rounded-full transition-colors text-text-secondary hover:text-text-main">
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-text-tertiary">
              <div>Du</div><div>Se</div><div>Ch</div><div>Pa</div><div>Ju</div><div>Sh</div><div>Ya</div>
            </div>
            <div className="grid grid-cols-7 gap-1 place-items-center">
              {days}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
