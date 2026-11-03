import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ClinicalDatePickerProps {
  value: string; // 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  maxDate?: string; // 'YYYY-MM-DD'
  label?: string;
  subLabel?: string;
  placeholder?: string;
  isNightShiftMode?: boolean;
  className?: string;
  align?: 'left' | 'right';
  showPresets?: boolean;
  presets?: Array<{ label: string; value: string }>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return 'Select date';
  try {
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 12);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
};

export const ClinicalDatePicker: React.FC<ClinicalDatePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  subLabel,
  placeholder = 'Select date',
  isNightShiftMode = false,
  className = '',
  align = 'left',
  showPresets = true,
  presets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Parse current value or fallback to today
  const parsedDate = useMemo(() => {
    if (value) {
      const [y, m, d] = value.split('-').map((n) => parseInt(n, 10));
      if (y && m && d) {
        return new Date(y, m - 1, d);
      }
    }
    return new Date();
  }, [value]);

  // Current calendar view month and year
  const [viewYear, setViewYear] = useState(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate.getMonth());
  const [manualInput, setManualInput] = useState(value || '');

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-').map((n) => parseInt(n, 10));
      if (y && m && d) {
        setViewYear(y);
        setViewMonth(m - 1);
        setManualInput(value);
      }
    }
  }, [value]);

  // Close calendar when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange(formatted);
    setManualInput(formatted);
    setIsOpen(false);
  };

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formatted = `${today.getFullYear()}-${mm}-${dd}`;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onChange(formatted);
    setManualInput(formatted);
    setIsOpen(false);
  };

  // Quick Presets calculation
  const defaultPresets = useMemo(() => {
    const today = new Date();
    // Next Monday
    const nextMon = new Date(today);
    const dayOfWeek = today.getDay();
    const daysUntilNextMon = ((1 + 7 - dayOfWeek) % 7) || 7;
    nextMon.setDate(today.getDate() + daysUntilNextMon);

    // In 2 Weeks
    const twoWks = new Date(today);
    twoWks.setDate(today.getDate() + 14);

    // In 1 Month
    const oneMo = new Date(today);
    oneMo.setMonth(today.getMonth() + 1);

    // In 13 Weeks (Standard Travel Nurse Rotation)
    const thirteenWks = new Date(today);
    thirteenWks.setDate(today.getDate() + 91);

    const toIso = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return [
      { label: 'Next Mon', value: toIso(nextMon) },
      { label: '+2 Wks', value: toIso(twoWks) },
      { label: '+1 Mo', value: toIso(oneMo) },
      { label: '+13 Wks', value: toIso(thirteenWks) },
    ];
  }, []);

  const activePresets = presets || defaultPresets;

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      dateStr: string;
      isSelected: boolean;
      isToday: boolean;
      isDisabled: boolean;
    }> = [];

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = viewMonth === 0 ? 12 : viewMonth;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isSelected: dateStr === value,
        isToday: dateStr === todayStr,
        isDisabled: minDate ? dateStr < minDate : false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled = (minDate ? dateStr < minDate : false) || (maxDate ? dateStr > maxDate : false);
      days.push({
        day: d,
        isCurrentMonth: true,
        dateStr,
        isSelected: dateStr === value,
        isToday: dateStr === todayStr,
        isDisabled,
      });
    }

    // Trailing days to complete the 7-day rows (up to 42 cells or remaining of week)
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingDays; d++) {
      const nextM = viewMonth === 11 ? 1 : viewMonth + 2;
      const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: false,
        dateStr,
        isSelected: dateStr === value,
        isToday: dateStr === todayStr,
        isDisabled: minDate ? dateStr < minDate : false,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, maxDate]);

  // Year choices for quick selection (current year - 80 to + 5)
  const yearOptions = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [];
    for (let y = currentY + 5; y >= currentY - 80; y--) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Optional Label Header */}
      {(label || subLabel) && (
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          {label && (
            <label
              onClick={() => setIsOpen((prev) => !prev)}
              className="block text-xs font-bold text-[#0B2559]/70 dark:text-[#E6ECF7]/70 uppercase tracking-wider cursor-pointer hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8] transition-colors"
            >
              {label}
            </label>
          )}
          {subLabel && (
            <span className="text-[11px] font-semibold text-[#0A6FA8] dark:text-[#3E9AD1]">
              {subLabel}
            </span>
          )}
        </div>
      )}

      {/* Main Interactive Trigger Card */}
      {/* Outer padding ensures focus rings never clip against parent bounding boxes */}
      <div className="p-0.5">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full h-12 rounded-xl border flex items-center justify-between px-3.5 sm:px-4 cursor-pointer transition-all duration-200 ease-in-out duration-200 text-left outline-none ${
            isOpen
              ? 'ring-2 ring-[#0A6FA8] dark:ring-[#3E9AD1] ring-offset-1 dark:ring-offset-[#0B1626] border-[#0A6FA8] bg-white dark:bg-[#182840]'
              : 'hover:border-[#0A6FA8] dark:hover:border-[#3E9AD1] bg-[#EFF6FB] dark:bg-[#182840] border-[rgba(11,37,89,0.15)] dark:border-[#233550]'
          } focus-visible:ring-2 focus-visible:ring-[#0A6FA8] dark:focus-visible:ring-[#3E9AD1] focus-visible:ring-offset-1 dark:focus-visible:ring-offset-[#0B1626]`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                isOpen ? 'text-[#0A6FA8] dark:text-[#3E9AD1] scale-110' : 'text-[#0A6FA8] dark:text-[#3E9AD1]'
              }`}
            >
              calendar_month
            </span>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-[#0B2559] dark:text-white tabular-nums truncate">
                {value ? formatDateDisplay(value) : placeholder}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {isOpen ? 'Select a day below' : 'Click to choose date'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span
              className={`material-symbols-outlined text-[18px] text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-[#0A6FA8] dark:text-[#3E9AD1]' : ''
              }`}
            >
              arrow_drop_down
            </span>
          </div>
        </button>
      </div>

      {/* Quick Shift Presets Bar (Below Input) */}
      {showPresets && activePresets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2 px-0.5">
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-0.5">
            Quick Dates:
          </span>
          {activePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(preset.value);
                setManualInput(preset.value);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                value === preset.value
                  ? 'bg-[#0A6FA8] text-white border-[#0A6FA8] shadow-2xs'
                  : 'bg-white dark:bg-[#182840] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-[#233550] hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#203450] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#203450]'
              } focus-visible:ring-2 focus-visible:ring-[#0A6FA8] outline-none`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Interactive Clinical Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-2 ${
              align === 'right' ? 'right-0' : 'left-0'
            } w-[280px] sm:w-[350px] max-w-[calc(100%-32px)] p-4 bg-white dark:bg-[#0E1A2E] rounded-2xl shadow-[0_12px_36px_rgba(11,37,89,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.6)] border border-[rgba(11,37,89,0.12)] dark:border-[#233550] z-50`}
          >
            {/* Header: Month/Year navigation */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-[#233550]">
              <div className="flex items-center gap-1.5">
                {/* Month Dropdown */}
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="text-sm font-bold text-[#0B2559] dark:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-[#182840] px-2 py-1 rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-[#0A6FA8]"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx} className="bg-white dark:bg-[#0E1A2E] text-gray-900 dark:text-white">
                      {name}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="text-sm font-bold text-[#0B2559] dark:text-white bg-transparent hover:bg-gray-100 dark:hover:bg-[#182840] px-2 py-1 rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-[#0A6FA8] tabular-nums"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y} className="bg-white dark:bg-[#0E1A2E] text-gray-900 dark:text-white">
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prev / Next Chevrons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  title="Previous month"
                  aria-label="Previous month"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-100 dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                  title="Next month"
                  aria-label="Next month"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAY_NAMES.map((day) => (
                <div key={day} className="text-[11px] font-bold text-gray-400 dark:text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => {
                const isCurrentMonth = item.isCurrentMonth;
                const isSelected = item.isSelected;
                const isToday = item.isToday;
                const isDisabled = item.isDisabled;

                return (
                  <button
                    key={`${item.dateStr}-${idx}`}
                    type="button"
                    disabled={isDisabled}
                    onClick={(e) => {
                      if (!isDisabled) {
                        handleSelectDay(item.day, e);
                      }
                    }}
                    className={`h-9 w-full rounded-xl text-xs font-semibold flex items-center justify-center relative transition-all duration-200 ease-in-out duration-150 tabular-nums ${
                      isDisabled
                        ? 'opacity-25 cursor-not-allowed text-gray-400'
                        : isSelected
                        ? 'bg-[#0A6FA8] text-white shadow-xs font-bold cursor-pointer'
                        : isToday
                        ? 'border border-[#0A6FA8] text-[#0A6FA8] dark:text-[#3E9AD1] font-bold hover:bg-[#EFF6FB] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#EFF6FB] dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] cursor-pointer'
                        : isCurrentMonth
                        ? 'text-[#0B2559] dark:text-[#E6ECF7] hover:bg-[#EFF6FB] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#EFF6FB] dark:hover:bg-[#182840] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#182840] hover:text-[#0A6FA8] focus-visible:text-[#0A6FA8] cursor-pointer'
                        : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-50 dark:hover:bg-[#152338] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#152338] cursor-pointer'
                    }`}
                  >
                    <span>{item.day}</span>
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0A6FA8] dark:bg-[#3E9AD1]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Manual Direct Input Fallback & Action Footer */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#233550] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="font-bold text-[#0A6FA8] dark:text-[#3E9AD1] hover:underline cursor-pointer"
                >
                  Jump to Today
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="font-semibold text-gray-500 hover:text-gray-800 focus-visible:text-gray-800 dark:hover:text-gray-200 focus-visible:text-gray-200 cursor-pointer"
                >
                  Done
                </button>
              </div>

              {/* Direct YYYY-MM-DD input field */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Type:</span>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD"
                  value={manualInput}
                  onChange={(e) => {
                    const text = e.target.value;
                    setManualInput(text);
                    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                      onChange(text);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (/^\d{4}-\d{2}-\d{2}$/.test(manualInput)) {
                        onChange(manualInput);
                        setIsOpen(false);
                      }
                    }
                  }}
                  className="flex-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 dark:border-[#233550] bg-gray-50 dark:bg-[#182840] text-[#0B2559] dark:text-white tabular-nums focus:ring-1 focus:ring-[#0A6FA8] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(manualInput)) {
                      onChange(manualInput);
                      setIsOpen(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#0A6FA8] text-white text-xs font-semibold hover:bg-[#0C7EBF] focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0C7EBF] cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
