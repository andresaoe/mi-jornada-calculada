-- Actualizar constraint para permitir todos los tipos de turno
ALTER TABLE work_days DROP CONSTRAINT work_days_shift_type_check;

ALTER TABLE work_days ADD CONSTRAINT work_days_shift_type_check 
  CHECK (shift_type = ANY (ARRAY[
    'diurno_am'::text, 
    'tarde_pm'::text, 
    'trasnocho'::text,
    'incapacidad'::text,
    'arl'::text,
    'vacaciones'::text,
    'licencia_remunerada'::text,
    'licencia_no_remunerada'::text
  ]));