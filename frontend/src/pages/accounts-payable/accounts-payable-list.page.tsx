import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsPayableApi } from '@/api/accounts-payable.api';
import { suppliersApi } from '@/api/suppliers.api';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2, Search, DollarSign, History, FileText } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';
import { SupplierDetailDialog } from '@/components/dialogs/supplier-detail-dialog';
import { PurchaseOrderDetailDialog } from '@/components/dialogs/purchase-order-detail-dialog';
import { ExpenseDetailDialog } from '@/components/dialogs/expense-detail-dialog';
import { paymentMethodsApi } from '@/api/payment-methods.api';

const estadoColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive' | 'warning'> = {
  pendiente: 'default',
  parcialmente_pagada: 'warning',
  pagada: 'secondary',
  vencida: 'destructive',
  anulada: 'outline',
};

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  parcialmente_pagada: 'Parcial',
  pagada: 'Pagada',
  vencida: 'Vencida',
  anulada: 'Anulada',
};

const schema = z.object({
  supplierId: z.string().min(1, 'Proveedor requerido'),
  purchaseOrderId: z.string().optional(),
  expenseId: z.string().optional(),
  fechaEmision: z.string().min(1, 'Requerido'),
  fechaVencimiento: z.string().min(1, 'Requerido'),
  montoOriginal: z.coerce.number().min(1, 'Mín 1'),
  observaciones: z.string().optional(),
});

const pagoSchema = z.object({
  monto: z.coerce.number().min(1, 'Mín 1'),
  fechaPago: z.string().min(1, 'Requerido'),
  metodoPagoId: z.string().min(1, 'Requerido'),
  referencia: z.string().optional(),
});

const statusOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'parcialmente_pagada', label: 'Parcialmente Pagada' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'anulada', label: 'Anulada' },
];

