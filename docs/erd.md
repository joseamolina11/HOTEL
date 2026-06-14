# PMS Hotel - Modelo Entidad Relación (ERD)

## 1. Diagrama de Entidades

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email UK
        varchar password
        varchar nombres
        varchar apellidos
        enum role "admin | reception"
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    HOTEL_CONFIG {
        uuid id PK
        varchar nombre
        text direccion
        varchar ciudad
        varchar pais
        varchar telefono
        varchar email
        varchar logo
        varchar moneda
        varchar check_in_time
        varchar check_out_time
        timestamp created_at
        timestamp updated_at
    }

    ROOM_TYPES {
        uuid id PK
        varchar nombre UK
        text descripcion
        int capacidad_adultos
        int capacidad_ninos
        decimal precio_base
        varchar color_identificador
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    AMENITIES {
        uuid id PK
        varchar nombre UK
        text descripcion
        timestamp created_at
    }

    ROOM_TYPE_AMENITIES {
        uuid room_type_id FK
        uuid amenity_id FK
    }

    ROOMS {
        uuid id PK
        varchar numero UK
        varchar nombre
        uuid room_type_id FK
        int piso
        text observaciones
        enum estado "disponible | reservada | ocupada | limpieza | mantenimiento"
        timestamp created_at
        timestamp updated_at
    }

    GUESTS {
        uuid id PK
        varchar nombres
        varchar apellidos
        varchar documento UK
        varchar nacionalidad
        varchar telefono
        varchar email
        date fecha_nacimiento
        text observaciones
        timestamp created_at
        timestamp updated_at
    }

    RESERVATIONS {
        uuid id PK
        varchar codigo UK
        uuid room_id FK
        uuid guest_id FK
        datetime fecha_entrada
        datetime fecha_salida
        int cantidad_huespedes
        text observaciones
        enum estado "pendiente | confirmada | checkin | checkout | cancelada"
        enum origen "directo | booking | airbnb"
        varchar ota_reservation_id
        timestamp created_at
        timestamp updated_at
    }

    RESERVATION_GUESTS {
        uuid id PK
        uuid reservation_id FK
        varchar nombres
        varchar apellidos
        varchar documento
        varchar nacionalidad
        timestamp created_at
    }

    CHECK_INS {
        uuid id PK
        uuid reservation_id FK UK
        uuid user_id FK
        datetime fecha_hora
        text observaciones
        timestamp created_at
    }

    CHECK_OUTS {
        uuid id PK
        uuid reservation_id FK UK
        uuid user_id FK
        datetime fecha_hora
        text observaciones
        decimal consumos_total
        timestamp created_at
    }

    INVENTORY_ITEMS {
        uuid id PK
        varchar nombre
        varchar categoria
        int stock_actual
        int stock_minimo
        decimal costo_unitario
        boolean activo
        timestamp created_at
        timestamp updated_at
    }

    INVENTORY_MOVEMENTS {
        uuid id PK
        uuid inventory_item_id FK
        uuid user_id FK
        enum tipo "entrada | salida | ajuste"
        int cantidad
        int stock_anterior
        int stock_posterior
        text observaciones
        timestamp created_at
    }

    CONSUMPTIONS {
        uuid id PK
        uuid reservation_id FK
        uuid inventory_item_id FK
        uuid user_id FK
        int cantidad
        decimal precio_unitario
        decimal subtotal
        datetime fecha
        timestamp created_at
    }

    %% RELACIONES
    ROOM_TYPES ||--o{ ROOMS : tiene
    ROOM_TYPES ||--o{ ROOM_TYPE_AMENITIES : "tiene amenidades"
    AMENITIES ||--o{ ROOM_TYPE_AMENITIES : "pertenece a"
    ROOMS ||--o{ RESERVATIONS : contiene
    GUESTS ||--o{ RESERVATIONS : titular
    RESERVATIONS ||--o{ RESERVATION_GUESTS : acompanantes
    RESERVATIONS ||--o| CHECK_INS : registro
    RESERVATIONS ||--o| CHECK_OUTS : registro
    USERS ||--o{ CHECK_INS : responsable
    USERS ||--o{ CHECK_OUTS : responsable
    USERS ||--o{ INVENTORY_MOVEMENTS : responsable
    USERS ||--o{ CONSUMPTIONS : responsable
    INVENTORY_ITEMS ||--o{ INVENTORY_MOVEMENTS : movimientos
    INVENTORY_ITEMS ||--o{ CONSUMPTIONS : consumido
    RESERVATIONS ||--o{ CONSUMPTIONS : tiene
```

## 2. Diagrama de Relaciones (Simplificado)

```mermaid
graph TD
    subgraph "Catálogos"
        RT[Room Types]
        AM[Amenities]
        II[Inventory Items]
    end

    subgraph "Operación"
        RM[Rooms]
        GV[Guests]
        RS[Reservations]
        RG[Reservation Guests]
    end

    subgraph "Procesos"
        CI[Check In]
        CO[Check Out]
        CN[Consumptions]
        IM[Inventory Movements]
    end

    subgraph "Configuración"
        HC[Hotel Config]
        US[Users]
    end

    RT -->|1:N| RM
    RT -->|N:M| AM
    
    RM -->|1:N| RS
    GV -->|1:N| RS
    RS -->|1:N| RG
    
    RS -->|1:1| CI
    RS -->|1:1| CO
    US -->|1:N| CI
    US -->|1:N| CO
    
    RS -->|1:N| CN
    II -->|1:N| CN
    US -->|1:N| CN
    
    II -->|1:N| IM
    US -->|1:N| IM
```

## 3. Diagrama de Base de Datos (Esquema Físico)

```mermaid
classDiagram
    class User {
        +uuid id
        +string email
        +string password
        +string nombres
        +string apellidos
        +enum role
        +boolean activo
        +timestamp createdAt
        +timestamp updatedAt
    }

    class HotelConfig {
        +uuid id
        +string nombre
        +text direccion
        +string ciudad
        +string pais
        +string telefono
        +string email
        +string logo
        +string moneda
        +string checkInTime
        +string checkOutTime
        +timestamp createdAt
        +timestamp updatedAt
    }

    class RoomType {
        +uuid id
        +string nombre
        +text descripcion
        +int capacidadAdultos
        +int capacidadNinos
        +decimal precioBase
        +string colorIdentificador
        +boolean activo
        +timestamp createdAt
        +timestamp updatedAt
    }

    class Amenity {
        +uuid id
        +string nombre
        +text descripcion
        +timestamp createdAt
    }

    class Room {
        +uuid id
        +string numero
        +string nombre
        +int piso
        +text observaciones
        +enum estado
        +timestamp createdAt
        +timestamp updatedAt
    }

    class Guest {
        +uuid id
        +string nombres
        +string apellidos
        +string documento
        +string nacionalidad
        +string telefono
        +string email
        +date fechaNacimiento
        +text observaciones
        +timestamp createdAt
        +timestamp updatedAt
    }

    class Reservation {
        +uuid id
        +string codigo
        +datetime fechaEntrada
        +datetime fechaSalida
        +int cantidadHuespedes
        +text observaciones
        +enum estado
        +enum origen
        +string otaReservationId
        +timestamp createdAt
        +timestamp updatedAt
    }

    class ReservationGuest {
        +uuid id
        +string nombres
        +string apellidos
        +string documento
        +string nacionalidad
        +timestamp createdAt
    }

    class CheckIn {
        +uuid id
        +datetime fechaHora
        +text observaciones
        +timestamp createdAt
    }

    class CheckOut {
        +uuid id
        +datetime fechaHora
        +text observaciones
        +decimal consumosTotal
        +timestamp createdAt
    }

    class InventoryItem {
        +uuid id
        +string nombre
        +string categoria
        +int stockActual
        +int stockMinimo
        +decimal costoUnitario
        +boolean activo
        +timestamp createdAt
        +timestamp updatedAt
    }

    class InventoryMovement {
        +uuid id
        +enum tipo
        +int cantidad
        +int stockAnterior
        +int stockPosterior
        +text observaciones
        +timestamp createdAt
    }

    class Consumption {
        +uuid id
        +int cantidad
        +decimal precioUnitario
        +decimal subtotal
        +datetime fecha
        +timestamp createdAt
    }

    %% Relationships
    RoomType "1" --> "*" Room : tiene
    RoomType "*" --> "*" Amenity : incluye
    
    Room "1" --> "*" Reservation : contiene
    Guest "1" --> "*" Reservation : titular
    
    Reservation "1" --> "*" ReservationGuest : acompanantes
    Reservation "1" --> "1" CheckIn : registro
    Reservation "1" --> "1" CheckOut : registro
    Reservation "1" --> "*" Consumption : tiene
    
    User "1" --> "*" CheckIn : responsable
    User "1" --> "*" CheckOut : responsable
    User "1" --> "*" InventoryMovement : responsable
    User "1" --> "*" Consumption : responsable
    
    InventoryItem "1" --> "*" InventoryMovement : movimientos
    InventoryItem "1" --> "*" Consumption : consumido
```

## 4. Índices Propuestos

```sql
-- Reservas: búsqueda por fechas y estado
CREATE INDEX idx_reservations_fechas ON reservations(fecha_entrada, fecha_salida);
CREATE INDEX idx_reservations_estado ON reservations(estado);
CREATE INDEX idx_reservations_codigo ON reservations(codigo);
CREATE INDEX idx_reservations_room_fechas ON reservations(room_id, fecha_entrada, fecha_salida);

-- Huéspedes: búsqueda por documento y nombre
CREATE INDEX idx_guests_documento ON guests(documento);
CREATE INDEX idx_guests_nombres ON guests(nombres, apellidos);

-- Habitaciones: búsqueda por estado y tipo
CREATE INDEX idx_rooms_estado ON rooms(estado);
CREATE INDEX idx_rooms_room_type ON rooms(room_type_id);

-- Inventario: alertas de stock bajo
CREATE INDEX idx_inventory_stock ON inventory_items(stock_actual, stock_minimo);

-- Consumos: búsqueda por reserva
CREATE INDEX idx_consumptions_reservation ON consumptions(reservation_id);
```

## 5. Constraints y Validaciones

```sql
-- Capacidad de habitación debe ser positiva
ALTER TABLE room_types
ADD CONSTRAINT chk_capacidad_adultos CHECK (capacidad_adultos > 0),
ADD CONSTRAINT chk_capacidad_ninos CHECK (capacidad_ninos >= 0),
ADD CONSTRAINT chk_precio_base CHECK (precio_base >= 0);

-- Stock no negativo
ALTER TABLE inventory_items
ADD CONSTRAINT chk_stock_actual CHECK (stock_actual >= 0),
ADD CONSTRAINT chk_stock_minimo CHECK (stock_minimo >= 0),
ADD CONSTRAINT chk_costo_unitario CHECK (costo_unitario >= 0);

-- Fechas de reserva coherentes
ALTER TABLE reservations
ADD CONSTRAINT chk_fechas CHECK (fecha_salida > fecha_entrada),
ADD CONSTRAINT chk_cantidad_huespedes CHECK (cantidad_huespedes > 0);

-- Consumos
ALTER TABLE consumptions
ADD CONSTRAINT chk_consumption_cantidad CHECK (cantidad > 0),
ADD CONSTRAINT chk_consumption_precio CHECK (precio_unitario >= 0);
```
