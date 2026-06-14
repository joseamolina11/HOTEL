import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/auth/entities/user.entity';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(User);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('⚠️  Usuarios ya existen, omitiendo seeder');
    return;
  }

  const password = await bcrypt.hash('admin123', 10);

  const users = repo.create([
    {
      email: 'admin@hotel.com',
      password,
      nombres: 'Admin',
      apellidos: 'Principal',
      role: 'admin',
      activo: true,
    },
    {
      email: 'recepcion@hotel.com',
      password,
      nombres: 'Recepcionista',
      apellidos: 'Hotel',
      role: 'reception',
      activo: true,
    },
  ]);

  await repo.save(users);
  console.log('✅ Usuarios creados correctamente');
}
