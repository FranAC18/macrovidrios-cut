"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  Cog,
  History,
  LayoutDashboard,
  Package,
  Scissors,
  SquareStack,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
}

const ICONS = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  cutting: Scissors,
  production: Package,
  customers: Users,
  remnants: SquareStack,
  sheets: Boxes,
  history: History,
  config: Cog,
} as const;

export const DESKTOP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/cuadres", label: "Cuadres", icon: "cutting" },
  { href: "/produccion", label: "Produccion", icon: "production" },
  { href: "/clientes", label: "Clientes", icon: "customers" },
  { href: "/retazos", label: "Retazos", icon: "remnants" },
  { href: "/planchas", label: "Planchas", icon: "sheets" },
  { href: "/historial", label: "Historial", icon: "history" },
  { href: "/configuracion", label: "Configuracion", icon: "config" },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/pedidos", label: "Pedidos", icon: "orders" },
  { href: "/cuadres", label: "Cuadres", icon: "cutting" },
  { href: "/produccion", label: "En corte", icon: "production" },
  { href: "/retazos", label: "Retazos", icon: "remnants" },
  { href: "/historial", label: "Historial", icon: "history" },
];

export function NavLinks({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={className}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  return (
    <nav className="grid h-16 grid-cols-5 border-t border-border bg-card">
      {MOBILE_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-[44px] flex-col items-center justify-center gap-1 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
