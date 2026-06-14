# PMS Hotel - Arquitectura del Sistema

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE (React SPA)                          │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌───────────┐ │
│  │  Router  │ │ TanStack │ │ Zustand │ │ RHF/Zod  │ │ Shadcn UI │ │
│  │    v7   │ │  Query   │ │  State  │ │  Forms   │ │ Comp.     │ │
│  └─────────┘ └──────────┘ └─────────┘ └──────────┘ └───────────┘ │
│                        Axios HTTP Client                            │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS / JWT
┌──────────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY (NestJS)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                Middleware Pipeline                             │   │
│  │  AuthGuard → RolesGuard → ValidationPipe → LoggingInterceptor │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌────┐ ┌─────┐ │
│  │  Auth  │ │ Hotel  │ │ Room │ │Guest │ │Reserv│ │Inv │ │ OTA │ │
│  │ Module │ │ Config │ │ Type │ │Module│ │Module│ │Module│ │Module│
│  └────────┘ └────────┘ └──────┘ └──────┘ └──────┘ └────┘ └─────┘ │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Shared / Core Layer                        │   │
│  │  Guards │ Decorators │ Filters │ Pipes │ Interceptors │ Utils │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  Infrastructure Layer                         │   │
│  │     TypeORM │ PostgreSQL │ JWT │ Passport │ Swagger           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. Principios Arquitectónicos

### Clean Architecture (Capas)
```
┌──────────────────────────────────┐
│  Presentation Layer (Controllers)│ → DTOs, HTTP, Swagger
├──────────────────────────────────┤
│  Application Layer (Services)    │ → Casos de uso, lógica
├──────────────────────────────────┤
│  Domain Layer (Entities)         │ → Modelos, reglas de negocio
├──────────────────────────────────┤
│  Infrastructure Layer (ORM/DB)   │ → TypeORM, PostgreSQL
└──────────────────────────────────┘
```

### Flujo de Datos
```
Request → Guard → Controller → Service → Repository → DB
                                         ↓
Response ← Interceptor ← DTO ← Entity ←─┘
```

## 3. Patrones Implementados

| Patrón | Ubicación | Propósito |
|--------|-----------|-----------|
| Repository | Cada módulo | Abstracción de persistencia |
| Dependency Injection | NestJS DI | Inversión de control |
| DTO | Módulos | Validación y transferencia |
| Adapter | Módulo OTA | Integración con Booking/Airbnb |
| Observer | Eventos NestJS | Comunicación entre módulos |
| Strategy | Auth | Múltiples estrategias Passport |
| Factory | Seeders | Creación de datos de prueba |

## 4. Estructura Modular (DDD Simplificado)

Cada módulo sigue:
```
module/
├── controllers/     → HTTP handlers
├── services/        → Business logic
├── entities/        → TypeORM entities
├── dto/             → Validation & transfer
├── interfaces/      → TypeScript interfaces
├── repositories/    → Data access
├── guards/          → Route protection
├── decorators/      → Custom decorators
├── module.ts        → NestJS module
└── index.ts         → Barrel exports
```

## 5. Base de Datos

### Tecnología
- PostgreSQL 15+
- TypeORM 0.3+
- Migraciones automáticas con `synchronize: false`
- Seeders para datos iniciales

### Esquema
```
hotel_pms/
├── public/
│   ├── users              → Administradores y recepcionistas
│   ├── hotel_config       → Configuración del hotel
│   ├── room_types         → Tipos de habitación
│   ├── amenities          → Amenidades
│   ├── room_type_amenities → Relación N:M
│   ├── rooms              → Habitaciones
│   ├── guests             → Huéspedes
│   ├── reservations       → Reservas
│   ├── reservation_guests → Acompañantes
│   ├── inventory_items    → Productos de inventario
│   ├── inventory_movements → Movimientos de inventario
│   ├── consumptions       → Consumos de huéspedes
│   ├── check_ins          → Registro de check-in
│   └── check_outs         → Registro de check-out
```

## 6. Seguridad

### Autenticación
- JWT con access token (15 min) y refresh token (7 días)
- Passport JWT Strategy
- bcrypt + salt para passwords

### Autorización
- Role-based access control (RBAC)
- Roles: `admin`, `reception`
- Guards por ruta y método

