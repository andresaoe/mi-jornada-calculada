// src/lib/salary-calculator.ts
// Cálculos de salario y recargos según ley laboral colombiana
// Actualizado con Ley 2466 de 2025

import { WorkDay, WorkDayCalculation, MonthlySummary } from '@/types/workday';
import { parseISO, isSameMonth, differenceInDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  MONTHLY_HOURS,
  MINIMUM_WAGE_2025,
  SURCHARGE_RATES,
  SPECIAL_SHIFT_RATES,
  NO_SURCHARGE_SHIFTS,
  isHolidayOrSunday,
  isSaturday,
  getSundayHolidaySurchargeRate,
  getShiftConfiguration,
  ShiftType,
} from './colombian-labor-law';

// Default base salary
const DEFAULT_BASE_SALARY = 2416500;

/**
 * Parse work day date string to Date object
 */
function parseWorkDayDate(dateStr: string): Date {
  return parseISO(dateStr);
}

/**
 * Calculate night shift surcharges
 * Considera el calendario colombiano automáticamente
 */
function calculateNightSurcharges(
  regularHours: number,
  hourlyRate: number,
  dateStr: string,
  shiftType: WorkDay['shiftType']
): { nightSurcharge: number; sundayNightSurcharge: number } {
  const date = parseWorkDayDate(dateStr);
  const isHoliday = isHolidayOrSunday(dateStr);
  const isSat = isSaturday(dateStr);
  const shiftConfig = getShiftConfiguration(shiftType as ShiftType, date);
  const holidayRate = getSundayHolidaySurchargeRate(date);
  
  let nightSurcharge = 0;
  let sundayNightSurcharge = 0;

  if (shiftType !== 'trasnocho') {
    // Para turnos diurnos, calcular horas nocturnas si aplica (ley nueva 7pm)
    const nightHours = shiftConfig.nightHoursBeforeMidnight + shiftConfig.nightHoursAfterMidnight;
    if (nightHours > 0) {
      if (isHoliday) {
        nightSurcharge = nightHours * hourlyRate * (SURCHARGE_RATES.NIGHT + holidayRate);
      } else {
        nightSurcharge = nightHours * hourlyRate * SURCHARGE_RATES.NIGHT;
      }
    }
    return { nightSurcharge, sundayNightSurcharge };
  }

  // Turno trasnocho
  if (isHoliday) {
    // Todo el turno con recargo nocturno + dominical/festivo
    nightSurcharge = regularHours * hourlyRate * (SURCHARGE_RATES.NIGHT + holidayRate);
  } else if (isSat) {
    // Sábado: horas antes de medianoche normal, después de medianoche dominical
    const hoursBeforeMidnight = shiftConfig.nightHoursBeforeMidnight;
    const hoursAfterMidnight = shiftConfig.nightHoursAfterMidnight;
    const sundayRate = getSundayHolidaySurchargeRate(date);
    
    nightSurcharge = hoursBeforeMidnight * hourlyRate * SURCHARGE_RATES.NIGHT;
    sundayNightSurcharge = hoursAfterMidnight * hourlyRate * (SURCHARGE_RATES.NIGHT + sundayRate);
  } else {
    // Día normal: solo recargo nocturno
    nightSurcharge = regularHours * hourlyRate * SURCHARGE_RATES.NIGHT;
  }

  return { nightSurcharge, sundayNightSurcharge };
}

/**
 * Calculate extra hours pay
 * Calcula automáticamente considerando calendario colombiano
 */
function calculateExtraHours(
  extraHours: number,
  hourlyRate: number,
  shiftType: WorkDay['shiftType'],
  dateStr: string
): number {
  if (extraHours === 0) return 0;

  const date = parseWorkDayDate(dateStr);
  const isHoliday = isHolidayOrSunday(dateStr);
  const isNight = shiftType === 'trasnocho';
  const holidayRate = getSundayHolidaySurchargeRate(date);
  
  let multiplier: number;
  if (isHoliday) {
    // Extra diurna dominical: 25% + dominical = 25% + 80% = 105%
    // Extra nocturna dominical: 75% + dominical = 75% + 80% = 155%
    multiplier = isNight 
      ? SURCHARGE_RATES.EXTRA_NIGHT + holidayRate
      : SURCHARGE_RATES.EXTRA_DAY + holidayRate;
  } else {
    multiplier = isNight ? SURCHARGE_RATES.EXTRA_NIGHT : SURCHARGE_RATES.EXTRA_DAY;
  }

  return extraHours * hourlyRate * (1 + multiplier);
}

/**
 * Check if shift type is a special (no surcharge) shift
 */
function isSpecialShift(shiftType: WorkDay['shiftType']): boolean {
  return NO_SURCHARGE_SHIFTS.includes(shiftType as ShiftType);
}

/**
 * Calculate consecutive incapacidad days position
 */
function getIncapacidadDayPosition(
  workDay: WorkDay,
  allWorkDays: WorkDay[]
): number {
  const workDate = parseWorkDayDate(workDay.date);
  
  const incapacidadDays = allWorkDays
    .filter(wd => wd.shiftType === 'incapacidad')
    .sort((a, b) => parseWorkDayDate(a.date).getTime() - parseWorkDayDate(b.date).getTime());
  
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
  
  return 1;
}

/**
 * Calculate incapacidad payment percentage based on consecutive days
 */
