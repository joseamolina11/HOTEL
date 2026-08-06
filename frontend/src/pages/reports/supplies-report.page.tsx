import { StockReportSection } from './stock-report';
import { suppliesApi } from '@/api/supplies.api';

export function SuppliesReportPage() {
  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Reporte de Suministros</h1>
      </div>
      <StockReportSection
        title="Reporte de Suministros"
        fileName="reporte-suministros"
        columns={['Suministro', 'Categoría', 'Proveedor', 'Unidad', 'Stock Inicial', 'Stock Actual', 'Costo Unitario']}
        withProveedor
        withUnidad
        withCosto
        fetchFn={() => suppliesApi.getStockReport()}
      />
    </div>
  );
}
