// Colombian Labor Law Configuration (Ley 2466 de 2025, Ley 2101 de 2021)
// This module contains all legal parameters and surcharge calculations
// Actualizado con normativa vigente 2025

import { parseISO, getDay } from 'date-fns';
import { isColombianHoliday } from './colombian-holidays';

// ==================== LEGAL CONSTANTS ====================

/**
 * Salario Mínimo Legal Vigente 2025
 * Decreto 2294 de diciembre 2024
 */
export const MINIMUM_WAGE_2025 = 1423500;

/**
 * Auxilio de transporte legal vigente 2025
 * Solo aplica para salarios hasta 2 SMLV ($2.847.000)
 */
export const TRANSPORT_ALLOWANCE_2025 = 200000;
export const MAX_SALARY_FOR_TRANSPORT_2025 = MINIMUM_WAGE_2025 * 2;

/**
 * Jornada laboral (Ley 2101 de 2021 - reducción gradual)
 * 
 * Cronograma de reducción:
 * - Antes 15 julio 2023: 48 horas semanales
 * - Desde 15 julio 2023: 47 horas semanales
 * - Desde 15 julio 2024: 46 horas semanales
 * - Desde 15 julio 2025: 44 horas semanales
 * - Desde 15 julio 2026: 42 horas semanales (meta final)
 */
export const WEEKLY_HOURS_SCHEDULE = [
  { from: new Date('2023-07-15'), hours: 47 },
  { from: new Date('2024-07-15'), hours: 46 },
  { from: new Date('2025-07-15'), hours: 44 },
  { from: new Date('2026-07-15'), hours: 42 },
] as const;

/**
 * Obtiene las horas semanales según la fecha
 */
export function getWeeklyHours(date?: Date): number {
  const checkDate = date ?? new Date();
  
  // Buscar en orden inverso para encontrar el período vigente
  for (let i = WEEKLY_HOURS_SCHEDULE.length - 1; i >= 0; i--) {
    if (checkDate >= WEEKLY_HOURS_SCHEDULE[i].from) {
      return WEEKLY_HOURS_SCHEDULE[i].hours;
    }
  }
  
  return 48; // Antes de julio 2023
}

/**
 * Obtiene las horas mensuales según la fecha
 * Fórmula: (horas semanales / 6 días) * 30 días
 */
export function getMonthlyHours(date?: Date): number {
  const weeklyHours = getWeeklyHours(date);
  return Math.round((weeklyHours / 6) * 30);
}

// Para compatibilidad con código existente - usar la fecha actual
export const WEEKLY_HOURS = getWeeklyHours(new Date());
export const MONTHLY_HOURS = getMonthlyHours(new Date());

// Horas máximas por día antes de generar horas extras automáticas
export const MAX_DAILY_HOURS = 8;

// ==================== SURCHARGE RATES ====================

/**
 * Recargos según el Código Sustantivo del Trabajo y Ley 2466 de 2025
 * 
 * Art. 168 CST - Recargo nocturno: 35%
 * Art. 168 CST - Hora extra diurna: 25%
 * Art. 168 CST - Hora extra nocturna: 75%
 * Art. 179 CST - Trabajo dominical/festivo: 75% (aumentando progresivamente)
 */
export const SURCHARGE_RATES = {
  // Recargo nocturno (Art. 168 CST)
  NIGHT: 0.35, // 35%
  
  // Hora extra diurna (Art. 168 CST)
  EXTRA_DAY: 0.25, // 25%
  
  // Hora extra nocturna (Art. 168 CST)
  EXTRA_NIGHT: 0.75, // 75%
  
  // Hora extra diurna dominical/festiva (25% + dominical progresivo)
  // Ejemplo con 80%: 25% + 80% = 105%
  EXTRA_HOLIDAY_DAY: 1.05, // Se recalcula dinámicamente
  
  // Hora extra nocturna dominical/festiva (75% + dominical progresivo)
  // Ejemplo con 80%: 75% + 80% = 155%
  EXTRA_HOLIDAY_NIGHT: 1.55, // Se recalcula dinámicamente
  
  // Hora nocturna dominical/festiva (35% + dominical progresivo)
  // Ejemplo con 80%: 35% + 80% = 115%
  NIGHT_HOLIDAY: 1.15, // Se recalcula dinámicamente
} as const;

/**
 * Recargo dominical/festivo con aumento progresivo (Ley 2466 de 2025)
 * 
 * Cronograma:
 * - 1 julio 2025 - 30 junio 2026: 80%
 * - 1 julio 2026 - 30 junio 2027: 90%
 * - 1 julio 2027 en adelante: 100%
 */
