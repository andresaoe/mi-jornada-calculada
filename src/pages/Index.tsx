// src/pages/Index.tsx - VERSIÓN REFACTORIZADA
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkDay } from '@/types/workday';
import WorkDayForm from '@/components/WorkDayForm';
import WorkDayList from '@/components/WorkDayList';
import MonthlySummaryCard from '@/components/MonthlySummaryCard';
import PayrollSummaryCard from '@/components/PayrollSummaryCard';
import UserProfile from '@/components/UserProfile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, ChevronLeft, ChevronRight, FileBarChart, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useWorkDays } from '@/hooks/useWorkDays';
import { useSalaryCalculations } from '@/hooks/useSalaryCalculations';
import { usePayrollConfig } from '@/hooks/usePayrollConfig';
import { supabase } from '@/integrations/supabase/client';
const Index = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingWorkDay, setEditingWorkDay] = useState<WorkDay | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        setIsAdmin(data ?? false);
      }
    };
    checkAdmin();
  }, []);

  // Custom hooks - separación de responsabilidades
  const { 
    workDays, 
    userId,
    baseSalary, 
    isLoading, 
    addWorkDay,
    addMultipleWorkDays,
    updateWorkDay, 
    deleteWorkDay 
  } = useWorkDays();

  const { config: payrollConfig } = usePayrollConfig(userId);

  const {
    currentMonthWorkDays,
    currentMonthSurcharges,
    monthlySummary,
    payrollSummary,
  } = useSalaryCalculations({ workDays, baseSalary, currentDate, payrollConfig });

  // Format current month/year
  const currentMonthYear = format(currentDate, 'LLLL yyyy', { locale: es });

  // Handlers
  const handleSubmit = async (workDayData: Omit<WorkDay, 'id' | 'createdAt'>) => {
    try {
      if (editingWorkDay) {
        await updateWorkDay(editingWorkDay.id, workDayData);
        setEditingWorkDay(null);
      } else {
        await addWorkDay(workDayData);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSubmitMultiple = async (workDaysData: Omit<WorkDay, 'id' | 'createdAt'>[]) => {
    try {
      await addMultipleWorkDays(workDaysData);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEdit = (workDay: WorkDay) => {
    setEditingWorkDay(workDay);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkDay(id);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCancelEdit = () => {
    setEditingWorkDay(null);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Control de Nómina
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gestiona tus días laborales y calcula tu salario
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => navigate('/admin/aprobaciones')}
                    className="sm:hidden h-9 w-9"
                  >
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate('/admin/aprobaciones')}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/reportes')}
                className="sm:hidden h-9 w-9"
              >
                <FileBarChart className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/reportes')}
                className="hidden sm:flex items-center gap-2"
              >
                <FileBarChart className="h-4 w-4" />
                Reportes
              </Button>
              <UserProfile />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Form and List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <WorkDayForm 
              onSubmit={handleSubmit}
              onSubmitMultiple={handleSubmitMultiple}
              editingWorkDay={editingWorkDay} 
              onCancelEdit={handleCancelEdit} 
            />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold capitalize">
                {currentMonthYear}
              </h2>
              <div className="flex gap-1 sm:gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => changeMonth('prev')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => changeMonth('next')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <WorkDayList 
              workDays={currentMonthWorkDays}
              allWorkDays={workDays}
              onEdit={handleEdit} 
              onDelete={handleDelete} 
              baseSalary={baseSalary} 
            />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <Tabs defaultValue="payroll" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payroll">Nómina</TabsTrigger>
                  <TabsTrigger value="surcharges">Recargos</TabsTrigger>
                </TabsList>
                <TabsContent value="payroll" className="mt-4">
                  <PayrollSummaryCard 
                    payroll={payrollSummary}
                    currentMonth={currentMonthYear}
                  />
                </TabsContent>
                <TabsContent value="surcharges" className="mt-4">
                  <MonthlySummaryCard 
                    summary={monthlySummary} 
                    currentMonth={currentMonthYear}
                    currentMonthSurcharges={currentMonthSurcharges}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;