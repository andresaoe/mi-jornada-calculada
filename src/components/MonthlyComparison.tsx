// src/components/MonthlyComparison.tsx
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { formatCurrency } from '@/lib/salary-calculator';
import { WorkDay } from '@/types/workday';
import { calculateFullPayroll } from '@/lib/payroll-calculator';
import { calculateSurchargesOnly, filterWorkDaysByMonth } from '@/lib/salary-calculator';
import { format, subMonths, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { PayrollConfig } from '@/types/payroll';
import { getMonthlyHours } from '@/lib/colombian-labor-law';

interface MonthlyComparisonProps {
  workDays: WorkDay[];
  baseSalary: number;
  payrollConfig?: PayrollConfig;
}

export default function MonthlyComparison({ workDays, baseSalary, payrollConfig }: MonthlyComparisonProps) {
  const monthlyData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(startOfMonth(today), i);
      const prevMonthDate = subMonths(monthDate, 1);
      
      const monthWorkDays = filterWorkDaysByMonth(workDays, monthDate);
      const prevMonthWorkDays = filterWorkDaysByMonth(workDays, prevMonthDate);
      
      const monthlyHours = getMonthlyHours(monthDate);
      const hourlyRate = baseSalary / monthlyHours;
      const regularPay = monthWorkDays.reduce((sum, wd) => sum + (wd.regularHours * hourlyRate), 0);
      const surcharges = calculateSurchargesOnly(prevMonthWorkDays, baseSalary);
      
      const payroll = calculateFullPayroll(
        baseSalary,
        regularPay,
        surcharges.totalSurcharges,
        { 
          uvtValue: payrollConfig?.uvtValue,
          includeTransportAllowance: payrollConfig?.includeTransportAllowance,
          date: monthDate,
        }
      );
      
      data.push({
        month: format(monthDate, 'MMM', { locale: es }),
        fullMonth: format(monthDate, 'MMMM yyyy', { locale: es }),
        devengado: Math.round(payroll.totalEarnings),
        deducciones: Math.round(payroll.totalDeductions),
        neto: Math.round(payroll.netPay),
        provisiones: Math.round(payroll.primaProvision + payroll.cesantiasProvision + payroll.cesantiasInterest),
        recargos: Math.round(surcharges.totalSurcharges),
      });
    }
    
    return data;
  }, [workDays, baseSalary, payrollConfig]);

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground capitalize mb-2">{data.fullMonth}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolución de Ingresos (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDevengado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="devengado" name="Devengado" stroke="#22c55e" fillOpacity={1} fill="url(#colorDevengado)" />
                <Area type="monotone" dataKey="neto" name="Neto" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNeto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Desglose Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={formatYAxis} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="recargos" name="Recargos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deducciones" name="Deducciones" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="provisiones" name="Provisiones" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen de los Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Mes</th>
                  <th className="text-right py-2 font-medium text-green-600">Devengado</th>
                  <th className="text-right py-2 font-medium text-red-600">Deducciones</th>
                  <th className="text-right py-2 font-medium text-blue-600">Neto</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-2 capitalize">{data.fullMonth}</td>
                    <td className="py-2 text-right text-green-600">{formatCurrency(data.devengado)}</td>
                    <td className="py-2 text-right text-red-600">-{formatCurrency(data.deducciones)}</td>
                    <td className="py-2 text-right font-semibold text-blue-600">{formatCurrency(data.neto)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right text-green-600">{formatCurrency(monthlyData.reduce((sum, d) => sum + d.devengado, 0))}</td>
                  <td className="py-2 text-right text-red-600">-{formatCurrency(monthlyData.reduce((sum, d) => sum + d.deducciones, 0))}</td>
                  <td className="py-2 text-right text-blue-600">{formatCurrency(monthlyData.reduce((sum, d) => sum + d.neto, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
