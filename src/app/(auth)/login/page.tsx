import { redirect } from "next/navigation";
import { Scissors } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-panel">
            <Scissors className="h-7 w-7" />
          </div>
          <span className="eyebrow">Corta mejor. Desperdicia menos.</span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">MacroVidrios Cut</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona pedidos, cuadra el vidrio y controla el taller.
          </p>
        </div>
        <Card className="panel-elevated">
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <CardDescription>Usa una cuenta del taller para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
            <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">Cuentas de demostracion</p>
              <p className="mt-1 font-mono">admin@macrovidrios.com · supervisor@macrovidrios.com</p>
              <p className="font-mono">vendedor@macrovidrios.com · cortador@macrovidrios.com</p>
              <p className="mt-1">
                Contrasena: <span className="code-chip">macrovidrios</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
