// src/components/PayrollSummaryCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { PayrollCalculation } from '@/lib/payroll-calculator';
import { formatCurrency } from '@/lib/salary-calculator';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Shield, 
  FileText,
  Gift,
  PiggyBank,
  Percent,
  Users,
  Building2,
  ChevronDown,
  Bus,
  Briefcase,
  Umbrella,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

interface PayrollSummaryCardProps {
  payroll: PayrollCalculation;
  currentMonth: string;
}

export default function PayrollSummaryCard({ payroll, currentMonth }: PayrollSummaryCardProps) {
  const [showEmployerCosts, setShowEmployerCosts] = useState(false);
  const [showWithholdingDetails, setShowWithholdingDetails] = useState(false);

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
                <Bus className="h-4 w-4 text-cyan-500" />
                <span className="text-sm text-muted-foreground">Auxilio de Transporte</span>
              </div>
              <span className="font-semibold text-cyan-600">+{formatCurrency(payroll.transportAllowance)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Devengado</span>
            <span className="font-bold text-lg">{formatCurrency(payroll.totalEarnings)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>IBC (Base de Cotización)</span>
            <span>{formatCurrency(payroll.ibc)}</span>
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
          {payroll.fspDeduction > 0 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Fondo Solidaridad Pensional</span>
              </div>
              <span className="font-semibold text-red-600">-{formatCurrency(payroll.fspDeduction)}</span>
            </div>
          )}
          {payroll.withholdingTax > 0 && (
            <Collapsible open={showWithholdingDetails} onOpenChange={setShowWithholdingDetails}>
              <div className="flex justify-between items-center">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Retención en la Fuente</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${showWithholdingDetails ? 'rotate-180' : ''}`} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <span className="font-semibold text-red-600">-{formatCurrency(payroll.withholdingTax)}</span>
              </div>
              <CollapsibleContent>
                {payroll.withholdingDetails && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ingreso bruto:</span>
                      <span>{formatCurrency(payroll.withholdingDetails.grossIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">(-) Salud + Pensión:</span>
                      <span>{formatCurrency(payroll.withholdingDetails.healthPensionDeduction)}</span>
                    </div>
                    {payroll.withholdingDetails.fspDeduction > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">(-) FSP:</span>
                        <span>{formatCurrency(payroll.withholdingDetails.fspDeduction)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">(-) Renta exenta 25%:</span>
                      <span>{formatCurrency(payroll.withholdingDetails.rentaExenta)}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium">
                      <span>Base gravable UVT:</span>
                      <span>{payroll.withholdingDetails.taxableBaseUVT.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tarifa aplicada:</span>
                      <span>{(payroll.withholdingDetails.appliedRate * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
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
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <Umbrella className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Vacaciones (4.17%)</span>
            </div>
            <span className="font-semibold text-amber-600">{formatCurrency(payroll.vacacionesProvision)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Aportes del Empleador */}
      <Collapsible open={showEmployerCosts} onOpenChange={setShowEmployerCosts}>
        <Card className="shadow-md bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <CardTitle className="text-base flex items-center gap-2 text-blue-600">
                  <Building2 className="h-5 w-5" />
                  Costos del Empleador
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">{formatCurrency(payroll.totalEmployerCosts)}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showEmployerCosts ? 'rotate-180' : ''}`} />
                </div>
              </Button>
            </CollapsibleTrigger>
            <p className="text-xs text-muted-foreground">
              Valores informativos - a cargo del empleador
            </p>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-2 pt-2">
              <div className="text-xs font-medium text-muted-foreground mb-2">Seguridad Social</div>
              {payroll.employerHealth > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Salud (8.5%)</span>
                  </div>
                  <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerHealth)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Pensión (12%)</span>
                </div>
                <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerPension)}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-muted-foreground">ARL</span>
                </div>
                <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerARL)}</span>
              </div>
              
              <Separator className="my-2" />
              <div className="text-xs font-medium text-muted-foreground mb-2">Parafiscales</div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Caja de Compensación (4%)</span>
                </div>
                <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerCaja)}</span>
              </div>
              {payroll.employerSENA > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">SENA (2%)</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerSENA)}</span>
                </div>
              )}
              {payroll.employerICBF > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ICBF (3%)</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(payroll.employerICBF)}</span>
                </div>
              )}
              
              {payroll.employerHealth === 0 && payroll.employerSENA === 0 && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  * Exonerado de aportes a salud, SENA e ICBF (Art. 114-1 E.T.)
                </p>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
