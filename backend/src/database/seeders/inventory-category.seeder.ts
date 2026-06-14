import { InventoryCategory } from '../../modules/inventory/entities/inventory-category.entity';
import { DataSource } from 'typeorm';

export async function seedInventoryCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(InventoryCategory);

  const existing = await repo.count();
  if (existing > 0) return;

  const categories = repo.create([
    { nombre: 'Bebidas', descripcion: 'Aguas, refrescos, cervezas, jugos' },
    { nombre: 'Snacks', descripcion: 'Papas, cacahuates, chocolates, galletas' },
    { nombre: 'Alimentos', descripcion: 'Comidas empaquetadas y preparadas' },
    { nombre: 'Kit de aseo', descripcion: 'Shampoo, jabón, papel higiénico, cepillos' },
    { nombre: 'Ropa blanca', descripcion: 'Toallas, sábanas, cobijas' },
    { nombre: 'Limpieza', descripcion: 'Productos de limpieza en general' },
    { nombre: 'Otro', descripcion: 'Productos misceláneos' },
  ]);

  await repo.save(categories);
  console.log('✅ Categorías de inventario creadas');
}
