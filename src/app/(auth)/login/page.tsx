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
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scissors className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">MacroVidrios Cut</h1>
          <p className="text-sm text-muted-foreground">Corta mejor. Desperdicia menos.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <CardDescription>Usa una cuenta del taller para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Cuentas de demostracion</p>
              <p>admin@macrovidrios.com · supervisor@macrovidrios.com</p>
              <p>vendedor@macrovidrios.com · cortador@macrovidrios.com</p>
              <p className="mt-1">Contrasena: macrovidrios</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
