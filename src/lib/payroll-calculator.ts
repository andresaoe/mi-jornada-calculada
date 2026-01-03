// src/lib/payroll-calculator.ts
// Cálculos de prestaciones sociales y deducciones según ley colombiana
// Actualizado con Ley 2466 de 2025, Ley 2101 de 2021, y normativa DIAN 2025
// Inspirado en software de nómina Siesa

import { getMonthlyHours } from './colombian-labor-law';

// ==================== CONSTANTES 2025 ====================

export const PAYROLL_CONSTANTS = {
  // Valores legales 2025
  MINIMUM_WAGE: 1423500,                 // SMLV 2025
  TRANSPORT_ALLOWANCE: 200000,           // Auxilio de transporte 2025
  MAX_SALARY_FOR_TRANSPORT: 2847000,     // 2 x SMLV
  UVT_VALUE: 49799,                      // UVT 2025 (DIAN)
  
  // Jornada laboral (Ley 2101 de 2021 - reducción gradual)
  // Antes 15 julio 2025: 46 horas semanales
  // Desde 15 julio 2025: 44 horas semanales
  WEEKLY_HOURS_BEFORE_JULY_2025: 46,
  WEEKLY_HOURS_AFTER_JULY_2025: 44,
  MONTHLY_HOURS_BEFORE_JULY_2025: 230,   // 46/6 * 30
  MONTHLY_HOURS_AFTER_JULY_2025: 220,    // 44/6 * 30
  
  // Aportes Seguridad Social - Empleado
  EMPLOYEE_HEALTH_PERCENTAGE: 0.04,      // 4%
  EMPLOYEE_PENSION_PERCENTAGE: 0.04,     // 4%
  
  // Aportes Seguridad Social - Empleador (informativo)
  EMPLOYER_HEALTH_PERCENTAGE: 0.085,     // 8.5% (exonerado para < 10 SMLV según art. 114-1 ET)
  EMPLOYER_PENSION_PERCENTAGE: 0.12,     // 12%
  
  // Prestaciones sociales
  PRIMA_PERCENTAGE: 0.0833,              // 8.33% (1/12)
  CESANTIAS_PERCENTAGE: 0.0833,          // 8.33% (1/12)
  CESANTIAS_INTEREST: 0.12,              // 12% anual
  VACACIONES_PERCENTAGE: 0.0417,         // 4.17% (15 días / 360)
  
  // Aportes parafiscales - Empleador (informativo)
  CAJA_COMPENSACION: 0.04,               // 4%
  SENA: 0.02,                            // 2% (exonerado para algunos empleadores)
  ICBF: 0.03,                            // 3% (exonerado para algunos empleadores)
  
  // ARL - Empleador (varía según riesgo)
  ARL_RIESGO_I: 0.00522,                 // 0.522% - Riesgo mínimo
  ARL_RIESGO_II: 0.01044,                // 1.044%
  ARL_RIESGO_III: 0.02436,               // 2.436%
  ARL_RIESGO_IV: 0.04350,                // 4.350%
  ARL_RIESGO_V: 0.06960,                 // 6.960% - Riesgo máximo
  
  // Retención en la fuente - Umbral mínimo en UVT
  WITHHOLDING_MIN_UVT: 95,               // No hay retención bajo 95 UVT
  
  // Límite para dependientes/medicina prepagada
  DEPENDENTS_MAX_PERCENTAGE: 0.10,       // 10% del ingreso bruto
  DEPENDENTS_MAX_UVT: 32,                // Máximo 32 UVT mensuales
  
  // Renta exenta Art. 206 numeral 10 E.T.
  RENTA_EXENTA_PERCENTAGE: 0.25,         // 25%
  RENTA_EXENTA_MAX_UVT: 240,             // Máximo 240 UVT mensuales
} as const;

