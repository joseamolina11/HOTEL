# PMS Hotel - Estructura de Carpetas

```
hotel-pms/
│
├── backend/
│   ├── src/
│   │   ├── main.ts                           # Entry point
│   │   ├── app.module.ts                     # Módulo raíz
│   │   ├── app.controller.ts                 # Health check
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts            # Config TypeORM
│   │   │   ├── jwt.config.ts                 # Config JWT
│   │   │   ├── cors.config.ts               # Config CORS
│   │   │   └── swagger.config.ts             # Config Swagger
│   │   │
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── roles.decorator.ts        # @Roles() decorator
│   │   │   │   ├── public.decorator.ts       # @Public() decorator
│   │   │   │   └── current-user.decorator.ts # @CurrentUser()
│   │   │   │
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts         # JWT guard
│   │   │   │   └── roles.guard.ts            # Roles guard
│   │   │   │
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts  # Error global
│   │   │   │
│   │   │   ├── interceptors/
│   │   │   │   ├── response.interceptor.ts   # Formato respuesta
│   │   │   │   └── logging.interceptor.ts    # Logging
│   │   │   │
│   │   │   ├── pipes/
│   │   │   │   └── validation.pipe.ts        # Validación global
│   │   │   │
│   │   │   ├── interfaces/
│   │   │   │   ├── api-response.interface.ts
│   │   │   │   └── pagination.interface.ts
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── generate-code.ts          # Generar códigos
│   │   │       └── date-utils.ts             # Utils fechas
│   │   │
│   │   ├── modules/
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   └── jwt-refresh.strategy.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   ├── register.dto.ts
│   │   │   │   │   └── refresh-token.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.entity.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── auth.interface.ts
│   │   │   │
│   │   │   ├── hotel-config/
│   │   │   │   ├── hotel-config.module.ts
│   │   │   │   ├── hotel-config.controller.ts
│   │   │   │   ├── hotel-config.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   └── hotel-config.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── hotel-config.entity.ts
│   │   │   │
│   │   │   ├── room-types/
│   │   │   │   ├── room-types.module.ts
│   │   │   │   ├── room-types.controller.ts
│   │   │   │   ├── room-types.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-room-type.dto.ts
│   │   │   │   │   ├── update-room-type.dto.ts
│   │   │   │   │   └── room-type-response.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── room-type.entity.ts
│   │   │   │
│   │   │   ├── amenities/
│   │   │   │   ├── amenities.module.ts
│   │   │   │   ├── amenities.controller.ts
│   │   │   │   ├── amenities.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-amenity.dto.ts
│   │   │   │   │   └── update-amenity.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── amenity.entity.ts
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   ├── rooms.module.ts
│   │   │   │   ├── rooms.controller.ts
│   │   │   │   ├── rooms.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-room.dto.ts
│   │   │   │   │   ├── update-room.dto.ts
│   │   │   │   │   └── change-status.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── room.entity.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── room-status.enum.ts
│   │   │   │
│   │   │   ├── guests/
│   │   │   │   ├── guests.module.ts
│   │   │   │   ├── guests.controller.ts
│   │   │   │   ├── guests.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-guest.dto.ts
│   │   │   │   │   └── update-guest.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   └── guest.entity.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── guest.interface.ts
│   │   │   │
│   │   │   ├── reservations/
│   │   │   │   ├── reservations.module.ts
│   │   │   │   ├── reservations.controller.ts
│   │   │   │   ├── reservations.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-reservation.dto.ts
│   │   │   │   │   ├── update-reservation.dto.ts
│   │   │   │   │   ├── cancel-reservation.dto.ts
│   │   │   │   │   └── reservation-filter.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── reservation.entity.ts
│   │   │   │   │   └── reservation-guest.entity.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── reservation-status.enum.ts
│   │   │   │
│   │   │   ├── check-in/
│   │   │   │   ├── check-in.module.ts
│   │   │   │   ├── check-in.controller.ts
│   │   │   │   ├── check-in.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   └── check-in.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── check-in.entity.ts
│   │   │   │
│   │   │   ├── check-out/
│   │   │   │   ├── check-out.module.ts
│   │   │   │   ├── check-out.controller.ts
│   │   │   │   ├── check-out.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   └── check-out.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── check-out.entity.ts
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.module.ts
│   │   │   │   ├── inventory.controller.ts
│   │   │   │   ├── inventory.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-inventory-item.dto.ts
│   │   │   │   │   ├── update-inventory-item.dto.ts
│   │   │   │   │   └── create-movement.dto.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── inventory-item.entity.ts
│   │   │   │   │   └── inventory-movement.entity.ts
│   │   │   │   └── interfaces/
│   │   │   │       └── movement-type.enum.ts
│   │   │   │
│   │   │   ├── consumptions/
│   │   │   │   ├── consumptions.module.ts
│   │   │   │   ├── consumptions.controller.ts
│   │   │   │   ├── consumptions.service.ts
│   │   │   │   ├── dto/
│   │   │   │   │   ├── create-consumption.dto.ts
│   │   │   │   │   └── consumption-filter.dto.ts
│   │   │   │   └── entities/
│   │   │   │       └── consumption.entity.ts
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.module.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   ├── dashboard.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── dashboard.dto.ts
│   │   │   │
│   │   │   └── ota/
│   │   │       ├── ota.module.ts
│   │   │       ├── ota.controller.ts
│   │   │       ├── ota.service.ts
│   │   │       ├── adapters/
│   │   │       │   ├── ota-adapter.interface.ts
│   │   │       │   ├── booking.adapter.ts
│   │   │       │   └── airbnb.adapter.ts
│   │   │       └── dto/
│   │   │           └── ota.dto.ts
│   │   │
│   │   └── database/
│   │       ├── migrations/
│   │       └── seeders/
│   │           ├── seed.ts
│   │           ├── user.seeder.ts
│   │           ├── room-type.seeder.ts
│   │           ├── amenity.seeder.ts
│   │           ├── room.seeder.ts
│   │           └── inventory.seeder.ts
│   │
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   │
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   │
│   │   ├── api/
│   │   │   ├── client.ts                    # Axios instance
│   │   │   ├── auth.api.ts
│   │   │   ├── reservations.api.ts
│   │   │   ├── rooms.api.ts
│   │   │   ├── guests.api.ts
│   │   │   ├── inventory.api.ts
│   │   │   ├── dashboard.api.ts
│   │   │   └── hotel-config.api.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useReservations.ts
│   │   │   ├── useRooms.ts
│   │   │   ├── useGuests.ts
│   │   │   ├── useInventory.ts
│   │   │   ├── useDashboard.ts
│   │   │   └── useHotelConfig.ts
│   │   │
│   │   ├── stores/
│   │   │   ├── auth.store.ts
│   │   │   ├── ui.store.ts
│   │   │   ├── hotel.store.ts
│   │   │   └── filter.store.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── utils.ts                     # cn(), formatters
│   │   │   ├── constants.ts
│   │   │   └── validators.ts
│   │   │
│   │   ├── types/
│   │   │   ├── api.types.ts
│   │   │   ├── auth.types.ts
│   │   │   ├── reservation.types.ts
│   │   │   ├── room.types.ts
│   │   │   ├── guest.types.ts
│   │   │   ├── inventory.types.ts
│   │   │   ├── hotel.types.ts
│   │   │   └── dashboard.types.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                          # Shadcn UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── toast.tsx
│   │   │   │   ├── skeleton.tsx
│   │   │   │   └── tooltip.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── topbar.tsx
│   │   │   │   ├── main-layout.tsx
│   │   │   │   └── auth-layout.tsx
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── data-table.tsx
│   │   │   │   ├── search-input.tsx
│   │   │   │   ├── status-badge.tsx
│   │   │   │   ├── stat-card.tsx
│   │   │   │   ├── empty-state.tsx
│   │   │   │   ├── loading-state.tsx
│   │   │   │   ├── confirm-dialog.tsx
│   │   │   │   └── page-header.tsx
│   │   │   │
│   │   │   └── forms/
│   │   │       ├── login-form.tsx
│   │   │       ├── reservation-form.tsx
│   │   │       ├── guest-form.tsx
│   │   │       ├── room-form.tsx
│   │   │       ├── inventory-form.tsx
│   │   │       └── hotel-config-form.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── login.page.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.page.tsx
│   │   │   │
│   │   │   ├── reservations/
│   │   │   │   ├── reservations-list.page.tsx
│   │   │   │   ├── reservation-detail.page.tsx
│   │   │   │   └── reservation-form.page.tsx
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   ├── rooms-list.page.tsx
│   │   │   │   └── room-detail.page.tsx
│   │   │   │
│   │   │   ├── guests/
│   │   │   │   ├── guests-list.page.tsx
│   │   │   │   └── guest-detail.page.tsx
│   │   │   │
│   │   │   ├── check-in/
│   │   │   │   ├── check-in-list.page.tsx
│   │   │   │   └── check-in-process.page.tsx
│   │   │   │
│   │   │   ├── check-out/
│   │   │   │   ├── check-out-list.page.tsx
│   │   │   │   └── check-out-summary.page.tsx
│   │   │   │
│   │   │   ├── inventory/
│   │   │   │   └── inventory.page.tsx
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── hotel-config.page.tsx
│   │   │       ├── room-types.page.tsx
│   │   │       ├── amenities.page.tsx
│   │   │       └── users.page.tsx
│   │   │
│   │   ├── router/
│   │   │   ├── index.tsx
│   │   │   ├── protected-route.tsx
│   │   │   └── role-guard.tsx
│   │   │
│   │   └── config/
│   │       └── constants.ts
│   │
│   ├── public/
│   │   └── logo.svg
│   │
│   ├── .env.example
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
├── .prettierrc
└── README.md
```
