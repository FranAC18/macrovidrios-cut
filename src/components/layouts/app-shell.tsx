import Link from "next/link";
import { LogOut, Scissors } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { roleLabel } from "@/domain/auth/permissions";
import type { UserProfile } from "@/types/domain";
import { DESKTOP_NAV, MobileNavLinks, NavLinks } from "./nav";

export function AppShell({ user, children }: { user: UserProfile; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">MacroVidrios Cut</p>
            <p className="text-[11px] text-muted-foreground">Corta mejor. Desperdicia menos.</p>
          </div>
        </div>
        <NavLinks items={DESKTOP_NAV} className="flex-1 space-y-1 overflow-y-auto p-3" />
        <div className="border-t border-border p-3">
          <div className="mb-2">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <Badge variant="secondary" className="mt-1">
              {roleLabel(user.role)}
            </Badge>
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" className="w-full justify-start" type="submit">
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </Button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold">MacroVidrios Cut</span>
          </Link>
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground">
              Hola, <span className="font-medium text-foreground">{user.full_name}</span>
            </p>
          </div>
          <form action={logoutAction} className="lg:hidden">
            <Button variant="ghost" size="icon" type="submit" aria-label="Cerrar sesion">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </header>

        <main className="px-4 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        <MobileNavLinks />
      </div>
    </div>
  );
}
