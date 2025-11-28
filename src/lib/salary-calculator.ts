import { WorkDay, WorkDayCalculation, MonthlySummary } from '@/types/workday';

// Base salary
const BASE_SALARY = 2416500;
const MONTHLY_HOURS = 220; // Standard monthly working hours for salary calculation
const HOURLY_RATE = BASE_SALARY / MONTHLY_HOURS;

// Colombian labor law surcharges
const NIGHT_SURCHARGE = 0.35; // 35% for night work (Trasnocho 9pm-5am)
const HOLIDAY_SURCHARGE = 0.75; // 75% for holidays
const EXTRA_HOURS_DAY = 0.25; // 25% for daytime extra hours
const EXTRA_HOURS_NIGHT = 0.75; // 75% for nighttime extra hours
const EXTRA_HOURS_HOLIDAY_DAY = 1.0; // 100% for daytime extra hours on holidays
const EXTRA_HOURS_HOLIDAY_NIGHT = 1.5; // 150% for nighttime extra hours on holidays
const NIGHT_HOLIDAY_SURCHARGE = 1.1; // 110% for night work on holidays (Trasnocho)

export function calculateWorkDay(workDay: WorkDay): WorkDayCalculation {
  const { shiftType, regularHours, extraHours, isHoliday, date } = workDay;
  
  let regularPay = regularHours * HOURLY_RATE;
  let nightSurcharge = 0;
  let sundayNightSurcharge = 0;
  let holidaySurcharge = 0;
  let extraHoursPay = 0;

  // Check if current day is Saturday
  const [year, month, day] = date.split('-').map(Number);
  const workDate = new Date(year, month - 1, day);
  const isSaturday = workDate.getDay() === 6;

  // Calculate night surcharge
  if (shiftType === 'trasnocho') {
    // Night shift is 9pm-5am (8 hours total)
    // 9pm-00:00 = 3 hours (same day)
    // 00:00-5am = 5 hours (next day)
    const hoursBeforeMidnight = 3;
    const hoursAfterMidnight = 5;

    if (isHoliday) {
      // All hours with holiday night surcharge if current day is holiday
      nightSurcharge = regularHours * HOURLY_RATE * NIGHT_HOLIDAY_SURCHARGE;
    } else if (isSaturday) {
      // Split calculation: normal night until midnight (3 hours), Sunday night after midnight (5 hours)
      nightSurcharge = hoursBeforeMidnight * HOURLY_RATE * NIGHT_SURCHARGE;
      sundayNightSurcharge = hoursAfterMidnight * HOURLY_RATE * NIGHT_HOLIDAY_SURCHARGE;
    } else {
      // Normal night surcharge for all hours
      nightSurcharge = regularHours * HOURLY_RATE * NIGHT_SURCHARGE;
    }
  }

  // Calculate holiday surcharge (only for non-night or in addition to night)
  if (isHoliday && shiftType !== 'trasnocho') {
    holidaySurcharge = regularHours * HOURLY_RATE * HOLIDAY_SURCHARGE;
  }

  // Calculate extra hours pay
  if (extraHours > 0) {
    if (isHoliday) {
      if (shiftType === 'trasnocho') {
        extraHoursPay = extraHours * HOURLY_RATE * (1 + EXTRA_HOURS_HOLIDAY_NIGHT);
      } else {
        extraHoursPay = extraHours * HOURLY_RATE * (1 + EXTRA_HOURS_HOLIDAY_DAY);
      }
    } else {
      if (shiftType === 'trasnocho') {
        extraHoursPay = extraHours * HOURLY_RATE * (1 + EXTRA_HOURS_NIGHT);
      } else {
        extraHoursPay = extraHours * HOURLY_RATE * (1 + EXTRA_HOURS_DAY);
      }
    }
  }

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

export function calculateMonthlySummary(workDays: WorkDay[]): MonthlySummary {
  const calculations = workDays.map(calculateWorkDay);

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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
