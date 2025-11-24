import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlySummary } from '@/types/workday';
import { formatCurrency } from '@/lib/salary-calculator';
import { TrendingUp, DollarSign, Moon, PartyPopper, Clock3, Calendar, Sun } from 'lucide-react';
interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  currentMonth: string;
}
export default function MonthlySummaryCard({
  summary,
  currentMonth
}: MonthlySummaryCardProps) {
  const totalNightSurcharges = summary.totalNightSurcharge + summary.totalSundayNightSurcharge;
  const stats = [{
    label: 'Días Trabajados',
    value: summary.daysWorked,
    icon: Calendar,
    color: 'text-primary'
  }, {
    label: 'Recargo Nocturno Total',
    value: formatCurrency(totalNightSurcharges),
    icon: Moon,
    color: 'text-blue-500'
  }, {
    label: 'Recargo Festivo',
    value: formatCurrency(summary.totalHolidaySurcharge),
    icon: PartyPopper,
    color: 'text-purple-500'
  }, {
    label: 'Horas Extras',
    value: formatCurrency(summary.totalExtraHoursPay),
    icon: Clock3,
    color: 'text-green-500'
  }];
  return <div className="space-y-4">
      <Card className="shadow-lg bg-gradient-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-6 w-6" />
            Total a Recibir - {currentMonth}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatCurrency(summary.totalPay)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => <Card key={stat.label} className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>)}
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Desglose de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pago Ordinario</span>
            <span className="font-semibold">{formatCurrency(summary.totalRegularPay)}</span>
          </div>
          {summary.totalNightSurcharge > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargo Nocturno</span>
              <span className="font-semibold text-stone-950">
                +{formatCurrency(summary.totalNightSurcharge)}
              </span>
            </div>}
          {summary.totalSundayNightSurcharge > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargo Nocturno Dominical</span>
              <span className="font-semibold text-stone-950">
                +{formatCurrency(summary.totalSundayNightSurcharge)}
              </span>
            </div>}
          {summary.totalHolidaySurcharge > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargo Festivo</span>
              <span className="font-semibold text-accent">
                +{formatCurrency(summary.totalHolidaySurcharge)}
              </span>
            </div>}
          {summary.totalExtraHoursPay > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horas Extras</span>
              <span className="font-semibold text-accent">
                +{formatCurrency(summary.totalExtraHoursPay)}
              </span>
            </div>}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(summary.totalPay)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}