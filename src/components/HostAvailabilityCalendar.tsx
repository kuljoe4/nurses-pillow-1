import React, { useState, useEffect } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { db } from '../services/database';
import { HostCalendarTips } from './HostCalendarTips';
import { ClinicalDateRangePicker } from './ClinicalDateRangePicker';
import { motion } from 'framer-motion';
import { useAvailability } from '../context/AvailabilityContext';

interface AvailabilityCalendarProps {
  listingId: string;
}

export const HostAvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ listingId }) => {
  const { refreshAvailability } = useAvailability();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [availabilityData, bookingsData] = await Promise.all([
        db.fetchAvailabilityBlocks(listingId),
        db.fetchBookingsForListing(listingId)
      ]);
      setAvailability(availabilityData);
      setBookings(bookingsData);
    };
    fetchData();
  }, [listingId]);

  const [conflict, setConflict] = useState<any>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [range, setRange] = useState({ start: '', end: '' });

  const handleApplyRange = async () => {
    if (!range.start || !range.end) return;
    try {
        await db.addAvailabilityBlock(listingId, {
            start_date: range.start,
            end_date: range.end,
            is_blocked: true,
            block_reason: 'host_blocked'
        });
        await refreshAvailability(listingId);
        const updated = await db.fetchAvailabilityBlocks(listingId);
        setAvailability(updated);
        setIsRangeModalOpen(false);
        setRange({ start: '', end: '' });
    } catch (err) {
        console.error('Failed to add range', err);
    }
  }

  const handleDateClick = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isBlocked = availability.some(b => b.start_date <= dateStr && b.end_date >= dateStr && b.is_blocked);
    
    // Check for existing bookings on this date
    const conflictingBooking = bookings.find(b => b.start_date <= dateStr && b.end_date >= dateStr);

    if (!isBlocked && conflictingBooking) {
      setConflict({
        error: 'Cannot block these dates as there is already a confirmed or pending booking.',
        conflictingBooking: {
          traveler_name: conflictingBooking.traveler_name_from_db || 'Clinician',
          traveler_phone: conflictingBooking.traveler_phone_from_db || 'N/A',
          traveler_email: conflictingBooking.traveler_email_from_db || 'N/A'
        }
      });
      return;
    }
    
    // Optimistic update
    const newBlockedState = !isBlocked;
    if (newBlockedState) {
        setAvailability(prev => [...prev, { start_date: dateStr, end_date: dateStr, is_blocked: true }]);
    } else {
        setAvailability(prev => prev.filter(b => !(b.start_date <= dateStr && b.end_date >= dateStr)));
    }
    
    try {
      await db.addAvailabilityBlock(listingId, {
        start_date: dateStr,
        end_date: dateStr,
        is_blocked: newBlockedState,
        block_reason: 'host_blocked'
      });
      // Refresh to ensure server sync and trigger context update
      await refreshAvailability(listingId);
      const updated = await db.fetchAvailabilityBlocks(listingId);
      setAvailability(updated);
    } catch (err: any) {
      // Revert on error
      const reverted = await db.fetchAvailabilityBlocks(listingId);
      setAvailability(reverted);
      
      if (err.response?.status === 409) {
          setConflict(err.response.data);
      } else {
          console.error('Failed to update availability', err);
      }
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div>
      <div className="bg-white dark:bg-[#0B1626] rounded-2xl p-6 border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[#0B2559] dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div className="flex gap-2">
              <button onClick={() => setIsRangeModalOpen(true)} className="px-3 py-1 bg-[#0A6FA8] text-white rounded-lg text-xs font-bold">Block Range</button>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} className="px-3 py-1 bg-gray-100 dark:bg-[#182840] rounded-lg">Prev</button>
              <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="px-3 py-1 bg-gray-100 dark:bg-[#182840] rounded-lg">Next</button>
          </div>
        </div>

      {isRangeModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white dark:bg-[#0B1626] p-6 rounded-3xl max-w-lg w-full my-auto">
                  <h3 className="text-lg font-bold mb-4">Select Blackout Range</h3>
                  <ClinicalDateRangePicker
                      startDate={range.start}
                      endDate={range.end}
                      onChange={(start, end) => setRange({ start, end })}
                      onApply={handleApplyRange}
                      onClose={() => setIsRangeModalOpen(false)}
                  />
              </div>
          </div>
        )}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="text-center text-xs font-bold text-gray-400">{day}</div>)}
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isBlocked = availability.some(b => b.start_date <= dateStr && b.end_date >= dateStr && b.is_blocked);
            const bookingForDay = bookings.filter(b => b.start_date <= dateStr && b.end_date >= dateStr);
            const isBooked = bookingForDay.length > 0;
            const hasConflict = bookingForDay.length > 1;
            const isCurrentMonth = isSameMonth(day, monthStart);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={`h-12 flex items-center justify-center rounded-lg text-sm font-bold relative ${
                  isCurrentMonth ? 'text-[#0B2559] dark:text-white' : 'text-gray-300'
                } ${isBlocked ? 'bg-[#A8452E] text-white' : isBooked ? 'bg-[#E1EFE9] dark:bg-[#142823] text-[#2F6E5E]' : 'bg-[#EFF6FB] dark:bg-[#0E1A2E]'}`}
              >
                {format(day, 'd')}
                {hasConflict && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Multiple requests"/>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <HostCalendarTips />
      {conflict && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0B1626] p-6 rounded-3xl max-w-sm w-full border border-[rgba(11,37,89,0.08)] dark:border-[#233550] shadow-2xl">
            <h3 className="text-lg font-bold text-[#A8452E] dark:text-[#F4E2DC] flex items-center gap-2">
              <span className="material-symbols-outlined">warning</span>
              Date Conflict
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">{conflict.error}</p>
            <div className="mt-4 p-4 bg-[#EFF6FB] dark:bg-[#0E1A2E] rounded-xl text-xs space-y-2">
              <p className="font-bold text-[#0B2559] dark:text-white">Conflicting Booking:</p>
              <p>Clinician: {conflict.conflictingBooking.traveler_name}</p>
              <p>Phone: {conflict.conflictingBooking.traveler_phone}</p>
              <p>Email: {conflict.conflictingBooking.traveler_email}</p>
            </div>
            <button onClick={() => setConflict(null)} className="mt-6 w-full bg-[#0A6FA8] text-white rounded-full py-3 text-xs font-bold hover:bg-[#0C7EBF]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};