export function getSundayHolidaySurchargeRate(date: Date): number {
  const cutoff2026 = new Date('2026-07-01');
  const cutoff2027 = new Date('2027-07-01');
  
  if (date >= cutoff2027) {
    return 1.00; // 100%
  } else if (date >= cutoff2026) {
    return 0.90; // 90%
  } else {
    return 0.80; // 80% (actual desde julio 2025)
  }
}

/**
 * Calcula las tasas de recargo para extras dominicales/festivos
 * Considerando el aumento progresivo del dominical
 */
export function getHolidayExtraRates(date: Date): {
  extraDayHoliday: number;
  extraNightHoliday: number;
  nightHoliday: number;
} {
  const holidayRate = getSundayHolidaySurchargeRate(date);
  
  return {
    extraDayHoliday: SURCHARGE_RATES.EXTRA_DAY + holidayRate,
    extraNightHoliday: SURCHARGE_RATES.EXTRA_NIGHT + holidayRate,
    nightHoliday: SURCHARGE_RATES.NIGHT + holidayRate,
  };
}

/**
 * Horario nocturno según ley colombiana
 * 
 * Ley 2466 de 2025:
 * - Antes de 25 dic 2025: 9pm - 6am (21:00 - 06:00)
 * - Después de 25 dic 2025: 7pm - 6am (19:00 - 06:00)
 */
export function getNightShiftHours(date: Date): { startHour: number; endHour: number } {
  const lawChangeDate = new Date('2025-12-25');
  
  if (date >= lawChangeDate) {
    return { startHour: 19, endHour: 6 }; // 7pm - 6am
  } else {
    return { startHour: 21, endHour: 6 }; // 9pm - 6am
  }
}

/**
 * Calcula las horas nocturnas de una jornada
 * Considerando el cambio de ley en diciembre 2025
 */
export function calculateNightHoursInShift(
  startHour: number,
  endHour: number,
  date: Date
): number {
  const nightShift = getNightShiftHours(date);
  const nightStart = nightShift.startHour;
  const nightEnd = nightShift.endHour;
  
  let nightHours = 0;
  
  // Jornada que no cruza medianoche
  if (startHour <= endHour) {
    // Horas nocturnas antes de medianoche
    if (endHour > nightStart) {
      nightHours += Math.min(endHour, 24) - Math.max(startHour, nightStart);
    }
  } else {
    // Jornada que cruza medianoche
    // Horas nocturnas antes de medianoche
    if (startHour < 24) {
      nightHours += Math.max(0, 24 - Math.max(startHour, nightStart));
    }
    // Horas nocturnas después de medianoche
    if (endHour > 0) {
      nightHours += Math.min(endHour, nightEnd);
    }
  }
  
  return Math.max(0, nightHours);
}

// ==================== SHIFT TYPE DEFINITIONS ====================

export type ShiftType = 
  | 'diurno_am' 
  | 'tarde_pm' 
  | 'trasnocho' 
  | 'incapacidad' 
  | 'arl' 
  | 'vacaciones' 
  | 'licencia_remunerada' 
  | 'licencia_no_remunerada';

// Shift types that don't receive surcharges
export const NO_SURCHARGE_SHIFTS: readonly ShiftType[] = [
  'incapacidad', 
  'arl', 
  'vacaciones', 
  'licencia_remunerada', 
  'licencia_no_remunerada'
];

/**
 * Tasas de pago para turnos especiales
 * 
 * Incapacidad (Decreto 780 de 2016):
 * - Días 1-2: 100% a cargo del empleador
 * - Días 3-90: 66.67% a cargo de la EPS (o 100% si es salario mínimo)
 * - Días 91-180: 50% a cargo de la EPS
 * 
 * ARL: 100% a cargo de la ARL desde el día 1
 */
export const SPECIAL_SHIFT_RATES = {
  INCAPACIDAD_DAYS_1_2: 1.0,      // 100% primeros 2 días (empleador)
  INCAPACIDAD_DAYS_3_90: 0.6667,  // 66.67% días 3-90 (EPS)
  INCAPACIDAD_DAYS_91_180: 0.5,   // 50% días 91-180 (EPS)
  ARL: 1.0,                        // 100% accidente laboral (ARL)
  VACACIONES: 1.0,                 // 100% vacaciones
  LICENCIA_REMUNERADA: 1.0,        // 100% licencia remunerada
  LICENCIA_NO_REMUNERADA: 0,       // 0% licencia no remunerada
} as const;

// ==================== DATE UTILITIES ====================

/**
 * Verifica si un día es domingo
 */
export function isSunday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getDay(d) === 0;
}

/**
 * Verifica si un día es sábado
 */
export function isSaturday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return getDay(d) === 6;
}

/**
 * Determina automáticamente si un día debe tener recargo dominical/festivo
 * Basado en el calendario colombiano
 */
