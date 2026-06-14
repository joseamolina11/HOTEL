# PMS Hotel - Modelo de Dominio

## 1. Entidades del Dominio

### User (Usuario)
```
User {
  id: UUID (PK)
  email: string (unique)
  password: string (hashed)
  nombres: string
  apellidos: string
  role: enum [admin, reception]
  activo: boolean
  createdAt: datetime
  updatedAt: datetime
}
```

### HotelConfig (Configuración del Hotel)
```
HotelConfig {
  id: UUID (PK)
  nombre: string
  direccion: string
  ciudad: string
  pais: string
  telefono: string
  email: string
  logo: string (URL)
  moneda: string (default: "MXN")
  checkInTime: string (HH:mm, default: "15:00")
  checkOutTime: string (HH:mm, default: "12:00")
  createdAt: datetime
  updatedAt: datetime
}
```

### RoomType (Tipo de Habitación)
```
RoomType {
  id: UUID (PK)
  nombre: string (unique)
  descripcion: text
  capacidadAdultos: number
  capacidadNinos: number
  precioBase: decimal(10,2)
  colorIdentificador: string (hex)
  activo: boolean (default: true)
  createdAt: datetime
  updatedAt: datetime

  Relations:
  - rooms: Room[]
  - amenities: Amenity[] (N:M)
}
```

### Amenity (Amenidad)
```
Amenity {
  id: UUID (PK)
  nombre: string (unique)
  descripcion: text
  createdAt: datetime

  Relations:
  - roomTypes: RoomType[] (N:M)
}
```

### Room (Habitación)
```
Room {
  id: UUID (PK)
  numero: string (unique)
  nombre: string
  piso: number
  observaciones: text
  estado: enum [disponible, reservada, ocupada, limpieza, mantenimiento]
  createdAt: datetime
  updatedAt: datetime

  Relations:
  - roomType: RoomType (N:1)
  - reservations: Reservation[] (1:N)
}
```

### Guest (Huésped)
```
Guest {
  id: UUID (PK)
  nombres: string
  apellidos: string
  documento: string (unique)
  nacionalidad: string
  telefono: string
  email: string
  fechaNacimiento: date
  observaciones: text
  createdAt: datetime
  updatedAt: datetime

  Relations:
  - reservations: Reservation[] (1:N, como titular)
}
```

### Reservation (Reserva)
```
Reservation {
  id: UUID (PK)
  codigo: string (unique, generated: "RES-XXXXXX")
  fechaEntrada: datetime
  fechaSalida: datetime
  cantidadHuespedes: number
  observaciones: text
  estado: enum [pendiente, confirmada, checkin, checkout, cancelada]
  origen: enum [directo, booking, airbnb]
  otaReservationId: string (nullable, para integración OTA)
  createdAt: datetime
  updatedAt: datetime

  Relations:
  - room: Room (N:1)
  - guest: Guest (N:1, titular)
  - companions: ReservationGuest[] (1:N)
  - consumptions: Consumption[] (1:N)
  - checkIn: CheckIn (1:1)
  - checkOut: CheckOut (1:1)
}
```

### ReservationGuest (Acompañante de Reserva)
```
ReservationGuest {
  id: UUID (PK)
  nombres: string
  apellidos: string
  documento: string
  nacionalidad: string
  createdAt: datetime

  Relations:
  - reservation: Reservation (N:1)
}
```

### CheckIn (Registro de Entrada)
```
CheckIn {
  id: UUID (PK)
  fechaHora: datetime
  observaciones: text
  createdAt: datetime

  Relations:
  - reservation: Reservation (1:1)
  - user: User (N:1, responsable)
}
```

### CheckOut (Registro de Salida)
```
CheckOut {
  id: UUID (PK)
  fechaHora: datetime
  observaciones: text
  consumosTotal: decimal(10,2)
  createdAt: datetime

  Relations:
  - reservation: Reservation (1:1)
  - user: User (N:1, responsable)
}
```

