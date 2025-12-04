-- Add payroll configuration columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS transport_allowance_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS uvt_value numeric NOT NULL DEFAULT 49799,
ADD COLUMN IF NOT EXISTS transport_allowance_value numeric NOT NULL DEFAULT 200000;

-- Create payroll_calculations table to store monthly summaries
CREATE TABLE IF NOT EXISTS public.payroll_calculations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year date NOT NULL,
  base_salary numeric NOT NULL,
  regular_pay numeric NOT NULL DEFAULT 0,
  surcharges numeric NOT NULL DEFAULT 0,
  transport_allowance numeric NOT NULL DEFAULT 0,
  health_deduction numeric NOT NULL DEFAULT 0,
  pension_deduction numeric NOT NULL DEFAULT 0,
  withholding_tax numeric NOT NULL DEFAULT 0,
  prima_provision numeric NOT NULL DEFAULT 0,
  cesantias_provision numeric NOT NULL DEFAULT 0,
  cesantias_interest numeric NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_deductions numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.payroll_calculations ENABLE ROW LEVEL SECURITY;

-- RLS policies for payroll_calculations
CREATE POLICY "Users can view their own payroll calculations" 
ON public.payroll_calculations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payroll calculations" 
ON public.payroll_calculations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payroll calculations" 
ON public.payroll_calculations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payroll calculations" 
ON public.payroll_calculations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payroll_calculations_updated_at
BEFORE UPDATE ON public.payroll_calculations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();