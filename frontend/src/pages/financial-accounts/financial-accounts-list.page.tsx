import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialAccountsApi } from '@/api/financial-accounts.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Landmark, Wallet, Building2, PiggyBank } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { formatCurrency } from '@/lib/utils';

const TIPO_OPTIONS = [
  { value: 'caja_principal', label: 'Caja Principal' },
  { value: 'caja_menor', label: 'Caja Menor' },
  { value: 'banco', label: 'Banco' },
  { value: 'billetera_digital', label: 'Billetera Digital' },
];

const TIPO_ICONS: Record<string, any> = {
  caja_principal: Landmark,
  caja_menor: Wallet,
  banco: Building2,
  billetera_digital: PiggyBank,
};

const TIPO_BADGE: Record<string, 'default' | 'secondary' | 'outline' | 'destructive' | 'warning'> = {
  caja_principal: 'default',
  caja_menor: 'warning',
  banco: 'secondary',
  billetera_digital: 'outline',
};

export function FinancialAccountsListPage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'caja_principal', saldoInicial: 0, descripcion: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['financial-accounts', page],
    queryFn: () => financialAccountsApi.findAll({ page: String(page), limit: '100' }),
  });

  const createMut = useMutation({
    mutationFn: (dto: any) => financialAccountsApi.create(dto),
    onSuccess: () => { toastSuccess('Cuenta creada'); closeDialog(); qc.invalidateQueries({ queryKey: ['financial-accounts'] }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => financialAccountsApi.update(id, dto),
    onSuccess: () => { toastSuccess('Cuenta actualizada'); closeDialog(); qc.invalidateQueries({ queryKey: ['financial-accounts'] }); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => financialAccountsApi.remove(id),
    onSuccess: () => { toastSuccess('Cuenta eliminada'); qc.invalidateQueries({ queryKey: ['financial-accounts'] }); },
  });

  const openCreate = () => { setEditing(null); setForm({ nombre: '', tipo: 'caja_principal', saldoInicial: 0, descripcion: '' }); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ nombre: item.nombre, tipo: item.tipo, saldoInicial: Number(item.saldo), descripcion: item.descripcion || '' }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); setForm({ nombre: '', tipo: 'caja_principal', saldoInicial: 0, descripcion: '' }); };

  const handleSubmit = () => {
    if (!form.nombre) return;
    if (editing) updateMut.mutate({ id: editing.id, dto: form });
    else createMut.mutate(form);
  };

  const handleDelete = async (id: string) => {
    const result = await confirmAction('Eliminar', '¿Eliminar esta cuenta financiera?');
    if (result.isConfirmed) deleteMut.mutate(id);
  };

  const accounts = (data as any)?.data?.data || [];
  const totalPages = (data as any)?.data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cuentas Financieras</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nueva Cuenta</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['caja_principal', 'caja_menor', 'banco', 'billetera_digital'].map((tipo) => {
          const Icon = TIPO_ICONS[tipo];
          const label = TIPO_OPTIONS.find(o => o.value === tipo)?.label || tipo;
          const total = accounts.filter((a: any) => a.tipo === tipo && a.activo).reduce((sum: number, a: any) => sum + Number(a.saldo), 0);
          return (
            <Card key={tipo} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4" /> {label}
                </div>
                <p className="text-xl font-bold mt-1">{formatCurrency(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Saldo</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : accounts.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin cuentas financieras</td></tr>
                ) : accounts.map((a: any) => {
                  const TipoIcon = TIPO_ICONS[a.tipo] || Landmark;
                  return (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{a.nombre}</td>
                      <td className="px-4 py-3">
                        <Badge variant={TIPO_BADGE[a.tipo] || 'outline'}>
                          <TipoIcon className="h-3 w-3 mr-1" /> {TIPO_OPTIONS.find(o => o.value === a.tipo)?.label || a.tipo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(a.saldo)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={a.activo ? 'default' : 'secondary'}>{a.activo ? 'Activa' : 'Inactiva'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <PaginationBar page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nueva'} Cuenta Financiera</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nombre</label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Caja Principal" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} options={TIPO_OPTIONS} />
            </div>
            <div>
              <label className="text-sm font-medium">{editing ? 'Saldo Actual' : 'Saldo Inicial'}</label>
              <Input type="number" step="0.01" min={0} value={form.saldoInicial} onChange={(e) => setForm({ ...form, saldoInicial: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
            </div>
            <Button onClick={handleSubmit} disabled={!form.nombre || createMut.isPending || updateMut.isPending} className="w-full">
              {editing ? 'Actualizar' : 'Crear'} Cuenta
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
