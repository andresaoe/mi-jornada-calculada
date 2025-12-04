// src/hooks/useSalaryCalculations.ts
import { useMemo } from 'react';
import { WorkDay } from '@/types/workday';
import { 
  calculateMonthlySummary, 
  calculateSurchargesOnly,
  filterWorkDaysByMonth 
} from '@/lib/salary-calculator';
import { calculateFullPayroll, PayrollCalculation } from '@/lib/payroll-calculator';
import { PayrollConfig } from '@/types/payroll';
import { addMonths } from 'date-fns';

interface UseSalaryCalculationsProps {
  workDays: WorkDay[];
  baseSalary: number;
  currentDate: Date;
  payrollConfig?: PayrollConfig;
}

export function useSalaryCalculations({ 
  workDays, 
  baseSalary, 
  currentDate,
  payrollConfig 
}: UseSalaryCalculationsProps) {
  
  // Filter current month work days
  const currentMonthWorkDays = useMemo(
    () => filterWorkDaysByMonth(workDays, currentDate),
    [workDays, currentDate]
  );

  // Filter previous month work days
  const previousMonthWorkDays = useMemo(
    () => filterWorkDaysByMonth(workDays, addMonths(currentDate, -1)),
    [workDays, currentDate]
  );

  // Calculate current month regular pay
  const currentMonthRegularPay = useMemo(() => {
    const hourlyRate = baseSalary / 220;
    return currentMonthWorkDays.reduce(
      (sum, wd) => sum + (wd.regularHours * hourlyRate), 
      0
    );
  }, [currentMonthWorkDays, baseSalary]);

  // Calculate surcharges (pass all workDays for incapacidad consecutive day calculation)
  const previousMonthSurcharges = useMemo(
    () => calculateSurchargesOnly(previousMonthWorkDays, baseSalary),
    [previousMonthWorkDays, baseSalary]
  );

  const currentMonthSurcharges = useMemo(
    () => calculateSurchargesOnly(currentMonthWorkDays, baseSalary),
    [currentMonthWorkDays, baseSalary]
  );

  // Total to receive this month (regular pay + previous month surcharges)
  const totalToReceive = useMemo(
    () => currentMonthRegularPay + previousMonthSurcharges.totalSurcharges,
    [currentMonthRegularPay, previousMonthSurcharges]
  );

  // Complete monthly summary
  const monthlySummary = useMemo(() => {
    const summary = calculateMonthlySummary(currentMonthWorkDays, baseSalary);
    return {
      ...summary,
      totalPay: totalToReceive,
      totalNightSurcharge: previousMonthSurcharges.totalNightSurcharge,
      totalSundayNightSurcharge: previousMonthSurcharges.totalSundayNightSurcharge,
      totalHolidaySurcharge: previousMonthSurcharges.totalHolidaySurcharge,
      totalExtraHoursPay: previousMonthSurcharges.totalExtraHoursPay,
    };
  }, [currentMonthWorkDays, baseSalary, totalToReceive, previousMonthSurcharges]);

  // Full payroll calculation with deductions and provisions
  const payrollSummary = useMemo((): PayrollCalculation => {
    return calculateFullPayroll(
      baseSalary,
      currentMonthRegularPay,
      previousMonthSurcharges.totalSurcharges,
      {
        transportAllowanceEnabled: payrollConfig?.transportAllowanceEnabled ?? true,
        customTransportAllowance: payrollConfig?.transportAllowanceValue,
        uvtValue: payrollConfig?.uvtValue,
      }
    );
  }, [baseSalary, currentMonthRegularPay, previousMonthSurcharges, payrollConfig]);

  return {
    currentMonthWorkDays,
    previousMonthWorkDays,
    currentMonthRegularPay,
    previousMonthSurcharges,
    currentMonthSurcharges,
    totalToReceive,
    monthlySummary,
    payrollSummary,
  };
}