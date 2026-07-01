import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '@/api/expenses.api';
import { expenseCategoriesApi } from '@/api/expense-categories.api';
import { suppliersApi } from '@/api/suppliers.api';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { accountsPayableApi } from '@/api/accounts-payable.api';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { filesApi } from '@/api/files.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2, Search, FileText, ExternalLink, Upload, Loader2, Link2, Eye } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';
import { SupplierDetailDialog } from '@/components/dialogs/supplier-detail-dialog';
import { PurchaseOrderDetailDialog } from '@/components/dialogs/purchase-order-detail-dialog';

  const schema = z.object({
    categoryId: z.string().min(1, 'Categoría requerida'),
    supplierId: z.string().optional(),
    fecha: z.string().min(1, 'Fecha requerida'),
    concepto: z.string().min(1, 'Concepto requerido'),
    metodoPagoId: z.string().min(1, 'Método de pago requerido'),
    referencia: z.string().optional(),
    monto: z.coerce.number().min(1, 'Monto requerido'),
    observaciones: z.string().optional(),
    purchaseOrderId: z.string().optional(),
    accountsPayableId: z.string().optional(),
  });

export function ExpensesListPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [contratoFileId, setContratoFileId] = useState<string | null>(null);
  const [contratoFileName, setContratoFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [supplierDetailId, setSupplierDetailId] = useState<string | null>(null);
  const [poDetailId, setPoDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['expenses', { search, categoryId: categoryFilter, page }],
    queryFn: () => expensesApi.findAll({ search, categoryId: categoryFilter, page: String(page) }),
  });
  const expenses = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const { data: categories } = useQuery({
    queryKey: ['expense-categories-all'],
    queryFn: () => expenseCategoriesApi.findAllActive(),
  });
  const createMut = useMutation({
    mutationFn: (dto: any) => expensesApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toastSuccess('Egreso creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => expensesApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toastSuccess('Egreso actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); toastSuccess('Egreso eliminado'); },
  });

  const uploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await filesApi.upload(file, 'comprobantes');
      setContratoFileId(result.id);
      setContratoFileName(result.originalName);
      toastSuccess('Comprobante subido');
    } finally {
      setUploading(false);
    }
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const { data: pendingAPs } = useQuery({
    queryKey: ['accounts-payable-by-supplier', watch('supplierId')],
    queryFn: () => accountsPayableApi.findBySupplier(watch('supplierId') || ''),
    enabled: !!watch('supplierId'),
  });

  const onSubmit = async (data: any) => {
    const dto = {
      ...data,
      supplierId: data.supplierId || undefined,
      purchaseOrderId: data.purchaseOrderId || undefined,
      accountsPayableId: data.accountsPayableId || undefined,
      comprobante: contratoFileId || undefined,
    };
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, dto });
    } else {
      await createMut.mutateAsync(dto);
    }
    setOpen(false);
    setEditing(null);
    reset();
    setContratoFileId(null);
    setContratoFileName(null);
  };

  const openEdit = (exp: any) => {
    setEditing(exp);
    reset({
      categoryId: exp.categoryId,
      supplierId: exp.supplierId || '',
      fecha: exp.fecha,
      concepto: exp.concepto,
      metodoPagoId: exp.metodoPagoId || '',
      referencia: exp.referencia || '',
      monto: exp.monto,
      observaciones: exp.observaciones || '',
      purchaseOrderId: exp.purchaseOrderId || '',
      accountsPayableId: exp.accountsPayableId || '',
    });
    setContratoFileId(exp.comprobante || null);
    setContratoFileName(null);
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({
      categoryId: '',
      supplierId: '',
      fecha: new Date().toISOString().slice(0, 10),
      concepto: '',
      metodoPagoId: '',
      referencia: '',
      monto: 0,
      observaciones: '',
      purchaseOrderId: '',
      accountsPayableId: '',
    });
    setContratoFileId(null);
    setContratoFileName(null);
    setOpen(true);
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Egresos</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar egreso..." className="pl-10" value={search} onChange={handleSearchChange} />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'Todas las categorías' }, ...(categories || []).map((c: any) => ({ value: c.id, label: c.nombre }))]}
            className="w-52"
          />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset(); setContratoFileId(null); setContratoFileName(null); } }}>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Egreso</Button>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Egreso' : 'Nuevo Egreso'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha</label>
                    <Input type="date" {...register('fecha')} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monto</label>
                    <Input type="number" step="0.01" {...register('monto')} placeholder="0.00" />
                    {errors.monto && <p className="text-xs text-destructive">{errors.monto.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría</label>
                  <SearchableSelect
                    value={watch('categoryId')}
                    onChange={(val) => setValue('categoryId', val, { shouldValidate: true })}
                    searchFn={(q) => expenseCategoriesApi.search(q)}
                    placeholder="Seleccionar categoría..."
                  />
                  {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message as string}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Concepto</label>
                  <Input {...register('concepto')} placeholder="Descripción del egreso" />
                  {errors.concepto && <p className="text-xs text-destructive">{errors.concepto.message as string}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Proveedor</label>
                    <SearchableSelect
                      value={watch('supplierId')}
                      onChange={(val) => setValue('supplierId', val)}
                      searchFn={(q) => suppliersApi.search(q)}
                      placeholder="Sin proveedor"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Método de Pago</label>
                    <MetodoPagoSelect value={watch('metodoPagoId') || ''} onChange={(v) => setValue('metodoPagoId', v, { shouldValidate: true })} />
                    {errors.metodoPagoId && <p className="text-xs text-destructive">{errors.metodoPagoId.message as string}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Referencia</label>
                  <Input {...register('referencia')} placeholder="N° factura, recibo, etc." />
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
                          setValue('monto', Number(po.total), { shouldValidate: true });
                        } catch {}
                      }
                    }}
                    searchFn={(q) => purchaseOrdersApi.search(q)}
                    placeholder="Sin orden de compra"
                  />
                </div>

                {watch('supplierId') && pendingAPs?.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Pagar Cuenta por Pagar (opcional)</label>
                    <select
                      value={watch('accountsPayableId') || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setValue('accountsPayableId', val);
                        const ap = pendingAPs.find((a: any) => a.id === val);
                        if (ap) {
                          setValue('monto', Number(ap.saldoPendiente), { shouldValidate: true });
                          setValue('concepto', `Pago ${ap.codigo} - ${ap.observaciones || ap.concepto || ''}`, { shouldValidate: true });
                        }
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    >
                      <option value="">Sin cuenta asociada</option>
                      {pendingAPs.map((ap: any) => (
                        <option key={ap.id} value={ap.id}>
                          {ap.codigo} - ${Number(ap.saldoPendiente).toLocaleString()} ({ap.estado === 'parcialmente_pagada' ? 'Parcial' : 'Pendiente'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Observaciones</label>
                  <Input {...register('observaciones')} placeholder="Opcional" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comprobante</label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} className="relative">
                      {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                      {uploading ? 'Subiendo...' : 'Subir Comprobante'}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={uploadComprobante} accept=".pdf,.jpg,.png,.jpeg" />
                    </Button>
                    {(contratoFileName || (editing && editing.comprobante)) && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" /> {contratoFileName || 'Archivo adjunto'}
                      </span>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Actualizar' : 'Crear'} Egreso
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium">Concepto</th>
                  <th className="px-4 py-3 text-left font-medium">Categoría</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">O. Compra</th>
                  <th className="px-4 py-3 text-left font-medium">Método Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Monto</th>
                  <th className="px-4 py-3 text-center font-medium">Comp.</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">Sin egresos registrados</td></tr>
                ) : (
                  expenses.map((e: any) => (
                    <tr key={e.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{e.codigo}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                      <td className="px-4 py-3 font-medium">{e.concepto}</td>
                      <td className="px-4 py-3">{e.category?.nombre || '—'}</td>
                       <td className="px-4 py-3">
                        {e.supplier ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setSupplierDetailId(e.supplierId)}>
                            {e.supplier.razonSocial}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {e.purchaseOrder ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setPoDetailId(e.purchaseOrderId)}>
                            {e.purchaseOrder.codigo}
                          </button>
                        ) : '—'}
                       </td> 
                      <td className="px-4 py-3">{e.metodoPago?.nombre || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.monto)}</td>
                      <td className="px-4 py-3 text-center">
                        {e.comprobante ? (
                          <a href={`/uploads/comprobantes/${e.comprobante}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar egreso?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(e.id); }}>
                            <Trash2 className="h-4 w-4" />
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
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <SupplierDetailDialog supplierId={supplierDetailId} open={!!supplierDetailId} onClose={() => setSupplierDetailId(null)} />
      <PurchaseOrderDetailDialog purchaseOrderId={poDetailId} open={!!poDetailId} onClose={() => setPoDetailId(null)} />
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
