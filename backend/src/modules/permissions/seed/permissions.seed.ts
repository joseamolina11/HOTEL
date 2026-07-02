export interface PermissionSeed {
  module: string;
  action: string;
  nombre: string;
  moduloNombre: string;
}

export const ALL_PERMISSIONS: PermissionSeed[] = [
  // Dashboard
  { module: 'dashboard', action: 'view', nombre: 'Ver dashboard', moduloNombre: 'Dashboard' },

  // Reservations
  { module: 'reservations', action: 'view', nombre: 'Ver reservaciones', moduloNombre: 'Reservaciones' },
  { module: 'reservations', action: 'create', nombre: 'Crear reservaciones', moduloNombre: 'Reservaciones' },
  { module: 'reservations', action: 'edit', nombre: 'Editar reservaciones', moduloNombre: 'Reservaciones' },
  { module: 'reservations', action: 'delete', nombre: 'Eliminar reservaciones', moduloNombre: 'Reservaciones' },
  { module: 'reservations', action: 'annul', nombre: 'Anular reservaciones', moduloNombre: 'Reservaciones' },

  // Rooms
  { module: 'rooms', action: 'view', nombre: 'Ver habitaciones', moduloNombre: 'Habitaciones' },
  { module: 'rooms', action: 'create', nombre: 'Crear habitaciones', moduloNombre: 'Habitaciones' },
  { module: 'rooms', action: 'edit', nombre: 'Editar habitaciones', moduloNombre: 'Habitaciones' },
  { module: 'rooms', action: 'delete', nombre: 'Eliminar habitaciones', moduloNombre: 'Habitaciones' },
  { module: 'rooms', action: 'change-status', nombre: 'Cambiar estado habitación', moduloNombre: 'Habitaciones' },

  // Room Types
  { module: 'room-types', action: 'view', nombre: 'Ver tipos de habitación', moduloNombre: 'Tipos Habitación' },
  { module: 'room-types', action: 'create', nombre: 'Crear tipos de habitación', moduloNombre: 'Tipos Habitación' },
  { module: 'room-types', action: 'edit', nombre: 'Editar tipos de habitación', moduloNombre: 'Tipos Habitación' },
  { module: 'room-types', action: 'delete', nombre: 'Eliminar tipos de habitación', moduloNombre: 'Tipos Habitación' },

  // Guests
  { module: 'guests', action: 'view', nombre: 'Ver huéspedes', moduloNombre: 'Huéspedes' },
  { module: 'guests', action: 'create', nombre: 'Crear huéspedes', moduloNombre: 'Huéspedes' },
  { module: 'guests', action: 'edit', nombre: 'Editar huéspedes', moduloNombre: 'Huéspedes' },
  { module: 'guests', action: 'delete', nombre: 'Eliminar huéspedes', moduloNombre: 'Huéspedes' },

  // Check-In
  { module: 'check-in', action: 'view', nombre: 'Ver check-ins', moduloNombre: 'Check-In' },
  { module: 'check-in', action: 'create', nombre: 'Realizar check-in', moduloNombre: 'Check-In' },

  // Check-Out
  { module: 'check-out', action: 'view', nombre: 'Ver check-outs', moduloNombre: 'Check-Out' },
  { module: 'check-out', action: 'create', nombre: 'Realizar check-out', moduloNombre: 'Check-Out' },

  // Orders
  { module: 'orders', action: 'view', nombre: 'Ver pedidos', moduloNombre: 'Pedidos' },
  { module: 'orders', action: 'create', nombre: 'Crear pedidos', moduloNombre: 'Pedidos' },
  { module: 'orders', action: 'edit', nombre: 'Editar pedidos', moduloNombre: 'Pedidos' },
  { module: 'orders', action: 'delete', nombre: 'Eliminar pedidos', moduloNombre: 'Pedidos' },
  { module: 'orders', action: 'annul', nombre: 'Anular pedidos', moduloNombre: 'Pedidos' },

  // Payments
  { module: 'payments', action: 'view', nombre: 'Ver pagos', moduloNombre: 'Pagos' },
  { module: 'payments', action: 'create', nombre: 'Registrar pagos', moduloNombre: 'Pagos' },
  { module: 'payments', action: 'delete', nombre: 'Eliminar pagos', moduloNombre: 'Pagos' },

  // Cash Register
  { module: 'cash-register', action: 'view', nombre: 'Ver caja', moduloNombre: 'Caja' },
  { module: 'cash-register', action: 'open', nombre: 'Abrir caja', moduloNombre: 'Caja' },
  { module: 'cash-register', action: 'close', nombre: 'Cerrar caja', moduloNombre: 'Caja' },

  // Inventory
  { module: 'inventory', action: 'view', nombre: 'Ver inventario', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'create', nombre: 'Crear productos', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'edit', nombre: 'Editar productos', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'delete', nombre: 'Eliminar productos', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'adjust', nombre: 'Ajustar inventario', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'movements-view', nombre: 'Ver movimientos inventario', moduloNombre: 'Inventario' },
  { module: 'inventory', action: 'categories-manage', nombre: 'Gestionar categorías inventario', moduloNombre: 'Inventario' },

  // Supplies
  { module: 'supplies', action: 'view', nombre: 'Ver suministros', moduloNombre: 'Suministros' },
  { module: 'supplies', action: 'create', nombre: 'Crear suministros', moduloNombre: 'Suministros' },
  { module: 'supplies', action: 'edit', nombre: 'Editar suministros', moduloNombre: 'Suministros' },
  { module: 'supplies', action: 'delete', nombre: 'Eliminar suministros', moduloNombre: 'Suministros' },
  { module: 'supplies', action: 'movements-view', nombre: 'Ver movimientos suministros', moduloNombre: 'Suministros' },
  { module: 'supplies', action: 'categories-manage', nombre: 'Gestionar categorías suministros', moduloNombre: 'Suministros' },

  // Consumptions
  { module: 'consumptions', action: 'view', nombre: 'Ver consumos', moduloNombre: 'Consumos' },
  { module: 'consumptions', action: 'create', nombre: 'Registrar consumos', moduloNombre: 'Consumos' },
  { module: 'consumptions', action: 'delete', nombre: 'Eliminar consumos', moduloNombre: 'Consumos' },

  // Housekeeping
  { module: 'housekeeping', action: 'view', nombre: 'Ver housekeeping', moduloNombre: 'Housekeeping' },
  { module: 'housekeeping', action: 'change-status', nombre: 'Cambiar estado limpieza', moduloNombre: 'Housekeeping' },
  { module: 'housekeeping', action: 'request-supplies', nombre: 'Solicitar suministros', moduloNombre: 'Housekeeping' },
  { module: 'housekeeping', action: 'complete', nombre: 'Completar limpieza', moduloNombre: 'Housekeeping' },

  // Amenities
  { module: 'amenities', action: 'view', nombre: 'Ver amenities', moduloNombre: 'Amenidades' },
  { module: 'amenities', action: 'create', nombre: 'Crear amenities', moduloNombre: 'Amenidades' },
  { module: 'amenities', action: 'edit', nombre: 'Editar amenities', moduloNombre: 'Amenidades' },
  { module: 'amenities', action: 'delete', nombre: 'Eliminar amenities', moduloNombre: 'Amenidades' },

  // Services
  { module: 'services', action: 'view', nombre: 'Ver servicios', moduloNombre: 'Servicios' },
  { module: 'services', action: 'create', nombre: 'Crear servicios', moduloNombre: 'Servicios' },
  { module: 'services', action: 'edit', nombre: 'Editar servicios', moduloNombre: 'Servicios' },
  { module: 'services', action: 'delete', nombre: 'Eliminar servicios', moduloNombre: 'Servicios' },

  // Files
  { module: 'files', action: 'view', nombre: 'Ver archivos', moduloNombre: 'Archivos' },
  { module: 'files', action: 'upload', nombre: 'Subir archivos', moduloNombre: 'Archivos' },
  { module: 'files', action: 'delete', nombre: 'Eliminar archivos', moduloNombre: 'Archivos' },

  // Hotel Config
  { module: 'hotel-config', action: 'view', nombre: 'Ver configuración', moduloNombre: 'Config. Hotel' },
  { module: 'hotel-config', action: 'edit', nombre: 'Editar configuración', moduloNombre: 'Config. Hotel' },

  // Expense Categories
  { module: 'expense-categories', action: 'view', nombre: 'Ver categorías egreso', moduloNombre: 'Categorías Egreso' },
  { module: 'expense-categories', action: 'create', nombre: 'Crear categorías egreso', moduloNombre: 'Categorías Egreso' },
  { module: 'expense-categories', action: 'edit', nombre: 'Editar categorías egreso', moduloNombre: 'Categorías Egreso' },
  { module: 'expense-categories', action: 'delete', nombre: 'Eliminar categorías egreso', moduloNombre: 'Categorías Egreso' },

  // Suppliers
  { module: 'suppliers', action: 'view', nombre: 'Ver proveedores', moduloNombre: 'Proveedores' },
  { module: 'suppliers', action: 'create', nombre: 'Crear proveedores', moduloNombre: 'Proveedores' },
  { module: 'suppliers', action: 'edit', nombre: 'Editar proveedores', moduloNombre: 'Proveedores' },
  { module: 'suppliers', action: 'delete', nombre: 'Eliminar proveedores', moduloNombre: 'Proveedores' },

  // Purchase Orders
  { module: 'purchase-orders', action: 'view', nombre: 'Ver órdenes compra', moduloNombre: 'Órdenes Compra' },
  { module: 'purchase-orders', action: 'create', nombre: 'Crear órdenes compra', moduloNombre: 'Órdenes Compra' },
  { module: 'purchase-orders', action: 'edit', nombre: 'Editar órdenes compra', moduloNombre: 'Órdenes Compra' },
  { module: 'purchase-orders', action: 'delete', nombre: 'Eliminar órdenes compra', moduloNombre: 'Órdenes Compra' },
  { module: 'purchase-orders', action: 'approve', nombre: 'Aprobar órdenes compra', moduloNombre: 'Órdenes Compra' },
  { module: 'purchase-orders', action: 'annul', nombre: 'Anular órdenes compra', moduloNombre: 'Órdenes Compra' },

  // Expenses
  { module: 'expenses', action: 'view', nombre: 'Ver egresos', moduloNombre: 'Egresos' },
  { module: 'expenses', action: 'create', nombre: 'Crear egresos', moduloNombre: 'Egresos' },
  { module: 'expenses', action: 'edit', nombre: 'Editar egresos', moduloNombre: 'Egresos' },
  { module: 'expenses', action: 'delete', nombre: 'Eliminar egresos', moduloNombre: 'Egresos' },
  { module: 'expenses', action: 'annul', nombre: 'Anular egresos', moduloNombre: 'Egresos' },
  { module: 'expenses', action: 'report', nombre: 'Ver reporte egresos', moduloNombre: 'Egresos' },

  // Accounts Payable
  { module: 'accounts-payable', action: 'view', nombre: 'Ver ctas. pagar', moduloNombre: 'Ctas. Pagar' },
  { module: 'accounts-payable', action: 'create', nombre: 'Crear ctas. pagar', moduloNombre: 'Ctas. Pagar' },
  { module: 'accounts-payable', action: 'edit', nombre: 'Editar ctas. pagar', moduloNombre: 'Ctas. Pagar' },
  { module: 'accounts-payable', action: 'delete', nombre: 'Eliminar ctas. pagar', moduloNombre: 'Ctas. Pagar' },
  { module: 'accounts-payable', action: 'register-payment', nombre: 'Registrar pago ctas. pagar', moduloNombre: 'Ctas. Pagar' },

  // Payment Methods
  { module: 'payment-methods', action: 'view', nombre: 'Ver métodos pago', moduloNombre: 'Métodos Pago' },
  { module: 'payment-methods', action: 'create', nombre: 'Crear métodos pago', moduloNombre: 'Métodos Pago' },
  { module: 'payment-methods', action: 'edit', nombre: 'Editar métodos pago', moduloNombre: 'Métodos Pago' },
  { module: 'payment-methods', action: 'delete', nombre: 'Eliminar métodos pago', moduloNombre: 'Métodos Pago' },

  // Financial Accounts
  { module: 'financial-accounts', action: 'view', nombre: 'Ver cuentas financieras', moduloNombre: 'Cuentas Financieras' },
  { module: 'financial-accounts', action: 'create', nombre: 'Crear cuentas financieras', moduloNombre: 'Cuentas Financieras' },
  { module: 'financial-accounts', action: 'edit', nombre: 'Editar cuentas financieras', moduloNombre: 'Cuentas Financieras' },
  { module: 'financial-accounts', action: 'delete', nombre: 'Eliminar cuentas financieras', moduloNombre: 'Cuentas Financieras' },

  // Financial Movements
  { module: 'financial-movements', action: 'view', nombre: 'Ver movimientos financieros', moduloNombre: 'Mov. Financieros' },
  { module: 'financial-movements', action: 'create', nombre: 'Crear movimientos manuales', moduloNombre: 'Mov. Financieros' },
  { module: 'financial-movements', action: 'transfer', nombre: 'Realizar transferencias', moduloNombre: 'Mov. Financieros' },
  { module: 'financial-movements', action: 'adjust', nombre: 'Realizar ajustes', moduloNombre: 'Mov. Financieros' },

  // Recibo Caja
  { module: 'recibo-caja', action: 'view', nombre: 'Ver recibos caja', moduloNombre: 'Recibos Caja' },
  { module: 'recibo-caja', action: 'create', nombre: 'Crear recibos caja', moduloNombre: 'Recibos Caja' },
  { module: 'recibo-caja', action: 'delete', nombre: 'Eliminar recibos caja', moduloNombre: 'Recibos Caja' },

  // Tax Config
  { module: 'tax-config', action: 'view', nombre: 'Ver impuestos', moduloNombre: 'Impuestos' },
  { module: 'tax-config', action: 'create', nombre: 'Crear impuestos', moduloNombre: 'Impuestos' },
  { module: 'tax-config', action: 'edit', nombre: 'Editar impuestos', moduloNombre: 'Impuestos' },
  { module: 'tax-config', action: 'delete', nombre: 'Eliminar impuestos', moduloNombre: 'Impuestos' },

  // Users
  { module: 'users', action: 'view', nombre: 'Ver usuarios', moduloNombre: 'Usuarios' },
  { module: 'users', action: 'create', nombre: 'Crear usuarios', moduloNombre: 'Usuarios' },
  { module: 'users', action: 'edit', nombre: 'Editar usuarios', moduloNombre: 'Usuarios' },
  { module: 'users', action: 'delete', nombre: 'Eliminar usuarios', moduloNombre: 'Usuarios' },
  { module: 'users', action: 'manage-roles', nombre: 'Gestionar roles', moduloNombre: 'Usuarios' },

  // Audit Trail
  { module: 'audit-trail', action: 'view', nombre: 'Ver auditoría', moduloNombre: 'Auditoría' },

  // OTA
  { module: 'ota', action: 'view', nombre: 'Ver OTA', moduloNombre: 'OTA' },
  { module: 'ota', action: 'configure', nombre: 'Configurar OTA', moduloNombre: 'OTA' },

  // Permissions (self)
  { module: 'permissions', action: 'view', nombre: 'Ver permisos', moduloNombre: 'Permisos' },
  { module: 'permissions', action: 'manage', nombre: 'Gestionar permisos', moduloNombre: 'Permisos' },
];