### Protección
- Rate limiting
- CORS configurado
- Helmet headers
- Validación estricta con class-validator

## 7. API REST

### Versionado
- Prefijo: `/api/v1/`

### Formato Respuesta
```json
{
  "success": true,
  "data": {},
  "message": "Operación exitosa",
  "timestamp": "2025-01-15T10:30:00Z",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Errores
```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_AVAILABLE",
    "message": "La habitación no está disponible",
    "statusCode": 409,
    "details": {}
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 8. Integración OTA

### Patrón Adapter
```
OTAService (abstracción)
├── BookingAdapter → implements OTAAdapter
└── AirbnbAdapter  → implements OTAAdapter
```

### Flujo Sincronización
```
Reserva creada en Booking → Webhook → OTAAdapter → Reserva local
                                                  ↓
BookingAPI ← Availability Update ← Estado habitación actualizado
```

### Interfaces
```typescript
interface OTAAdapter {
  importReservations(): Promise<OTAImportResult>;
  updateAvailability(roomId: string, available: boolean): Promise<void>;
  blockDates(roomId: string, start: Date, end: Date): Promise<void>;
  syncInventory(): Promise<SyncResult>;
}
```

## 9. Frontend

### Routing
```
/login                  → Login
/dashboard              → Dashboard operativo
/reservations           → Gestión de reservas
/reservations/:id       → Detalle de reserva
/reservations/new       → Nueva reserva
/guests                 → Huéspedes
/guests/:id             → Perfil huésped
/rooms                  → Habitaciones
/rooms/:id              → Detalle habitación
/check-in               → Check-in
/check-in/:id           → Procesar check-in
/check-out              → Check-out
/check-out/:id          → Procesar check-out
/inventory              → Inventario
/settings               → Configuración hotel
/settings/users         → Usuarios del sistema
```

### Component Tree
```
App
├── AuthLayout
│   └── LoginPage
├── MainLayout
│   ├── Sidebar
│   │   ├── Logo
│   │   ├── NavItems
│   │   └── UserMenu
│   ├── TopBar
│   │   ├── Search
│   │   ├── Notifications
│   │   └── ThemeToggle
│   └── Content (Router Outlet)
│       ├── DashboardPage
│       │   ├── StatsCards
│       │   ├── OccupancyChart
│       │   ├── RevenueChart
│       │   └── RecentReservations
│       ├── ReservationsPage
│       │   ├── ReservationFilters
│       │   ├── ReservationTable
│       │   └── ReservationForm (modal)
│       ├── RoomsPage
│       │   ├── RoomGrid
│       │   ├── RoomCard
│       │   └── RoomForm (modal)
│       ├── GuestsPage
│       │   ├── GuestTable
│       │   └── GuestForm (modal)
│       ├── CheckInPage
│       │   ├── CheckInList
│       │   └── CheckInProcess (wizard)
│       ├── CheckOutPage
│       │   ├── CheckOutList
│       │   └── CheckOutSummary
│       └── SettingsPage
│           ├── HotelConfig
│           ├── RoomTypes
│           ├── Amenities
│           └── Users
```

### State Management (Zustand)
```
stores/
├── authStore        → User, token, login/logout
├── hotelStore       → Configuración activa
├── uiStore          → Sidebar, theme, modals
└── filterStore      → Filtros globales
```

## 10. Tech Stack Detallado

### Backend (package.json)
```json
{
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/platform-express": "^10.x",
    "@nestjs/jwt": "^10.x",
    "@nestjs/passport": "^10.x",
    "@nestjs/swagger": "^7.x",
    "@nestjs/typeorm": "^10.x",
    "passport": "^0.7.x",
    "passport-jwt": "^4.x",
    "bcrypt": "^5.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "typeorm": "^0.3.x",
    "pg": "^8.x",
    "reflect-metadata": "^0.2.x",
    "rxjs": "^7.x"
  }
}
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^7.x",
    "@tanstack/react-query": "^5.x",
    "axios": "^1.x",
    "zustand": "^4.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "zod": "^3.x",
    "tailwindcss": "^3.x",
    "recharts": "^2.x",
    "lucide-react": "^0.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```
