import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MonthlySummary, SurchargesSummary } from '@/types/workday';
import { formatCurrency } from '@/lib/salary-calculator';
import { TrendingUp, DollarSign, Moon, PartyPopper, Clock3, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MonthlySummaryCardProps {
  summary: MonthlySummary;
  currentMonth: string;
  currentMonthSurcharges: SurchargesSummary;
}
export default function MonthlySummaryCard({
  summary,
  currentMonth,
  currentMonthSurcharges
}: MonthlySummaryCardProps) {
  const navigate = useNavigate();

  const handleViewCurrentMonthSurcharges = () => {
    navigate('/recargos-mes-actual', {
      state: {
        surcharges: currentMonthSurcharges,
        currentMonth
      }
    });
  };
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
            <span className="text-sm text-muted-foreground">Pago Ordinario (Mes Actual)</span>
            <span className="font-semibold">{formatCurrency(summary.totalRegularPay)}</span>
          </div>
          {summary.totalNightSurcharge > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargo Nocturno (Mes Anterior)</span>
              <span className="font-semibold text-stone-950">
                +{formatCurrency(summary.totalNightSurcharge)}
              </span>
            </div>}
          {summary.totalSundayNightSurcharge > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Recargo Nocturno Dominical (Mes Anterior)</span>
              <span className="font-semibold text-stone-950">
                +{formatCurrency(summary.totalSundayNightSurcharge)}
              </span>
            </div>}
          {summary.totalHolidaySurcharge > 0 && <div className="flex justify-between items-center text-muted-foreground">
              <span className="text-sm text-muted-foreground">Recargo Festivo (Mes Anterior)</span>
              <span className="font-semibold text-muted-foreground">
                +{formatCurrency(summary.totalHolidaySurcharge)}
              </span>
            </div>}
          {summary.totalExtraHoursPay > 0 && <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Horas Extras (Mes Anterior)</span>
              <span className="font-semibold text-accent">
                +{formatCurrency(summary.totalExtraHoursPay)}
              </span>
            </div>}
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total a Recibir</span>
              <span className="text-xl font-bold text-success">
                {formatCurrency(summary.totalPay)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button to view current month surcharges */}
      {currentMonthSurcharges.totalSurcharges > 0 && (
        <Card className="shadow-md bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm mb-1">Recargos del Mes Actual</p>
                  <p className="text-xs text-muted-foreground">
                    Se pagarán el próximo mes
                  </p>
                </div>
                <span className="font-bold text-lg">
                  {formatCurrency(currentMonthSurcharges.totalSurcharges)}
                </span>
              </div>
              <Button 
                onClick={handleViewCurrentMonthSurcharges}
                variant="outline"
                className="w-full"
              >
                Ver Detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>;
}