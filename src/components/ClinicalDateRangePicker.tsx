import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  Check,
} from 'lucide-react';

export interface ClinicalDateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  onChange: (startDate: string, endDate: string) => void;
  minDate?: string; // 'YYYY-MM-DD'
  maxDate?: string; // 'YYYY-MM-DD'
  blackoutDates?: string[];
  isNightShiftMode?: boolean;
  onApply?: () => void;
  onClose?: () => void;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Format concise date e.g. "Oct 5, 2026" or "Oct 5"
export const formatDisplayDate = (
  dateStr: string,
  options?: { hideYear?: boolean },
): string => {
  if (!dateStr) return 'Select date';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
  if (isNaN(d.getTime())) return dateStr;

  if (options?.hideYear) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
};

// Calculate assignment duration summary
export const calculateAssignmentDuration = (
  startStr: string,
  endStr: string,
): { days: number; weeks: number; label: string } => {
  if (!startStr || !endStr) {
    return { days: 0, weeks: 0, label: '' };
  }
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const date1 = new Date(y1, m1 - 1, d1, 12);
  const date2 = new Date(y2, m2 - 1, d2, 12);
  const diffTime = date2.getTime() - date1.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (days <= 0) return { days: 0, weeks: 0, label: '' };

  const weeks = Math.floor(days / 7);
  const remainderDays = days % 7;

  let label = '';
  if (weeks > 0 && remainderDays > 0) {
    label = `${weeks}w ${remainderDays}d (${days} nights)`;
  } else if (weeks > 0) {
    label = `${weeks} weeks (${days} nights)`;
  } else {
    label = `${days} nights`;
  }

  return { days, weeks, label };
};

