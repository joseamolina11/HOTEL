import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GuestForm } from '@/components/forms/guest-form';
import { PaginationBar } from '@/components/shared/pagination-bar';
import { Search, Plus, Phone } from 'lucide-react';

export function GuestsListPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['guests', search, page],
    queryFn: () => guestsApi.findAll(search, page),
  });
  const guests = data?.data?.data || [];
  const totalPages = data?.data?.totalPages || 1;

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Huéspedes</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o documento..." className="pl-10" value={search} onChange={handleSearchChange} />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nuevo Huésped</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Huésped</DialogTitle>
              </DialogHeader>
              <GuestForm onSuccess={() => { setOpen(false); refetch(); }} />
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
                  <th className="px-4 py-3 text-left font-medium">Documento</th>
                  <th className="px-4 py-3 text-left font-medium">Nacionalidad</th>
                  <th className="px-4 py-3 text-left font-medium">Contacto</th>
                  <th className="px-4 py-3 text-left font-medium">Estancias</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                ) : guests.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin huéspedes registrados</td></tr>
                ) : (
                  guests.map((guest: any) => (
                    <tr key={guest.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{guest.nombres} {guest.apellidos}</td>
                      <td className="px-4 py-3">{guest.documento}</td>
                      <td className="px-4 py-3">{guest.nacionalidad}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{guest.telefono}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{guest.reservations?.length || 0}</td>
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
