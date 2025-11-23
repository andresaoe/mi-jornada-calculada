import { WorkDay } from '@/types/workday';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar } from 'lucide-react';
import { calculateWorkDay, formatCurrency } from '@/lib/salary-calculator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WorkDayListProps {
  workDays: WorkDay[];
  onEdit: (workDay: WorkDay) => void;
  onDelete: (id: string) => void;
}

export default function WorkDayList({ workDays, onEdit, onDelete }: WorkDayListProps) {
  const sortedWorkDays = [...workDays].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getShiftBadge = (shiftType: string) => {
    const variants = {
      diurno_am: 'default',
      tarde_pm: 'secondary',
      trasnocho: 'outline',
      mixto: 'outline',
    };
    return variants[shiftType as keyof typeof variants] || 'default';
  };

  const getShiftLabel = (shiftType: string) => {
    const labels = {
      diurno_am: 'Diurno AM',
      tarde_pm: 'Tarde PM',
      trasnocho: 'Trasnocho',
      mixto: 'Mixto',
    };
    return labels[shiftType as keyof typeof labels] || shiftType;
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Registro de Días Trabajados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {workDays.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay días registrados aún. ¡Comienza agregando tu primer día laboral!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Pago Total</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWorkDays.map((workDay) => {
                  const calculation = calculateWorkDay(workDay);
                  return (
                    <TableRow key={workDay.id}>
                      <TableCell className="font-medium">
                        {(() => {
                          const [year, month, day] = workDay.date.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('es-CO', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          });
                        })()}
                        {workDay.isHoliday && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Festivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getShiftBadge(workDay.shiftType) as any}>
                          {getShiftLabel(workDay.shiftType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {workDay.regularHours}h
                        {workDay.extraHours > 0 && (
                          <span className="text-accent ml-1">
                            +{workDay.extraHours}h
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(calculation.totalPay)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(workDay)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(workDay.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
