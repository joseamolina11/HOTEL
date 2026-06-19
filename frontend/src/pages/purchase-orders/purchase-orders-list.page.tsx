import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/api/purchase-orders.api';
import { suppliersApi } from '@/api/suppliers.api';
import { inventoryApi } from '@/api/inventory.api';
import { servicesApi } from '@/api/services.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Plus, Pencil, Trash2, Search, X, PlusCircle } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';
import { SupplierDetailDialog } from '@/components/dialogs/supplier-detail-dialog';

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  borrador: 'secondary',
  aprobada: 'default',
  recibida: 'outline',
  anulada: 'destructive',
};

const itemSchema = z.object({
  tipo: z.string().optional().default('texto'),
  inventoryItemId: z.string().optional(),
  serviceId: z.string().optional(),
  descripcion: z.string().min(1, 'Requerido'),
  cantidad: z.coerce.number().min(1, 'Mín 1'),
  precioUnitario: z.coerce.number().min(0, 'Mín 0'),
});

const schema = z.object({
  supplierId: z.string().min(1, 'Proveedor requerido'),
  fecha: z.string().min(1, 'Fecha requerida'),
  observaciones: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Agrega al menos un item'),
});

export function PurchaseOrdersListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [supplierDetailId, setSupplierDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['purchase-orders', { search, estado: statusFilter, page }],
    queryFn: () => purchaseOrdersApi.findAll({ search, estado: statusFilter, page: String(page) }),
  });
  const orders = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => purchaseOrdersApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); toastSuccess('Orden creada'); },
  });
  const updateStatusMut = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) => purchaseOrdersApi.updateStatus(id, estado),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); toastSuccess('Estado actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchase-orders'] }); },
  });

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { supplierId: '', fecha: new Date().toISOString().slice(0, 10), observaciones: '', items: [{ tipo: 'texto', inventoryItemId: '', serviceId: '', descripcion: '', cantidad: 1, precioUnitario: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');

  const calcSubtotal = () => {
    if (!items) return 0;
    return items.reduce((sum, item: any) => sum + (Number(item.cantidad) * Number(item.precioUnitario)), 0);
  };
  const subtotal = calcSubtotal();
  const impuestos = subtotal * 0.19;
  const total = subtotal + impuestos;

  const onSubmit = async (data: any) => {
    const dto = {
      ...data,
      items: data.items.map((i: any) => ({ inventoryItemId: i.inventoryItemId || undefined, serviceId: i.serviceId || undefined, descripcion: i.descripcion, cantidad: Number(i.cantidad), precioUnitario: Number(i.precioUnitario) })),
    };
    await createMut.mutateAsync(dto);
    setOpen(false);
    reset();
  };

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'borrador', label: 'Borrador' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'recibida', label: 'Recibida' },
    { value: 'anulada', label: 'Anulada' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
        <div className="flex items-center gap-4">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={statusOptions} className="w-44" />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
              <Button onClick={() => reset()}><Plus className="mr-2 h-4 w-4" /> Nueva Orden</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nueva Orden de Compra</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="text-sm font-medium">Fecha</label>
                    <Input type="date" {...register('fecha')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Detalle de Productos/Servicios</label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ tipo: 'texto', inventoryItemId: '', serviceId: '', descripcion: '', cantidad: 1, precioUnitario: 0 })}>
                      <PlusCircle className="mr-1 h-3 w-3" /> Agregar Item
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
                      <div className="w-40 space-y-1">
                        <span className="text-xs text-muted-foreground">Tipo</span>
                        <select
                          {...register(`items.${index}.tipo`)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue(`items.${index}.tipo`, val);
                            if (val === 'producto') {
                              setValue(`items.${index}.inventoryItemId`, '');
                              setValue(`items.${index}.serviceId`, '');
                              setValue(`items.${index}.descripcion`, '');
                            } else if (val === 'servicio') {
                              setValue(`items.${index}.inventoryItemId`, '');
                              setValue(`items.${index}.serviceId`, '');
                              setValue(`items.${index}.descripcion`, '');
                            } else {
                              setValue(`items.${index}.inventoryItemId`, '');
                              setValue(`items.${index}.serviceId`, '');
                            }
                          }}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        >
                          <option value="texto">Texto libre</option>
                          <option value="producto">Producto</option>
                          <option value="servicio">Servicio</option>
                        </select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-xs text-muted-foreground">Descripción</span>
                        {watch(`items.${index}.tipo`) === 'producto' ? (
                          <SearchableSelect
                            value={watch(`items.${index}.inventoryItemId`)}
                            onChange={async (val) => {
                              setValue(`items.${index}.inventoryItemId`, val);
                              if (val) {
                                try {
                                  const product = await inventoryApi.findOne(val);
                                  setValue(`items.${index}.descripcion`, product.nombre);
                                  setValue(`items.${index}.precioUnitario`, Number(product.costoUnitario));
                                } catch {}
                              }
                            }}
                            searchFn={(q) => inventoryApi.searchProducts(q)}
                            placeholder="Seleccionar producto..."
                          />
                        ) : watch(`items.${index}.tipo`) === 'servicio' ? (
                          <SearchableSelect
                            value={watch(`items.${index}.serviceId`)}
                            onChange={async (val) => {
                              setValue(`items.${index}.serviceId`, val);
                              if (val) {
                                try {
                                  const service = await servicesApi.findOne(val);
                                  setValue(`items.${index}.descripcion`, service.nombre);
                                  setValue(`items.${index}.precioUnitario`, Number(service.precio));
                                } catch {}
                              }
                            }}
                            searchFn={(q) => servicesApi.search(q)}
                            placeholder="Seleccionar servicio..."
                          />
                        ) : (
                          <input {...register(`items.${index}.descripcion`)} placeholder="Descripción" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                        )}
                      </div>
                      <div className="w-24 space-y-1">
                        <span className="text-xs text-muted-foreground">Cantidad</span>
                        <input type="number" {...register(`items.${index}.cantidad`)} min={1} placeholder="Cant" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                      </div>
                      <div className="w-28 space-y-1">
                        <span className="text-xs text-muted-foreground">Precio Unit.</span>
                        <input type="number" step="0.01" {...register(`items.${index}.precioUnitario`)} min={0} placeholder="Precio" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mt-1" onClick={() => fields.length > 1 && remove(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span>Impuestos (19%):</span><span>{formatCurrency(impuestos)}</span></div>
                  <div className="flex justify-between font-semibold"><span>Total:</span><span>{formatCurrency(total)}</span></div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Observaciones</label>
                  <Input {...register('observaciones')} placeholder="Opcional" />
                </div>

                <Button type="submit" className="w-full" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creando...' : 'Crear Orden de Compra'}
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
              <caption className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Lista de órdenes de compra</caption>
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Código</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin órdenes registradas</td></tr>
                ) : (
                  orders.map((o: any) => (
                    <tr key={o.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{o.codigo}</td>
                      <td className="px-4 py-3">
                        {o.supplier ? (
                          <button className="text-primary hover:underline cursor-pointer" onClick={() => setSupplierDetailId(o.supplierId)}>
                            {o.supplier.razonSocial}
                          </button>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{o.fecha}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(o.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={statusColors[o.estado] || 'secondary'} className="capitalize">{o.estado}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {o.estado === 'borrador' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => updateStatusMut.mutate({ id: o.id, estado: 'aprobada' })}>
                                Aprobar
                              </Button>
                              <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar orden?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(o.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {o.estado === 'aprobada' && (
                            <Button variant="ghost" size="sm" onClick={() => updateStatusMut.mutate({ id: o.id, estado: 'recibida' })}>
                              Recibir
                            </Button>
                          )}
                          {(o.estado === 'borrador' || o.estado === 'aprobada') && (
                            <Button variant="ghost" size="sm" onClick={async () => { const r = await confirmAction('¿Anular orden?', '¿Estás seguro?'); if (r.isConfirmed) updateStatusMut.mutate({ id: o.id, estado: 'anulada' }); }}>
                              Anular
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
    </div>
  );
}