// Tabla Fondo de Solidaridad Pensional (FSP)
// Aplica para salarios >= 4 SMLV (Ley 100 de 1993, Art. 25)
// Nota: La reforma pensional Ley 2381 de 2024 quedó suspendida por la Corte Constitucional
export const FSP_TABLE = [
  { fromSMLV: 4, toSMLV: 16, rate: 0.01 },    // 1%
  { fromSMLV: 16, toSMLV: 17, rate: 0.012 },  // 1.2%
  { fromSMLV: 17, toSMLV: 18, rate: 0.014 },  // 1.4%
  { fromSMLV: 18, toSMLV: 19, rate: 0.016 },  // 1.6%
  { fromSMLV: 19, toSMLV: 20, rate: 0.018 },  // 1.8%
  { fromSMLV: 20, toSMLV: Infinity, rate: 0.02 }, // 2%
] as const;

// Tabla de retención en la fuente (Art. 383 E.T.)
// Procedimiento 1: Tabla mensual basada en UVT
export const WITHHOLDING_TABLE = [
  { from: 0, to: 95, rate: 0, base: 0 },
  { from: 95, to: 150, rate: 0.19, base: 0 },
  { from: 150, to: 360, rate: 0.28, base: 10.45 },
  { from: 360, to: 640, rate: 0.33, base: 69.25 },
  { from: 640, to: 945, rate: 0.35, base: 161.65 },
  { from: 945, to: 2300, rate: 0.37, base: 268.40 },
  { from: 2300, to: Infinity, rate: 0.39, base: 769.80 },
] as const;

// ==================== INTERFACES ====================

export interface PayrollCalculation {
  // Ingresos
  baseSalary: number;
  regularPay: number;
  surcharges: number;
  transportAllowance: number;
  totalEarnings: number;
  
  // IBC (Ingreso Base de Cotización)
  ibc: number;
  
  // Deducciones obligatorias
  healthDeduction: number;           // 4%
  pensionDeduction: number;          // 4%
  fspDeduction: number;              // Fondo Solidaridad Pensional (0-2%)
  withholdingTax: number;            // Retención en la fuente
  totalDeductions: number;
  
  // Provisiones (informativo - a cargo del empleador)
  primaProvision: number;
  cesantiasProvision: number;
  cesantiasInterest: number;
  vacacionesProvision: number;
  
  // Aportes empleador (informativo)
  employerHealth: number;
  employerPension: number;
  employerARL: number;
  employerCaja: number;
  employerSENA: number;
  employerICBF: number;
  totalEmployerCosts: number;
  
  // Neto
  netPay: number;
  
  // Detalles del cálculo de retención
  withholdingDetails: {
    grossIncome: number;
    healthPensionDeduction: number;
    fspDeduction: number;
    rentaExenta: number;
    taxableBaseUVT: number;
    appliedRate: number;
    withholdingUVT: number;
  };
}

export interface PayrollOptions {
  uvtValue?: number;
  includeTransportAllowance?: boolean;
  arlRiskLevel?: 1 | 2 | 3 | 4 | 5;
  useExoneracionAportes?: boolean;    // Art. 114-1 ET
  dependentsDeduction?: number;        // Deducción por dependientes
  medicinaPrepagada?: number;          // Deducción medicina prepagada
  viviendaIntereses?: number;          // Intereses de vivienda
  date?: Date;                         // Para calcular horas según jornada vigente
}

// ==================== FUNCIONES DE CÁLCULO ====================

/**
 * Calcula el IBC (Ingreso Base de Cotización)
 * El IBC es la base para calcular aportes a salud y pensión
 * NO incluye auxilio de transporte
 */
export function calculateIBC(regularPay: number, surcharges: number): number {
  return regularPay + surcharges;
}

/**
 * Determina si el salario tiene derecho a auxilio de transporte
 */
export function hasTransportAllowance(baseSalary: number): boolean {
  return baseSalary <= PAYROLL_CONSTANTS.MAX_SALARY_FOR_TRANSPORT;
}

/**
 * Calcula la deducción de salud del empleado (4%)
 */
export function calculateHealthDeduction(ibc: number): number {
  return Math.round(ibc * PAYROLL_CONSTANTS.EMPLOYEE_HEALTH_PERCENTAGE);
}

/**
 * Calcula la deducción de pensión del empleado (4%)
 */
