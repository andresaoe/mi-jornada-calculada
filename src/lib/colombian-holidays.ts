// Colombian holidays for 2024-2030
// Includes fixed holidays and variable holidays (moved to Monday by Law 51 of 1983)

interface Holiday {
  date: string; // YYYY-MM-DD format
  name: string;
}

// Fixed holidays (same date every year)
const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: 'Año Nuevo' },
  { month: 5, day: 1, name: 'Día del Trabajo' },
  { month: 7, day: 20, name: 'Día de la Independencia' },
  { month: 8, day: 7, name: 'Batalla de Boyacá' },
  { month: 12, day: 8, name: 'Inmaculada Concepción' },
  { month: 12, day: 25, name: 'Navidad' },
];

// Variable holidays by year (Easter-based and Emiliani Law holidays moved to Monday)
const VARIABLE_HOLIDAYS: Record<number, { month: number; day: number; name: string }[]> = {
  2024: [
    { month: 1, day: 8, name: 'Día de los Reyes Magos' },
    { month: 3, day: 25, name: 'Día de San José' },
    { month: 3, day: 28, name: 'Jueves Santo' },
    { month: 3, day: 29, name: 'Viernes Santo' },
    { month: 5, day: 13, name: 'Día de la Ascensión' },
    { month: 6, day: 3, name: 'Corpus Christi' },
    { month: 6, day: 10, name: 'Sagrado Corazón' },
    { month: 7, day: 1, name: 'San Pedro y San Pablo' },
    { month: 8, day: 19, name: 'Asunción de la Virgen' },
    { month: 10, day: 14, name: 'Día de la Raza' },
    { month: 11, day: 4, name: 'Todos los Santos' },
    { month: 11, day: 11, name: 'Independencia de Cartagena' },
  ],
  2025: [
    { month: 1, day: 6, name: 'Día de los Reyes Magos' },
    { month: 3, day: 24, name: 'Día de San José' },
    { month: 4, day: 17, name: 'Jueves Santo' },
    { month: 4, day: 18, name: 'Viernes Santo' },
    { month: 6, day: 2, name: 'Día de la Ascensión' },
    { month: 6, day: 23, name: 'Corpus Christi' },
    { month: 6, day: 30, name: 'Sagrado Corazón' },
    { month: 6, day: 30, name: 'San Pedro y San Pablo' },
    { month: 8, day: 18, name: 'Asunción de la Virgen' },
    { month: 10, day: 13, name: 'Día de la Raza' },
    { month: 11, day: 3, name: 'Todos los Santos' },
    { month: 11, day: 17, name: 'Independencia de Cartagena' },
  ],
  2026: [
    { month: 1, day: 12, name: 'Día de los Reyes Magos' },
    { month: 3, day: 23, name: 'Día de San José' },
    { month: 4, day: 2, name: 'Jueves Santo' },
    { month: 4, day: 3, name: 'Viernes Santo' },
    { month: 5, day: 18, name: 'Día de la Ascensión' },
    { month: 6, day: 8, name: 'Corpus Christi' },
    { month: 6, day: 15, name: 'Sagrado Corazón' },
    { month: 6, day: 29, name: 'San Pedro y San Pablo' },
    { month: 8, day: 17, name: 'Asunción de la Virgen' },
    { month: 10, day: 12, name: 'Día de la Raza' },
    { month: 11, day: 2, name: 'Todos los Santos' },
    { month: 11, day: 16, name: 'Independencia de Cartagena' },
  ],
  2027: [
    { month: 1, day: 11, name: 'Día de los Reyes Magos' },
    { month: 3, day: 22, name: 'Día de San José' },
    { month: 3, day: 25, name: 'Jueves Santo' },
    { month: 3, day: 26, name: 'Viernes Santo' },
    { month: 5, day: 10, name: 'Día de la Ascensión' },
    { month: 5, day: 31, name: 'Corpus Christi' },
    { month: 6, day: 7, name: 'Sagrado Corazón' },
    { month: 6, day: 28, name: 'San Pedro y San Pablo' },
    { month: 8, day: 16, name: 'Asunción de la Virgen' },
    { month: 10, day: 18, name: 'Día de la Raza' },
    { month: 11, day: 1, name: 'Todos los Santos' },
    { month: 11, day: 15, name: 'Independencia de Cartagena' },
  ],
  2028: [
    { month: 1, day: 10, name: 'Día de los Reyes Magos' },
    { month: 3, day: 20, name: 'Día de San José' },
    { month: 4, day: 13, name: 'Jueves Santo' },
    { month: 4, day: 14, name: 'Viernes Santo' },
    { month: 5, day: 29, name: 'Día de la Ascensión' },
    { month: 6, day: 19, name: 'Corpus Christi' },
    { month: 6, day: 26, name: 'Sagrado Corazón' },
    { month: 7, day: 3, name: 'San Pedro y San Pablo' },
    { month: 8, day: 21, name: 'Asunción de la Virgen' },
    { month: 10, day: 16, name: 'Día de la Raza' },
    { month: 11, day: 6, name: 'Todos los Santos' },
    { month: 11, day: 13, name: 'Independencia de Cartagena' },
  ],
  2029: [
    { month: 1, day: 8, name: 'Día de los Reyes Magos' },
    { month: 3, day: 19, name: 'Día de San José' },
    { month: 3, day: 29, name: 'Jueves Santo' },
    { month: 3, day: 30, name: 'Viernes Santo' },
    { month: 5, day: 14, name: 'Día de la Ascensión' },
    { month: 6, day: 4, name: 'Corpus Christi' },
    { month: 6, day: 11, name: 'Sagrado Corazón' },
    { month: 7, day: 2, name: 'San Pedro y San Pablo' },
    { month: 8, day: 20, name: 'Asunción de la Virgen' },
    { month: 10, day: 15, name: 'Día de la Raza' },
    { month: 11, day: 5, name: 'Todos los Santos' },
    { month: 11, day: 12, name: 'Independencia de Cartagena' },
  ],
  2030: [
    { month: 1, day: 7, name: 'Día de los Reyes Magos' },
    { month: 3, day: 25, name: 'Día de San José' },
    { month: 4, day: 18, name: 'Jueves Santo' },
    { month: 4, day: 19, name: 'Viernes Santo' },
    { month: 6, day: 3, name: 'Día de la Ascensión' },
    { month: 6, day: 24, name: 'Corpus Christi' },
    { month: 7, day: 1, name: 'Sagrado Corazón' },
    { month: 7, day: 1, name: 'San Pedro y San Pablo' },
    { month: 8, day: 19, name: 'Asunción de la Virgen' },
    { month: 10, day: 14, name: 'Día de la Raza' },
    { month: 11, day: 4, name: 'Todos los Santos' },
    { month: 11, day: 11, name: 'Independencia de Cartagena' },
  ],
};

