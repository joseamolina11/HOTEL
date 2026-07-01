import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentMethodsApi } from '@/api/payment-methods.api';
import { financialAccountsApi } from '@/api/financial-accounts.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Check, X, Landmark } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';

const TIPO_OPTIONS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otros', label: 'Otros' },
];

export function PaymentMethodsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', financialAccountId: '', tipo: 'otros' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods', page],
    queryFn: () => paymentMethodsApi.findAll({ page: String(page), limit: '100' }),
  });

  const { data: accounts } = useQuery({
    queryKey: ['financial-accounts-active'],
    queryFn: () => financialAccountsApi.findAllActive(),
  });

  const createMut = useMutation({
    mutationFn: (dto: any) => paymentMethodsApi.create(dto),
    onSuccess: () => { toastSuccess('Método de pago creado'); closeDialog(); qc.invalidateQueries({ queryKey: ['payment-methods'] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => paymentMethodsApi.update(id, dto),
    onSuccess: () => { toastSuccess('Método de pago actualizado'); closeDialog(); qc.invalidateQueries({ queryKey: ['payment-methods'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => paymentMethodsApi.remove(id),
    onSuccess: () => { toastSuccess('Método de pago eliminado'); qc.invalidateQueries({ queryKey: ['payment-methods'] }); },
  });

  const openCreate = () => { setEditing(null); setForm({ nombre: '', descripcion: '', financialAccountId: '', tipo: 'otros' }); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ nombre: item.nombre, descripcion: item.descripcion || '', financialAccountId: item.financialAccountId || '', tipo: item.tipo || 'otros' }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ nombre: '', descripcion: '', financialAccountId: '', tipo: 'otros' }); };

  const handleSubmit = () => {
    if (!form.nombre) return;
    const dto: any = { nombre: form.nombre, descripcion: form.descripcion, tipo: form.tipo };
    if (form.financialAccountId) dto.financialAccountId = form.financialAccountId;
    if (editing) updateMut.mutate({ id: editing.id, dto });
    else createMut.mutate(dto);
  };

  const handleDelete = async (id: string) => {
    const result = await confirmAction('Eliminar', '¿Eliminar este método de pago?');
    if (result.isConfirmed) deleteMut.mutate(id);
  };

  const methods = (data as any)?.data?.data || [];
  const totalPages = (data as any)?.data?.totalPages || 1;

  const filtered = methods.filter((m: any) => !search || m.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Métodos de Pago</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Método</Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Cuenta Financiera</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin métodos de pago</td></tr>
                ) : filtered.map((m: any) => (
                  <tr key={m.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{m.nombre}</td>
                    <td className="px-4 py-3"><Badge variant="outline">{TIPO_OPTIONS.find(t => t.value === m.tipo)?.label || m.tipo}</Badge></td>
                    <td className="px-4 py-3">
                      {m.financialAccount ? (
                        <span className="flex items-center gap-1 text-muted-foreground"><Landmark className="h-3 w-3" /> {m.financialAccount.nombre}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.activo ? <Badge variant="default"><Check className="h-3 w-3 mr-1" /> Activo</Badge> : <Badge variant="secondary"><X className="h-3 w-3 mr-1" /> Inactivo</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nuevo'} Método de Pago</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Nequi, Efectivo, Tarjeta" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo (reportes)</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                {TIPO_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Cuenta Financiera (destino del dinero)</label>
              <select value={form.financialAccountId} onChange={(e) => setForm({ ...form, financialAccountId: e.target.value })} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                <option value="">Sin cuenta asociada</option>
                {(accounts || []).map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nombre} ({a.tipo})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
            </div>
            <Button onClick={handleSubmit} disabled={!form.nombre || createMut.isPending || updateMut.isPending} className="w-full">
              {editing ? 'Actualizar' : 'Crear'} Método de Pago
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
