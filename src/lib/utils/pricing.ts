import { differenceInCalendarDays } from 'date-fns';

export function calculateStayPricing(monthlyRent: number, checkInDate: Date | string, checkOutDate: Date | string) {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  const daysCount = differenceInCalendarDays(checkOut, checkIn);

  if (daysCount < 0) {
    throw new Error('Check-out date must be after check-in date');
  }

  const dailyRate = monthlyRent / 30;
  let accommodationTotal = 0;

  if (daysCount < 30) {
    accommodationTotal = Math.round(dailyRate * daysCount);
  } else {
    const fullMonths = Math.floor(daysCount / 30);
    const extraDays = daysCount % 30;
    accommodationTotal = Math.round((fullMonths * monthlyRent) + (extraDays * dailyRate));
  }

  return { daysCount, accommodationTotal, dailyRate };
}
