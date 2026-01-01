// Colombian Labor Law Configuration (Ley 2466 de 2025)
// This module contains all legal parameters and surcharge calculations

import { parseISO, getDay } from 'date-fns';
import { isColombianHoliday } from './colombian-holidays';

// ==================== LEGAL CONSTANTS ====================

/**
 * Auxilio de transporte legal vigente: $200.000 COP
 * Solo aplica para salarios hasta 2 SMLV
 * Este cálculo se ha removido de la lógica de la aplicación
 * pero se mantiene como referencia informativa.
 */
export const TRANSPORT_ALLOWANCE_2025 = 200000;

// Salario Mínimo Legal Vigente 2025
export const MINIMUM_WAGE_2025 = 1423500;

// Jornada laboral semanal (Ley 2101 de 2021 - reducción gradual)
// Desde 16 julio 2025: 44 horas semanales
export const WEEKLY_HOURS = 44;
export const MONTHLY_HOURS = 220; // 44/6 * 30

// Horas máximas por día antes de generar horas extras automáticas
export const MAX_DAILY_HOURS = 8;

// ==================== SURCHARGE RATES ====================

/**
 * Recargos según el Código Sustantivo del Trabajo y Ley 2466 de 2025
 */
export const SURCHARGE_RATES = {
  // Recargo nocturno (Art. 168 CST)
  NIGHT: 0.35, // 35%
  
  // Hora extra diurna (Art. 168 CST)
  EXTRA_DAY: 0.25, // 25%
  
  // Hora extra nocturna (Art. 168 CST)
  EXTRA_NIGHT: 0.75, // 75%
  
  // Hora extra diurna dominical/festiva (25% + 80% = 105%)
  // Nota: Con el aumento progresivo del dominical, esto cambiará
  EXTRA_HOLIDAY_DAY: 1.05, // 105% (con dominical 80%)
  
  // Hora extra nocturna dominical/festiva (75% + 80% = 155%)
  EXTRA_HOLIDAY_NIGHT: 1.55, // 155% (con dominical 80%)
  
  // Hora nocturna dominical/festiva (35% + 80% = 115%)
  NIGHT_HOLIDAY: 1.15, // 115% (con dominical 80%)
} as const;

/**
 * Recargo dominical/festivo con aumento progresivo (Ley 2466 de 2025)
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
    return 0.80; // 80% (actual)
  }
}

/**
 * Horario nocturno según ley colombiana
 * Antes de 25 dic 2025: 9pm - 6am
 * Después de 25 dic 2025: 7pm - 6am (Ley 2466 de 2025)
 */
export function getNightShiftHours(date: Date): { startHour: number; endHour: number } {
  const lawChangeDate = new Date('2025-12-25');
  
  if (date >= lawChangeDate) {
    return { startHour: 19, endHour: 6 }; // 7pm - 6am
  } else {
    return { startHour: 21, endHour: 6 }; // 9pm - 6am
  }
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

// Special shift payment percentages
export const SPECIAL_SHIFT_RATES = {
  INCAPACIDAD_DAYS_1_2: 1.0,      // 100% primeros 2 días
  INCAPACIDAD_DAYS_3_90: 0.6667,  // 66.67% días 3-90
  INCAPACIDAD_DAYS_91_180: 0.5,   // 50% días 91-180
  ARL: 1.0,                        // 100% accidente laboral
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
}

/**
 * Obtiene la configuración de horas para cada tipo de turno
 * Considerando los cambios en horario nocturno de la Ley 2466
 */
export function getShiftConfiguration(shiftType: ShiftType, date: Date): ShiftHours {
  const nightHours = getNightShiftHours(date);
  
  switch (shiftType) {
    case 'diurno_am':
      // 5am - 1pm (no tiene horas nocturnas)
      return {
        startHour: 5,
        endHour: 13,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
      };
    
    case 'tarde_pm':
      // 1pm - 9pm 
      // Con ley nueva (7pm nocturna): 2 horas nocturnas (7pm-9pm)
      // Con ley antigua (9pm nocturna): 0 horas nocturnas
      if (date >= new Date('2025-12-25')) {
        return {
          startHour: 13,
          endHour: 21,
          crossesMidnight: false,
          nightHoursBeforeMidnight: 2, // 7pm-9pm son nocturnas
          nightHoursAfterMidnight: 0,
        };
      }
      return {
        startHour: 13,
        endHour: 21,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
      };
    
    case 'trasnocho':
      // 9pm - 5am (8 horas nocturnas)
      // Con ley nueva el turno podría empezar a las 7pm
      return {
        startHour: 21,
        endHour: 5,
        crossesMidnight: true,
        nightHoursBeforeMidnight: 3, // 9pm-00:00
        nightHoursAfterMidnight: 5,  // 00:00-5am
      };
    
    default:
      // Para turnos especiales (incapacidad, vacaciones, etc.)
      return {
        startHour: 6,
        endHour: 14,
        crossesMidnight: false,
        nightHoursBeforeMidnight: 0,
        nightHoursAfterMidnight: 0,
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
  
  return {
    isHoliday: holiday,
    isSunday: sunday,
    holidaySurchargeRate: isHolidayOrSun ? holidayRate : 0,
    nightSurchargeRate: SURCHARGE_RATES.NIGHT,
    extraDaySurchargeRate: SURCHARGE_RATES.EXTRA_DAY,
    extraNightSurchargeRate: SURCHARGE_RATES.EXTRA_NIGHT,
    nightHolidaySurchargeRate: isHolidayOrSun 
      ? SURCHARGE_RATES.NIGHT + holidayRate  // 35% + dominical
      : SURCHARGE_RATES.NIGHT,
  };
}
