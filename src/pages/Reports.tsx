// src/pages/Reports.tsx
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Calendar, BarChart3, Download } from 'lucide-react';
import { useWorkDays } from '@/hooks/useWorkDays';
import { usePayrollConfig } from '@/hooks/usePayrollConfig';
import { useSalaryCalculations } from '@/hooks/useSalaryCalculations';
import { generatePayStubPDF, generateAnnualReportPDF } from '@/lib/pdf-generator';
import { calculateFullPayroll } from '@/lib/payroll-calculator';
import { calculateSurchargesOnly, filterWorkDaysByMonth } from '@/lib/salary-calculator';
import MonthlyComparison from '@/components/MonthlyComparison';
import { format, subMonths, startOfMonth, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

const Reports = () => {
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  
  const { workDays, userId, baseSalary, isLoading } = useWorkDays();
  const { config: payrollConfig } = usePayrollConfig(userId);
  
  // Get user profile data
  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { payrollSummary } = useSalaryCalculations({ 
    workDays, 
    baseSalary, 
    currentDate: selectedMonth,
    payrollConfig 
  });

  // Generate months for selector (last 12 months)
  const availableMonths = useMemo(() => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = subMonths(today, i);
      months.push({
        value: date.toISOString(),
        label: format(date, 'MMMM yyyy', { locale: es }),
      });
    }
    return months;
  }, []);

  // Generate years for selector
  const availableYears = useMemo(() => {
    const currentYear = getYear(new Date());
    return [currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // Generate annual data
  const annualData = useMemo(() => {
    const data = [];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(selectedYear, i, 1);
      const prevMonthDate = subMonths(monthDate, 1);
      
      const monthWorkDays = filterWorkDaysByMonth(workDays, monthDate);
      const prevMonthWorkDays = filterWorkDaysByMonth(workDays, prevMonthDate);
      
      const hourlyRate = baseSalary / 220;
      const regularPay = monthWorkDays.reduce((sum, wd) => sum + (wd.regularHours * hourlyRate), 0);
      const surcharges = calculateSurchargesOnly(prevMonthWorkDays, baseSalary);
      
      const payroll = calculateFullPayroll(
        baseSalary,
        regularPay,
        surcharges.totalSurcharges,
        {
          transportAllowanceEnabled: payrollConfig?.transportAllowanceEnabled ?? true,
          customTransportAllowance: payrollConfig?.transportAllowanceValue,
          uvtValue: payrollConfig?.uvtValue,
        }
      );
      
      data.push({
        month: months[i],
        earnings: payroll.totalEarnings,
        deductions: payroll.totalDeductions,
        netPay: payroll.netPay,
        provisions: payroll.primaProvision + payroll.cesantiasProvision + payroll.cesantiasInterest,
      });
    }
    
    return data;
  }, [workDays, baseSalary, selectedYear, payrollConfig]);

  const handleGeneratePayStub = () => {
    try {
      generatePayStubPDF({
        payroll: payrollSummary,
        employeeName: profile?.full_name || '',
        employeeEmail: profile?.email || '',
        month: format(selectedMonth, 'MMMM', { locale: es }),
        year: getYear(selectedMonth),
      });
      toast({
        title: 'PDF Generado',
        description: 'El desprendible de nómina se ha descargado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAnnualReport = () => {
    try {
      generateAnnualReportPDF(
        profile?.full_name || 'No especificado',
        selectedYear,
        annualData
      );
      toast({
        title: 'PDF Generado',
        description: 'El reporte anual se ha descargado correctamente.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reportes</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Genera y descarga reportes de nómina
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="paystub" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="paystub" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Desprendible</span>
            </TabsTrigger>
            <TabsTrigger value="annual" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Reporte Anual</span>
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Comparativo</span>
            </TabsTrigger>
          </TabsList>

          {/* Pay Stub Tab */}
          <TabsContent value="paystub">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Desprendible de Nómina
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="w-full sm:w-64">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Seleccionar Mes
                    </label>
                    <Select
                      value={selectedMonth.toISOString()}
                      onValueChange={(value) => setSelectedMonth(new Date(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMonths.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            <span className="capitalize">{month.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGeneratePayStub} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Genera un PDF con el detalle completo de tu nómina para el mes seleccionado,
                  incluyendo ingresos, deducciones y provisiones.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Annual Report Tab */}
          <TabsContent value="annual">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Reporte Anual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="w-full sm:w-64">
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Seleccionar Año
                    </label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleGenerateAnnualReport} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Genera un reporte PDF con el resumen de tu nómina de todo el año,
                  incluyendo totales de ingresos, deducciones y neto recibido por mes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <MonthlyComparison 
              workDays={workDays} 
              baseSalary={baseSalary} 
              payrollConfig={payrollConfig}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Reports;
