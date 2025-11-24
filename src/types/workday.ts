export type ShiftType = 'diurno_am' | 'tarde_pm' | 'trasnocho';

export interface WorkDay {
  id: string;
  date: string;
  shiftType: ShiftType;
  regularHours: number;
  extraHours: number;
  isHoliday: boolean;
  notes?: string;
  createdAt: string;
}

export interface WorkDayCalculation extends WorkDay {
  regularPay: number;
  nightSurcharge: number;
  holidaySurcharge: number;
  extraHoursPay: number;
  totalPay: number;
}

export interface MonthlySummary {
  totalRegularPay: number;
  totalNightSurcharge: number;
  totalHolidaySurcharge: number;
  totalExtraHoursPay: number;
  totalPay: number;
  daysWorked: number;
  totalHours: number;
}
