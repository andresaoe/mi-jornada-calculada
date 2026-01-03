// src/lib/pdf-generator.ts
import jsPDF from 'jspdf';
import { PayrollCalculation } from './payroll-calculator';
import { formatCurrency } from './salary-calculator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PayStubData {
  payroll: PayrollCalculation;
  employeeName: string;
  employeeEmail: string;
  month: string;
  year: number;
}

export function generatePayStubPDF(data: PayStubData): void {
  const doc = new jsPDF();
  const { payroll, employeeName, employeeEmail, month, year } = data;
  
  // Colors
  const primaryColor: [number, number, number] = [34, 197, 94]; // green-500
  const textColor: [number, number, number] = [31, 41, 55]; // gray-800
  const mutedColor: [number, number, number] = [107, 114, 128]; // gray-500
  
  let yPos = 20;
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DESPRENDIBLE DE NÓMINA', 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${month} ${year}`, 105, 28, { align: 'center' });
  
  yPos = 50;
  
  // Employee Info
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL EMPLEADO', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nombre: ${employeeName || 'No especificado'}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${employeeEmail || 'No especificado'}`, 20, yPos);
  yPos += 6;
  doc.text(`Salario Base: ${formatCurrency(payroll.baseSalary)}`, 20, yPos);
  yPos += 6;
  doc.text(`Fecha de Generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 20, yPos);
  
  yPos += 15;
  
  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, 190, yPos);
  yPos += 10;
  
  // Ingresos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('INGRESOS', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  const earnings = [
    ['Pago Ordinario', formatCurrency(payroll.regularPay)],
    ['Recargos (Mes Anterior)', formatCurrency(payroll.surcharges)],
  ];
  
  // Add transport allowance if present
  if (payroll.transportAllowance > 0) {
    earnings.push(['Auxilio de Transporte', formatCurrency(payroll.transportAllowance)]);
  }
  
  earnings.forEach(([label, value]) => {
    doc.text(label, 25, yPos);
    doc.text(value, 180, yPos, { align: 'right' });
    yPos += 6;
  });
  
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEVENGADO', 25, yPos);
  doc.text(formatCurrency(payroll.totalEarnings), 180, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Deducciones
  doc.setFontSize(12);
  doc.setTextColor(239, 68, 68); // red-500
  doc.text('DEDUCCIONES', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  
  const deductions = [
    ['Salud (4%)', formatCurrency(payroll.healthDeduction)],
    ['Pensión (4%)', formatCurrency(payroll.pensionDeduction)],
  ];
  
  // Add FSP if present
  if (payroll.fspDeduction > 0) {
    deductions.push(['Fondo Solidaridad Pensional', formatCurrency(payroll.fspDeduction)]);
  }
  
  // Add withholding tax if present
  if (payroll.withholdingTax > 0) {
    deductions.push(['Retención en la Fuente', formatCurrency(payroll.withholdingTax)]);
  }
  
  deductions.forEach(([label, value]) => {
    doc.text(label, 25, yPos);
    doc.text(`-${value}`, 180, yPos, { align: 'right' });
    yPos += 6;
  });
  
  yPos += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEDUCCIONES', 25, yPos);
  doc.setTextColor(239, 68, 68);
  doc.text(`-${formatCurrency(payroll.totalDeductions)}`, 180, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Provisiones
  doc.setTextColor(245, 158, 11); // amber-500
  doc.setFontSize(12);
  doc.text('PROVISIONES (Informativo)', 20, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...mutedColor);
  
  const provisions = [
    ['Prima de Servicios (8.33%)', formatCurrency(payroll.primaProvision)],
    ['Cesantías (8.33%)', formatCurrency(payroll.cesantiasProvision)],
    ['Intereses Cesantías (12%)', formatCurrency(payroll.cesantiasInterest)],
    ['Vacaciones (4.17%)', formatCurrency(payroll.vacacionesProvision)],
  ];
  
  provisions.forEach(([label, value]) => {
    doc.text(label, 25, yPos);
    doc.text(value, 180, yPos, { align: 'right' });
    yPos += 6;
  });
  
  yPos += 15;
  
  // Net Pay Box
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(20, yPos, 170, 25, 3, 3, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NETO A RECIBIR', 30, yPos + 10);
  doc.setFontSize(18);
  doc.text(formatCurrency(payroll.netPay), 180, yPos + 16, { align: 'right' });
  
  yPos += 40;
  
  // Footer
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Este documento es un comprobante de nómina generado automáticamente.', 105, yPos, { align: 'center' });
  doc.text('Control de Nómina Personal - Desarrollado por Andres Osorio', 105, yPos + 5, { align: 'center' });
  
  // Save
  doc.save(`Desprendible_${month}_${year}.pdf`);
}

export function generateAnnualReportPDF(
  employeeName: string,
  year: number,
  monthlyData: Array<{
    month: string;
    earnings: number;
    deductions: number;
    netPay: number;
    provisions: number;
  }>
): void {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [59, 130, 246]; // blue-500
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE ANUAL DE NÓMINA', 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Año ${year}`, 105, 28, { align: 'center' });
  
  let yPos = 50;
  
  // Employee Info
  doc.setTextColor(...textColor);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Empleado: ${employeeName || 'No especificado'}`, 20, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, 20, yPos);
  
  yPos += 15;
  
  // Table Header
  doc.setFillColor(243, 244, 246); // gray-100
  doc.rect(15, yPos - 5, 180, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MES', 20, yPos);
  doc.text('DEVENGADO', 70, yPos, { align: 'right' });
  doc.text('DEDUCCIONES', 105, yPos, { align: 'right' });
  doc.text('PROVISIONES', 145, yPos, { align: 'right' });
  doc.text('NETO', 185, yPos, { align: 'right' });
  
  yPos += 10;
  
  // Table Rows
  doc.setFont('helvetica', 'normal');
  let totalEarnings = 0;
  let totalDeductions = 0;
  let totalProvisions = 0;
  let totalNet = 0;
  
  monthlyData.forEach((data, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, 180, 8, 'F');
    }
    
    doc.setTextColor(...textColor);
    doc.text(data.month, 20, yPos);
    doc.text(formatCurrency(data.earnings), 70, yPos, { align: 'right' });
    doc.setTextColor(239, 68, 68);
    doc.text(formatCurrency(data.deductions), 105, yPos, { align: 'right' });
    doc.setTextColor(245, 158, 11);
    doc.text(formatCurrency(data.provisions), 145, yPos, { align: 'right' });
    doc.setTextColor(34, 197, 94);
    doc.text(formatCurrency(data.netPay), 185, yPos, { align: 'right' });
    
    totalEarnings += data.earnings;
    totalDeductions += data.deductions;
    totalProvisions += data.provisions;
    totalNet += data.netPay;
    
    yPos += 8;
  });
  
  // Totals
  yPos += 5;
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPos - 5, 180, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTALES', 20, yPos + 2);
  doc.text(formatCurrency(totalEarnings), 70, yPos + 2, { align: 'right' });
  doc.text(formatCurrency(totalDeductions), 105, yPos + 2, { align: 'right' });
  doc.text(formatCurrency(totalProvisions), 145, yPos + 2, { align: 'right' });
  doc.text(formatCurrency(totalNet), 185, yPos + 2, { align: 'right' });
  
  yPos += 25;
  
  // Summary Cards
  const summaryY = yPos;
  const cardWidth = 42;
  const cardHeight = 30;
  
  // Earnings Card
  doc.setFillColor(220, 252, 231); // green-100
  doc.roundedRect(15, summaryY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(8);
  doc.text('Total Devengado', 15 + cardWidth/2, summaryY + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalEarnings), 15 + cardWidth/2, summaryY + 20, { align: 'center' });
  
  // Deductions Card
  doc.setFillColor(254, 226, 226); // red-100
  doc.roundedRect(60, summaryY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setTextColor(220, 38, 38);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Deducciones', 60 + cardWidth/2, summaryY + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalDeductions), 60 + cardWidth/2, summaryY + 20, { align: 'center' });
  
  // Provisions Card
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(105, summaryY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Provisiones', 105 + cardWidth/2, summaryY + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalProvisions), 105 + cardWidth/2, summaryY + 20, { align: 'center' });
  
  // Net Card
  doc.setFillColor(219, 234, 254); // blue-100
  doc.roundedRect(150, summaryY, cardWidth, cardHeight, 2, 2, 'F');
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Total Neto', 150 + cardWidth/2, summaryY + 8, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalNet), 150 + cardWidth/2, summaryY + 20, { align: 'center' });
  
  // Footer
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Control de Nómina Personal - Desarrollado por Andres Osorio', 105, 285, { align: 'center' });
  
  doc.save(`Reporte_Anual_${year}.pdf`);
}
