// src/hooks/usePayrollConfig.ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PayrollConfig } from '@/types/payroll';
import { PAYROLL_CONSTANTS } from '@/lib/payroll-calculator';

const DEFAULT_CONFIG: PayrollConfig = {
  transportAllowanceEnabled: true,
  transportAllowanceValue: PAYROLL_CONSTANTS.TRANSPORT_ALLOWANCE,
  uvtValue: PAYROLL_CONSTANTS.UVT_VALUE,
};

export function usePayrollConfig(userId: string | null) {
  const [config, setConfig] = useState<PayrollConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const loadConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('transport_allowance_enabled, transport_allowance_value, uvt_value')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setConfig({
            transportAllowanceEnabled: data.transport_allowance_enabled ?? true,
            transportAllowanceValue: data.transport_allowance_value ?? PAYROLL_CONSTANTS.TRANSPORT_ALLOWANCE,
            uvtValue: data.uvt_value ?? PAYROLL_CONSTANTS.UVT_VALUE,
          });
        }
      } catch (error) {
        console.error('Error loading payroll config:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [userId]);

  const updateConfig = async (newConfig: Partial<PayrollConfig>) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          transport_allowance_enabled: newConfig.transportAllowanceEnabled,
          transport_allowance_value: newConfig.transportAllowanceValue,
          uvt_value: newConfig.uvtValue,
        })
        .eq('id', userId);

      if (error) throw error;

      setConfig(prev => ({ ...prev, ...newConfig }));
    } catch (error) {
      console.error('Error updating payroll config:', error);
      throw error;
    }
  };

  return { config, isLoading, updateConfig };
}
