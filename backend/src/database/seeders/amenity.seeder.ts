import { Amenity } from '../../modules/amenities/entities/amenity.entity';
import { DataSource } from 'typeorm';

export async function seedAmenities(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Amenity);

  const existing = await repo.count();
  if (existing > 0) return;

  const amenities = repo.create([
    { nombre: 'WiFi', descripcion: 'Internet de alta velocidad' },
    { nombre: 'Aire acondicionado', descripcion: 'Clima controlado' },
    { nombre: 'TV', descripcion: 'Televisor de pantalla plana' },
    { nombre: 'Netflix', descripcion: 'Acceso a Netflix' },
    { nombre: 'Minibar', descripcion: 'Minibar con snacks y bebidas' },
    { nombre: 'Caja fuerte', descripcion: 'Caja fuerte digital' },
    { nombre: 'Balcón', descripcion: 'Balcón privado' },
    { nombre: 'Vista al mar', descripcion: 'Habitación con vista al mar' },
    { nombre: 'Jacuzzi', descripcion: 'Jacuzzi privado' },
    { nombre: 'Cocina', descripcion: 'Cocina equipada' },
    { nombre: 'Estacionamiento', descripcion: 'Estacionamiento gratuito' },
    { nombre: 'Desayuno', descripcion: 'Desayuno incluido' },
  ]);

  await repo.save(amenities);
  console.log('✅ Amenidades creadas');
}
