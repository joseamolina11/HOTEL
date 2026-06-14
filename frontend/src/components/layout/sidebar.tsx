import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui.store";
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

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const [expandedGroups, setExpandedGroups] = useState<
    Record<string, boolean>
  >({
    "/inventory": true,
    "/supplies": true,
  });

  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

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
  }: {
    to: string;
    label: string;
    icon: any;
    className?: string;
  }) => (
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
              <img
                src="/logo-blanco.png"
                alt="Hotel Luxury VIP"
                className="h-8 w-8 object-contain"
              />
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
        <SectionTitle title="Operación" />

        <NavLinkItem
          to="/dashboard"
          label="Dashboard"
          icon={LayoutDashboard}
        />

        <NavLinkItem
          to="/reservations"
          label="Reservas"
          icon={CalendarDays}
        />

        <NavLinkItem
          to="/rooms"
          label="Habitaciones"
          icon={BedDouble}
        />

        <NavLinkItem
          to="/calendar"
          label="Calendario"
          icon={CalendarRange}
        />

        <NavLinkItem
          to="/guests"
          label="Huéspedes"
          icon={Users}
        />

        <SectionTitle title="Hotel" />

        <NavLinkItem
          to="/room-types"
          label="Tipos Habitación"
          icon={Hotel}
        />

        <NavLinkItem
          to="/amenities"
          label="Beneficios"
          icon={BetweenHorizonalEnd}
        />

        <NavLinkItem
          to="/check-in"
          label="Check-In"
          icon={LogIn}
        />

        <NavLinkItem
          to="/check-out"
          label="Check-Out"
          icon={LogOut}
        />

        <SectionTitle title="Ventas" />

        <NavLinkItem
          to="/orders"
          label="Pedidos"
          icon={ShoppingCart}
        />

        <NavLinkItem
          to="/payments"
          label="Pagos"
          icon={CreditCard}
        />

        <NavLinkItem
          to="/cash-register"
          label="Caja"
          icon={DollarSign}
        />

        <SectionTitle title="Inventario" />

        {groups.map((group) => (
          <div
            key={group.to}
            className="relative"
            onMouseEnter={() =>
              !sidebarOpen && setHoveredGroup(group.to)
            }
            onMouseLeave={() =>
              !sidebarOpen && setHoveredGroup(null)
            }
          >
            <div className="relative">
              <NavLinkItem
                to={group.to}
                label={group.label}
                icon={group.icon}
              />

              {sidebarOpen && (
                <button
                  onClick={() => toggleGroup(group.to)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md p-1 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      expandedGroups[group.to] && "rotate-180",
                    )}
                  />
                </button>
              )}
            </div>

            {sidebarOpen && expandedGroups[group.to] && (
              <div className="ml-6 mr-2 mt-1 border-l border-sidebar-border pl-2">
                {group.children.map((child) => (
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

            {!sidebarOpen &&
              hoveredGroup === group.to && (
                <div className="absolute left-full top-0 z-50 ml-2 min-w-[220px] rounded-xl border border-sidebar-border bg-sidebar p-2 shadow-2xl">
                  <div className="mb-2 border-b border-sidebar-border px-2 pb-2 text-sm font-semibold text-sidebar-foreground">
                    {group.label}
                  </div>

                  {group.children.map((child) => {
                    const ChildIcon = child.icon;

                    return (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-foreground"
                              : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground",
                          )
                        }
                      >
                        <ChildIcon className="h-4 w-4" />
                        {child.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
          </div>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="border-t border-sidebar-border py-2">
        <NavLinkItem
          to="/settings"
          label="Configuración"
          icon={Settings}
        />
      </div>
    </aside>
  );
}