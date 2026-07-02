import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { guestsApi } from '@/api/guests.api';
import { CreateGuestDialog } from '@/components/dialogs/create-guest-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, X } from 'lucide-react';

interface GuestSearchProps {
  onSelect: (guestId: string) => void;
}

export function GuestSearch({ onSelect }: GuestSearchProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; nombres: string; apellidos: string; documento: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: guestsResponse } = useQuery({
    queryKey: ['guests', query],
    queryFn: () => guestsApi.findAll(query),
    enabled: query.length > 0,
  });

  const guests = guestsResponse?.data?.data || [];

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
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Buscar por nombre o documento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="text-center">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(true)} className="w-full">
              <UserPlus className="mr-1 h-3 w-3" /> Crear nuevo cliente
            </Button>
          </div>
        </>
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

      <CreateGuestDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={(guest) => {
          setSelected({ id: guest.id, nombres: guest.nombres, apellidos: guest.apellidos, documento: guest.documento });
          onSelect(guest.id);
        }}
      />
    </div>
  );
}
