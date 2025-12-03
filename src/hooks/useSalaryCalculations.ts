// src/hooks/useSalaryCalculations.ts
import { useMemo } from 'react';
import { WorkDay } from '@/types/workday';
import { 
  calculateMonthlySummary, 
  calculateSurchargesOnly,
  filterWorkDaysByMonth 
} from '@/lib/salary-calculator';
import { addMonths } from 'date-fns';

interface UseSalaryCalculationsProps {
  workDays: WorkDay[];
  baseSalary: number;
  currentDate: Date;
}

export function useSalaryCalculations({ 
  workDays, 
  baseSalary, 
  currentDate 
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

  // Total to receive this month
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

  return {
    currentMonthWorkDays,
    previousMonthWorkDays,
    currentMonthRegularPay,
    previousMonthSurcharges,
    currentMonthSurcharges,
    totalToReceive,
    monthlySummary,
  };
}