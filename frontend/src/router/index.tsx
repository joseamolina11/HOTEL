import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute, RoleGuard } from './protected-route';
import { LoginPage } from '@/pages/auth/login.page';
import { DashboardPage } from '@/pages/dashboard/dashboard.page';
import { ReservationsListPage } from '@/pages/reservations/reservations-list.page';
import { RoomsListPage } from '@/pages/rooms/rooms-list.page';
import { RoomTypesPage } from '@/pages/room-types/room-types.page';
import { GuestsListPage } from '@/pages/guests/guests-list.page';
import { CheckInListPage } from '@/pages/check-in/check-in-list.page';
import { CheckOutListPage } from '@/pages/check-out/check-out-list.page';
import { InventoryPage } from '@/pages/inventory/inventory.page';
import { InventoryCategoriesPage } from '@/pages/inventory/inventory-categories.page';
import { InventoryMovementsPage } from '@/pages/inventory/inventory-movements.page';
import { SuppliesPage } from '@/pages/supplies/supplies.page';
import { SupplyCategoriesPage } from '@/pages/supplies/supply-categories.page';
import { SupplyMovementsPage } from '@/pages/supplies/supply-movements.page';
import { SettingsPage } from '@/pages/settings/settings.page';
import { AmemitiesListPage } from '@/pages/amenities/amemities-list.page';
import { CalendarPage } from '@/pages/calendar/calendar.page';
import { OrdersPage } from '@/pages/orders/orders.page';
import { PaymentsPage } from '@/pages/payments/payments.page';
import { CashRegisterPage } from '@/pages/cash-register/cash-register.page';
import { UsersListPage } from '@/pages/users/users-list.page';
import { HousekeepingPage } from '@/pages/housekeeping/housekeeping.page';
import { ExpenseCategoriesListPage } from '@/pages/expense-categories/expense-categories-list.page';
import { SuppliersListPage } from '@/pages/suppliers/suppliers-list.page';
import { PurchaseOrdersListPage } from '@/pages/purchase-orders/purchase-orders-list.page';
import { ExpensesListPage } from '@/pages/expenses/expenses-list.page';
import { ServicesListPage } from '@/pages/services/services-list.page';
import { TaxConfigListPage } from '@/pages/tax-config/tax-config-list.page';
import { AccountsPayableListPage } from '@/pages/accounts-payable/accounts-payable-list.page';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'reservations', element: <ReservationsListPage /> },
      { path: 'rooms', element: <RoomsListPage /> },
      { path: 'room-types', element: <RoomTypesPage /> },
      { path: 'guests', element: <GuestsListPage /> },
      { path: 'check-in', element: <CheckInListPage /> },
      { path: 'check-out', element: <CheckOutListPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/categories', element: <InventoryCategoriesPage /> },
      { path: 'inventory/movements', element: <InventoryMovementsPage /> },
      { path: 'supplies', element: <SuppliesPage /> },
      { path: 'supplies/categories', element: <SupplyCategoriesPage /> },
      { path: 'supplies/movements', element: <SupplyMovementsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'amenities', element: <AmemitiesListPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'cash-register', element: <CashRegisterPage /> },
      { path: 'expense-categories', element: <ExpenseCategoriesListPage /> },
      { path: 'suppliers', element: <SuppliersListPage /> },
      { path: 'purchase-orders', element: <PurchaseOrdersListPage /> },
      { path: 'expenses', element: <ExpensesListPage /> },
      { path: 'services', element: <ServicesListPage /> },
      { path: 'tax-config', element: <TaxConfigListPage /> },
      { path: 'accounts-payable', element: <AccountsPayableListPage /> },
      { path: 'users', element: <RoleGuard roles={['admin']}><UsersListPage /></RoleGuard> },
      { path: 'housekeeping', element: <HousekeepingPage /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
