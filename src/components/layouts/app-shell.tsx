import type { UserProfile } from "@/types/domain";
import { BottomNav, MobileTopBar, TopNav } from "./nav";

export function AppShell({ user, children }: { user: UserProfile; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <TopNav user={user} />
      <MobileTopBar user={user} />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-24 lg:px-6 lg:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