// Default permission keys assigned to each role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map(p => `${p.module}:${p.action}`),

  reception: [
    'dashboard:view',
    'reservations:view', 'reservations:create', 'reservations:edit', 'reservations:annul',
    'rooms:view', 'rooms:change-status',
    'room-types:view',
    'guests:view', 'guests:create', 'guests:edit',
    'check-in:view', 'check-in:create',
    'check-out:view', 'check-out:create',
    'orders:view', 'orders:create', 'orders:edit', 'orders:annul',
    'payments:view', 'payments:create',
    'cash-register:view', 'cash-register:open', 'cash-register:close',
    'inventory:view', 'inventory:movements-view',
    'supplies:view', 'supplies:movements-view',
    'consumptions:view', 'consumptions:create',
    'housekeeping:view',
    'amenities:view',
    'services:view',
    'files:view', 'files:upload',
    'hotel-config:view',
    'expense-categories:view',
    'suppliers:view',
    'purchase-orders:view',
    'expenses:view', 'expenses:report',
    'accounts-payable:view',
    'payment-methods:view',
    'financial-accounts:view',
    'financial-movements:view',
    'recibo-caja:view', 'recibo-caja:create',
    'tax-config:view',
  ],

  limpieza: [
    'housekeeping:view', 'housekeeping:change-status', 'housekeeping:complete', 'housekeeping:request-supplies',
    'rooms:view', 'rooms:change-status',
  ],

  mantenimiento: [
    'housekeeping:view', 'housekeeping:change-status',
    'rooms:view', 'rooms:change-status',
  ],
};