### InventoryItem (Producto de Inventario)
```
InventoryItem {
  id: UUID (PK)
  nombre: string
  categoria: string
  stockActual: number (default: 0)
  stockMinimo: number (default: 0)
  costoUnitario: decimal(10,2) (default: 0)
  activo: boolean (default: true)
  createdAt: datetime
  updatedAt: datetime

  Relations:
  - movements: InventoryMovement[] (1:N)
  - consumptions: Consumption[] (1:N)
}
```

### InventoryMovement (Movimiento de Inventario)
```
InventoryMovement {
  id: UUID (PK)
  tipo: enum [entrada, salida, ajuste]
  cantidad: number
  stockAnterior: number
  stockPosterior: number
  observaciones: text
  createdAt: datetime

  Relations:
  - inventoryItem: InventoryItem (N:1)
  - user: User (N:1, responsable)
}
```

### Consumption (Consumo)
```
Consumption {
  id: UUID (PK)
  cantidad: number
  precioUnitario: decimal(10,2)
  subtotal: decimal(10,2)
  fecha: datetime
  createdAt: datetime

  Relations:
  - reservation: Reservation (N:1)
  - inventoryItem: InventoryItem (N:1)
  - user: User (N:1, responsable)
}
```

## 2. Reglas de Negocio

### Habitaciones
- Una habitación solo puede estar en un estado a la vez
- Una habitación no puede reservarse si está en mantenimiento
- El cambio a "limpieza" ocurre automáticamente al hacer check-out
- El cambio a "disponible" ocurre al finalizar limpieza (manual)
- No se puede eliminar una habitación con reservas activas

### Reservas
- No permitir reservas superpuestas en la misma habitación
  - Validación: fechaEntrada < nuevaFechaSalida AND fechaSalida > nuevaFechaEntrada
- La capacidad de la habitación debe ser >= cantidadHuespedes
- El estado "pendiente" permite modificación
- "confirmada" permite modificación solo con autorización
- "checkin", "checkout" y "cancelada" son finales (no modificables)
- El código de reserva debe ser único y generado automáticamente

### Check-In
- Solo posible si la reserva está en estado "confirmada"
- Requiere que la habitación esté en estado "disponible" o "reservada"
- Cambia estado de habitación a "ocupada"
- Cambia estado de reserva a "checkin"
- Puede registrar acompañantes adicionales

### Check-Out
- Solo posible si la reserva está en estado "checkin"
- Registra todos los consumos de la reserva
- Cambia estado de habitación a "limpieza"
- Cambia estado de reserva a "checkout"
- Calcula total de consumos

### Inventario
- stockActual no puede ser negativo
- Al crear un movimiento, se actualiza stockActual automáticamente
- Al stockActual < stockMinimo, generar alerta

### Consumos
- Solo pueden registrarse contra reservas en estado "checkin"
- Descuentan automáticamente del stockActual del producto
- Se visualizan en el resumen de check-out

### Integración OTA
- Las reservas importadas de OTA no pueden modificarse manualmente
- La disponibilidad se sincroniza automáticamente
- Las habitaciones ocupadas por OTA se bloquean en el PMS

## 3. Estados y Transiciones

### Room Status
```
disponible ──→ reservada (al crear reserva)
disponible ──→ mantenimiento (manual)
reservada ──→ disponible (cancelación)
reservada ──→ ocupada (check-in)
ocupada ──→ limpieza (check-out)
limpieza ──→ disponible (manual)
mantenimiento ──→ disponible (manual)
```

### Reservation Status
```
pendiente ──→ confirmada (confirmación)
pendiente ──→ cancelada (cancelación)
confirmada ──→ checkin (check-in)
confirmada ──→ cancelada (cancelación)
checkin ──→ checkout (check-out)
checkout (final)
cancelada (final)
```