export function calculatePensionDeduction(ibc: number): number {
  return Math.round(ibc * PAYROLL_CONSTANTS.EMPLOYEE_PENSION_PERCENTAGE);
}

/**
 * Calcula el aporte al Fondo de Solidaridad Pensional (FSP)
 * Solo aplica para salarios >= 4 SMLV
 * Este aporte es 100% a cargo del trabajador
 */
export function calculateFSPDeduction(ibc: number): number {
  const smlv = PAYROLL_CONSTANTS.MINIMUM_WAGE;
  const salaryInSMLV = ibc / smlv;
  
  // No aplica para salarios menores a 4 SMLV
  if (salaryInSMLV < 4) return 0;
  
  // Buscar el rango correspondiente
  const bracket = FSP_TABLE.find(
    b => salaryInSMLV >= b.fromSMLV && salaryInSMLV < b.toSMLV
  );
  
  if (!bracket) return 0;
  
  return Math.round(ibc * bracket.rate);
}

/**
 * Calcula la retención en la fuente - Procedimiento 1
 * Según Art. 383 E.T. y tabla DIAN 2025
 */
export function calculateWithholdingTax(
  monthlyIncome: number,
  options: {
    uvtValue?: number;
    healthPensionDeduction?: number;
    fspDeduction?: number;
    dependentsDeduction?: number;
    medicinaPrepagada?: number;
    viviendaIntereses?: number;
  } = {}
): { tax: number; details: PayrollCalculation['withholdingDetails'] } {
  const uvtValue = options.uvtValue ?? PAYROLL_CONSTANTS.UVT_VALUE;
  
  // 1. Ingreso bruto laboral
  const grossIncome = monthlyIncome;
  
  // 2. Restar aportes obligatorios a salud y pensión (ingresos no constitutivos)
  const healthPensionDeduction = options.healthPensionDeduction ?? 
    Math.round(grossIncome * 0.08); // 4% salud + 4% pensión
  
  // 3. Restar FSP (también es ingreso no constitutivo de renta)
  const fspDeduction = options.fspDeduction ?? 0;
  
  // 4. Subtotal 1
  const subtotal1 = grossIncome - healthPensionDeduction - fspDeduction;
  
  // 5. Deducciones adicionales (Art. 387 E.T.)
  // - Dependientes: máximo 10% del ingreso bruto, tope 32 UVT mensuales
  const maxDependents = Math.min(
    grossIncome * PAYROLL_CONSTANTS.DEPENDENTS_MAX_PERCENTAGE,
    PAYROLL_CONSTANTS.DEPENDENTS_MAX_UVT * uvtValue
  );
  const dependentsDeduction = Math.min(options.dependentsDeduction ?? 0, maxDependents);
  
  // - Medicina prepagada: máximo 16 UVT mensuales
  const maxMedicina = 16 * uvtValue;
  const medicinaPrepagada = Math.min(options.medicinaPrepagada ?? 0, maxMedicina);
  
  // - Intereses de vivienda: máximo 100 UVT mensuales
  const maxVivienda = 100 * uvtValue;
  const viviendaIntereses = Math.min(options.viviendaIntereses ?? 0, maxVivienda);
  
  const totalDeducciones = dependentsDeduction + medicinaPrepagada + viviendaIntereses;
  
  // 6. Subtotal 2
  const subtotal2 = subtotal1 - totalDeducciones;
  
  // 7. Renta exenta del 25% (Art. 206 numeral 10 E.T.)
  // Máximo 240 UVT mensuales
  const maxRentaExenta = PAYROLL_CONSTANTS.RENTA_EXENTA_MAX_UVT * uvtValue;
  const rentaExenta = Math.min(
    subtotal2 * PAYROLL_CONSTANTS.RENTA_EXENTA_PERCENTAGE,
    maxRentaExenta
  );
  
  // 8. Base gravable
  const taxableBase = Math.max(0, subtotal2 - rentaExenta);
  
  // 9. Convertir a UVT
  const taxableBaseUVT = taxableBase / uvtValue;
  
  // 10. Buscar rango en tabla
  const bracket = WITHHOLDING_TABLE.find(
    b => taxableBaseUVT >= b.from && taxableBaseUVT < b.to
  );
  
  if (!bracket || bracket.rate === 0) {
    return {
      tax: 0,
      details: {
        grossIncome,
        healthPensionDeduction,
        fspDeduction,
        rentaExenta,
        taxableBaseUVT,
        appliedRate: 0,
        withholdingUVT: 0,
      }
    };
  }
  
  // 11. Calcular retención en UVT
  const withholdingUVT = ((taxableBaseUVT - bracket.from) * bracket.rate) + bracket.base;
  
  // 12. Convertir a pesos
  const tax = Math.max(0, Math.round(withholdingUVT * uvtValue));
  
  return {
    tax,
    details: {
      grossIncome,
      healthPensionDeduction,
      fspDeduction,
      rentaExenta,
      taxableBaseUVT,
      appliedRate: bracket.rate,
      withholdingUVT,
    }
  };
}

