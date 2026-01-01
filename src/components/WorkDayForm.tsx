import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkDay, ShiftType } from '@/types/workday';
import { Plus, Edit, AlertCircle, CalendarIcon, CalendarRange, Sun, PartyPopper, Info } from 'lucide-react';
import { format, eachDayOfInterval, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { isHolidayOrSunday, isSunday, getHolidayName, isColombianHoliday } from '@/lib/colombian-holidays';
import { Badge } from '@/components/ui/badge';

interface WorkDayFormProps {
  onSubmit: (workDay: Omit<WorkDay, 'id' | 'createdAt'>) => void;
  onSubmitMultiple?: (workDays: Omit<WorkDay, 'id' | 'createdAt'>[]) => void;
  editingWorkDay?: WorkDay | null;
  onCancelEdit?: () => void;
}

// Shift types that support date range selection
const RANGE_SHIFT_TYPES: ShiftType[] = ['incapacidad', 'arl', 'vacaciones', 'licencia_remunerada', 'licencia_no_remunerada'];

export default function WorkDayForm({ onSubmit, onSubmitMultiple, editingWorkDay, onCancelEdit }: WorkDayFormProps) {
  const initialDate = editingWorkDay?.date || new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [useRangeMode, setUseRangeMode] = useState(false);
  const [shiftType, setShiftType] = useState<ShiftType>(editingWorkDay?.shiftType || 'diurno_am');
  const [regularHours, setRegularHours] = useState(editingWorkDay?.regularHours.toString() || '8');
  const [extraHours, setExtraHours] = useState(editingWorkDay?.extraHours.toString() || '0');
  const [notes, setNotes] = useState(editingWorkDay?.notes || '');

  // Auto-detect if current date is holiday/sunday
  const isCurrentDateHoliday = isHolidayOrSunday(date);
  const currentDateIsSunday = isSunday(date);
  const holidayName = getHolidayName(date);

  // Check if current shift type supports range selection
  const supportsRange = RANGE_SHIFT_TYPES.includes(shiftType);

  // Reset range mode when shift type changes
  useEffect(() => {
    if (!supportsRange) {
      setUseRangeMode(false);
      setDateRange(undefined);
    }
  }, [shiftType, supportsRange]);

  // Calculate number of days in range
  const daysInRange = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If using range mode and we have a valid range
    if (useRangeMode && dateRange?.from && dateRange?.to && onSubmitMultiple) {
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      const workDays = days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        return {
          date: dayStr,
          shiftType,
          regularHours: parseFloat(regularHours),
          extraHours: 0,
          isHoliday: isHolidayOrSunday(dayStr), // Auto-detect from Colombian calendar
          notes,
        };
      });
      onSubmitMultiple(workDays);
      
      // Reset form
      setDateRange(undefined);
      setUseRangeMode(false);
      setShiftType('diurno_am');
      setRegularHours('8');
      setExtraHours('0');
      setNotes('');
    } else {
      // Single day submission - auto-detect holiday status
      onSubmit({
        date,
        shiftType,
        regularHours: parseFloat(regularHours),
        extraHours: parseFloat(extraHours),
        isHoliday: isHolidayOrSunday(date), // Auto-detect from Colombian calendar
        notes,
      });
      
      if (!editingWorkDay) {
        setDate(new Date().toISOString().split('T')[0]);
        setShiftType('diurno_am');
        setRegularHours('8');
        setExtraHours('0');
        setNotes('');
      }
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {editingWorkDay ? (
            <>
              <Edit className="h-5 w-5" />
              Editar Día Laboral
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              Registrar Día Laboral
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shift Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="shiftType">Tipo de Turno</Label>
              <Select value={shiftType} onValueChange={(value) => setShiftType(value as ShiftType)}>
                <SelectTrigger id="shiftType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diurno_am">Diurno AM (5am-1pm)</SelectItem>
                  <SelectItem value="tarde_pm">Tarde PM (1pm-9pm)</SelectItem>
                  <SelectItem value="trasnocho">Trasnocho (9pm-5am)</SelectItem>
                  <SelectItem value="incapacidad">Incapacidad</SelectItem>
                  <SelectItem value="arl">ARL (Accidente Laboral)</SelectItem>
                  <SelectItem value="vacaciones">Vacaciones</SelectItem>
                  <SelectItem value="licencia_remunerada">Licencia Remunerada</SelectItem>
                  <SelectItem value="licencia_no_remunerada">Licencia No Remunerada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Range mode toggle for supported shift types */}
            {supportsRange && !editingWorkDay && (
              <div className="space-y-2">
                <Label>Modo de Selección</Label>
                <div className="flex items-center gap-4 h-10">
                  <Button
                    type="button"
                    variant={!useRangeMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseRangeMode(false)}
                    className="flex items-center gap-1"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Un día
                  </Button>
                  <Button
                    type="button"
                    variant={useRangeMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseRangeMode(true)}
                    className="flex items-center gap-1"
                  >
                    <CalendarRange className="h-4 w-4" />
                    Varios días
                  </Button>
                </div>
              </div>
            )}

            {/* Date Selection */}
            {useRangeMode && supportsRange ? (
              <div className="space-y-2 md:col-span-2">
                <Label>Rango de Fechas</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarRange className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                            {format(dateRange.to, "dd MMM yyyy", { locale: es })}
                            <span className="ml-auto text-primary font-medium">
                              ({daysInRange} días)
                            </span>
                          </>
                        ) : (
                          format(dateRange.from, "dd MMM yyyy", { locale: es })
                        )
                      ) : (
                        <span>Seleccionar rango de fechas</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={es}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {daysInRange > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Se registrarán <span className="font-semibold text-primary">{daysInRange}</span> días de {
                      shiftType === 'incapacidad' ? 'incapacidad' :
                      shiftType === 'arl' ? 'ARL' :
                      shiftType === 'vacaciones' ? 'vacaciones' :
                      shiftType === 'licencia_remunerada' ? 'licencia remunerada' :
                      'licencia no remunerada'
                    }
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="regularHours">Horas Ordinarias</Label>
              <Input
                id="regularHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={regularHours}
                onChange={(e) => setRegularHours(e.target.value)}
                required
              />
            </div>

            {!RANGE_SHIFT_TYPES.includes(shiftType) && (
              <div className="space-y-2">
                <Label htmlFor="extraHours">Horas Extras</Label>
                <Input
                  id="extraHours"
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={extraHours}
                  onChange={(e) => setExtraHours(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Auto-detected holiday/sunday info */}
          {!useRangeMode && !RANGE_SHIFT_TYPES.includes(shiftType) && isCurrentDateHoliday && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md">
              {currentDateIsSunday ? (
                <Sun className="h-5 w-5 text-amber-600 flex-shrink-0" />
              ) : (
                <PartyPopper className="h-5 w-5 text-amber-600 flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  {currentDateIsSunday ? 'Domingo' : 'Festivo'} - Recargo automático
                </p>
                {holidayName && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">{holidayName}</p>
                )}
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                Auto-detectado
              </Badge>
            </div>
          )}

          {/* Info about auto-detection */}
          {!useRangeMode && !RANGE_SHIFT_TYPES.includes(shiftType) && !isCurrentDateHoliday && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm text-blue-700 dark:text-blue-400">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>Los domingos y festivos colombianos se detectan automáticamente</span>
            </div>
          )}

          {shiftType === 'incapacidad' && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>El porcentaje varía según días consecutivos: 100% (días 1-2), 66.67% (días 3-90), 50% (días 91+)</span>
            </div>
          )}

          {shiftType === 'vacaciones' && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md text-sm text-blue-700 dark:text-blue-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Las vacaciones se calculan con el promedio de los últimos 6 meses dividido entre 30</span>
            </div>
          )}

          {shiftType === 'tarde_pm' && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-md text-sm text-purple-700 dark:text-purple-400">
              <Info className="h-4 w-4 flex-shrink-0" />
              <span>Desde el 25 de diciembre de 2025, las horas de 7pm a 9pm tienen recargo nocturno (Ley 2466)</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Añade cualquier observación sobre este día..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={useRangeMode && (!dateRange?.from || !dateRange?.to)}
            >
              {editingWorkDay ? 'Actualizar' : useRangeMode ? `Guardar ${daysInRange} días` : 'Guardar'}
            </Button>
            {editingWorkDay && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
