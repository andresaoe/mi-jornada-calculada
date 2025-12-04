// src/components/PayrollSummaryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PayrollSummary } from '@/types/payroll';
import { formatCurrency } from '@/lib/salary-calculator';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Shield, 
  FileText,
  Bus,
  Gift,
  PiggyBank,
  Percent
} from 'lucide-react';

interface PayrollSummaryCardProps {
  payroll: PayrollSummary;
  currentMonth: string;
}

export default function PayrollSummaryCard({ payroll, currentMonth }: PayrollSummaryCardProps) {
  return (
    <div className="space-y-4">
      {/* Total Neto */}
      <Card className="shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-6 w-6" />
            Neto a Recibir - {currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatCurrency(payroll.netPay)}
          </div>
          <p className="text-green-100 text-sm mt-1">
            Después de deducciones
          </p>
        </CardContent>
      </Card>

      {/* Ingresos */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            Ingresos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pago Ordinario</span>
            <span className="font-semibold">{formatCurrency(payroll.regularPay)}</span>
          </div>
          {payroll.surcharges > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargos (Mes Anterior)</span>
              <span className="font-semibold text-blue-600">+{formatCurrency(payroll.surcharges)}</span>
            </div>
          )}
          {payroll.transportAllowance > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Bus className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Auxilio de Transporte</span>
              </div>
              <span className="font-semibold text-green-600">+{formatCurrency(payroll.transportAllowance)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Devengado</span>
            <span className="font-bold text-lg">{formatCurrency(payroll.totalEarnings)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Deducciones */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <TrendingDown className="h-5 w-5" />
            Deducciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Salud (4%)</span>
            </div>
            <span className="font-semibold text-red-600">-{formatCurrency(payroll.healthDeduction)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Pensión (4%)</span>
            </div>
            <span className="font-semibold text-red-600">-{formatCurrency(payroll.pensionDeduction)}</span>
          </div>
          {payroll.withholdingTax > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">Retención en la Fuente</span>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(payroll.withholdingTax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Deducciones</span>
            <span className="font-bold text-lg text-red-600">-{formatCurrency(payroll.totalDeductions)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Provisiones */}
      <Card className="shadow-md bg-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-600">
            <PiggyBank className="h-5 w-5" />
            Provisiones del Mes
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Valores informativos - se pagan en fechas específicas
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Prima (8.33%)</span>
            </div>
            <span className="font-semibold text-amber-600">{formatCurrency(payroll.primaProvision)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <PiggyBank className="h-4 w-4 text-teal-500" />
              <span className="text-sm text-muted-foreground">Cesantías (8.33%)</span>
            </div>
            <span className="font-semibold text-amber-600">{formatCurrency(payroll.cesantiasProvision)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Percent className="h-4 w-4 text-indigo-500" />
              <span className="text-sm text-muted-foreground">Int. Cesantías (12%)</span>
            </div>
            <span className="font-semibold text-amber-600">{formatCurrency(payroll.cesantiasInterest)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
