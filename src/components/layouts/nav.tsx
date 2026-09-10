"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronDown,
  ClipboardList,
  Cog,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Scissors,
  SquareStack,
  Users,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { roleLabel } from "@/domain/auth/permissions";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/domain";

type Icon = ComponentType<{ className?: string }>;

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

const ICONS: Record<string, Icon> = {
  dashboard: LayoutDashboard,
  orders: ClipboardList,
  cutting: Scissors,
  production: Package,
  customers: Users,
  remnants: SquareStack,
  sheets: Boxes,
  history: History,
  config: Cog,
};

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: ICONS.dashboard },
  { href: "/pedidos", label: "Pedidos", icon: ICONS.orders },
  { href: "/cuadres", label: "Cuadres", icon: ICONS.cutting },
  { href: "/produccion", label: "Produccion", icon: ICONS.production },
  { href: "/retazos", label: "Retazos", icon: ICONS.remnants },
];

const SECONDARY: NavItem[] = [
  { href: "/clientes", label: "Clientes", icon: ICONS.customers },
  { href: "/planchas", label: "Planchas", icon: ICONS.sheets },
  { href: "/historial", label: "Historial", icon: ICONS.history },
  { href: "/configuracion", label: "Configuracion", icon: ICONS.config },
];

const MOBILE: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: ICONS.dashboard },
  { href: "/pedidos", label: "Pedidos", icon: ICONS.orders },
  { href: "/cuadres", label: "Cortes", icon: ICONS.cutting },
  { href: "/retazos", label: "Retazos", icon: ICONS.remnants },
  { href: "/historial", label: "Historial", icon: ICONS.history },
];

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useSlidingPill(activeIndex: number, containerRef: React.RefObject<HTMLElement | null>) {
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>("[data-nav-item]");
    const el = items[activeIndex];
    if (!el) {
      setPill((current) => ({ ...current, opacity: 0 }));
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const itemRect = el.getBoundingClientRect();
    setPill({ left: itemRect.left - containerRect.left, width: itemRect.width, opacity: 1 });
  }, [activeIndex, containerRef]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return pill;
}

function PrimaryNav({ pathname }: { pathname: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(
    0,
    PRIMARY.findIndex((item) => isActive(pathname, item.href)),
  );
  const pill = useSlidingPill(activeIndex, containerRef);

  return (
    <div
      ref={containerRef}
      className="relative hidden items-center gap-1 rounded-full bg-muted p-1 lg:flex"
    >
      <span
        aria-hidden
        className="absolute top-1 bottom-1 rounded-full bg-card shadow-panel transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]"
        style={{ left: pill.left, width: pill.width, opacity: pill.opacity }}
      />
      {PRIMARY.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-nav-item
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={hostRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        Mas
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="panel-elevated animate-rise absolute right-0 top-[calc(100%+10px)] z-50 w-56 p-2">
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ user }: { user: UserProfile }) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(event: MouseEvent) {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const initials = user.full_name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div ref={hostRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 shadow-panel transition-colors hover:border-primary"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden max-w-[120px] truncate text-[13px] font-semibold sm:block">
          {user.full_name}
        </span>
      </button>
      {open ? (
        <div className="panel-elevated animate-rise absolute right-0 top-[calc(100%+10px)] z-50 w-60 p-2">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function TopNav({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  return (
    <div className="fixed inset-x-0 top-3 z-50 hidden justify-center px-4 lg:flex">
      <nav className="flex h-14 w-full max-w-6xl items-center justify-between gap-4 rounded-full border border-border bg-card/95 px-3 shadow-panel backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2.5 pl-1">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </span>
          <span className="font-display text-[15px] font-extrabold tracking-tight">
            MacroVidrios Cut
          </span>
        </Link>
        <PrimaryNav pathname={pathname} />
        <div className="flex items-center gap-1">
          <MoreMenu pathname={pathname} />
          <UserMenu user={user} />
        </div>
      </nav>
    </div>
  );
}

export function MobileTopBar({ user }: { user: UserProfile }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-4 lg:hidden">
      <nav className="flex h-12 w-full max-w-2xl items-center justify-between rounded-full border border-border bg-card/95 px-3 py-2 shadow-panel backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scissors className="h-3.5 w-3.5" />
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight">MacroVidrios</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label="Mas opciones"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
          </button>
          <UserMenu user={user} />
        </div>
      </nav>
      {open ? (
        <div className="panel-elevated animate-rise absolute left-4 right-4 top-16 z-50 grid grid-cols-2 gap-1 p-2">
          {[...PRIMARY, ...SECONDARY].map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = Math.max(
    0,
    MOBILE.findIndex((item) => isActive(pathname, item.href)),
  );
  const pill = useSlidingPill(activeIndex, containerRef);

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-4 lg:hidden">
      <div
        ref={containerRef}
        className="relative flex w-full max-w-md items-center justify-around rounded-full border border-border bg-card/95 p-1.5 shadow-elevated backdrop-blur"
      >
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 rounded-full bg-accent transition-all duration-300 ease-[cubic-bezier(0.2,1,0.3,1)]"
          style={{ left: pill.left, width: pill.width, opacity: pill.opacity }}
        />
        {MOBILE.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              data-nav-item
              className={cn(
                "relative z-10 flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 text-[10.5px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