function getIncapacidadPercentage(dayPosition: number, baseSalary: number): number {
  const isMinimumWage = baseSalary <= MINIMUM_WAGE_2025;
  
  if (dayPosition <= 2) {
    return SPECIAL_SHIFT_RATES.INCAPACIDAD_DAYS_1_2;
  } else if (dayPosition <= 90) {
    return isMinimumWage ? 1.0 : SPECIAL_SHIFT_RATES.INCAPACIDAD_DAYS_3_90;
  } else if (dayPosition <= 180) {
    return SPECIAL_SHIFT_RATES.INCAPACIDAD_DAYS_91_180;
  }
  
  return SPECIAL_SHIFT_RATES.INCAPACIDAD_DAYS_91_180;
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
      return regularHours * hourlyRate * SPECIAL_SHIFT_RATES.ARL;
    case 'vacaciones': {
      const vacationDate = parseWorkDayDate(workDay.date);
      return calculateVacationDailyRate(allWorkDays, baseSalary, vacationDate);
    }
    case 'licencia_remunerada':
      return regularHours * hourlyRate * SPECIAL_SHIFT_RATES.LICENCIA_REMUNERADA;
    case 'licencia_no_remunerada':
      return 0;
    case 'descanso':
      // Descanso remunerado (Art. 172 CST): se paga como día ordinario
      // Cálculo: salario base / 30 días
      return baseSalary / 30;
    case 'suspendido':
      // Suspensión disciplinaria (Art. 51 CST): sin remuneración
      return 0;
    default:
      return regularHours * hourlyRate;
  }
}

/**
 * Calculate vacation daily rate based on last 6 months average
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
    
    const monthWorkDays = allWorkDays.filter(wd => {
      if (wd.shiftType === 'vacaciones') return false;
      const workDate = parseWorkDayDate(wd.date);
      return isWithinInterval(workDate, { start: monthStart, end: monthEnd });
    });
    
    const monthTotal = monthWorkDays.reduce((total, wd) => {
      return total + calculateWorkDaySimple(wd, baseSalary, allWorkDays);
    }, 0);
    
    monthlyTotals.push(monthTotal);
  }
  
  const totalEarnings = monthlyTotals.reduce((sum, val) => sum + val, 0);
  
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
  const { shiftType, regularHours, extraHours, date } = workDay;
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const isHoliday = isHolidayOrSunday(date);
  const workDate = parseWorkDayDate(date);

  if (shiftType === 'vacaciones') return 0;
  
  if (shiftType === 'incapacidad') {
    const dayPosition = getIncapacidadDayPosition(workDay, allWorkDays);
    const percentage = getIncapacidadPercentage(dayPosition, baseSalary);
    return regularHours * hourlyRate * percentage;
  }
  if (shiftType === 'arl') return regularHours * hourlyRate * SPECIAL_SHIFT_RATES.ARL;
  if (shiftType === 'licencia_remunerada') return regularHours * hourlyRate * SPECIAL_SHIFT_RATES.LICENCIA_REMUNERADA;
  if (shiftType === 'licencia_no_remunerada') return 0;
  if (shiftType === 'descanso') return baseSalary / 30; // Descanso remunerado
  if (shiftType === 'suspendido') return 0; // Suspensión sin pago

  let total = regularHours * hourlyRate;

  if (shiftType === 'trasnocho') {
    const surcharges = calculateNightSurcharges(regularHours, hourlyRate, date, shiftType);
    total += surcharges.nightSurcharge + surcharges.sundayNightSurcharge;
  }

  if (isHoliday && shiftType !== 'trasnocho') {
    const holidayRate = getSundayHolidaySurchargeRate(workDate);
    total += regularHours * hourlyRate * holidayRate;
  }

  total += calculateExtraHours(extraHours, hourlyRate, shiftType, date);

  return total;
}

/**
 * Calculate a single work day
 * Detecta automáticamente dominicales y festivos del calendario colombiano
 */
export function calculateWorkDay(
  workDay: WorkDay, 
  baseSalary: number = DEFAULT_BASE_SALARY,
  allWorkDays: WorkDay[] = []
): WorkDayCalculation {
  const { shiftType, regularHours, extraHours, date } = workDay;
  const hourlyRate = baseSalary / MONTHLY_HOURS;
  const isHoliday = isHolidayOrSunday(date);
  const workDate = parseWorkDayDate(date);

  // Handle special shifts (no surcharges)
  if (isSpecialShift(shiftType)) {
    const regularPay = calculateSpecialShiftPay(workDay, hourlyRate, baseSalary, allWorkDays);
    return {
      ...workDay,
      isHoliday, // Auto-detect from calendar
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
    const surcharges = calculateNightSurcharges(regularHours, hourlyRate, date, shiftType);
    nightSurcharge = surcharges.nightSurcharge;
    sundayNightSurcharge = surcharges.sundayNightSurcharge;
  } else {
    // Check for night hours in tarde_pm shift with new law
    const surcharges = calculateNightSurcharges(regularHours, hourlyRate, date, shiftType);
    nightSurcharge = surcharges.nightSurcharge;
  }

  // Holiday/Sunday surcharge (for non-night shifts)
  let holidaySurcharge = 0;
  if (isHoliday && shiftType !== 'trasnocho') {
    const holidayRate = getSundayHolidaySurchargeRate(workDate);
    holidaySurcharge = regularHours * hourlyRate * holidayRate;
  }

  // Extra hours
  const extraHoursPay = calculateExtraHours(extraHours, hourlyRate, shiftType, date);

  const totalPay = regularPay + nightSurcharge + sundayNightSurcharge + holidaySurcharge + extraHoursPay;

  return {
    ...workDay,
    isHoliday, // Auto-detected
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
