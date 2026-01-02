import { WorkDay } from '@/types/workday';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, FileSpreadsheet } from 'lucide-react';
import { calculateWorkDay, formatCurrency } from '@/lib/salary-calculator';
import { isSunday } from '@/lib/colombian-labor-law';
import * as XLSX from 'xlsx';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
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
  allWorkDays?: WorkDay[];
  onEdit: (workDay: WorkDay) => void;
  onDelete: (id: string) => void;
  baseSalary?: number;
}

export default function WorkDayList({ workDays, allWorkDays, onEdit, onDelete, baseSalary = 2416500 }: WorkDayListProps) {
  const { toast } = useToast();
  const sortedWorkDays = [...workDays].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getShiftBadge = (shiftType: string) => {
    const variants = {
      diurno_am: 'default',
      tarde_pm: 'secondary',
      trasnocho: 'outline',
      incapacidad: 'destructive',
      arl: 'destructive',
      vacaciones: 'default',
      licencia_remunerada: 'secondary',
      licencia_no_remunerada: 'outline',
    };
    return variants[shiftType as keyof typeof variants] || 'default';
  };

  const getShiftLabel = (shiftType: string) => {
    const labels = {
      diurno_am: 'Diurno AM',
      tarde_pm: 'Tarde PM',
      trasnocho: 'Trasnocho',
      incapacidad: 'Incapacidad',
      arl: 'ARL',
      vacaciones: 'Vacaciones',
      licencia_remunerada: 'Lic. Remunerada',
      licencia_no_remunerada: 'Lic. No Remunerada',
    };
    return labels[shiftType as keyof typeof labels] || shiftType;
  };

  const exportToExcel = async () => {
    try {
      const allDays = allWorkDays || workDays;
      const data = sortedWorkDays.map((workDay) => {
        const calculation = calculateWorkDay(workDay, baseSalary, allDays);
        const [year, month, day] = workDay.date.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        return {
          Fecha: date.toLocaleDateString('es-CO', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }),
          Turno: getShiftLabel(workDay.shiftType),
          'Horas Ordinarias': workDay.regularHours,
          'Horas Extras': workDay.extraHours,
          'Festivo': workDay.isHoliday ? 'Sí' : 'No',
          'Pago Ordinario': calculation.regularPay,
          'Recargo Nocturno': calculation.nightSurcharge,
          'Recargo Festivo': calculation.holidaySurcharge,
          'Pago Horas Extras': calculation.extraHoursPay,
          'Pago Total': calculation.totalPay,
          'Notas': workDay.notes || '',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Días Trabajados');
      
      const fileName = `dias_trabajados_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Check if running on native mobile platform
      if (Capacitor.isNativePlatform()) {
        // Generate binary data for mobile
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
        
        // Save to device storage
        await Filesystem.writeFile({
          path: fileName,
          data: wbout,
          directory: Directory.Documents,
        });

        toast({
          title: "Excel exportado",
          description: `Archivo guardado en Documentos/${fileName}`,
        });
      } else {
        // Use standard download for web
        XLSX.writeFile(workbook, fileName);
        
        toast({
          title: "Excel exportado",
          description: "El archivo se ha descargado correctamente.",
        });
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "No se pudo exportar el archivo Excel.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registro de Días Trabajados
          </div>
          {workDays.length > 0 && (
            <Button
              onClick={exportToExcel}
              className="bg-[#1D6F42] hover:bg-[#155c37] text-white"
              size="sm"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar a Excel
            </Button>
          )}
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
                  const allDays = allWorkDays || workDays;
                  const calculation = calculateWorkDay(workDay, baseSalary, allDays);
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
                            {isSunday(workDay.date) ? 'Dominical' : 'Festivo'}
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
