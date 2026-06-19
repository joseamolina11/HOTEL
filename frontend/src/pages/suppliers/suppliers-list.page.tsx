import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/api/suppliers.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { filesApi } from '@/api/files.api';
import { Plus, Pencil, Trash2, Search, FileText, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { confirmAction, toastSuccess } from '@/lib/notifications';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SupplierDetailDialog } from '@/components/dialogs/supplier-detail-dialog';

const schema = z.object({
  razonSocial: z.string().min(1, 'Razón social requerida'),
  nit: z.string().min(1, 'NIT/RUT requerido'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
  direccion: z.string().optional(),
});

export function SuppliersListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [rutFileId, setRutFileId] = useState<string | null>(null);
  const [rutFileName, setRutFileName] = useState<string | null>(null);
  const [uploadingRut, setUploadingRut] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: () => suppliersApi.findAll(search, page),
  });
  const suppliers = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const createMut = useMutation({
    mutationFn: (dto: any) => suppliersApi.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toastSuccess('Proveedor creado'); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => suppliersApi.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toastSuccess('Proveedor actualizado'); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toastSuccess('Proveedor eliminado'); },
  });

  const uploadRut = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRut(true);
    try {
      const result = await filesApi.upload(file, 'proveedores');
      setRutFileId(result.id);
      setRutFileName(result.originalName);
      toastSuccess('RUT subido');
    } finally {
      setUploadingRut(false);
    }
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, dto: { ...data, rutFileId: rutFileId || undefined } });
    } else {
      await createMut.mutateAsync({ ...data, rutFileId: rutFileId || undefined });
    }
    setOpen(false);
    setEditing(null);
    reset();
  };

  const openEdit = (sup: any) => {
    setEditing(sup);
    reset({
      razonSocial: sup.razonSocial,
      nit: sup.nit,
      contacto: sup.contacto || '',
      telefono: sup.telefono || '',
      email: sup.email || '',
      direccion: sup.direccion || '',
    });
    setRutFileId(sup.rutFileId || null);
    setRutFileName(null);
    setOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ razonSocial: '', nit: '', contacto: '', telefono: '', email: '', direccion: '' });
    setRutFileId(null);
    setRutFileName(null);
    setOpen(true);
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proveedores</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar proveedor..." className="pl-10" value={search} onChange={handleSearchChange} />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); reset(); } }}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Razón Social</label>
                    <Input {...register('razonSocial')} placeholder="Nombre de la empresa" />
                    {errors.razonSocial && <p className="text-xs text-destructive">{errors.razonSocial.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">NIT/RUT</label>
                    <Input {...register('nit')} placeholder="901.123.456-7" />
                    {errors.nit && <p className="text-xs text-destructive">{errors.nit.message as string}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contacto</label>
                    <Input {...register('contacto')} placeholder="Nombre del contacto" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input {...register('telefono')} placeholder="+57 300 123 4567" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input {...register('email')} type="email" placeholder="proveedor@email.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dirección</label>
                  <Input {...register('direccion')} placeholder="Dirección completa" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">RUT / Documento Legal</label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" disabled={uploadingRut} className="relative">
                      {uploadingRut ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                      {uploadingRut ? 'Subiendo...' : 'Subir RUT'}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={uploadRut} accept=".pdf,.jpg,.png,.jpeg" />
                    </Button>
                    {(rutFileName || (editing && editing.rutUrl)) && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" /> {rutFileName || 'RUT'}
                        {editing?.rutUrl && (
                          <a href={editing.rutUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 ml-2">
                            Ver <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMut.isPending || updateMut.isPending}>
                  {editing ? 'Actualizar' : 'Crear'} Proveedor
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
                  <th className="px-4 py-3 text-left font-medium">Razón Social</th>
                  <th className="px-4 py-3 text-left font-medium">NIT/RUT</th>
                  <th className="px-4 py-3 text-left font-medium">Contacto</th>
                  <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium">RUT</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : suppliers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Sin proveedores registrados</td></tr>
                ) : (
                  suppliers.map((s: any) => (
                    <tr key={s.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">
                        <button className="text-primary hover:underline cursor-pointer" onClick={() => setDetailId(s.id)}>
                          {s.razonSocial}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.nit}</td>
                      <td className="px-4 py-3">{s.contacto || '—'}</td>
                      <td className="px-4 py-3">{s.telefono || '—'}</td>
                      <td className="px-4 py-3">
                        {s.rutUrl ? (
                          <a href={s.rutUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <FileText className="h-4 w-4" /> Ver RUT
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={s.activo ? 'default' : 'secondary'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={async () => { const r = await confirmAction('¿Eliminar proveedor?', 'Esta acción no se puede deshacer'); if (r.isConfirmed) deleteMut.mutate(s.id); }}>
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

      <SupplierDetailDialog supplierId={detailId} open={!!detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
