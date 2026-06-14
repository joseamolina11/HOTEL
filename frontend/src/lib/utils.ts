import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    disponible: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    ocupada: 'bg-red-500/10 text-red-500 border-red-500/20',
    reservada: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    limpieza: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    mantenimiento: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    pendiente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmada: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    checkin: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    checkout: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    cancelada: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return colors[status.toLowerCase()] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    disponible: 'Disponible',
    ocupada: 'Ocupada',
    reservada: 'Reservada',
    limpieza: 'Limpieza',
    mantenimiento: 'Mantenimiento',
    pendiente: 'Pendiente',
    confirmada: 'Confirmada',
    checkin: 'Check-In',
    checkout: 'Check-Out',
    cancelada: 'Cancelada',
  };
  return labels[status.toLowerCase()] || status;
}
