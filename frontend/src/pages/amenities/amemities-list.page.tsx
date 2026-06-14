import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { amenityApi } from '@/api/amenity.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AmenityForm } from '@/components/forms/amenity-form';
import { Badge } from '@/components/ui/badge';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';

export function AmemitiesListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['amenities', search, page],
    queryFn: () => amenityApi.findAll(search, page),
  });
  const amenities = response?.data?.data || [];
  const totalPages = response?.data?.totalPages || 1;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => amenityApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['amenities'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Amenidades / Beneficios</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar amenidad..." className="pl-10" value={search} onChange={handleSearchChange} />
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4" /> Nueva Amenidad</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar Amenidad' : 'Nueva Amenidad'}</DialogTitle>
              </DialogHeader>
              <AmenityForm
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
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : amenities.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Sin amenidades registradas</td></tr>
                ) : (
                  amenities.map((a: any) => (
                    <tr key={a.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{a.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{a.descripcion || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
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
