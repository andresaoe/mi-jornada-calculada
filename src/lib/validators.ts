// src/lib/validators.ts
// Validaciones de entrada centralizadas para seguridad

import { z } from 'zod';

// Validación para autenticación
export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Email inválido' })
    .max(255, { message: 'Email muy largo' }),
  password: z
    .string()
    .min(6, { message: 'Mínimo 6 caracteres' })
    .max(128, { message: 'Contraseña muy larga' }),
});

export const signupSchema = authSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Nombre muy corto' })
    .max(100, { message: 'Nombre muy largo' }),
  baseSalary: z
    .number()
    .min(0, { message: 'Salario debe ser positivo' })
    .max(100000000, { message: 'Salario inválido' }),
});

// Validación para días laborales
export const workDaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Formato de fecha inválido' }),
  shiftType: z.enum([
    'diurno_am',
    'tarde_pm',
    'trasnocho',
    'incapacidad',
    'arl',
    'vacaciones',
    'licencia_remunerada',
    'licencia_no_remunerada',
  ]),
  regularHours: z
    .number()
    .min(0, { message: 'Horas debe ser positivo' })
    .max(24, { message: 'Máximo 24 horas' }),
  extraHours: z
    .number()
    .min(0, { message: 'Horas debe ser positivo' })
    .max(12, { message: 'Máximo 12 horas extra' }),
  notes: z
    .string()
    .max(500, { message: 'Notas muy largas' })
    .optional()
    .nullable(),
});

// Validación para perfil
export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Nombre muy corto' })
    .max(100, { message: 'Nombre muy largo' }),
  baseSalary: z
    .number()
    .min(0, { message: 'Salario debe ser positivo' })
    .max(100000000, { message: 'Salario inválido' }),
});

// Tipos inferidos
export type AuthInput = z.infer<typeof authSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type WorkDayInput = z.infer<typeof workDaySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

// Helper para validar y sanitizar
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.errors.map((e) => e.message).join(', '),
  };
}
