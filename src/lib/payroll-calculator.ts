// src/lib/payroll-calculator.ts
// Cálculos de prestaciones sociales y deducciones según ley colombiana

// Constantes 2025
export const PAYROLL_CONSTANTS = {
  MINIMUM_WAGE: 1423500,
  TRANSPORT_ALLOWANCE: 200000,
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
  transportAllowance: number;
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
 * Calcula el auxilio de transporte
 * Solo aplica para salarios hasta 2 SMLV
 */
export function calculateTransportAllowance(
  baseSalary: number,
  enabled: boolean = true,
  customValue?: number
): number {
  if (!enabled) return 0;
  if (baseSalary > PAYROLL_CONSTANTS.MAX_SALARY_FOR_TRANSPORT) return 0;
  return customValue ?? PAYROLL_CONSTANTS.TRANSPORT_ALLOWANCE;
}

/**
 * Calcula el IBC (Ingreso Base de Cotización)
 * Es el total devengado menos auxilio de transporte
 * El IBC es la base para calcular aportes a salud y pensión
 */
export function calculateIBC(
  regularPay: number,
  surcharges: number,
  transportAllowance: number
): number {
  // El IBC es todo lo devengado EXCEPTO auxilio de transporte
  const totalDevengado = regularPay + surcharges + transportAllowance;
  return totalDevengado - transportAllowance; // = regularPay + surcharges
}

/**
 * Calcula la deducción de salud (4%)
 * Se calcula sobre el IBC (no sobre salario base)
 */
export function calculateHealthDeduction(ibc: number): number {
  return Math.round(ibc * PAYROLL_CONSTANTS.HEALTH_PERCENTAGE);
}

/**
 * Calcula la deducción de pensión (4%)
 * Se calcula sobre el IBC (no sobre salario base)
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
 */
export function calculatePrimaProvision(
  baseSalary: number,
  transportAllowance: number
): number {
  // La prima se calcula sobre salario + auxilio de transporte
  return (baseSalary + transportAllowance) * PAYROLL_CONSTANTS.PRIMA_PERCENTAGE;
}

/**
 * Calcula la provisión de cesantías (8.33% mensual)
 */
export function calculateCesantiasProvision(
  baseSalary: number,
  transportAllowance: number
): number {
  // Las cesantías se calculan sobre salario + auxilio de transporte
  return (baseSalary + transportAllowance) * PAYROLL_CONSTANTS.CESANTIAS_PERCENTAGE;
}

/**
 * Calcula los intereses sobre cesantías (12% anual = 1% mensual)
 */
export function calculateCesantiasInterest(cesantiasProvision: number): number {
  // Interés mensual (12% anual / 12 meses)
  return cesantiasProvision * (PAYROLL_CONSTANTS.CESANTIAS_INTEREST / 12);
}

/**
 * Calcula la nómina completa del mes
 */
export function calculateFullPayroll(
  baseSalary: number,
  regularPay: number,
  surcharges: number,
  options: {
    transportAllowanceEnabled?: boolean;
    customTransportAllowance?: number;
    uvtValue?: number;
  } = {}
): PayrollCalculation {
  const {
    transportAllowanceEnabled = true,
    customTransportAllowance,
    uvtValue = PAYROLL_CONSTANTS.UVT_VALUE,
  } = options;

  // Ingresos
  const transportAllowance = calculateTransportAllowance(
    baseSalary,
    transportAllowanceEnabled,
    customTransportAllowance
  );
  const totalEarnings = regularPay + surcharges + transportAllowance;

  // Calcular IBC (Ingreso Base de Cotización)
  // IBC = Total Devengado - Auxilio de Transporte
  const ibc = calculateIBC(regularPay, surcharges, transportAllowance);

  // Deducciones (sobre el IBC, no sobre salario base)
  const healthDeduction = calculateHealthDeduction(ibc);
  const pensionDeduction = calculatePensionDeduction(ibc);
  const withholdingTax = calculateWithholdingTax(ibc, uvtValue);
  const totalDeductions = healthDeduction + pensionDeduction + withholdingTax;

  // Provisiones (informativo)
  const primaProvision = calculatePrimaProvision(baseSalary, transportAllowance);
  const cesantiasProvision = calculateCesantiasProvision(baseSalary, transportAllowance);
  const cesantiasInterest = calculateCesantiasInterest(cesantiasProvision);

  // Neto
  const netPay = totalEarnings - totalDeductions;

  return {
    baseSalary,
    regularPay,
    surcharges,
    transportAllowance,
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
