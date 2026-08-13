import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationsApi } from '@/api/reservations.api';
import { checkoutApi } from '@/api/checkout.api';
import { filesApi } from '@/api/files.api';
import { reciboCajaApi } from '@/api/recibo-caja.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { guestsApi } from '@/api/guests.api';
import apiClient from '@/api/client';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { ReservationForm } from '@/components/forms/reservation-form';
import { ChangeRoomDialog } from '@/components/forms/change-room-dialog';
import { ReciboCajaDetailDialog } from '@/components/dialogs/recibo-caja-detail-dialog';
import { ReservationDetailDialog } from '@/components/dialogs/reservation-detail-dialog';
import { AbonoDialog } from '@/components/dialogs/abono-dialog';
import { Search, Plus, Pencil, Eye, XCircle, CheckCircle, Loader2, Printer, ChevronLeft, ChevronRight, FileText, ExternalLink, Upload, Receipt, DollarSign, ArrowRightLeft, HandCoins } from 'lucide-react';
import { formatDateShort, formatCurrency } from '@/lib/utils';
import { useUpdateReservation, useCancelReservation, useConfirmReservation } from '@/hooks/useReservations';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { printReceipt } from '@/components/checkout/receipt-ticket';
import { useAuthStore } from '@/stores/auth.store';
import Swal from 'sweetalert2';

interface EditReservationForm {
  fechaEntrada: string;
  fechaSalida: string;
  observaciones: string;
  estado: string;
  direccion: string;
  ciudad: string;
  pais: string;
  oficio: string;
  empresa: string;
  telefonoContacto: string;
  emailContacto: string;
  transporteLlegada: string;
  transporteSalida: string;
  reservacionOrigen: string;
  procedencia: string;
  destino: string;
  motivoViaje: string;
  tipoAcomodacion: string;
  numeroPlaca: string;
}

