import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '@/api/suppliers.api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  supplierId: string | null | undefined;
  open: boolean;
  onClose: () => void;
}

export function SupplierDetailDialog({ supplierId, open, onClose }: Props) {
  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier-detail', supplierId],
    queryFn: () => suppliersApi.findOne(supplierId!),
    enabled: !!supplierId && open,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Proveedor</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Cargando...</p>
        ) : supplier ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Razón Social</p>
                <p className="font-medium">{supplier.razonSocial}</p>
              </div>
              <div>
                <p className="text-muted-foreground">NIT</p>
                <p className="font-medium">{supplier.nit}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Contacto</p>
                <p className="font-medium">{supplier.contacto || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Teléfono</p>
                <p className="font-medium">{supplier.telefono || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{supplier.email || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <Badge variant={supplier.activo ? 'default' : 'secondary'}>{supplier.activo ? 'Activo' : 'Inactivo'}</Badge>
              </div>
            </div>
            {supplier.direccion && (
              <div className="text-sm">
                <p className="text-muted-foreground">Dirección</p>
                <p className="font-medium">{supplier.direccion}</p>
              </div>
            )}
            {supplier.rutUrl && (
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">RUT</p>
                <Button variant="outline" size="sm" asChild>
                  <a href={supplier.rutUrl} target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-1 h-4 w-4" /> Ver RUT <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Proveedor no encontrado</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