/**
 * Calcula la provisión de prima (8.33% mensual)
 * Base: Salario + auxilio de transporte (si aplica)
 */
export function calculatePrimaProvision(
  baseSalary: number, 
  transportAllowance: number = 0
): number {
  return Math.round((baseSalary + transportAllowance) * PAYROLL_CONSTANTS.PRIMA_PERCENTAGE);
}

/**
 * Calcula la provisión de cesantías (8.33% mensual)
 * Base: Salario + auxilio de transporte (si aplica)
 */
export function calculateCesantiasProvision(
  baseSalary: number, 
  transportAllowance: number = 0
): number {
  return Math.round((baseSalary + transportAllowance) * PAYROLL_CONSTANTS.CESANTIAS_PERCENTAGE);
}

/**
 * Calcula los intereses sobre cesantías (12% anual = 1% mensual)
 */
export function calculateCesantiasInterest(cesantiasProvision: number): number {
  return Math.round(cesantiasProvision * (PAYROLL_CONSTANTS.CESANTIAS_INTEREST / 12));
}

/**
 * Calcula la provisión de vacaciones (4.17% mensual)
 * Base: Solo salario (no incluye auxilio de transporte)
 */
export function calculateVacacionesProvision(baseSalary: number): number {
  return Math.round(baseSalary * PAYROLL_CONSTANTS.VACACIONES_PERCENTAGE);
}

/**
 * Calcula los aportes del empleador
 */
export function calculateEmployerContributions(
  ibc: number,
  options: {
    arlRiskLevel?: 1 | 2 | 3 | 4 | 5;
    useExoneracion?: boolean;
    baseSalary?: number;
  } = {}
): {
  health: number;
  pension: number;
  arl: number;
  caja: number;
  sena: number;
  icbf: number;
  total: number;
} {
  const { arlRiskLevel = 1, useExoneracion = true, baseSalary = ibc } = options;
  
  // ARL según nivel de riesgo
  const arlRates = [
    PAYROLL_CONSTANTS.ARL_RIESGO_I,
    PAYROLL_CONSTANTS.ARL_RIESGO_II,
    PAYROLL_CONSTANTS.ARL_RIESGO_III,
    PAYROLL_CONSTANTS.ARL_RIESGO_IV,
    PAYROLL_CONSTANTS.ARL_RIESGO_V,
  ];
  const arlRate = arlRates[arlRiskLevel - 1];
  const arl = Math.round(ibc * arlRate);
  
  // Exoneración Art. 114-1 ET: aplica para salarios < 10 SMLV
  const isExonerated = useExoneracion && baseSalary < (PAYROLL_CONSTANTS.MINIMUM_WAGE * 10);
  
  // Aportes según exoneración
  const health = isExonerated ? 0 : Math.round(ibc * PAYROLL_CONSTANTS.EMPLOYER_HEALTH_PERCENTAGE);
  const pension = Math.round(ibc * PAYROLL_CONSTANTS.EMPLOYER_PENSION_PERCENTAGE);
  const caja = Math.round(ibc * PAYROLL_CONSTANTS.CAJA_COMPENSACION);
  const sena = isExonerated ? 0 : Math.round(ibc * PAYROLL_CONSTANTS.SENA);
  const icbf = isExonerated ? 0 : Math.round(ibc * PAYROLL_CONSTANTS.ICBF);
  
  return {
    health,
    pension,
    arl,
    caja,
    sena,
    icbf,
    total: health + pension + arl + caja + sena + icbf,
  };
}

