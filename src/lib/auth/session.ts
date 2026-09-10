import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRepository, DEMO_PASSWORD } from "@/lib/data";
import { can, type Permission } from "@/domain/auth/permissions";
import type { UserProfile } from "@/types/domain";

export const SESSION_COOKIE = "mv_session";

export async function getCurrentUser(): Promise<UserProfile | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const profile = getRepository().findProfileById(userId);
  if (!profile || !profile.active) return null;
  return profile;
}

export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission): Promise<UserProfile> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    redirect("/sin-permiso");
  }
  return user;
}

export async function signIn(email: string, password: string): Promise<UserProfile | null> {
  const profile = getRepository().findProfileByEmail(email.trim().toLowerCase());
  if (!profile || !profile.active) return null;
  if (password !== DEMO_PASSWORD) return null;
  const store = await cookies();
  store.set(SESSION_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return profile;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
