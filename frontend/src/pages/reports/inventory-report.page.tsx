import { StockReportSection } from './stock-report';
import { inventoryApi } from '@/api/inventory.api';

export function InventoryReportPage() {
  return (
    <div className="space-y-6 print-area">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold">Reporte de Inventario</h1>
      </div>
      <StockReportSection
        title="Reporte de Inventario"
        fileName="reporte-inventario"
        columns={['Producto', 'Categoría', 'Stock Inicial', 'Stock Actual', 'Costo Unitario']}
        withCosto
        fetchFn={() => inventoryApi.getStockReport()}
      />
    </div>
  );
}
