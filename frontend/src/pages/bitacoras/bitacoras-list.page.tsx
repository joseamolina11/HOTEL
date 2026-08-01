import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bitacorasApi } from '@/api/bitacoras.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, Send, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toastSuccess } from '@/lib/notifications';
import { formatDateShort } from '@/lib/utils';

export function BitacorasListPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [nuevoContenido, setNuevoContenido] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['bitacoras', { page, fechaDesde, fechaHasta }],
    queryFn: () => bitacorasApi.findAll({ page, fechaDesde: fechaDesde || undefined, fechaHasta: fechaHasta || undefined, limit: '20' } as any),
    placeholderData: (prev) => prev,
  });

  const createMut = useMutation({
    mutationFn: (contenido: string) => bitacorasApi.create(contenido),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bitacoras'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toastSuccess('Bitácora creada');
      setShowCreate(false);
      setNuevoContenido('');
    },
  });

  const items = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" /> Bitácoras
        </h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Bitácora
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={fechaDesde} onChange={(e) => { setFechaDesde(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={fechaHasta} onChange={(e) => { setFechaHasta(e.target.value); setPage(1); }} />
        </div>
        {(fechaDesde || fechaHasta) && (
          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={() => { setFechaDesde(''); setFechaHasta(''); setPage(1); }}>
              Limpiar
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">Cargando...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-muted-foreground">Sin bitácoras</div>
          ) : (
            <div className="divide-y">
              {items.map((item: any) => (
                <div key={item.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {item.createdBy?.nombres} {item.createdBy?.apellidos}
                    </span>
                    <span>{formatDateShort(item.createdAt)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{item.contenido}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={(v) => { if (!v) { setShowCreate(false); setNuevoContenido(''); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Bitácora</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Escribe el contenido de la bitácora..."
              rows={5}
              value={nuevoContenido}
              onChange={(e) => setNuevoContenido(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!nuevoContenido.trim() || createMut.isPending}
              onClick={() => createMut.mutate(nuevoContenido.trim())}
            >
              {createMut.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Publicar</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
