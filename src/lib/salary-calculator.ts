// src/lib/salary-calculator.ts
import { WorkDay, WorkDayCalculation, MonthlySummary } from '@/types/workday';
import { parseISO, getDay, isSameMonth, differenceInDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Constants
const DEFAULT_BASE_SALARY = 2416500;
const MINIMUM_WAGE = 1423500;
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

// Special shift payment percentages
const SPECIAL_SHIFTS = {
  INCAPACIDAD_DAYS_1_2: 1.0,      // 100% first 2 days
  INCAPACIDAD_DAYS_3_90: 0.6667,  // 66.67% days 3-90
  INCAPACIDAD_DAYS_91_180: 0.5,   // 50% days 91-180
  ARL: 1.0,                       // 100% work-related injury
  VACACIONES: 1.0,                // 100% vacation
  LICENCIA_REMUNERADA: 1.0,       // 100% paid leave
  LICENCIA_NO_REMUNERADA: 0,      // 0% unpaid leave
} as const;

// Night shift hours split
const NIGHT_SHIFT = {
  BEFORE_MIDNIGHT: 3,  // 9pm-00:00
  AFTER_MIDNIGHT: 5,   // 00:00-5am
  TOTAL: 8,
} as const;

// Shift types that don't receive surcharges
const NO_SURCHARGE_SHIFTS = ['incapacidad', 'arl', 'vacaciones', 'licencia_remunerada', 'licencia_no_remunerada'] as const;

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
 * Check if shift type is a special (no surcharge) shift
 */
function isSpecialShift(shiftType: WorkDay['shiftType']): boolean {
  return NO_SURCHARGE_SHIFTS.includes(shiftType as typeof NO_SURCHARGE_SHIFTS[number]);
}

/**
 * Calculate consecutive incapacidad days position
 * Returns which day number in the streak this workday represents
 */
function getIncapacidadDayPosition(
  workDay: WorkDay,
  allWorkDays: WorkDay[]
): number {
  const workDate = parseWorkDayDate(workDay.date);
  
  // Get all incapacidad days sorted by date
  const incapacidadDays = allWorkDays
    .filter(wd => wd.shiftType === 'incapacidad')
    .sort((a, b) => parseWorkDayDate(a.date).getTime() - parseWorkDayDate(b.date).getTime());
  
  // Find the streak that contains this day
  let streakStart = 0;
  let position = 1;
  
  for (let i = 0; i < incapacidadDays.length; i++) {
    const currentDate = parseWorkDayDate(incapacidadDays[i].date);
    
    if (i === 0) {
      streakStart = 0;
      position = 1;
    } else {
      const prevDate = parseWorkDayDate(incapacidadDays[i - 1].date);
      const daysDiff = differenceInDays(currentDate, prevDate);
      
      if (daysDiff > 1) {
        // New streak starts
        streakStart = i;
        position = 1;
      } else {
        position = i - streakStart + 1;
      }
    }
    
    if (incapacidadDays[i].id === workDay.id) {
      return position;
    }
  }
  
  return 1; // Default to first day if not found
}

/**
 * Calculate incapacidad payment percentage based on consecutive days
 */
function getIncapacidadPercentage(
  dayPosition: number,
  baseSalary: number
): number {
  const isMinimumWage = baseSalary <= MINIMUM_WAGE;
  
  if (dayPosition <= 2) {
    return SPECIAL_SHIFTS.INCAPACIDAD_DAYS_1_2;
  } else if (dayPosition <= 90) {
    // 66.67% or 100% if minimum wage
    return isMinimumWage ? 1.0 : SPECIAL_SHIFTS.INCAPACIDAD_DAYS_3_90;
  } else if (dayPosition <= 180) {
    return SPECIAL_SHIFTS.INCAPACIDAD_DAYS_91_180;
  }
  
  // Beyond 180 days, typically handled differently
  return SPECIAL_SHIFTS.INCAPACIDAD_DAYS_91_180;
}

/**
 * Calculate special shift pay (no surcharges)
 */
function calculateSpecialShiftPay(
  workDay: WorkDay,
  hourlyRate: number,
  baseSalary: number,
  allWorkDays: WorkDay[] = []
): number {
  const { shiftType, regularHours } = workDay;
  
  switch (shiftType) {
    case 'incapacidad': {
      const dayPosition = getIncapacidadDayPosition(workDay, allWorkDays);
      const percentage = getIncapacidadPercentage(dayPosition, baseSalary);
      return regularHours * hourlyRate * percentage;
    }
    case 'arl':
      return regularHours * hourlyRate * SPECIAL_SHIFTS.ARL;
    case 'vacaciones': {
      const vacationDate = parseWorkDayDate(workDay.date);
      return calculateVacationDailyRate(allWorkDays, baseSalary, vacationDate);
    }
    case 'licencia_remunerada':
      return regularHours * hourlyRate * SPECIAL_SHIFTS.LICENCIA_REMUNERADA;
    case 'licencia_no_remunerada':
      return 0;
    default:
      return regularHours * hourlyRate;
  }
}

/**
 * Calculate vacation daily rate based on last 6 months average
 * Formula: (Total earnings last 6 months / 6 months) / 30 days
 */
function calculateVacationDailyRate(
  allWorkDays: WorkDay[],
  baseSalary: number,
  referenceDate: Date
): number {
  const monthlyTotals: number[] = [];
  
  for (let i = 1; i <= 6; i++) {
    const monthDate = subMonths(referenceDate, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Filter work days for this month (exclude vacation days)
    const monthWorkDays = allWorkDays.filter(wd => {
      if (wd.shiftType === 'vacaciones') return false;
      const workDate = parseWorkDayDate(wd.date);
      return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
    });
    
    // Calculate total for this month
    const monthTotal = monthWorkDays.reduce((total, wd) => {
      return total + calculateWorkDaySimple(wd, baseSalary, allWorkDays);
    }, 0);
    
    monthlyTotals.push(monthTotal);
  }
  
  const totalEarnings = monthlyTotals.reduce((sum, val) => sum + val, 0);
  
  // Use base salary as fallback if no historical data
  if (totalEarnings === 0) return baseSalary / 30;
  
  return (totalEarnings / 6) / 30;
}

/**
 * Simple calculation for vacation average (avoids recursion)
 */
function calculateWorkDaySimple(
  workDay: WorkDay, 
  baseSalary: number,
  allWorkDays: WorkDay[]
): number {
  const { shiftType, regularHours, extraHours, isHoliday, date } = workDay;
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const workDate = parseWorkDayDate(date);
  const isSat = isSaturday(workDate);

  // Skip vacation for this calculation
  if (shiftType === 'vacaciones') return 0;
  
  // Handle other special shifts
  if (shiftType === 'incapacidad') {
    const dayPosition = getIncapacidadDayPosition(workDay, allWorkDays);
    const percentage = getIncapacidadPercentage(dayPosition, baseSalary);
    return regularHours * hourlyRate * percentage;
  }
  if (shiftType === 'arl') return regularHours * hourlyRate * SPECIAL_SHIFTS.ARL;
  if (shiftType === 'licencia_remunerada') return regularHours * hourlyRate * SPECIAL_SHIFTS.LICENCIA_REMUNERADA;
  if (shiftType === 'licencia_no_remunerada') return 0;

  // Regular pay for normal shifts
  let total = regularHours * hourlyRate;

  // Night surcharges
  if (shiftType === 'trasnocho') {
    const surcharges = calculateNightSurcharges(regularHours, hourlyRate, isHoliday, isSat);
    total += surcharges.nightSurcharge + surcharges.sundayNightSurcharge;
  }

  // Holiday surcharge
  if (isHoliday && shiftType !== 'trasnocho') {
    total += regularHours * hourlyRate * SURCHARGES.HOLIDAY;
  }

  // Extra hours
  total += calculateExtraHours(extraHours, hourlyRate, shiftType, isHoliday);

  return total;
}

/**
 * Calculate a single work day
 */
export function calculateWorkDay(
  workDay: WorkDay, 
  baseSalary: number = DEFAULT_BASE_SALARY,
  allWorkDays: WorkDay[] = []
): WorkDayCalculation {
  const { shiftType, regularHours, extraHours, isHoliday, date } = workDay;
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const workDate = parseWorkDayDate(date);
  const isSat = isSaturday(workDate);

  // Handle special shifts (no surcharges)
  if (isSpecialShift(shiftType)) {
    const regularPay = calculateSpecialShiftPay(workDay, hourlyRate, baseSalary, allWorkDays);
    return {
      ...workDay,
      regularPay,
      nightSurcharge: 0,
      sundayNightSurcharge: 0,
      holidaySurcharge: 0,
      extraHoursPay: 0,
      totalPay: regularPay,
    };
  }

  // Regular pay for normal shifts
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
  const calculations = workDays.map(wd => calculateWorkDay(wd, baseSalary, workDays));

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
  const calculations = workDays.map(wd => calculateWorkDay(wd, baseSalary, workDays));
  
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