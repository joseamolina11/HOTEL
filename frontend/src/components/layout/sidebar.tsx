import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  Users,
  LogIn,
  LogOut,
  Package,
  Settings,
  ChevronLeft,
  CalendarRange,
  BetweenHorizonalEnd,
  Hotel,
  Boxes,
  ChevronDown,
  Tags,
  History,
  ShoppingCart,
  CreditCard,
  DollarSign,
  Sparkles,
  UserCog,
  Shield,
  Receipt,
  Truck,
  ShoppingBag,
  Landmark,
  Percent,
  Wrench,
  BookOpen,
  ArrowUpDown,
  FileText,
  Zap,
  ClipboardList,
  Building2,
  BarChart3,
  Trash2,
  FileX,
  Wallet,
  PieChart,
  Bell,
} from "lucide-react";

interface GroupItem {
  to: string;
  label: string;
  icon: typeof Package;
  children: {
    to: string;
    label: string;
    icon: typeof Tags;
  }[];
}

const groups: GroupItem[] = [
  {
    to: "/inventory",
    label: "Productos",
    icon: Package,
    children: [
      {
        to: "/inventory",
        label: "Ver Productos",
        icon: Package,
      },
      {
        to: "/inventory/categories",
        label: "Categorías",
        icon: Tags,
      },
      {
        to: "/inventory/movements",
        label: "Movimientos",
        icon: History,
      },
    ],
  },
  {
    to: "/supplies",
    label: "Suministros",
    icon: Boxes,
    children: [
      {
        to: "/supplies",
        label: "Ver Suministros",
        icon: Boxes,
      },
      {
        to: "/supplies/categories",
        label: "Categorías",
        icon: Tags,
      },
      {
        to: "/supplies/movements",
        label: "Movimientos",
        icon: History,
      },
    ],
  },
];

interface NavChild {
  to: string;
  label: string;
  icon: any;
  show?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: any;
  visible: boolean;
  children?: NavChild[];
  subgroups?: GroupItem[];
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const theme = useUIStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({
    "/inventory": true,
    "/supplies": true,
  });

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const userPermissions = user?.permissions ?? [];
  const hasPerm = (perm: string) => isAdmin || userPermissions.includes(perm);

