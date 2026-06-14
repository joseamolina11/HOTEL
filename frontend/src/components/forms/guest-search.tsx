import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Loader2, Check, X } from 'lucide-react';

interface GuestSearchProps {
  onSelect: (guestId: string) => void;
}

export function GuestSearch({ onSelect }: GuestSearchProps) {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; nombres: string; apellidos: string; documento: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newGuest, setNewGuest] = useState({ nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '', email: '' });

  const { data: guestsResponse } = useQuery({
    queryKey: ['guests', query],
    queryFn: () => guestsApi.findAll(query),
    enabled: query.length > 0,
  });

  const guests = guestsResponse?.data?.data || [];

  const createGuestMut = useMutation({
    mutationFn: (dto: any) => guestsApi.create(dto),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['guests'] });
      setSelected({ id: data.id, nombres: data.nombres, apellidos: data.apellidos, documento: data.documento });
      setShowNew(false);
      setNewGuest({ nombres: '', apellidos: '', documento: '', nacionalidad: '', telefono: '', email: '' });
      setQuery('');
      onSelect(data.id);
    },
  });

  const handleSelect = (g: any) => {
    setSelected({ id: g.id, nombres: g.nombres, apellidos: g.apellidos, documento: g.documento });
    setQuery('');
    onSelect(g.id);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onSelect('');
  };

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{selected.nombres} {selected.apellidos}</p>
            <p className="text-xs text-muted-foreground">{selected.documento}</p>
          </div>
          <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre o documento..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      )}

      {query && guests && guests.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border">
          {guests.slice(0, 8).map((g: any) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleSelect(g)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent border-b last:border-0"
            >
              <span className="font-medium">{g.nombres} {g.apellidos}</span>
              <span className="text-muted-foreground">{g.documento}</span>
            </button>
          ))}
        </div>
      )}

      {!showNew && !selected && (
        <div className="text-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setShowNew(true)} className="w-full">
            <UserPlus className="mr-1 h-3 w-3" /> Crear nuevo huésped
          </Button>
        </div>
      )}

      {showNew && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-xs font-medium text-muted-foreground">Nuevo huésped</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Nombres *" value={newGuest.nombres} onChange={(e) => setNewGuest((p) => ({ ...p, nombres: e.target.value }))} />
            <Input placeholder="Apellidos *" value={newGuest.apellidos} onChange={(e) => setNewGuest((p) => ({ ...p, apellidos: e.target.value }))} />
            <Input placeholder="Documento *" value={newGuest.documento} onChange={(e) => setNewGuest((p) => ({ ...p, documento: e.target.value }))} />
            <Input placeholder="Nacionalidad *" value={newGuest.nacionalidad} onChange={(e) => setNewGuest((p) => ({ ...p, nacionalidad: e.target.value }))} />
            <Input placeholder="Teléfono" value={newGuest.telefono} onChange={(e) => setNewGuest((p) => ({ ...p, telefono: e.target.value }))} />
            <Input placeholder="Email" value={newGuest.email} onChange={(e) => setNewGuest((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={createGuestMut.isPending || !newGuest.nombres || !newGuest.apellidos || !newGuest.documento || !newGuest.nacionalidad}
              onClick={() => createGuestMut.mutate(newGuest)}
            >
              {createGuestMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Crear y seleccionar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
