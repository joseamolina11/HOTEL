import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'reception' NOT NULL,
        activo BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Hotel Config
    await queryRunner.query(`
      CREATE TABLE hotel_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        direccion TEXT NOT NULL,
        ciudad VARCHAR(255) NOT NULL,
        pais VARCHAR(255) NOT NULL,
        telefono VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        logo VARCHAR(500),
        moneda VARCHAR(10) DEFAULT 'MXN',
        check_in_time VARCHAR(5) DEFAULT '15:00',
        check_out_time VARCHAR(5) DEFAULT '12:00',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Room Types
    await queryRunner.query(`
      CREATE TABLE room_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) UNIQUE NOT NULL,
        descripcion TEXT,
        capacidad_adultos INTEGER DEFAULT 1 NOT NULL,
        capacidad_ninos INTEGER DEFAULT 0 NOT NULL,
        precio_base DECIMAL(10,2) DEFAULT 0 NOT NULL,
        color_identificador VARCHAR(7) DEFAULT '#3B82F6',
        activo BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Amenities
    await queryRunner.query(`
      CREATE TABLE amenities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) UNIQUE NOT NULL,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Room Type Amenities (N:M)
    await queryRunner.query(`
      CREATE TABLE room_type_amenities (
        room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
        amenity_id UUID NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
        PRIMARY KEY (room_type_id, amenity_id)
      )
    `);

    // Rooms
    await queryRunner.query(`
      CREATE TABLE rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        numero VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        room_type_id UUID NOT NULL REFERENCES room_types(id),
        piso INTEGER DEFAULT 1 NOT NULL,
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'disponible' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Guests
    await queryRunner.query(`
      CREATE TABLE guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        documento VARCHAR(100) UNIQUE NOT NULL,
        nacionalidad VARCHAR(100) NOT NULL,
        telefono VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        fecha_nacimiento DATE,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Reservations
    await queryRunner.query(`
      CREATE TABLE reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        codigo VARCHAR(20) UNIQUE NOT NULL,
        room_id UUID NOT NULL REFERENCES rooms(id),
        guest_id UUID REFERENCES guests(id),
        fecha_entrada TIMESTAMPTZ NOT NULL,
        fecha_salida TIMESTAMPTZ NOT NULL,
        cantidad_huespedes INTEGER DEFAULT 1 NOT NULL,
        observaciones TEXT,
        estado VARCHAR(20) DEFAULT 'pendiente' NOT NULL,
        origen VARCHAR(20) DEFAULT 'directo' NOT NULL,
        ota_reservation_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Reservation Guests (Companions)
    await queryRunner.query(`
      CREATE TABLE reservation_guests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
        nombres VARCHAR(255) NOT NULL,
        apellidos VARCHAR(255) NOT NULL,
        documento VARCHAR(100) NOT NULL,
        nacionalidad VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Check Ins
    await queryRunner.query(`
      CREATE TABLE check_ins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID UNIQUE NOT NULL REFERENCES reservations(id),
        user_id UUID NOT NULL REFERENCES users(id),
        fecha_hora TIMESTAMPTZ NOT NULL,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Check Outs
    await queryRunner.query(`
      CREATE TABLE check_outs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID UNIQUE NOT NULL REFERENCES reservations(id),
        user_id UUID NOT NULL REFERENCES users(id),
        fecha_hora TIMESTAMPTZ NOT NULL,
        observaciones TEXT,
        consumos_total DECIMAL(10,2) DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Inventory Items
    await queryRunner.query(`
      CREATE TABLE inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre VARCHAR(255) NOT NULL,
        categoria VARCHAR(255) NOT NULL,
        stock_actual INTEGER DEFAULT 0 NOT NULL,
        stock_minimo INTEGER DEFAULT 0 NOT NULL,
        costo_unitario DECIMAL(10,2) DEFAULT 0 NOT NULL,
        activo BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Inventory Movements
    await queryRunner.query(`
      CREATE TABLE inventory_movements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
        user_id UUID NOT NULL REFERENCES users(id),
        tipo VARCHAR(20) NOT NULL,
        cantidad INTEGER NOT NULL,
        stock_anterior INTEGER NOT NULL,
        stock_posterior INTEGER NOT NULL,
        observaciones TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Consumptions
    await queryRunner.query(`
      CREATE TABLE consumptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reservation_id UUID NOT NULL REFERENCES reservations(id),
        inventory_item_id UUID NOT NULL REFERENCES inventory_items(id),
        user_id UUID NOT NULL REFERENCES users(id),
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        fecha TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX idx_reservations_fechas ON reservations(fecha_entrada, fecha_salida)`);
    await queryRunner.query(`CREATE INDEX idx_reservations_estado ON reservations(estado)`);
    await queryRunner.query(`CREATE INDEX idx_reservations_codigo ON reservations(codigo)`);
    await queryRunner.query(`CREATE INDEX idx_reservations_room_fechas ON reservations(room_id, fecha_entrada, fecha_salida)`);
    await queryRunner.query(`CREATE INDEX idx_guests_documento ON guests(documento)`);
    await queryRunner.query(`CREATE INDEX idx_guests_nombres ON guests(nombres, apellidos)`);
    await queryRunner.query(`CREATE INDEX idx_rooms_estado ON rooms(estado)`);
    await queryRunner.query(`CREATE INDEX idx_rooms_room_type ON rooms(room_type_id)`);
    await queryRunner.query(`CREATE INDEX idx_inventory_stock ON inventory_items(stock_actual, stock_minimo)`);
    await queryRunner.query(`CREATE INDEX idx_consumptions_reservation ON consumptions(reservation_id)`);
    await queryRunner.query(`CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id)`);
    await queryRunner.query(`CREATE INDEX idx_reservations_ota ON reservations(ota_reservation_id)`);
    await queryRunner.query(`CREATE INDEX idx_reservations_origen ON reservations(origen)`);

    // Constraints
    await queryRunner.query(`ALTER TABLE room_types ADD CONSTRAINT chk_capacidad_adultos CHECK (capacidad_adultos > 0)`);
    await queryRunner.query(`ALTER TABLE room_types ADD CONSTRAINT chk_capacidad_ninos CHECK (capacidad_ninos >= 0)`);
    await queryRunner.query(`ALTER TABLE room_types ADD CONSTRAINT chk_precio_base CHECK (precio_base >= 0)`);
    await queryRunner.query(`ALTER TABLE inventory_items ADD CONSTRAINT chk_stock_actual CHECK (stock_actual >= 0)`);
    await queryRunner.query(`ALTER TABLE inventory_items ADD CONSTRAINT chk_stock_minimo CHECK (stock_minimo >= 0)`);
    await queryRunner.query(`ALTER TABLE reservations ADD CONSTRAINT chk_fechas CHECK (fecha_salida > fecha_entrada)`);
    await queryRunner.query(`ALTER TABLE reservations ADD CONSTRAINT chk_cantidad_huespedes CHECK (cantidad_huespedes > 0)`);
    await queryRunner.query(`ALTER TABLE consumptions ADD CONSTRAINT chk_cantidad CHECK (cantidad > 0)`);
    await queryRunner.query(`ALTER TABLE consumptions ADD CONSTRAINT chk_precio CHECK (precio_unitario >= 0)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS consumptions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_movements CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventory_items CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS check_outs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS check_ins CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservation_guests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS guests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS rooms CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS room_type_amenities CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS amenities CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS room_types CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS hotel_config CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
  }
}
