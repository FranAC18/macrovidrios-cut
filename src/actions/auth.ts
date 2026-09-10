"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";

export interface ActionState {
  error?: string;
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos invalidos." };
  }
  const user = await signIn(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Correo o contrasena incorrectos." };
  }
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}
