import { DataSource } from 'typeorm';
import { databaseConfig } from '../../config/database.config';
import { seedUsers } from './user.seeder';
import { seedRoomTypes } from './room-type.seeder';
import { seedAmenities } from './amenity.seeder';
import { seedRooms } from './room.seeder';
import { seedInventoryCategories } from './inventory-category.seeder';
import { seedSupplyCategories } from './supply-category.seeder';
import { seedInventory } from './inventory.seeder';

async function runSeeders() {
  console.log('\n🌱 Iniciando seeders...\n');

  const dataSource = new DataSource(databaseConfig);

  try {
    await dataSource.initialize();
    console.log('📦 Conexión a BD establecida\n');

    await seedUsers(dataSource);
    return;
    await seedRoomTypes(dataSource);
    await seedAmenities(dataSource);
    await seedRooms(dataSource);
    await seedInventoryCategories(dataSource);
    await seedSupplyCategories(dataSource);
    await seedInventory(dataSource);

    console.log('\n🎯 Seeders completados exitosamente\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeders();
