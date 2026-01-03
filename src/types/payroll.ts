// src/types/payroll.ts

export interface PayrollConfig {
  uvtValue: number;
  includeTransportAllowance?: boolean;
  arlRiskLevel?: 1 | 2 | 3 | 4 | 5;
  useExoneracionAportes?: boolean;
  dependentsDeduction?: number;
  medicinaPrepagada?: number;
  viviendaIntereses?: number;
}

export interface PayrollSummary {
  // Ingresos
  baseSalary: number;
  regularPay: number;
  surcharges: number;
  transportAllowance: number;
  totalEarnings: number;
  
  // IBC
  ibc: number;
  
  // Deducciones
  healthDeduction: number;
  pensionDeduction: number;
  fspDeduction: number;
  withholdingTax: number;
  totalDeductions: number;
  
  // Provisiones
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
  
  // Detalles retención
  withholdingDetails?: {
    grossIncome: number;
    healthPensionDeduction: number;
    fspDeduction: number;
    rentaExenta: number;
    taxableBaseUVT: number;
    appliedRate: number;
    withholdingUVT: number;
  };
}

export interface MonthlyPayroll {
  id: string;
  userId: string;
  monthYear: Date;
  baseSalary: number;
  regularPay: number;
  surcharges: number;
  transportAllowance: number;
  healthDeduction: number;
  pensionDeduction: number;
  fspDeduction: number;
  withholdingTax: number;
  primaProvision: number;
  cesantiasProvision: number;
  cesantiasInterest: number;
  vacacionesProvision: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  createdAt: string;
  updatedAt: string;
}
