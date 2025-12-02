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
  sundayNightSurcharge: number;
  holidaySurcharge: number;
  extraHoursPay: number;
  totalPay: number;
}

export interface MonthlySummary {
  totalRegularPay: number;
  totalNightSurcharge: number;
  totalSundayNightSurcharge: number;
  totalHolidaySurcharge: number;
  totalExtraHoursPay: number;
  totalPay: number;
  daysWorked: number;
  totalHours: number;
}

export interface SurchargesSummary {
  totalNightSurcharge: number;
  totalSundayNightSurcharge: number;
  totalHolidaySurcharge: number;
  totalExtraHoursPay: number;
  totalSurcharges: number;
}

export interface PayrollSummary {
  currentMonthRegularPay: number;
  previousMonthSurcharges: SurchargesSummary;
  currentMonthSurcharges: SurchargesSummary;
  totalToReceive: number;
  daysWorked: number;
  totalHours: number;
}
