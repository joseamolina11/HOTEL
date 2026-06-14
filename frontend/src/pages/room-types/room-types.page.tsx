import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomTypesApi } from '@/api/room-types.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RoomTypeForm } from '@/components/forms/room-type-form';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { formatCurrency } from '@/lib/utils';
import { Search, Plus, Pencil, Trash2, BedDouble } from 'lucide-react';

export function RoomTypesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ['room-types', search, page],
    queryFn: () => roomTypesApi.findAll({ search, page: String(page), limit: '10' }),
  });
  const roomTypes = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomTypesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['room-types'] }),
  });

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const filtered = roomTypes.filter((rt: any) =>
    rt.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Habitación</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar tipo..." className="pl-10" value={search} onChange={handleSearchChange} />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" /> Nuevo Tipo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Tipo de Habitación' : 'Nuevo Tipo de Habitación'}</DialogTitle>
              </DialogHeader>
              <RoomTypeForm
                key={editing?.id || 'new'}
                initial={editing}
                onSuccess={() => { setOpen(false); setEditing(null); }}
              />
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
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Capacidad</th>
                  <th className="px-4 py-3 text-right font-medium">Precio Base</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin tipos de habitación registrados</td></tr>
                ) : (
                  filtered.map((rt: any) => (
                    <tr key={rt.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: rt.colorIdentificador }} />
                          <span className="font-medium">{rt.nombre}</span>
                        </div>
                        {rt.descripcion && (
                          <p className="text-xs text-muted-foreground mt-0.5">{rt.descripcion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">{rt.capacidadAdultos} Adultos / {rt.capacidadNinos} Niños</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(rt.precioBase)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={rt.activo ? 'success' : 'destructive'}>
                          {rt.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(rt); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(rt.id)}>
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
    </div>
  );
}
