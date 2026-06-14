import { SupplyCategory } from '../../modules/supplies/entities/supply-category.entity';
import { DataSource } from 'typeorm';

export async function seedSupplyCategories(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(SupplyCategory);

  const existing = await repo.count();
  if (existing > 0) return;

  const categories = repo.create([
    { nombre: 'Limpieza', descripcion: 'Productos de limpieza para habitaciones y áreas comunes' },
    { nombre: 'Aseo Personal', descripcion: 'Artículos de aseo personal para huéspedes' },
    { nombre: 'Blanquería', descripcion: 'Ropa de cama, toallas, uniformes' },
    { nombre: 'Cocina', descripcion: 'Utensilios e insumos de cocina' },
    { nombre: 'Mantenimiento', descripcion: 'Herramientas y materiales de mantenimiento' },
    { nombre: 'Oficina', descripcion: 'Papelería y artículos de oficina' },
    { nombre: 'Otro', descripcion: 'Insumos misceláneos' },
  ]);

  await repo.save(categories);
  console.log('✅ Categorías de suministros creadas');
}
