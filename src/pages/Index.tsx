import { useState, useMemo, useEffect } from 'react';
import { WorkDay } from '@/types/workday';
import WorkDayForm from '@/components/WorkDayForm';
import WorkDayList from '@/components/WorkDayList';
import MonthlySummaryCard from '@/components/MonthlySummaryCard';
import { calculateMonthlySummary } from '@/lib/salary-calculator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'workdays_data';

const Index = () => {
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [editingWorkDay, setEditingWorkDay] = useState<WorkDay | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Load data from local storage on mount
  useEffect(() => {
    const loadWorkDays = async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const parsedData = JSON.parse(value);
          setWorkDays(parsedData);
        }
      } catch (error) {
        console.error('Error loading work days:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkDays();
  }, []);

  // Save data to local storage whenever workDays changes
  useEffect(() => {
    const saveWorkDays = async () => {
      if (!isLoading) {
        try {
          await Preferences.set({
            key: STORAGE_KEY,
            value: JSON.stringify(workDays),
          });
        } catch (error) {
          console.error('Error saving work days:', error);
        }
      }
    };

    saveWorkDays();
  }, [workDays, isLoading]);

  const currentMonthYear = useMemo(() => {
    return currentDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const filteredWorkDays = useMemo(() => {
    return workDays.filter(workDay => {
      const [year, month, day] = workDay.date.split('-').map(Number);
      const workDayDate = new Date(year, month - 1, day);
      return (
        workDayDate.getMonth() === currentDate.getMonth() &&
        workDayDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [workDays, currentDate]);

  const monthlySummary = useMemo(() => {
    return calculateMonthlySummary(filteredWorkDays);
  }, [filteredWorkDays]);

  const handleSubmit = (workDayData: Omit<WorkDay, 'id' | 'createdAt'>) => {
    if (editingWorkDay) {
      setWorkDays(workDays.map(wd => 
        wd.id === editingWorkDay.id 
          ? { ...workDayData, id: wd.id, createdAt: wd.createdAt }
          : wd
      ));
      setEditingWorkDay(null);
      toast({
        title: "Día actualizado",
        description: "El registro ha sido actualizado exitosamente.",
      });
    } else {
      const newWorkDay: WorkDay = {
        ...workDayData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      setWorkDays([...workDays, newWorkDay]);
      toast({
        title: "Día registrado",
        description: "El día laboral ha sido guardado exitosamente.",
      });
    }
  };

  const handleEdit = (workDay: WorkDay) => {
    setEditingWorkDay(workDay);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setWorkDays(workDays.filter(wd => wd.id !== id));
    toast({
      title: "Día eliminado",
      description: "El registro ha sido eliminado.",
      variant: "destructive",
    });
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
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Control de Nómina</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gestiona tus días laborales y calcula tu salario</p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-base sm:text-lg font-semibold text-foreground">Bienvenido, Andres Osorio</p>
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
              editingWorkDay={editingWorkDay}
              onCancelEdit={handleCancelEdit}
            />
            
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">
                {currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
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
              workDays={filteredWorkDays}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <MonthlySummaryCard 
                summary={monthlySummary}
                currentMonth={currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
