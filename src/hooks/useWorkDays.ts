// src/hooks/useWorkDays.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkDay } from '@/types/workday';

interface UseWorkDaysReturn {
  workDays: WorkDay[];
  userId: string | null;
  baseSalary: number;
  isLoading: boolean;
  addWorkDay: (workDay: Omit<WorkDay, 'id' | 'createdAt'>) => Promise<void>;
  addMultipleWorkDays: (workDays: Omit<WorkDay, 'id' | 'createdAt'>[]) => Promise<void>;
  updateWorkDay: (id: string, workDay: Omit<WorkDay, 'id' | 'createdAt'>) => Promise<void>;
  deleteWorkDay: (id: string) => Promise<void>;
  setBaseSalary: (salary: number) => void;
}

const transformDbToWorkDay = (item: any): WorkDay => ({
  id: item.id,
  date: item.date,
  shiftType: item.shift_type,
  regularHours: Number(item.regular_hours),
  extraHours: Number(item.extra_hours),
  isHoliday: item.is_holiday,
  notes: item.notes || '',
  createdAt: item.created_at,
});

export function useWorkDays(): UseWorkDaysReturn {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [baseSalary, setBaseSalary] = useState<number>(2416500);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkDays = useCallback(async (uid: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('work_days')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });

      if (error) throw error;
      setWorkDays(data?.map(transformDbToWorkDay) || []);
    } catch (error: any) {
      toast({
        title: "Error al cargar datos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);
      
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else if (session.user.id !== userId) {
        setUserId(session.user.id);
        loadWorkDays(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, loadWorkDays, userId]);

  const addWorkDay = useCallback(async (workDayData: Omit<WorkDay, 'id' | 'createdAt'>) => {
    if (!userId) return;

    try {
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
        setWorkDays(prev => [transformDbToWorkDay(data), ...prev]);
        toast({
          title: "Día registrado",
          description: "El día laboral ha sido guardado exitosamente."
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [userId, toast]);

  const addMultipleWorkDays = useCallback(async (workDaysData: Omit<WorkDay, 'id' | 'createdAt'>[]) => {
    if (!userId || workDaysData.length === 0) return;

    try {
      const insertData = workDaysData.map(wd => ({
        user_id: userId,
        date: wd.date,
        shift_type: wd.shiftType,
        regular_hours: wd.regularHours,
        extra_hours: wd.extraHours,
        is_holiday: wd.isHoliday,
        notes: wd.notes,
      }));

      const { data, error } = await supabase
        .from('work_days')
        .insert(insertData)
        .select();

      if (error) throw error;
      if (data) {
        setWorkDays(prev => [...data.map(transformDbToWorkDay), ...prev]);
        toast({
          title: "Días registrados",
          description: `Se han guardado ${data.length} días exitosamente.`
        });
      }
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [userId, toast]);

  const updateWorkDay = useCallback(async (id: string, workDayData: Omit<WorkDay, 'id' | 'createdAt'>) => {
    if (!userId) return;

    try {
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
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setWorkDays(prev => prev.map(wd => 
        wd.id === id ? { ...workDayData, id, createdAt: wd.createdAt } : wd
      ));
      
      toast({
        title: "Día actualizado",
        description: "El registro ha sido actualizado exitosamente."
      });
    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [userId, toast]);

  const deleteWorkDay = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('work_days')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      setWorkDays(prev => prev.filter(wd => wd.id !== id));
      toast({
        title: "Día eliminado",
        description: "El registro ha sido eliminado.",
        variant: "destructive"
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [userId, toast]);

  return {
    workDays,
    userId,
    baseSalary,
    isLoading,
    addWorkDay,
    addMultipleWorkDays,
    updateWorkDay,
    deleteWorkDay,
    setBaseSalary,
  };
}