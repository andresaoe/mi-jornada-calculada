// src/types/payroll.ts

export interface PayrollConfig {
  transportAllowanceEnabled: boolean;
  transportAllowanceValue: number;
  uvtValue: number;
}

export interface PayrollSummary {
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
  
  // Provisiones
  primaProvision: number;
  cesantiasProvision: number;
  cesantiasInterest: number;
  
  // Neto
  netPay: number;
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
  withholdingTax: number;
  primaProvision: number;
  cesantiasProvision: number;
  cesantiasInterest: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  createdAt: string;
  updatedAt: string;
}