/**
 * Calcula la nómina completa del mes
 * Incluye todos los conceptos según normativa colombiana 2025
 */
export function calculateFullPayroll(
  baseSalary: number,
  regularPay: number,
  surcharges: number,
  options: PayrollOptions = {}
): PayrollCalculation {
  const {
    uvtValue = PAYROLL_CONSTANTS.UVT_VALUE,
    includeTransportAllowance = true,
    arlRiskLevel = 1,
    useExoneracionAportes = true,
    dependentsDeduction = 0,
    medicinaPrepagada = 0,
    viviendaIntereses = 0,
  } = options;

  // Auxilio de transporte
  const transportAllowance = (includeTransportAllowance && hasTransportAllowance(baseSalary))
    ? PAYROLL_CONSTANTS.TRANSPORT_ALLOWANCE
    : 0;

  // Total devengado (para pago)
  const totalEarnings = regularPay + surcharges + transportAllowance;

  // IBC (no incluye auxilio de transporte)
  const ibc = calculateIBC(regularPay, surcharges);

  // Deducciones del empleado
  const healthDeduction = calculateHealthDeduction(ibc);
  const pensionDeduction = calculatePensionDeduction(ibc);
  const fspDeduction = calculateFSPDeduction(ibc);
  
  // Retención en la fuente
  const { tax: withholdingTax, details: withholdingDetails } = calculateWithholdingTax(
    ibc, // Base para retención
    {
      uvtValue,
      healthPensionDeduction: healthDeduction + pensionDeduction,
      fspDeduction,
      dependentsDeduction,
      medicinaPrepagada,
      viviendaIntereses,
    }
  );

  const totalDeductions = healthDeduction + pensionDeduction + fspDeduction + withholdingTax;

  // Provisiones (a cargo del empleador)
  const primaProvision = calculatePrimaProvision(baseSalary, transportAllowance);
  const cesantiasProvision = calculateCesantiasProvision(baseSalary, transportAllowance);
  const cesantiasInterest = calculateCesantiasInterest(cesantiasProvision);
  const vacacionesProvision = calculateVacacionesProvision(baseSalary);

  // Aportes del empleador
  const employerContributions = calculateEmployerContributions(ibc, {
    arlRiskLevel,
    useExoneracion: useExoneracionAportes,
    baseSalary,
  });

  // Neto a pagar
  const netPay = totalEarnings - totalDeductions;

  return {
    baseSalary,
    regularPay,
    surcharges,
    transportAllowance,
    totalEarnings,
    ibc,
    healthDeduction,
    pensionDeduction,
    fspDeduction,
    withholdingTax,
    totalDeductions,
    primaProvision,
    cesantiasProvision,
    cesantiasInterest,
    vacacionesProvision,
    employerHealth: employerContributions.health,
    employerPension: employerContributions.pension,
    employerARL: employerContributions.arl,
    employerCaja: employerContributions.caja,
    employerSENA: employerContributions.sena,
    employerICBF: employerContributions.icbf,
    totalEmployerCosts: employerContributions.total + primaProvision + cesantiasProvision + 
      cesantiasInterest + vacacionesProvision,
    netPay,
    withholdingDetails,
  };
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Calcula el costo total del empleado para el empleador
 */
export function calculateTotalEmployeeCost(payroll: PayrollCalculation): number {
  return payroll.totalEarnings + payroll.totalEmployerCosts;
}

/**
 * Obtiene el valor hora según la jornada vigente
 */
export function getHourlyRate(baseSalary: number, date?: Date): number {
  const monthlyHours = getMonthlyHours(date);
  return baseSalary / monthlyHours;
}