export function ReservationsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [detailRes, setDetailRes] = useState<any>(null);
  const [fullDetailRes, setFullDetailRes] = useState<any>(null);
  const [reciboDetailId, setReciboDetailId] = useState<string | null>(null);
  const [changeRoomRes, setChangeRoomRes] = useState<any>(null);
  const [abonoRes, setAbonoRes] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [uploadingContract, setUploadingContract] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [guestResults, setGuestResults] = useState<any[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const contractMut = useMutation({
    mutationFn: ({ id, contratoFileId }: { id: string; contratoFileId: string }) =>
      apiClient.put(`/reservations/${id}/contract`, { contratoFileId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] });
      toastSuccess('Contrato asignado a la reserva');
    },
  });

  const uploadContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !detailRes) return;
    setUploadingContract(true);
    try {
      const result = await filesApi.upload(file, 'contratos');
      await contractMut.mutateAsync({ id: detailRes.id, contratoFileId: result.id });
      setDetailRes((prev: any) => ({
        ...prev,
        contratoFile: { ...result, url: `/uploads/contratos/${result.fileName}` },
        contratoFileId: result.id,
      }));
    } finally {
      setUploadingContract(false);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', { search, estado: statusFilter, page }],
    queryFn: () => reservationsApi.findAll({ search, estado: statusFilter, page: String(page), limit: '10' }),
    placeholderData: (prev) => prev,
  });
  console.log('Reservations data:', data);

  const reservations = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;

  const { data: reciboData } = useQuery({
    queryKey: ['recibo-by-reservation', detailRes?.id],
    queryFn: () => reciboCajaApi.findByReservation(detailRes!.id),
    enabled: !!detailRes && detailRes.estado === 'checkout',
  });
  const reciboVinculado = reciboData?.recibo;

  const updateMut = useUpdateReservation();
  const cancelMut = useCancelReservation();
  const confirmMut = useConfirmReservation();

  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; motivo: string; reembolsoMonto: number; reembolsoMetodoPagoId: string }>({ open: false, motivo: '', reembolsoMonto: 0, reembolsoMetodoPagoId: '' });

  const { data: paymentMethods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });

  const { register, handleSubmit, reset } = useForm<EditReservationForm>({
    defaultValues: {
      fechaEntrada: '',
      fechaSalida: '',
      observaciones: '',
      estado: '',
      direccion: '',
      ciudad: '',
      pais: '',
      oficio: '',
      empresa: '',
      telefonoContacto: '',
      emailContacto: '',
      transporteLlegada: '',
      transporteSalida: '',
      reservacionOrigen: '',
      procedencia: '',
      destino: '',
      motivoViaje: '',
      tipoAcomodacion: 'multiple',
      numeroPlaca: '',
    },
  });

  const openDetail = (res: any) => {
    setDetailRes(res);
    setSelectedGuestId(res.guestId || '');
    setGuestSearch('');
    setGuestResults([]);
    reset({
      fechaEntrada: res.fechaEntrada?.slice(0, 10) || '',
      fechaSalida: res.fechaSalida?.slice(0, 10) || '',
      observaciones: res.observaciones || '',
      estado: res.estado || '',
      direccion: res.direccion || '',
      ciudad: res.ciudad || '',
      pais: res.pais || '',
      oficio: res.oficio || '',
      empresa: res.empresa || '',
      telefonoContacto: res.telefonoContacto || '',
      emailContacto: res.emailContacto || '',
      transporteLlegada: res.transporteLlegada || '',
      transporteSalida: res.transporteSalida || '',
      reservacionOrigen: res.reservacionOrigen || '',
      procedencia: res.procedencia || '',
      destino: res.destino || '',
      motivoViaje: res.motivoViaje || '',
      tipoAcomodacion: res.tipoAcomodacion || 'multiple',
      numeroPlaca: res.numeroPlaca || '',
    });
  };

  const searchGuests = async (q: string) => {
    if (!q.trim()) {
      setGuestResults([]);
      return;
    }
    const res = await guestsApi.findAll(q, 1);
    setGuestResults(res?.data?.data || []);
  };

  const onSubmitEdit = async (formData: EditReservationForm) => {
    if (!detailRes) return;
    const dto: any = {
      fechaEntrada: formData.fechaEntrada || undefined,
      fechaSalida: formData.fechaSalida || undefined,
      observaciones: formData.observaciones || undefined,
    };

    const estadoChanged = isAdmin && formData.estado && formData.estado !== detailRes.estado;
    const result = await Swal.fire({
      title: '¿Guardar los cambios de la reserva?',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.8">
          <div><strong>Reserva:</strong> ${detailRes.codigo}</div>
          ${estadoChanged ? `<div><strong>Estado:</strong> ${detailRes.estado} → ${formData.estado}</div>` : ''}
          <div style="margin-top:6px;color:#6b7280">Esta acción no se puede revertir.</div>
        </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;

    if (estadoChanged) {
      dto.estado = formData.estado;
    }
    if (selectedGuestId && selectedGuestId !== detailRes.guestId) {
      dto.guestId = selectedGuestId;
    }
    [
      'direccion', 'ciudad', 'pais', 'oficio', 'empresa', 'telefonoContacto',
      'emailContacto', 'transporteLlegada', 'transporteSalida', 'reservacionOrigen',
      'procedencia', 'destino', 'motivoViaje', 'tipoAcomodacion', 'numeroPlaca',
    ].forEach((field) => {
      if ((formData as any)[field]) dto[field] = (formData as any)[field];
    });
    await updateMut.mutateAsync({
      id: detailRes.id,
      dto,
    });
    qc.invalidateQueries({ queryKey: ['reservations'] });
    setDetailRes(null);
  };

  const handleCancel = () => {
    if (!detailRes) return;
    setCancelDialog({ open: true, motivo: '', reembolsoMonto: 0, reembolsoMetodoPagoId: '' });
  };

  const handleCancelConfirm = async () => {
    if (!detailRes) return;
    const id = detailRes.id;
    setDetailRes(null);
    setCancelDialog((prev) => ({ ...prev, open: false }));
    const dto: any = {};
    if (cancelDialog.motivo) dto.motivo = cancelDialog.motivo;
    if (cancelDialog.reembolsoMonto > 0 && cancelDialog.reembolsoMetodoPagoId) {
      dto.reembolsoMonto = cancelDialog.reembolsoMonto;
      dto.reembolsoMetodoPagoId = cancelDialog.reembolsoMetodoPagoId;
    }
    await cancelMut.mutateAsync({ id, ...dto });
  };

  const handleConfirm = async () => {
    if (!detailRes) return;
    const result = await confirmAction('¿Confirmar reserva?', `Se confirmará la reserva ${detailRes.codigo}.`);
    if (!result.isConfirmed) return;
    await confirmMut.mutateAsync(detailRes.id);
    setDetailRes(null);
  };

  const handlePrint = async () => {
    if (!detailRes) return;
    setLoadingReceipt(true);
    try {
      const summary = await checkoutApi.getStaySummary(detailRes.id);
      printReceipt({ hotelConfig: summary.hotelConfig, reservation: summary.reservation, summary: summary.summary });
    } catch {
      const config = await (await import('@/api/hotel-config.api')).hotelConfigApi.getConfig();
      const hotelConfig = { nombre: config.nombre, direccion: config.direccion, ciudad: config.ciudad, pais: config.pais, telefono: config.telefono, email: config.email, logo: config.logo };
      printReceipt({
        hotelConfig,
        reservation: detailRes,
        summary: {
          noches: 0, precioPorNoche: 0, totalHabitacion: 0,
          consumos: [], totalConsumos: 0,
          pedidos: [], totalPedidos: 0,
          surcharges: [], totalRecargos: 0,
          descuento: 0,
          payments: [], totalPagado: 0,
          totalEstancia: 0, saldoPendiente: 0,
        },
      });
    }
    setLoadingReceipt(false);
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservas</h1>
        {/* <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Reserva
        </Button> */}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
          </DialogHeader>
          <ReservationForm
            onSuccess={() => {
              setOpen(false);
              qc.invalidateQueries({ queryKey: ['reservations'] });
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, huésped..."
            className="pl-10"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="checkin">Check-In</option>
          <option value="checkout">Check-Out</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Huésped</th>
                  <th className="px-4 py-3 text-left font-medium">Habitación</th>
                  <th className="px-4 py-3 text-left font-medium">Entrada</th>
                  <th className="px-4 py-3 text-left font-medium">Salida</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Origen</th>
                  <th className="px-4 py-3 text-right font-medium">Abonado</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                  <th className="px-4 py-3 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sin reservas</td></tr>
                ) : (
                  reservations?.map((res: any) => (
                    <tr key={res.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{res.codigo}</div>
                        {res.checkinConsecutivo && (
                          <div className="text-xs text-violet-600">Check-in {res.checkinConsecutivo}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">{res.guest?.nombres} {res.guest?.apellidos}</td>
                      <td className="px-4 py-3">{res.room?.nombre}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaEntrada)}</td>
                      <td className="px-4 py-3">{formatDateShort(res.fechaSalida)}</td>
                      <td className="px-4 py-3"><StatusBadge status={res.estado} /></td>
                      <td className="px-4 py-3 capitalize">{res.origen}</td>
                      <td className="px-4 py-3 text-right text-green-600">{formatCurrency(res.resumen?.totalPagado || 0)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${Number(res.resumen?.saldoPendiente) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(res.resumen?.saldoPendiente || 0)}
                        {Number(res.resumen?.totalPedidos) > 0 && (
                          <div className="text-[11px] text-red-500 font-normal">incluye pedidos {formatCurrency(res.resumen.totalPedidos)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setFullDetailRes(res)} title="Ver detalle completo">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAbonoRes(res)}
                            title="Registrar abono"
                            disabled={['cancelada', 'checkout'].includes(res.estado)}
                          >
                            <HandCoins className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDetail(res)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            const { printReservation } = await import('@/lib/print-document');
                            printReservation(res.id);
                          }} title="Imprimir reserva">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => {
                            const { printReservationContract } = await import('@/lib/print-document');
                            printReservationContract(res.id);
                          }} title="Descargar contrato">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages >= 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <Dialog open={!!detailRes} onOpenChange={(v) => !v && setDetailRes(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reserva {detailRes?.codigo}</DialogTitle>
          </DialogHeader>
          {detailRes && (
            <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Habitación:</span> <span className="font-medium">{detailRes.room?.nombre}</span></div>
                <div><span className="text-muted-foreground">Código:</span> <span className="font-medium">{detailRes.codigo}</span></div>
                <div><span className="text-muted-foreground">Check-in:</span> <span className="font-medium text-violet-600">{detailRes.checkinConsecutivo || '—'}</span></div>
                <div><span className="text-muted-foreground">Estado:</span> <StatusBadge status={detailRes.estado} /></div>
                <div><span className="text-muted-foreground">Origen:</span> <span className="font-medium capitalize">{detailRes.origen}</span></div>
                <div><span className="text-muted-foreground">Huéspedes:</span> <span className="font-medium">{detailRes.cantidadHuespedes}</span></div>
                {Number(detailRes.descuento) > 0 && (
                  <div><span className="text-muted-foreground">Descuento:</span> <span className="font-medium text-amber-600">{formatCurrency(detailRes.descuento)}</span></div>
                )}
                {reciboVinculado && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Recibo de Caja: </span>
                    <button className="text-primary hover:underline cursor-pointer font-medium inline-flex items-center gap-1" onClick={() => setReciboDetailId(reciboVinculado.id)}>
                      <Receipt className="h-3 w-3" /> {reciboVinculado.codigo}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Huésped</p>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-52">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Buscar por nombre o documento..."
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => searchGuests(guestSearch)}>
                    Buscar
                  </Button>
                </div>
                {guestResults.length > 0 && (
                  <div className="max-h-44 overflow-y-auto rounded-md border">
                    {guestResults.map((g: any) => (
                      <button
                        type="button"
                        key={g.id}
                        className={`block w-full px-3 py-2 text-left text-sm hover:bg-muted/50 ${selectedGuestId === g.id ? 'bg-primary/10 font-medium' : ''}`}
                        onClick={() => {
                          setSelectedGuestId(g.id);
                          setDetailRes((prev: any) => ({ ...prev, guest: g }));
                          setGuestResults([]);
                          setGuestSearch('');
                        }}
                      >
                        {g.nombres} {g.apellidos} · {g.documento}
                      </button>
                    ))}
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Huésped actual:</span>{' '}
                  <span className="font-medium">
                    {detailRes.guest?.nombres} {detailRes.guest?.apellidos}
                  </span>
                  {detailRes.guest?.documento && (
                    <span className="text-muted-foreground"> · {detailRes.guest.documento}</span>
                  )}
                  {selectedGuestId !== detailRes.guestId && detailRes.guestId && (
                    <span className="ml-2 text-xs font-medium text-primary">
                      Se actualizará al huésped seleccionado
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Fecha Entrada</label>
                  <Input type="date" {...register('fechaEntrada', { required: true })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Fecha Salida</label>
                  <Input type="date" {...register('fechaSalida', { required: true })} />
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-primary">Estado (solo administrador)</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    {...register('estado')}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="checkin">Check-In</option>
                    <option value="checkout">Check-Out</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                  <p className="text-xs text-muted-foreground">Al cambiar de estado se actualiza automáticamente el estado de la habitación.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">Observaciones</label>
                <Input {...register('observaciones')} placeholder="Opcional" />
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Registro Hotelero</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Dirección</label>
                    <Input {...register('direccion')} placeholder="Dirección" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Ciudad</label>
                    <Input {...register('ciudad')} placeholder="Ciudad" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">País</label>
                    <Input {...register('pais')} placeholder="País" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Oficio / Ocupación</label>
                    <Input {...register('oficio')} placeholder="Ej: Ingeniero" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Empresa</label>
                    <Input {...register('empresa')} placeholder="Empresa" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Teléfono contacto</label>
                    <Input {...register('telefonoContacto')} placeholder="Teléfono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Email contacto</label>
                    <Input {...register('emailContacto')} placeholder="Email" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Transporte de llegada</label>
                    <Input {...register('transporteLlegada')} placeholder="Ej: Vehículo propio" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Transporte de salida</label>
                    <Input {...register('transporteSalida')} placeholder="Ej: Vehículo propio" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Reservación origen</label>
                    <Input {...register('reservacionOrigen')} placeholder="Ej: Directo, Booking" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Procedencia</label>
                    <Input {...register('procedencia')} placeholder="Ciudad de procedencia" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Destino</label>
                    <Input {...register('destino')} placeholder="Ciudad de destino" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Motivo de viaje</label>
                    <Input {...register('motivoViaje')} placeholder="Ej: Negocios, Turismo" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Tipo de acomodación</label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      {...register('tipoAcomodacion')}
                    >
                      <option value="individual">Individual</option>
                      <option value="multiple">Múltiple</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Número de placa</label>
                    <Input {...register('numeroPlaca')} placeholder="Placa del vehículo" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Contrato</label>
                {detailRes.contratoFile && (
                  <div className="flex items-center gap-2 rounded-lg border p-3 text-sm mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate">{detailRes.contratoFile.originalName}</span>
                    <a href={detailRes.contratoFile.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Ver <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {detailRes.estado !== 'cancelada' && (
                  <Button type="button" variant="outline" size="sm" disabled={uploadingContract} className="relative">
                    {uploadingContract ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                    {uploadingContract ? 'Subiendo...' : detailRes.contratoFile ? 'Reemplazar Contrato' : 'Subir Contrato'}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={uploadContract} accept=".pdf,.doc,.docx,.jpg,.png" />
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {detailRes.estado === 'pendiente' && (
                    <Button type="button" variant="outline" size="sm" onClick={handleConfirm} disabled={confirmMut.isPending}>
                      {confirmMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                      Confirmar
                    </Button>
                  )}
                  {['pendiente', 'confirmada', 'checkin'].includes(detailRes.estado) && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setChangeRoomRes(detailRes)}>
                      <ArrowRightLeft className="h-4 w-4 mr-1" />
                      Cambiar Hab.
                    </Button>
                  )}
                  {(detailRes.estado === 'pendiente' || detailRes.estado === 'confirmada') && (
                    <Button type="button" variant="destructive" size="sm" onClick={handleCancel} disabled={cancelMut.isPending}>
                      {cancelMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Cancelar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const { printReservation } = await import('@/lib/print-document');
                      printReservation(detailRes.id);
                    }}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Imprimir
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    disabled={loadingReceipt}
                  >
                    {loadingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4 mr-1" />}
                    Recibo
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setDetailRes(null)}>Cerrar</Button>
                  {(detailRes.estado === 'pendiente' || detailRes.estado === 'confirmada' || detailRes.estado === 'checkin' || isAdmin) && (
                    <Button type="submit" size="sm" disabled={updateMut.isPending}>
                      {updateMut.isPending ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={cancelDialog.open} onOpenChange={(v) => !v && setCancelDialog((p) => ({ ...p, open: false }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" /> Cancelar Reserva {detailRes?.codigo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="space-y-1">
              <label className="text-xs font-medium">Motivo (opcional)</label>
              <Input placeholder="Ej. Cancelación por solicitud del huésped" value={cancelDialog.motivo} onChange={(e) => setCancelDialog((p) => ({ ...p, motivo: e.target.value }))} />
            </div>
            <div className="rounded-lg border border-amber-200 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <DollarSign className="h-4 w-4" /> Reembolso (opcional)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs">Monto a devolver</label>
                  <Input type="number" min={0} step="0.01" placeholder="0" value={cancelDialog.reembolsoMonto || ''} onChange={(e) => setCancelDialog((p) => ({ ...p, reembolsoMonto: Number(e.target.value) }))} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs">Método de pago</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={cancelDialog.reembolsoMetodoPagoId}
                    onChange={(e) => setCancelDialog((p) => ({ ...p, reembolsoMetodoPagoId: e.target.value }))}
                  >
                    <option value="">Seleccionar...</option>
                    {(paymentMethods || []).map((pm: any) => (
                      <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1">Volver</Button>
              </DialogClose>
              <Button variant="destructive" className="flex-1" onClick={handleCancelConfirm} disabled={cancelMut.isPending}>
                {cancelMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Confirmar Cancelación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <ChangeRoomDialog
        open={!!changeRoomRes}
        onClose={() => setChangeRoomRes(null)}
        reservation={changeRoomRes ? {
          id: changeRoomRes.id,
          roomId: changeRoomRes.roomId,
          roomNombre: changeRoomRes.room?.nombre,
          fechaEntrada: changeRoomRes.fechaEntrada,
          fechaSalida: changeRoomRes.fechaSalida,
          estado: changeRoomRes.estado,
        } : { id: '', roomId: '', fechaEntrada: '', fechaSalida: '', estado: '' }}
      />
      <ReciboCajaDetailDialog reciboId={reciboDetailId} open={!!reciboDetailId} onClose={() => setReciboDetailId(null)} />
      <ReservationDetailDialog
        reservation={fullDetailRes}
        open={!!fullDetailRes}
        onClose={() => setFullDetailRes(null)}
      />
      <AbonoDialog
        reservation={abonoRes}
        open={!!abonoRes}
        onClose={() => setAbonoRes(null)}
      />
    </div>
  );
}
