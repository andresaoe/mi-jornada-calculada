import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Moon, PartyPopper, Clock3, DollarSign, TrendingUp, Sun } from 'lucide-react';
import { formatCurrency } from '@/lib/salary-calculator';
import { SurchargesSummary } from '@/types/workday';

export default function CurrentMonthSurcharges() {
  const navigate = useNavigate();
  const location = useLocation();
  const { surcharges, currentMonth } = location.state as { 
    surcharges: SurchargesSummary; 
    currentMonth: string;
  };
  const stats = [
    {
      label: 'Recargo Nocturno',
      value: formatCurrency(surcharges.totalNightSurcharge),
      icon: Moon,
      color: 'text-blue-500',
    },
    {
      label: 'Recargo Nocturno Dominical',
      value: formatCurrency(surcharges.totalSundayNightSurcharge),
      icon: Sun,
      color: 'text-orange-500',
    },
    {
      label: 'Recargo Festivo',
      value: formatCurrency(surcharges.totalHolidaySurcharge),
      icon: PartyPopper,
      color: 'text-purple-500',
    },
    {
      label: 'Horas Extras',
      value: formatCurrency(surcharges.totalExtraHoursPay),
      icon: Clock3,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Recargos de {currentMonth}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Se pagarán el mes siguiente
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Total Card */}
          <Card className="shadow-lg bg-gradient-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-6 w-6" />
                Total de Recargos a Recibir el Próximo Mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {formatCurrency(surcharges.totalSurcharges)}
              </div>
              <p className="text-sm mt-2 text-primary-foreground/80">
                Estos recargos se sumarán a tu nómina del próximo mes
              </p>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.map((stat) => (
              <Card key={stat.label} className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color} flex-shrink-0`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Breakdown */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Desglose Detallado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {surcharges.totalNightSurcharge > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recargo Nocturno</span>
                  <span className="font-semibold">
                    {formatCurrency(surcharges.totalNightSurcharge)}
                  </span>
                </div>
              )}
              {surcharges.totalSundayNightSurcharge > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Recargo Nocturno Dominical
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(surcharges.totalSundayNightSurcharge)}
                  </span>
                </div>
              )}
              {surcharges.totalHolidaySurcharge > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Recargo Festivo</span>
                  <span className="font-semibold">
                    {formatCurrency(surcharges.totalHolidaySurcharge)}
                  </span>
                </div>
              )}
              {surcharges.totalExtraHoursPay > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Horas Extras</span>
                  <span className="font-semibold">
                    {formatCurrency(surcharges.totalExtraHoursPay)}
                  </span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total de Recargos</span>
                  <span className="text-xl font-bold text-success">
                    {formatCurrency(surcharges.totalSurcharges)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="shadow-md bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Nota importante:</strong> Los recargos
                nocturnos, dominicales, festivos y horas extras se pagan a mes vencido. Esto
                significa que estos valores se sumarán a tu nómina del próximo mes junto con
                el pago ordinario correspondiente a ese período.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
