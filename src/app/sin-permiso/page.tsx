import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Sin permisos" };

export default function NoPermissionPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="flex max-w-md flex-col items-center gap-3 p-10 text-center">
        <ShieldAlert className="h-8 w-8 text-amber-600" />
        <h1 className="text-xl font-bold">Sin permisos</h1>
        <p className="text-sm text-muted-foreground">
          Tu rol no tiene acceso a esta seccion. Solicita acceso a un administrador.
        </p>
        <Link href="/dashboard" className={buttonVariants()}>
          Volver al dashboard
        </Link>
      </Card>
    </div>
  );
}
