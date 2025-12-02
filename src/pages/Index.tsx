import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkDay } from '@/types/workday';
import WorkDayForm from '@/components/WorkDayForm';
import WorkDayList from '@/components/WorkDayList';
import MonthlySummaryCard from '@/components/MonthlySummaryCard';
import UserProfile from '@/components/UserProfile';
import { calculateMonthlySummary } from '@/lib/salary-calculator';
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [editingWorkDay, setEditingWorkDay] = useState<WorkDay | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [baseSalary, setBaseSalary] = useState<number>(2416500);

  // Check authentication and load user data
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);
      
      // Load user profile to get base salary
      const { data: profile } = await supabase
        .from('profiles')
        .select('base_salary')
        .eq('id', user.id)
        .single();
      
      if (profile?.base_salary) {
        setBaseSalary(Number(profile.base_salary));
      }
      
      loadWorkDays(user.id);
    };

    initUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else if (session.user.id !== userId) {
        setUserId(session.user.id);
        loadWorkDays(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load work days from Supabase
  const loadWorkDays = async (uid: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data) {
        // Transform database format to WorkDay format
        const transformedData: WorkDay[] = data.map((item) => ({
          id: item.id,
          date: item.date,
          shiftType: item.shift_type as 'diurno_am' | 'tarde_pm' | 'trasnocho',
          regularHours: Number(item.regular_hours),
          extraHours: Number(item.extra_hours),
          isHoliday: item.is_holiday,
          notes: item.notes || '',
          createdAt: item.created_at,
        }));
        setWorkDays(transformedData);
      }
    } catch (error: any) {
      console.error('Error loading work days:', error);
      toast({
        title: "Error al cargar datos",
        description: error.message || "No se pudieron cargar los registros",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const currentMonthYear = useMemo(() => {
    return currentDate.toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric'
    });
  }, [currentDate]);
  const filteredWorkDays = useMemo(() => {
    return workDays.filter(workDay => {
      const [year, month, day] = workDay.date.split('-').map(Number);
      const workDayDate = new Date(year, month - 1, day);
      return workDayDate.getMonth() === currentDate.getMonth() && workDayDate.getFullYear() === currentDate.getFullYear();
    });
  }, [workDays, currentDate]);
  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(filteredWorkDays, baseSalary);
  }, [filteredWorkDays, baseSalary]);
  const handleSubmit = async (workDayData: Omit<WorkDay, 'id' | 'createdAt'>) => {
    if (!userId) return;

    try {
      if (editingWorkDay) {
        // Update existing work day
        const { error } = await supabase
          .from('work_days')
          .update({
            date: workDayData.date,
            shift_type: workDayData.shiftType,
            regular_hours: workDayData.regularHours,
            extra_hours: workDayData.extraHours,
            is_holiday: workDayData.isHoliday,
            notes: workDayData.notes,
          })
          .eq('id', editingWorkDay.id)
          .eq('user_id', userId);

        if (error) throw error;

        setWorkDays(workDays.map(wd => 
          wd.id === editingWorkDay.id 
            ? { ...workDayData, id: wd.id, createdAt: wd.createdAt }
            : wd
        ));
        setEditingWorkDay(null);
        
        toast({
          title: "Día actualizado",
          description: "El registro ha sido actualizado exitosamente."
        });
      } else {
        // Insert new work day
        const { data, error } = await supabase
          .from('work_days')
          .insert({
            user_id: userId,
            date: workDayData.date,
            shift_type: workDayData.shiftType,
            regular_hours: workDayData.regularHours,
            extra_hours: workDayData.extraHours,
            is_holiday: workDayData.isHoliday,
            notes: workDayData.notes,
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          const newWorkDay: WorkDay = {
            id: data.id,
            date: data.date,
            shiftType: data.shift_type as 'diurno_am' | 'tarde_pm' | 'trasnocho',
            regularHours: Number(data.regular_hours),
            extraHours: Number(data.extra_hours),
            isHoliday: data.is_holiday,
            notes: data.notes || '',
            createdAt: data.created_at,
          };
          setWorkDays([...workDays, newWorkDay]);
        }

        toast({
          title: "Día registrado",
          description: "El día laboral ha sido guardado exitosamente."
        });
      }
    } catch (error: any) {
      console.error('Error saving work day:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el registro",
        variant: "destructive",
      });
    }
  };
  const handleEdit = (workDay: WorkDay) => {
    setEditingWorkDay(workDay);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleDelete = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('work_days')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setWorkDays(workDays.filter(wd => wd.id !== id));
      toast({
        title: "Día eliminado",
        description: "El registro ha sido eliminado.",
        variant: "destructive"
      });
    } catch (error: any) {
      console.error('Error deleting work day:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el registro",
        variant: "destructive",
      });
    }
  };
  const handleCancelEdit = () => {
    setEditingWorkDay(null);
  };
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Control de Nómina</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gestiona tus días laborales y calcula tu salario</p>
              </div>
            </div>
            <UserProfile />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Form and List */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <WorkDayForm onSubmit={handleSubmit} editingWorkDay={editingWorkDay} onCancelEdit={handleCancelEdit} />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">
                {currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
              </h2>
              <div className="flex gap-1 sm:gap-2">
                <Button variant="outline" size="icon" onClick={() => changeMonth('prev')} className="h-8 w-8 sm:h-10 sm:w-10">
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => changeMonth('next')} className="h-8 w-8 sm:h-10 sm:w-10">
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            <WorkDayList workDays={filteredWorkDays} onEdit={handleEdit} onDelete={handleDelete} baseSalary={baseSalary} />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <MonthlySummaryCard summary={monthlySummary} currentMonth={currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)} />
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;