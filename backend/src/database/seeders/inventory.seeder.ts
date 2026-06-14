import { InventoryItem } from '../../modules/inventory/entities/inventory-item.entity';
import { InventoryCategory } from '../../modules/inventory/entities/inventory-category.entity';
import { DataSource } from 'typeorm';

export async function seedInventory(dataSource: DataSource): Promise<void> {
  const itemRepo = dataSource.getRepository(InventoryItem);
  const catRepo = dataSource.getRepository(InventoryCategory);

  const existing = await itemRepo.count();
  if (existing > 0) return;

  const cats = await catRepo.find();
  const catMap = new Map(cats.map((c) => [c.nombre, c.id]));

  const items = itemRepo.create([
    { nombre: 'Agua mineral 500ml', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 100, stockMinimo: 20, costoUnitario: 15, precioVenta: 30, activo: true },
    { nombre: 'Agua mineral 1L', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 60, stockMinimo: 15, costoUnitario: 25, precioVenta: 50, activo: true },
    { nombre: 'Coca Cola 355ml', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 80, stockMinimo: 20, costoUnitario: 20, precioVenta: 40, activo: true },
    { nombre: 'Sprite 355ml', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 50, stockMinimo: 15, costoUnitario: 20, precioVenta: 40, activo: true },
    { nombre: 'Cerveza Corona 355ml', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 40, stockMinimo: 10, costoUnitario: 30, precioVenta: 60, activo: true },
    { nombre: 'Cerveza Modelo 355ml', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 35, stockMinimo: 10, costoUnitario: 30, precioVenta: 60, activo: true },
    { nombre: 'Jugo de naranja', categoria: 'Bebidas', categoryId: catMap.get('Bebidas'), stockActual: 30, stockMinimo: 10, costoUnitario: 35, precioVenta: 70, activo: true },

    { nombre: 'Papas fritas', categoria: 'Snacks', categoryId: catMap.get('Snacks'), stockActual: 40, stockMinimo: 10, costoUnitario: 18, precioVenta: 35, activo: true },
    { nombre: 'Cacahuates', categoria: 'Snacks', categoryId: catMap.get('Snacks'), stockActual: 30, stockMinimo: 10, costoUnitario: 20, precioVenta: 40, activo: true },
    { nombre: 'Chocolate barra', categoria: 'Snacks', categoryId: catMap.get('Snacks'), stockActual: 25, stockMinimo: 5, costoUnitario: 25, precioVenta: 50, activo: true },
    { nombre: 'Galletas surtidas', categoria: 'Snacks', categoryId: catMap.get('Snacks'), stockActual: 20, stockMinimo: 5, costoUnitario: 22, precioVenta: 45, activo: true },

    { nombre: 'Shampoo', categoria: 'Kit de aseo', categoryId: catMap.get('Kit de aseo'), stockActual: 30, stockMinimo: 10, costoUnitario: 12, precioVenta: 25, activo: true },
    { nombre: 'Jabón de baño', categoria: 'Kit de aseo', categoryId: catMap.get('Kit de aseo'), stockActual: 40, stockMinimo: 15, costoUnitario: 8, precioVenta: 18, activo: true },
    { nombre: 'Papel higiénico (pack)', categoria: 'Kit de aseo', categoryId: catMap.get('Kit de aseo'), stockActual: 50, stockMinimo: 20, costoUnitario: 15, precioVenta: 30, activo: true },
    { nombre: 'Cepillo dental', categoria: 'Kit de aseo', categoryId: catMap.get('Kit de aseo'), stockActual: 25, stockMinimo: 10, costoUnitario: 10, precioVenta: 20, activo: true },
    { nombre: 'Toalla de mano', categoria: 'Ropa blanca', categoryId: catMap.get('Ropa blanca'), stockActual: 20, stockMinimo: 10, costoUnitario: 0, precioVenta: 0, activo: true },
    { nombre: 'Sábana individual', categoria: 'Ropa blanca', categoryId: catMap.get('Ropa blanca'), stockActual: 30, stockMinimo: 10, costoUnitario: 0, precioVenta: 0, activo: true },
  ]);

  await itemRepo.save(items);
  console.log('✅ Inventario creado');
}
