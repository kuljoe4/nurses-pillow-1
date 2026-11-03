import React, { createContext, useContext, useState } from 'react';
import { db } from '../services/database';

interface AvailabilityContextType {
  blockedDates: Record<string, string[]>;
  fetchBlockedDates: (listingId: string) => Promise<void>;
  refreshAvailability: (listingId: string) => Promise<void>;
}

const AvailabilityContext = createContext<AvailabilityContextType | undefined>(undefined);

export const AvailabilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [blockedDates, setBlockedDates] = useState<Record<string, string[]>>({});

  const fetchBlockedDates = async (listingId: string) => {
    try {
      const blocks = await db.fetchAvailabilityBlocks(listingId);
      // Flatten the blocked ranges into individual dates, or just keep them as ranges
      // Since blackout dates in Calendar are usually individual dates, I'll map them here
      const dates = blocks
        .filter((b: any) => b.is_blocked)
        .flatMap((b: any) => {
          const start = new Date(b.start_date);
          const end = new Date(b.end_date);
          const datesInRange = [];
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            datesInRange.push(d.toISOString().split('T')[0]);
          }
          return datesInRange;
        });
      setBlockedDates(prev => ({ ...prev, [listingId]: dates }));
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  const refreshAvailability = async (listingId: string) => {
    await fetchBlockedDates(listingId);
  };

  return (
    <AvailabilityContext.Provider value={{ blockedDates, fetchBlockedDates, refreshAvailability }}>
      {children}
    </AvailabilityContext.Provider>
  );
};

export const useAvailability = () => {
  const context = useContext(AvailabilityContext);
  if (!context) {
    throw new Error('useAvailability must be used within an AvailabilityProvider');
  }
  return context;
};
