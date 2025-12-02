// src/lib/salary-calculator.ts
import { WorkDay, WorkDayCalculation, MonthlySummary } from '@/types/workday';
import { parseISO, getDay, isSameMonth } from 'date-fns';

// Constants
const DEFAULT_BASE_SALARY = 2416500;
const MONTHLY_HOURS = 220;

// Colombian labor law surcharges
const SURCHARGES = {
  NIGHT: 0.35,                    // 35% night work (9pm-5am)
  HOLIDAY: 0.75,                  // 75% holidays
  EXTRA_DAY: 0.25,                // 25% daytime extra hours
  EXTRA_NIGHT: 0.75,              // 75% nighttime extra hours
  EXTRA_HOLIDAY_DAY: 1.0,         // 100% daytime extra on holidays
  EXTRA_HOLIDAY_NIGHT: 1.5,       // 150% nighttime extra on holidays
  NIGHT_HOLIDAY: 1.1,             // 110% night work on holidays
} as const;

// Night shift hours split
const NIGHT_SHIFT = {
  BEFORE_MIDNIGHT: 3,  // 9pm-00:00
  AFTER_MIDNIGHT: 5,   // 00:00-5am
  TOTAL: 8,
} as const;

/**
 * Parse work day date string to Date object
 */
function parseWorkDayDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Check if date is Saturday
 */
function isSaturday(date: Date): boolean {
  return getDay(date) === 6;
}

/**
 * Calculate night shift surcharges
 */
function calculateNightSurcharges(
  regularHours: number,
  hourlyRate: number,
  isHoliday: boolean,
  isSat: boolean
): { nightSurcharge: number; sundayNightSurcharge: number } {
  let nightSurcharge = 0;
  let sundayNightSurcharge = 0;

  if (isHoliday) {
    // All hours with holiday night surcharge
    nightSurcharge = regularHours * hourlyRate * SURCHARGES.NIGHT_HOLIDAY;
  } else if (isSat) {
    // Split: normal night until midnight, Sunday night after
    nightSurcharge = NIGHT_SHIFT.BEFORE_MIDNIGHT * hourlyRate * SURCHARGES.NIGHT;
    sundayNightSurcharge = NIGHT_SHIFT.AFTER_MIDNIGHT * hourlyRate * SURCHARGES.NIGHT_HOLIDAY;
  } else {
    // Normal night surcharge
    nightSurcharge = regularHours * hourlyRate * SURCHARGES.NIGHT;
  }

  return { nightSurcharge, sundayNightSurcharge };
}

/**
 * Calculate extra hours pay
 */
function calculateExtraHours(
  extraHours: number,
  hourlyRate: number,
  shiftType: WorkDay['shiftType'],
  isHoliday: boolean
): number {
  if (extraHours === 0) return 0;

  const isNight = shiftType === 'trasnocho';
  
  let multiplier: number;
  if (isHoliday) {
    multiplier = isNight ? SURCHARGES.EXTRA_HOLIDAY_NIGHT : SURCHARGES.EXTRA_HOLIDAY_DAY;
  } else {
    multiplier = isNight ? SURCHARGES.EXTRA_NIGHT : SURCHARGES.EXTRA_DAY;
  }

  return extraHours * hourlyRate * (1 + multiplier);
}

/**
 * Calculate a single work day
 */
export function calculateWorkDay(
  workDay: WorkDay, 
  baseSalary: number = DEFAULT_BASE_SALARY
): WorkDayCalculation {
  const { shiftType, regularHours, extraHours, isHoliday, date } = workDay;
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const workDate = parseWorkDayDate(date);
  const isSat = isSaturday(workDate);

  // Regular pay
  const regularPay = regularHours * hourlyRate;

  // Night surcharges
  let nightSurcharge = 0;
  let sundayNightSurcharge = 0;
  if (shiftType === 'trasnocho') {
    const surcharges = calculateNightSurcharges(regularHours, hourlyRate, isHoliday, isSat);
    nightSurcharge = surcharges.nightSurcharge;
    sundayNightSurcharge = surcharges.sundayNightSurcharge;
  }

  // Holiday surcharge (non-night shifts)
  const holidaySurcharge = (isHoliday && shiftType !== 'trasnocho') 
    ? regularHours * hourlyRate * SURCHARGES.HOLIDAY 
    : 0;

  // Extra hours
  const extraHoursPay = calculateExtraHours(extraHours, hourlyRate, shiftType, isHoliday);

  const totalPay = regularPay + nightSurcharge + sundayNightSurcharge + holidaySurcharge + extraHoursPay;

  return {
    ...workDay,
    regularPay,
    nightSurcharge,
    sundayNightSurcharge,
    holidaySurcharge,
    extraHoursPay,
    totalPay,
  };
}

/**
 * Calculate monthly summary
 */
export function calculateMonthlySummary(
  workDays: WorkDay[], 
  baseSalary: number = DEFAULT_BASE_SALARY
): MonthlySummary {
  const calculations = workDays.map(wd => calculateWorkDay(wd, baseSalary));

  return calculations.reduce(
    (summary, calc) => ({
      totalRegularPay: summary.totalRegularPay + calc.regularPay,
      totalNightSurcharge: summary.totalNightSurcharge + calc.nightSurcharge,
      totalSundayNightSurcharge: summary.totalSundayNightSurcharge + calc.sundayNightSurcharge,
      totalHolidaySurcharge: summary.totalHolidaySurcharge + calc.holidaySurcharge,
      totalExtraHoursPay: summary.totalExtraHoursPay + calc.extraHoursPay,
      totalPay: summary.totalPay + calc.totalPay,
      daysWorked: summary.daysWorked + 1,
      totalHours: summary.totalHours + calc.regularHours + calc.extraHours,
    }),
    {
      totalRegularPay: 0,
      totalNightSurcharge: 0,
      totalSundayNightSurcharge: 0,
      totalHolidaySurcharge: 0,
      totalExtraHoursPay: 0,
      totalPay: 0,
      daysWorked: 0,
      totalHours: 0,
    }
  );
}

/**
 * Calculate only surcharges (for previous month)
 */
export function calculateSurchargesOnly(
  workDays: WorkDay[], 
  baseSalary: number = DEFAULT_BASE_SALARY
) {
  const calculations = workDays.map(wd => calculateWorkDay(wd, baseSalary));
  
  return calculations.reduce(
    (summary, calc) => {
      const surchargesTotal = 
        calc.nightSurcharge + 
        calc.sundayNightSurcharge + 
        calc.holidaySurcharge + 
        calc.extraHoursPay;
      
      return {
        totalNightSurcharge: summary.totalNightSurcharge + calc.nightSurcharge,
        totalSundayNightSurcharge: summary.totalSundayNightSurcharge + calc.sundayNightSurcharge,
        totalHolidaySurcharge: summary.totalHolidaySurcharge + calc.holidaySurcharge,
        totalExtraHoursPay: summary.totalExtraHoursPay + calc.extraHoursPay,
        totalSurcharges: summary.totalSurcharges + surchargesTotal,
      };
    },
    {
      totalNightSurcharge: 0,
      totalSundayNightSurcharge: 0,
      totalHolidaySurcharge: 0,
      totalExtraHoursPay: 0,
      totalSurcharges: 0,
    }
  );
}

/**
 * Filter work days by month
 */
export function filterWorkDaysByMonth(workDays: WorkDay[], date: Date): WorkDay[] {
  return workDays.filter(wd => {
    const workDate = parseWorkDayDate(wd.date);
    return isSameMonth(workDate, date);
  });
}

/**
 * Format currency in Colombian pesos
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}