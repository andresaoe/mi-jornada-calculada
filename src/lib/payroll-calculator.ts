// src/lib/payroll-calculator.ts
// Cálculos de prestaciones sociales y deducciones según ley colombiana
// Actualizado con Ley 2466 de 2025

import { MONTHLY_HOURS } from './colombian-labor-law';

// ==================== CONSTANTES 2025 ====================

export const PAYROLL_CONSTANTS = {
  MINIMUM_WAGE: 1423500,
  // NOTA: El auxilio de transporte legal vigente es de $200.000 COP
  // Esta funcionalidad ha sido removida de la lógica de la aplicación
  // El cálculo del auxilio de transporte debe hacerse externamente
  TRANSPORT_ALLOWANCE_REFERENCE: 200000,
  MAX_SALARY_FOR_TRANSPORT: 2847000, // 2 x SMLV
  HEALTH_PERCENTAGE: 0.04,           // 4%
  PENSION_PERCENTAGE: 0.04,          // 4%
  PRIMA_PERCENTAGE: 0.0833,          // 8.33% (1/12)
  CESANTIAS_PERCENTAGE: 0.0833,      // 8.33% (1/12)
  CESANTIAS_INTEREST: 0.12,          // 12% anual
  UVT_VALUE: 49799,                  // UVT 2025
} as const;

// Tabla de retención en la fuente (basada en UVT)
const WITHHOLDING_TABLE = [
  { from: 0, to: 95, rate: 0, base: 0 },
  { from: 95, to: 150, rate: 0.19, base: 0 },
  { from: 150, to: 360, rate: 0.28, base: 10 },
  { from: 360, to: 640, rate: 0.33, base: 69 },
  { from: 640, to: 945, rate: 0.35, base: 162 },
  { from: 945, to: 2300, rate: 0.37, base: 268 },
  { from: 2300, to: Infinity, rate: 0.39, base: 770 },
] as const;

export interface PayrollCalculation {
  // Ingresos
  baseSalary: number;
  regularPay: number;
  surcharges: number;
  totalEarnings: number;
  
  // Deducciones
  healthDeduction: number;
  pensionDeduction: number;
  withholdingTax: number;
  totalDeductions: number;
  
  // Provisiones (informativo)
  primaProvision: number;
  cesantiasProvision: number;
  cesantiasInterest: number;
  
  // Neto
  netPay: number;
}

/**
 * Calcula el IBC (Ingreso Base de Cotización)
 * Es el total devengado (para este caso, sin auxilio de transporte)
 * El IBC es la base para calcular aportes a salud y pensión
 */
export function calculateIBC(regularPay: number, surcharges: number): number {
  return regularPay + surcharges;
}

/**
 * Calcula la deducción de salud (4%)
 * Se calcula sobre el IBC
 */
export function calculateHealthDeduction(ibc: number): number {
  return Math.round(ibc * PAYROLL_CONSTANTS.HEALTH_PERCENTAGE);
}

/**
 * Calcula la deducción de pensión (4%)
 * Se calcula sobre el IBC
 */
export function calculatePensionDeduction(ibc: number): number {
  return Math.round(ibc * PAYROLL_CONSTANTS.PENSION_PERCENTAGE);
}

/**
 * Calcula la retención en la fuente basada en UVT
 * Simplificado para empleados con procedimiento 1
 */
export function calculateWithholdingTax(
  monthlyIncome: number,
  uvtValue: number = PAYROLL_CONSTANTS.UVT_VALUE
): number {
  // Base gravable aproximada (después de deducciones)
  const healthPension = monthlyIncome * 0.08; // 8% total
  const dependentsDeduction = monthlyIncome * 0.10; // Hasta 10% por dependientes
  const taxableBase = monthlyIncome - healthPension - dependentsDeduction;
  
  // Convertir a UVT
  const incomeInUvt = taxableBase / uvtValue;
  
  // Encontrar rango en la tabla
  const bracket = WITHHOLDING_TABLE.find(
    b => incomeInUvt >= b.from && incomeInUvt < b.to
  );
  
  if (!bracket || bracket.rate === 0) return 0;
  
  // Calcular retención
  const taxInUvt = ((incomeInUvt - bracket.from) * bracket.rate) + bracket.base;
  return Math.max(0, taxInUvt * uvtValue);
}

/**
 * Calcula la provisión de prima (8.33% mensual)
 * Prima se paga en junio y diciembre
 * NOTA: Sin auxilio de transporte en este cálculo
 */
export function calculatePrimaProvision(baseSalary: number): number {
  return baseSalary * PAYROLL_CONSTANTS.PRIMA_PERCENTAGE;
}

/**
 * Calcula la provisión de cesantías (8.33% mensual)
 * NOTA: Sin auxilio de transporte en este cálculo
 */
export function calculateCesantiasProvision(baseSalary: number): number {
  return baseSalary * PAYROLL_CONSTANTS.CESANTIAS_PERCENTAGE;
}

/**
 * Calcula los intereses sobre cesantías (12% anual = 1% mensual)
 */
export function calculateCesantiasInterest(cesantiasProvision: number): number {
  return cesantiasProvision * (PAYROLL_CONSTANTS.CESANTIAS_INTEREST / 12);
}

/**
 * Calcula la nómina completa del mes
 * NOTA: El auxilio de transporte ha sido removido de esta lógica
 */
export function calculateFullPayroll(
  baseSalary: number,
  regularPay: number,
  surcharges: number,
  options: {
    uvtValue?: number;
  } = {}
): PayrollCalculation {
  const { uvtValue = PAYROLL_CONSTANTS.UVT_VALUE } = options;

  // Total de ingresos (sin auxilio de transporte)
  const totalEarnings = regularPay + surcharges;

  // Calcular IBC
  const ibc = calculateIBC(regularPay, surcharges);

  // Deducciones
  const healthDeduction = calculateHealthDeduction(ibc);
  const pensionDeduction = calculatePensionDeduction(ibc);
  const withholdingTax = calculateWithholdingTax(ibc, uvtValue);
  const totalDeductions = healthDeduction + pensionDeduction + withholdingTax;

  // Provisiones (informativo, sin auxilio de transporte)
  const primaProvision = calculatePrimaProvision(baseSalary);
  const cesantiasProvision = calculateCesantiasProvision(baseSalary);
  const cesantiasInterest = calculateCesantiasInterest(cesantiasProvision);

  // Neto
  const netPay = totalEarnings - totalDeductions;

  return {
    baseSalary,
    regularPay,
    surcharges,
    totalEarnings,
    healthDeduction,
    pensionDeduction,
    withholdingTax,
    totalDeductions,
    primaProvision,
    cesantiasProvision,
    cesantiasInterest,
    netPay,
  };
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