  const navGroups: NavGroup[] = [
    {
      id: 'operacion',
      label: 'Operación',
      icon: LayoutDashboard,
      visible: true,
      children: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: hasPerm('dashboard:view') },
        { to: '/guests', label: 'Clientes', icon: Users, show: hasPerm('guests:view') },
        { to: '/housekeeping', label: 'Housekeeping', icon: Sparkles, show: hasPerm('housekeeping:view') },
      ],
    },
    {
      id: 'hotel',
      label: 'Hotel',
      icon: Hotel,
      visible: true,
      children: [
        { to: '/room-types', label: 'Tipos Habitación', icon: Hotel, show: hasPerm('room-types:view') },
        { to: '/amenities', label: 'Beneficios', icon: BetweenHorizonalEnd, show: hasPerm('amenities:view') },
        { to: '/services', label: 'Servicios', icon: Wrench, show: hasPerm('services:view') },
        { to: '/surcharge-types', label: 'Recargos', icon: Zap, show: hasPerm('surcharges:view') },
        { to: '/terceros', label: 'Terceros', icon: Building2, show: hasPerm('terceros:view') },
        { to: '/bitacoras', label: 'Bitácoras', icon: ClipboardList, show: hasPerm('bitacoras:view') },
        { to: '/notifications', label: 'Notificaciones', icon: Bell, show: true },
      ],
    },
    {
      id: 'estadias',
      label: 'Estadías',
      icon: LogIn,
      visible: hasPerm('check-in:view') || hasPerm('check-out:view'),
      children: [
        { to: '/check-in', label: 'Check-In Reserva', icon: LogIn, show: hasPerm('check-in:view') },
        { to: '/check-out', label: 'Check-Out', icon: LogOut, show: hasPerm('check-out:view') },
      ],
    },
    {
      id: 'ventas',
      label: 'Ventas',
      icon: ShoppingCart,
      visible: hasPerm('orders:view') || hasPerm('payments:view') || hasPerm('cash-register:view'),
      children: [
        { to: '/orders', label: 'Pedidos', icon: ShoppingCart, show: hasPerm('orders:view') },
        { to: '/payments', label: 'Pagos', icon: CreditCard, show: hasPerm('payments:view') },
        { to: '/cash-register', label: 'Caja', icon: DollarSign, show: hasPerm('cash-register:view') },
      ],
    },
    {
      id: 'inventario',
      label: 'Inventario',
      icon: Boxes,
      visible: hasPerm('inventory:view') || hasPerm('supplies:view'),
      subgroups: groups,
    },
    {
      id: 'contabilidad',
      label: 'Contabilidad',
      icon: Landmark,
      visible: true,
      children: [
        { to: '/expense-categories', label: 'Categorías Egreso', icon: Tags, show: hasPerm('expense-categories:view') },
        { to: '/suppliers', label: 'Proveedores', icon: Truck, show: hasPerm('suppliers:view') },
        { to: '/purchase-orders', label: 'Órdenes Compra', icon: ShoppingBag, show: hasPerm('purchase-orders:view') },
        { to: '/expenses', label: 'Egresos', icon: Receipt, show: hasPerm('expenses:view') },
        { to: '/accounts-payable', label: 'Ctas. por Pagar', icon: BookOpen, show: hasPerm('accounts-payable:view') },
        { to: '/payment-methods', label: 'Métodos Pago', icon: CreditCard, show: hasPerm('payment-methods:view') },
        { to: '/financial-accounts', label: 'Cuentas Financieras', icon: Landmark, show: hasPerm('financial-accounts:view') },
        { to: '/financial-movements', label: 'Movimientos Financieros', icon: ArrowUpDown, show: hasPerm('financial-movements:view') },
        { to: '/recibo-caja', label: 'Recibos de Caja', icon: FileText, show: hasPerm('recibo-caja:view') },
        { to: '/tax-config', label: 'Impuestos', icon: Percent, show: hasPerm('tax-config:view') },
      ],
    },
{
          id: 'reportes',
          label: 'Reportes',
          icon: BarChart3,
          visible: hasPerm('reports:view'),
          children: [
            { to: '/reports', label: 'Terceros', icon: BarChart3, show: hasPerm('reports:view') },
            { to: '/reports/inventory', label: 'Inventario', icon: Package, show: hasPerm('reports:view') },
            { to: '/reports/supplies', label: 'Suministros', icon: Boxes, show: hasPerm('reports:view') },
            { to: '/reports/cash-register', label: 'Caja', icon: DollarSign, show: hasPerm('reports:view') },
            { to: '/reports/rooms', label: 'Habitaciones', icon: BedDouble, show: hasPerm('reports:view') },
            { to: '/reports/expenses', label: 'Gastos', icon: Receipt, show: hasPerm('reports:view') },
          ],
        },
    {
      id: 'control-registros',
      label: 'Control Registros',
      icon: ClipboardList,
      visible: hasPerm('record-control:view'),
      children: [
        { to: '/record-control/deleted-reservations', label: 'Reservas Eliminadas', icon: Trash2, show: hasPerm('record-control:view') },
        { to: '/record-control/deleted-surcharges', label: 'Recargos Eliminados', icon: FileX, show: hasPerm('record-control:view') },
        { to: '/record-control/discounts', label: 'Descuentos Realizados', icon: Percent, show: hasPerm('record-control:view') },
        { to: '/record-control/unpaid-reservations', label: 'Reservas Sin Pagar', icon: Wallet, show: hasPerm('record-control:view') },
      ],
    },
    {
      id: 'estadisticas',
      label: 'Estadísticas',
      icon: BarChart3,
      visible: hasPerm('statistics:view') || hasPerm('dashboard-gerencial:view'),
      children: [
        { to: '/statistics/gerencial', label: 'Gerencial', icon: PieChart, show: hasPerm('statistics:view') },
        { to: '/dashboard-gerencial', label: 'Dashboard Gerencial', icon: BarChart3, show: hasPerm('dashboard-gerencial:view') },
        { to: '/calendar-gerencial', label: 'Calendario Gerencial', icon: CalendarRange, show: hasPerm('dashboard-gerencial:view') },
      ],
    },
  ];

  const toggleGroup = (to: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [to]: !prev[to],
    }));
  };

  const SectionTitle = ({ title }: { title: string }) => {
    if (!sidebarOpen) return null;

    return (
      <div className="px-3 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-muted/60">
          {title}
        </p>
      </div>
    );
  };

  const NavLinkItem = ({
    to,
    label,
    icon: Icon,
    className,
    show = true,
  }: {
    to: string;
    label: string;
    icon: any;
    className?: string;
    show?: boolean;
  }) => {
    if (!show) return null;
    return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative mx-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
          !sidebarOpen && "justify-center px-2",
          className,
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />

      {sidebarOpen && (
        <span className="truncate">
          {label}
        </span>
      )}

      {!sidebarOpen && (
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-black px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-all group-hover:opacity-100">
          {label}
        </div>
      )}
    </NavLink>
  );
  };

  const FlyoutLink = ({
    to,
    label,
    icon: Icon,
  }: {
    to: string;
    label: string;
    icon: any;
  }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground"
            : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );

  const GroupSection = ({ group }: { group: NavGroup }) => {
    if (!group.visible) return null;

    const visibleChildren = (group.children || []).filter((c) => c.show);
    const visibleSubgroups = (group.subgroups || []).filter((sub) =>
      sub.to === '/inventory' ? hasPerm('inventory:view') : hasPerm('supplies:view'),
    );
    if (visibleChildren.length === 0 && visibleSubgroups.length === 0) return null;

    const expanded = expandedGroups[group.id];

    return (
      <div
        className="relative"
        onMouseEnter={() => !sidebarOpen && setHoveredGroup(group.id)}
        onMouseLeave={() => !sidebarOpen && setHoveredGroup(null)}
      >
        <button
          onClick={() => sidebarOpen && toggleGroup(group.id)}
          className={cn(
            "group relative mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
            !sidebarOpen && "justify-center px-2",
          )}
        >
          <group.icon className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span className="truncate">{group.label}</span>}
          {sidebarOpen && (
            <ChevronDown
              className={cn(
                "ml-auto h-4 w-4 shrink-0 transition-transform",
                expanded && "rotate-180",
              )}
            />
          )}
        </button>

        {sidebarOpen && expanded && (
          <div className="ml-6 mr-2 mt-1 space-y-0.5 border-l border-sidebar-border pl-2">
            {visibleChildren.map((child) => (
              <NavLinkItem
                key={child.to}
                to={child.to}
                label={child.label}
                icon={child.icon}
                className="py-2 text-xs"
              />
            ))}
            {visibleSubgroups.map((sub) => {
              const subExpanded = expandedGroups[sub.to];
              return (
                <div key={sub.to}>
                  <button
                    onClick={() => toggleGroup(sub.to)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <sub.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-3.5 w-3.5 shrink-0 transition-transform",
                        subExpanded && "rotate-180",
                      )}
                    />
                  </button>
                  {subExpanded && (
                    <div className="ml-4 border-l border-sidebar-border pl-2">
                      {sub.children.map((child) => (
                        <NavLinkItem
                          key={child.to}
                          to={child.to}
                          label={child.label}
                          icon={child.icon}
                          className="py-2 text-xs"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!sidebarOpen && hoveredGroup === group.id && (
          <div className="absolute left-full top-0 z-50 ml-2 min-w-[220px] rounded-xl border border-sidebar-border bg-sidebar p-2 shadow-2xl">
            <div className="mb-2 border-b border-sidebar-border px-2 pb-2 text-sm font-semibold text-sidebar-foreground">
              {group.label}
            </div>
            {visibleChildren.map((child) => (
              <FlyoutLink key={child.to} to={child.to} label={child.label} icon={child.icon} />
            ))}
            {visibleSubgroups.map((sub) => (
              <div key={sub.to} className="mt-2">
                <div className="px-3 pb-1 text-xs font-semibold uppercase text-sidebar-muted/70">
                  {sub.label}
                </div>
                {sub.children.map((child) => (
                  <FlyoutLink key={child.to} to={child.to} label={child.label} icon={child.icon} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16",
      )}
    >
      {/* HEADER */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-3">
        {sidebarOpen ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {
              theme === 'dark' ? (
                <img
                  src="/logo-blanco.png"
                  alt="Hotel Luxury VIP"
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <img
                  src="/logo-negro.png"
                  alt="Hotel Luxury VIP"
                  className="h-7 w-7 object-contain"
                />
              )
            }
            </div>

            <div>
              <h2 className="text-sm font-semibold text-sidebar-foreground">
                Hotel Luxury VIP
              </h2>
              <p className="text-xs text-sidebar-muted">
                Management System
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <img
              src="/logo-blanco.png"
              alt="Hotel Luxury VIP"
              className="h-7 w-7 object-contain"
            />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className={cn(
            "rounded-lg p-1.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
            sidebarOpen && "ml-auto",
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              !sidebarOpen && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* CONTENIDO */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <NavLinkItem
          to="/rooms"
          label="Habitaciones"
          icon={BedDouble}
          show={hasPerm('rooms:view')}
        />

        <NavLinkItem
          to="/reservations"
          label="Reservas"
          icon={CalendarDays}
          show={hasPerm('reservations:view')}
        />

        <NavLinkItem
          to="/calendar"
          label="Calendario"
          icon={CalendarRange}
          show={hasPerm('rooms:view')}
        />

        <SectionTitle title="Módulos" />

        {navGroups.map((group) => (
          <GroupSection key={group.id} group={group} />
        ))}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-sidebar-border py-2">
        <NavLinkItem
          to="/permissions"
          label="Roles y Permisos"
          icon={Shield}
          show={isAdmin}
        />
        <NavLinkItem
          to="/users"
          label="Usuarios"
          icon={UserCog}
          show={isAdmin}
        />
        <NavLinkItem
          to="/settings"
          label="Configuración"
          icon={Settings}
          show={isAdmin}
        />
      </div>
    </aside>
  );
}