export function isHolidayOrSunday(dateStr: string): boolean {
  return isSunday(dateStr) || isColombianHoliday(dateStr);
}

// ==================== SHIFT CONFIGURATION ====================

interface ShiftHours {
  startHour: number;
  endHour: number;
  crossesMidnight: boolean;
  nightHoursBeforeMidnight: number;
  nightHoursAfterMidnight: number;
  totalNightHours: number;
}

/**
 * Obtiene la configuración de horas para cada tipo de turno
 * Considerando los cambios en horario nocturno de la Ley 2466
 */
export function getShiftConfiguration(shiftType: ShiftType, date: Date): ShiftHours {
  const nightHours = getNightShiftHours(date);
  const isNewNightLaw = date >= new Date('2025-12-25');
  
  switch (shiftType) {
    case 'diurno_am':
      // 5am - 1pm (no tiene horas nocturnas)
      return {
        startHour: 5,
        endHour: 13,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
        totalNightHours: 0,
      };
    
    case 'tarde_pm':
      // 1pm - 9pm 
      // Con ley nueva (7pm nocturna): 2 horas nocturnas (7pm-9pm)
      // Con ley antigua (9pm nocturna): 0 horas nocturnas
      if (isNewNightLaw) {
        return {
          startHour: 13,
          endHour: 21,
          crossesMidnight: false,
          nightHoursBeforeMidnight: 2, // 7pm-9pm son nocturnas
          nightHoursAfterMidnight: 0,
          totalNightHours: 2,
        };
      }
      return {
        startHour: 13,
        endHour: 21,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
        totalNightHours: 0,
      };
    
    case 'trasnocho':
      // 9pm - 5am (8 horas nocturnas)
      return {
        startHour: 21,
        endHour: 5,
        crossesMidnight: true,
        nightHoursBeforeMidnight: 3, // 9pm-00:00
        nightHoursAfterMidnight: 5,  // 00:00-5am
        totalNightHours: 8,
      };
    
    default:
      // Para turnos especiales (incapacidad, vacaciones, etc.)
      return {
        startHour: 6,
        endHour: 14,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
        totalNightHours: 0,
      };
  }
}

// ==================== SURCHARGE CALCULATIONS ====================

export interface DayTypeSurcharges {
  isHoliday: boolean;
  isSunday: boolean;
  holidaySurchargeRate: number;
  nightSurchargeRate: number;
  extraDaySurchargeRate: number;
  extraNightSurchargeRate: number;
  nightHolidaySurchargeRate: number;
  extraDayHolidaySurchargeRate: number;
  extraNightHolidaySurchargeRate: number;
}

/**
 * Calcula los recargos aplicables para un día específico
 * Considerando si es domingo, festivo, y la fecha para recargos progresivos
 */
export function calculateDaySurcharges(dateStr: string): DayTypeSurcharges {
  const date = parseISO(dateStr);
  const sunday = isSunday(dateStr);
  const holiday = isColombianHoliday(dateStr);
  const isHolidayOrSun = sunday || holiday;
  
  const holidayRate = getSundayHolidaySurchargeRate(date);
  const holidayExtraRates = getHolidayExtraRates(date);
  
  return {
    isHoliday: holiday,
    isSunday: sunday,
    holidaySurchargeRate: isHolidayOrSun ? holidayRate : 0,
    nightSurchargeRate: SURCHARGE_RATES.NIGHT,
    extraDaySurchargeRate: SURCHARGE_RATES.EXTRA_DAY,
    extraNightSurchargeRate: SURCHARGE_RATES.EXTRA_NIGHT,
    nightHolidaySurchargeRate: isHolidayOrSun 
      ? holidayExtraRates.nightHoliday
      : SURCHARGE_RATES.NIGHT,
    extraDayHolidaySurchargeRate: isHolidayOrSun
      ? holidayExtraRates.extraDayHoliday
      : SURCHARGE_RATES.EXTRA_DAY,
    extraNightHolidaySurchargeRate: isHolidayOrSun
      ? holidayExtraRates.extraNightHoliday
      : SURCHARGE_RATES.EXTRA_NIGHT,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calcula el valor de la hora ordinaria
 */
export function calculateHourlyRate(baseSalary: number, date?: Date): number {
  const monthlyHours = getMonthlyHours(date);
  return baseSalary / monthlyHours;
}

/**
 * Calcula el valor del día de trabajo
 */
export function calculateDailyRate(baseSalary: number): number {
  return baseSalary / 30;
}

/**
 * Determina si el salario tiene derecho a auxilio de transporte
 */
export function hasTransportAllowance(baseSalary: number): boolean {
  return baseSalary <= MAX_SALARY_FOR_TRANSPORT_2025;
}
