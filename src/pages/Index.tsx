import { useState, useMemo } from 'react';
import { WorkDay } from '@/types/workday';
import WorkDayForm from '@/components/WorkDayForm';
import WorkDayList from '@/components/WorkDayList';
import MonthlySummaryCard from '@/components/MonthlySummaryCard';
import { calculateMonthlySummary } from '@/lib/salary-calculator';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [editingWorkDay, setEditingWorkDay] = useState<WorkDay | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Control de Nómina</h1>
                <p className="text-sm text-muted-foreground">Gestiona tus días laborales y calcula tu salario</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-foreground">Bienvenido, Andres Osorio</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form and List */}
          <div className="lg:col-span-2 space-y-6">
            <WorkDayForm 
              onSubmit={handleSubmit} 
              editingWorkDay={editingWorkDay}
              onCancelEdit={handleCancelEdit}
            />
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1)}
              </h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
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
            <div className="sticky top-6">
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