/**
 * Get all Colombian holidays for a specific year
 */
export function getColombianHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  // Add fixed holidays
  for (const holiday of FIXED_HOLIDAYS) {
    const dateStr = `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
    holidays.push({ date: dateStr, name: holiday.name });
  }

  // Add variable holidays for the year if available
  const variableHolidays = VARIABLE_HOLIDAYS[year];
  if (variableHolidays) {
    for (const holiday of variableHolidays) {
      const dateStr = `${year}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day).padStart(2, '0')}`;
      holidays.push({ date: dateStr, name: holiday.name });
    }
  }

  return holidays;
}

/**
 * Check if a date string (YYYY-MM-DD) is a Colombian holiday
 */
export function isColombianHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getColombianHolidays(year);
  return holidays.some(h => h.date === dateStr);
}

/**
 * Check if a date is a Sunday
 */
export function isSunday(dateStr: string): boolean {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
  return date.getDay() === 0;
}

/**
 * Check if a date should be marked as holiday (Sunday or Colombian holiday)
 */
export function isHolidayOrSunday(dateStr: string): boolean {
  return isSunday(dateStr) || isColombianHoliday(dateStr);
}

/**
 * Get the holiday name if the date is a Colombian holiday
 */
export function getHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.split('-')[0], 10);
  const holidays = getColombianHolidays(year);
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday ? holiday.name : null;
}
