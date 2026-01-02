// Types for work day management
// ShiftType is exported from colombian-labor-law for reuse
import { ShiftType } from '@/lib/colombian-labor-law';
export type { ShiftType };

export interface WorkDay {
  id: string;
  date: string; // Format: YYYY-MM-DD
  shiftType: ShiftType;
  regularHours: number;
  extraHours: number;
  isHoliday: boolean; // Auto-detected from Colombian calendar
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