export function AccountsPayableListPage() {
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoCuenta, setPagoCuenta] = useState<any>(null);
  const [pagosOpen, setPagosOpen] = useState(false);
  const [pagosCuenta, setPagosCuenta] = useState<any>(null);
  const [supplierDetailId, setSupplierDetailId] = useState<string | null>(null);
  const [poDetailId, setPoDetailId] = useState<string | null>(null);
  const [expenseDetailId, setExpenseDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['accounts-payable', { search, estado: estadoFilter, page }],
    queryFn: () => accountsPayableApi.findAll({ search, estado: estadoFilter, page: String(page) }),
  });
  const cuentas = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => accountsPayableApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts-payable'] }); toastSuccess('Cuenta creada'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => accountsPayableApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts-payable'] }); toastSuccess('Cuenta actualizada'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => accountsPayableApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts-payable'] }); toastSuccess('Cuenta eliminada'); },
  });
  const pagoMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => accountsPayableApi.registerPago(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts-payable'] }); toastSuccess('Pago registrado'); setPagoOpen(false); },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { register: pagoRegister, handleSubmit: pagoHandleSubmit, reset: pagoReset, watch: pagoWatch, setValue: pagoSetValue, formState: { errors: pagoErrors } } = useForm({
    resolver: zodResolver(pagoSchema),
  });

  const onSubmit = async (data: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, dto: data });
    } else {
      await createMut.mutateAsync(data);
    }
    setOpen(false);
    setEditing(null);
    reset();
  };

  const openEdit = (cuenta: any) => {
    setEditing(cuenta);
    reset({
      supplierId: cuenta.supplierId,
      purchaseOrderId: cuenta.purchaseOrderId || '',
      expenseId: cuenta.expenseId || '',
      fechaEmision: cuenta.fechaEmision,
      fechaVencimiento: cuenta.fechaVencimiento,
      montoOriginal: cuenta.montoOriginal,
      observaciones: cuenta.observaciones || '',
    });
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ supplierId: '', purchaseOrderId: undefined, expenseId: undefined, fechaEmision: '', fechaVencimiento: '', montoOriginal: 0, observaciones: '' });
    setOpen(true);
  };

  const openPago = (cuenta: any) => {
    setPagoCuenta(cuenta);
    pagoReset({ monto: Number(cuenta.saldoPendiente), fechaPago: new Date().toISOString().slice(0, 10), metodoPagoId: '', referencia: '' });
    setPagoOpen(true);
  };

  const openPagos = (cuenta: any) => {
    setPagosCuenta(cuenta);
    setPagosOpen(true);
  };

  const onPagoSubmit = async (data: any) => {
    await pagoMut.mutateAsync({ id: pagoCuenta.id, dto: data });
    pagoReset();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuentas por Pagar</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por código..." className="pl-10" value={search} onChange={handleSearchChange} />
        </div>
        <Select value={estadoFilter} onChange={(e) => { setEstadoFilter(e.target.value); setPage(1); }} options={statusOptions} className="w-52" />
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva Cuenta</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Lista de cuentas por pagar</caption>
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">Emisión</th>
                  <th className="px-4 py-3 text-left font-medium">Vencimiento</th>
                  <th className="px-4 py-3 text-right font-medium">Monto Original</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo Pendiente</th>
                  <th className="px-4 py-3 text-left font-medium">O. Compra</th>
                  <th className="px-4 py-3 text-left font-medium">Egreso</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : cuentas.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sin cuentas registradas</td></tr>
                ) : (
                  cuentas.map((c: any) => (
                    <tr key={c.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{c.codigo}</td>
                      <td className="px-4 py-3">
                        {c.supplier ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setSupplierDetailId(c.supplierId)}>
                            {c.supplier.razonSocial}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{c.fechaEmision}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.fechaVencimiento}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.montoOriginal)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.saldoPendiente)}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {c.purchaseOrder ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setPoDetailId(c.purchaseOrderId)}>
                            {c.purchaseOrder.codigo}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {c.sourceExpense ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setExpenseDetailId(c.sourceExpenseId)}>
                            {c.sourceExpense.codigo}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={estadoColors[c.estado] || 'secondary'} className="capitalize">
                          {estadoLabels[c.estado] || c.estado}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {/* {c.estado !== 'pagada' && c.estado !== 'anulada' && (
                            <Button variant="ghost" size="icon" onClick={() => openPago(c)} title="Registrar pago">
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )} */}
                          <Button variant="ghost" size="icon" onClick={() => openPagos(c)} title="Historial de pagos">
                            <History className="h-4 w-4" />
                          </Button>
                          {c.estado !== 'pagada' && c.estado !== 'anulada' && (
                            <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {c.estado !== 'pagada' && (
                            <Button variant="ghost" size="icon" onClick={async () => {
                              const ok = await confirmAction('¿Eliminar cuenta?', 'Esta acción no se puede deshacer');
                              if (ok) deleteMut.mutate(c.id);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <SupplierDetailDialog supplierId={supplierDetailId} open={!!supplierDetailId} onClose={() => setSupplierDetailId(null)} />
      <PurchaseOrderDetailDialog purchaseOrderId={poDetailId} open={!!poDetailId} onClose={() => setPoDetailId(null)} />
      <ExpenseDetailDialog expenseId={expenseDetailId} open={!!expenseDetailId} onClose={() => setExpenseDetailId(null)} />

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cuenta por Pagar' : 'Nueva Cuenta por Pagar'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Proveedor</label>
              <SearchableSelect
                value={watch('supplierId')}
                onChange={(val) => setValue('supplierId', val, { shouldValidate: true })}
                searchFn={(q) => suppliersApi.search(q)}
                placeholder="Seleccionar proveedor..."
              />
              {errors.supplierId && <p className="text-xs text-destructive">{errors.supplierId.message as string}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Orden de Compra</label>
              <SearchableSelect
                value={watch('purchaseOrderId')}
                onChange={async (val) => {
                  setValue('purchaseOrderId', val);
                  if (val) {
                    try {
                      const po = await purchaseOrdersApi.findOne(val);
                      setValue('montoOriginal', Number(po.total), { shouldValidate: true });
                    } catch {}
                  } else {
                    setValue('montoOriginal', 0, { shouldValidate: true });
                  }
                }}
                searchFn={(q) => purchaseOrdersApi.search(q, watch('supplierId'))}
                placeholder="Sin orden de compra"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Emisión</label>
                <Input type="date" {...register('fechaEmision')} />
                {errors.fechaEmision && <p className="text-xs text-destructive">{errors.fechaEmision.message as string}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de Vencimiento</label>
                <Input type="date" {...register('fechaVencimiento')} />
                {errors.fechaVencimiento && <p className="text-xs text-destructive">{errors.fechaVencimiento.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Original</label>
              <Input type="number" step="0.01" {...register('montoOriginal')} placeholder="0.00" disabled={!!watch('purchaseOrderId')} />
              {watch('montoOriginal') > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(Number(watch('montoOriginal')))}</p>
              )}
              {errors.montoOriginal && <p className="text-xs text-destructive">{errors.montoOriginal.message as string}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observaciones</label>
              <Input {...register('observaciones')} placeholder="Opcional" />
            </div>

            <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Guardando...' : editing ? 'Actualizar' : 'Crear Cuenta'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Payment Dialog */}
      <Dialog open={pagoOpen} onOpenChange={(v) => { if (!v) setPagoOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {pagoCuenta && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p><span className="text-muted-foreground">Cuenta: </span>{pagoCuenta.codigo}</p>
                <p><span className="text-muted-foreground">Proveedor: </span>{pagoCuenta.supplier?.razonSocial}</p>
                <p><span className="text-muted-foreground">Saldo pendiente: </span><span className="font-bold">{formatCurrency(pagoCuenta.saldoPendiente)}</span></p>
              </div>
              <form onSubmit={pagoHandleSubmit(onPagoSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Monto</label>
                  <Input type="number" step="0.01" {...pagoRegister('monto')} max={pagoCuenta.saldoPendiente} placeholder="0.00" />
                  {Number(pagoWatch('monto')) > 0 && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(Number(pagoWatch('monto')))}</p>
                  )}
                  {pagoErrors.monto && <p className="text-xs text-destructive">{pagoErrors.monto.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fecha de Pago</label>
                  <Input type="date" {...pagoRegister('fechaPago')} />
                  {pagoErrors.fechaPago && <p className="text-xs text-destructive">{pagoErrors.fechaPago.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Método de Pago</label>
                  <MetodoPagoSelect value={pagoWatch('metodoPagoId') || ''} onChange={(v) => pagoSetValue('metodoPagoId', v)} />
                  {pagoErrors.metodoPagoId && <p className="text-xs text-destructive">{pagoErrors.metodoPagoId.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Referencia</label>
                  <Input {...pagoRegister('referencia')} placeholder="Opcional" />
                </div>
                <Button type="submit" className="w-full" disabled={pagoMut.isPending}>
                  {pagoMut.isPending ? 'Registrando...' : 'Registrar Pago'}
                </Button>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={pagosOpen} onOpenChange={(v) => { if (!v) setPagosOpen(false); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle — {pagosCuenta?.codigo}</DialogTitle>
          </DialogHeader>
          {pagosCuenta && <ApDetailContent cuentaId={pagosCuenta.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PaymentHistoryTable({ cuentaId }: { cuentaId: string }) {
  const { data: pagos, isLoading } = useQuery({
    queryKey: ['pagos-cuenta', cuentaId],
    queryFn: () => accountsPayableApi.getPagos(cuentaId),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <caption className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Pagos registrados</caption>
        <thead>
          <tr className="border-b">
            <th className="px-3 py-2 text-left font-medium">Fecha</th>
            <th className="px-3 py-2 text-right font-medium">Monto</th>
            <th className="px-3 py-2 text-left font-medium">Método</th>
            <th className="px-3 py-2 text-left font-medium">Referencia</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Cargando...</td></tr>
          ) : !pagos || pagos.length === 0 ? (
            <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Sin pagos registrados</td></tr>
          ) : (
            (Array.isArray(pagos) ? pagos : []).map((p: any) => (
              <tr key={p.id} className="border-b">
                <td className="px-3 py-2 text-muted-foreground">{p.fechaPago}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(p.monto)}</td>
                <td className="px-3 py-2">{p.metodoPago?.nombre || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{p.referencia || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetodoPagoSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: methods } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => paymentMethodsApi.findAllActive(),
  });
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
      <option value="">Seleccionar...</option>
      {(methods || []).map((pm: any) => (
        <option key={pm.id} value={pm.id}>{pm.nombre}{pm.financialAccount ? ` (${pm.financialAccount.nombre})` : ''}</option>
      ))}
    </select>
  );
}

function ApDetailContent({ cuentaId }: { cuentaId: string }) {
  const { data: ap, isLoading } = useQuery({
    queryKey: ['accounts-payable-detail', cuentaId],
    queryFn: () => accountsPayableApi.findOne(cuentaId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando detalle...</div>;
  if (!ap) return <div className="text-sm text-destructive">No se pudo cargar el detalle</div>;

  return (
    <>
      <div className="rounded-lg bg-muted p-3 text-sm mb-4">
        <span className="text-muted-foreground">Proveedor: </span>
        <span className="font-medium">{ap.supplier?.razonSocial}</span>
        <span className="ml-4 text-muted-foreground">Saldo: </span>
        <span className="font-bold">{formatCurrency(ap.saldoPendiente)}</span>
        <span className="ml-4 text-muted-foreground">Estado: </span>
        <Badge variant={estadoColors[ap.estado] || 'secondary'} className="capitalize">{estadoLabels[ap.estado] || ap.estado}</Badge>
        {ap.sourceExpense && (
          <>
            <span className="ml-4 text-muted-foreground">Egreso origen: </span>
            <span className="font-medium">{ap.sourceExpense.codigo}</span>
          </>
        )}
      </div>

      {ap.payingExpenses && ap.payingExpenses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Egresos aplicados a esta cuenta</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium">Código</th>
                  <th className="px-3 py-2 text-left font-medium">Concepto</th>
                  <th className="px-3 py-2 text-left font-medium">Fecha</th>
                  <th className="px-3 py-2 text-left font-medium">Método</th>
                  <th className="px-3 py-2 text-right font-medium">Monto</th>
                  <th className="px-3 py-2 text-center font-medium">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {ap.payingExpenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-2 font-mono text-xs">{exp.codigo}</td>
                    <td className="px-3 py-2">{exp.concepto}</td>
                    <td className="px-3 py-2 text-muted-foreground">{exp.fecha}</td>
                    <td className="px-3 py-2">{exp.metodoPago?.nombre || '—'}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(exp.monto)}</td>
                    <td className="px-3 py-2 text-center">{exp.comprobante ? <FileText className="h-3 w-3 inline" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PaymentHistoryTable cuentaId={cuentaId} />
    </>
  );
}