// Safe date add
const addWeeksToDateStr = (dateStr: string, weeks: number): string => {
  const parts = dateStr.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
  d.setDate(d.getDate() + weeks * 7);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ClinicalDateRangePicker: React.FC<ClinicalDateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  minDate,
  maxDate,
  onApply,
  onClose,
  blackoutDates = [],
  className = '',
}) => {
  const [activeStep, setActiveStep] = useState<'start' | 'end'>('start');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const effectiveMinDate = minDate || todayStr;

  const initialDate = useMemo(() => {
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, d || 1);
    }
    return new Date();
  }, [startDate]);

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const secondMonthDate = useMemo(() => {
    const d = new Date(viewYear, viewMonth + 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [startDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (effectiveMinDate && dateStr < effectiveMinDate) return;
    if (maxDate && dateStr > maxDate) return;

    if (activeStep === 'start') {
      if (endDate && dateStr >= endDate) {
        onChange(dateStr, '');
      } else {
        onChange(dateStr, endDate);
      }
      setActiveStep('end');
    } else {
      if (!startDate || dateStr < startDate) {
        onChange(dateStr, '');
        setActiveStep('end');
      } else if (dateStr === startDate) {
        onChange(dateStr, '');
      } else {
        onChange(startDate, dateStr);
        setActiveStep('start');
      }
    }
  };

  const handlePresetSelect = (weeks: number) => {
    let start = startDate;
    if (!start) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMon = ((1 + 7 - dayOfWeek) % 7) || 7;
      now.setDate(now.getDate() + daysUntilMon);
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      start = `${y}-${m}-${d}`;
    }

    const calculatedEnd = addWeeksToDateStr(start, weeks);
    onChange(start, calculatedEnd);
    setActiveStep('start');

    const [y, m] = start.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  };

  const handleClear = () => {
    onChange('', '');
    setActiveStep('start');
    setHoverDate(null);
  };

  const duration = useMemo(() => {
    return calculateAssignmentDuration(startDate, endDate);
  }, [startDate, endDate]);

  const getMonthDays = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isDisabled: boolean;
      isStart: boolean;
      isEnd: boolean;
      isInRange: boolean;
      isHoverPreview: boolean;
      isSingle: boolean;
    }> = [];

    // Leading days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isDisabled: true,
        isStart: false,
        isEnd: false,
        isInRange: false,
        isHoverPreview: false,
        isSingle: false,
      });
    }

    // Days in month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isDisabled =
        (effectiveMinDate ? dateStr < effectiveMinDate : false) ||
        (maxDate ? dateStr > maxDate : false) ||
        (blackoutDates.includes(dateStr));

      const isStart = Boolean(startDate && dateStr === startDate);
      const isEnd = Boolean(endDate && dateStr === endDate);
      const isSingle = isStart && isEnd;
      const isInRange = Boolean(
        startDate && endDate && dateStr > startDate && dateStr < endDate,
      );

      let isHoverPreview = false;
      if (
        activeStep === 'end' &&
        startDate &&
        !endDate &&
        hoverDate &&
        hoverDate > startDate
      ) {
        if (dateStr > startDate && dateStr < hoverDate) {
          isHoverPreview = true;
        }
      }

      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isDisabled,
        isStart,
        isEnd: isEnd || (activeStep === 'end' && !endDate && dateStr === hoverDate && hoverDate > startDate),
        isInRange: isInRange || isHoverPreview,
        isHoverPreview,
        isSingle,
      });
    }

    // Trailing days
    const remainingDays = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingDays; d++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isDisabled: true,
        isStart: false,
        isEnd: false,
        isInRange: false,
        isHoverPreview: false,
        isSingle: false,
      });
    }

    return days;
  };

  const month1Days = useMemo(() => getMonthDays(viewYear, viewMonth), [
    viewYear,
    viewMonth,
    startDate,
    endDate,
    hoverDate,
    activeStep,
    effectiveMinDate,
    maxDate,
  ]);

  const month2Days = useMemo(
    () => getMonthDays(secondMonthDate.year, secondMonthDate.month),
    [
      secondMonthDate,
      startDate,
      endDate,
      hoverDate,
      activeStep,
      effectiveMinDate,
      maxDate,
    ],
  );

  return (
    <div
      className={`w-full bg-white dark:bg-[#0B1626] rounded-2xl border border-[rgba(11,37,89,0.12)] dark:border-[#233550] shadow-2xl p-4 sm:p-6 text-left select-none ${className}`}
    >
      {/* 1. Streamlined Header: Clean Check-In / Check-Out Tabs */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[rgba(11,37,89,0.06)] dark:border-[#233550]">
        <div className="flex items-center gap-2">
          {/* Check-In Tab */}
          <button
            type="button"
            onClick={() => setActiveStep('start')}
            className={`px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeStep === 'start'
                ? 'bg-[#EFF6FB] dark:bg-[#182840] border-[#0A6FA8] dark:border-[#3E9AD1] ring-2 ring-[#0A6FA8]/20'
                : 'bg-transparent border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#15233a]'
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
              Check-in
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white tabular-nums whitespace-nowrap">
              {startDate ? formatDisplayDate(startDate, { hideYear: true }) : 'Add date'}
            </span>
          </button>

          <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden="true" />

          {/* Check-Out Tab */}
          <button
            type="button"
            onClick={() => setActiveStep('end')}
            className={`px-3 py-1.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeStep === 'end'
                ? 'bg-[#EFF6FB] dark:bg-[#182840] border-[#0A6FA8] dark:border-[#3E9AD1] ring-2 ring-[#0A6FA8]/20'
                : 'bg-transparent border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-[#15233a]'
            }`}
          >
            <span className="block text-[9px] font-bold uppercase tracking-wider text-[#0A6FA8] dark:text-[#3E9AD1]">
              Check-out
            </span>
            <span className="block text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white tabular-nums whitespace-nowrap">
              {endDate ? formatDisplayDate(endDate, { hideYear: true }) : 'Add date'}
            </span>
          </button>
        </div>

        {/* Duration Badge & Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          {startDate && endDate && duration.days > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-[#E1EFE9] dark:bg-[#195b4c]/25 text-[#2F6E5E] dark:text-[#aff0db] text-xs font-bold tabular-nums whitespace-nowrap">
              {duration.label}
            </span>
          )}

          {(startDate || endDate) && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-gray-400 hover:text-[#A8452E] hover:bg-[#F4E2DC]/30 transition-colors cursor-pointer"
              title="Reset dates"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Streamlined Contract Length Chips (Minimal Cognitive Load) */}
      <div className="pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mr-1 whitespace-nowrap">
          Duration:
        </span>
        {[
          { weeks: 4, label: '4 weeks' },
          { weeks: 8, label: '8 weeks' },
          { weeks: 13, label: '13 weeks', standard: true },
          { weeks: 26, label: '26 weeks' },
        ].map((preset) => {
          const isSelected = duration.weeks === preset.weeks;
          return (
            <button
              key={preset.weeks}
              type="button"
              onClick={() => handlePresetSelect(preset.weeks)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#0A6FA8] text-white border-[#0A6FA8] shadow-xs'
                  : preset.standard
                  ? 'bg-[#EFF6FB] dark:bg-[#15233a] border-[#0A6FA8]/40 hover:border-[#0A6FA8] text-[#0A6FA8] dark:text-[#3E9AD1]'
                  : 'bg-white dark:bg-[#0E1A2E] border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              {preset.label}
              {preset.standard && (
                <span className="ml-1 text-[10px] opacity-75 hidden sm:inline">• standard</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Dual-Month Responsive Calendar Grid */}
      <div className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
          {/* Month 1 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#0A6FA8] hover:bg-[#EFF6FB] dark:hover:bg-[#182840] transition-colors cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <h4 className="text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h4>
              <div className="w-8 md:hidden">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#0A6FA8] hover:bg-[#EFF6FB] dark:hover:bg-[#182840] transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <div className="hidden md:block w-8" />
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-0.5"
                >
                  {name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {month1Days.map((d) => renderDayCell(d))}
            </div>
          </div>

          {/* Month 2 (Desktop side-by-side) */}
          <div className="space-y-2 hidden md:block">
            <div className="flex items-center justify-between px-1">
              <div className="w-8" />
              <h4 className="text-xs sm:text-sm font-bold text-[#0B2559] dark:text-white">
                {MONTH_NAMES[secondMonthDate.month]} {secondMonthDate.year}
              </h4>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#0A6FA8] hover:bg-[#EFF6FB] dark:hover:bg-[#182840] transition-colors cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center">
              {WEEKDAY_NAMES.map((name) => (
                <span
                  key={name}
                  className="text-[10px] font-bold text-gray-400 dark:text-gray-500 py-0.5"
                >
                  {name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1">
              {month2Days.map((d) => renderDayCell(d))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Action Footer: Concise & Purposeful */}
      <div className="mt-4 pt-3 border-t border-[rgba(11,37,89,0.06)] dark:border-[#233550] flex items-center justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold text-gray-500 hover:text-[#0B2559] dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (onApply) onApply();
            else if (onClose) onClose();
          }}
          disabled={!startDate || !endDate}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            startDate && endDate
              ? 'bg-[#0A6FA8] hover:bg-[#0C7EBF] active:bg-[#095C8C] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
          }`}
        >
          <Check className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  );

  function renderDayCell(d: any) {
    if (!d.isCurrentMonth) {
      return (
        <div key={d.dateStr} className="h-8 w-full flex items-center justify-center">
          <span className="text-xs text-transparent select-none">{d.day}</span>
        </div>
      );
    }

    const isConnectedRight = (d.isStart && !d.isSingle && (endDate || (hoverDate && hoverDate > d.dateStr))) || d.isInRange;
    const isConnectedLeft = (d.isEnd && !d.isSingle && startDate) || d.isInRange;

    return (
      <div
        key={d.dateStr}
        className="h-8 w-full relative flex items-center justify-center select-none"
        onMouseEnter={() => {
          if (activeStep === 'end' && startDate && !endDate) {
            setHoverDate(d.dateStr);
          }
        }}
      >
        {/* Connected Range Ribbon Layer */}
        {!d.isDisabled && (
          <>
            {isConnectedLeft && !d.isStart && (
              <span
                className={`absolute left-0 right-1/2 top-0.5 bottom-0.5 ${
                  d.isHoverPreview
                    ? 'bg-[#EFF6FB]/80 dark:bg-[#0A6FA8]/15'
                    : 'bg-[#EFF6FB] dark:bg-[#0A6FA8]/25'
                }`}
                aria-hidden="true"
              />
            )}

            {isConnectedRight && !d.isEnd && (
              <span
                className={`absolute left-1/2 right-0 top-0.5 bottom-0.5 ${
                  d.isHoverPreview
                    ? 'bg-[#EFF6FB]/80 dark:bg-[#0A6FA8]/15'
                    : 'bg-[#EFF6FB] dark:bg-[#0A6FA8]/25'
                }`}
                aria-hidden="true"
              />
            )}

            {d.isInRange && (
              <span
                className={`absolute inset-x-0 top-0.5 bottom-0.5 ${
                  d.isHoverPreview
                    ? 'bg-[#EFF6FB]/80 dark:bg-[#0A6FA8]/15'
                    : 'bg-[#EFF6FB] dark:bg-[#0A6FA8]/25'
                }`}
                aria-hidden="true"
              />
            )}
          </>
        )}

        {/* Day Button */}
        <button
          type="button"
          disabled={d.isDisabled}
          onClick={() => handleDayClick(d.dateStr)}
          className={`relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex flex-col items-center justify-center text-xs font-semibold tabular-nums transition-all ${
            d.isDisabled
              ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              : d.isStart || d.isEnd
              ? 'bg-[#0A6FA8] text-white font-bold shadow-xs hover:bg-[#0C7EBF] cursor-pointer'
              : d.isInRange
              ? 'text-[#0A6FA8] dark:text-[#93ccff] font-bold hover:bg-[#0A6FA8]/15 cursor-pointer'
              : 'text-[#0B2559] dark:text-[#E6ECF7] hover:bg-gray-100 dark:hover:bg-[#182840] cursor-pointer'
          } ${d.isToday && !d.isStart && !d.isEnd ? 'ring-1 ring-[#0A6FA8]' : ''}`}
        >
          <span>{d.day}</span>
          {d.isToday && (
            <span
              className={`w-1 h-1 rounded-full absolute bottom-0.5 ${
                d.isStart || d.isEnd ? 'bg-white' : 'bg-[#0A6FA8]'
              }`}
            />
          )}
        </button>
      </div>
    );
  }
};
