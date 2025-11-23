import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WorkDay, ShiftType } from '@/types/workday';
import { Plus, Edit } from 'lucide-react';

interface WorkDayFormProps {
  onSubmit: (workDay: Omit<WorkDay, 'id' | 'createdAt'>) => void;
  editingWorkDay?: WorkDay | null;
  onCancelEdit?: () => void;
}

export default function WorkDayForm({ onSubmit, editingWorkDay, onCancelEdit }: WorkDayFormProps) {
  const [date, setDate] = useState(editingWorkDay?.date || new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState<ShiftType>(editingWorkDay?.shiftType || 'diurno');
  const [regularHours, setRegularHours] = useState(editingWorkDay?.regularHours.toString() || '8');
  const [extraHours, setExtraHours] = useState(editingWorkDay?.extraHours.toString() || '0');
  const [isHoliday, setIsHoliday] = useState(editingWorkDay?.isHoliday || false);
  const [notes, setNotes] = useState(editingWorkDay?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      shiftType,
      regularHours: parseFloat(regularHours),
      extraHours: parseFloat(extraHours),
      isHoliday,
      notes,
    });
    
    if (!editingWorkDay) {
      // Reset form only if not editing
      setDate(new Date().toISOString().split('T')[0]);
      setShiftType('diurno');
      setRegularHours('8');
      setExtraHours('0');
      setIsHoliday(false);
      setNotes('');
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

            <div className="space-y-2">
              <Label htmlFor="shiftType">Tipo de Turno</Label>
              <Select value={shiftType} onValueChange={(value) => setShiftType(value as ShiftType)}>
                <SelectTrigger id="shiftType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diurno">Diurno</SelectItem>
                  <SelectItem value="nocturno">Nocturno (9pm-5am)</SelectItem>
                  <SelectItem value="mixto">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isHoliday"
              checked={isHoliday}
              onCheckedChange={setIsHoliday}
            />
            <Label htmlFor="isHoliday" className="cursor-pointer">
              Día Festivo o Dominical
            </Label>
          </div>

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
            <Button type="submit" className="flex-1">
              {editingWorkDay ? 'Actualizar' : 'Guardar'}
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
