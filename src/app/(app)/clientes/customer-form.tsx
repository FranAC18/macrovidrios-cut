"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction, type CustomerActionState } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";

const initialState: CustomerActionState = {};

export function CustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo cliente</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Nombre o razon social *</Label>
              <Input id="full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="identification_number">Identificacion</Label>
              <Input id="identification_number" name="identification_number" inputMode="numeric" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" inputMode="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" inputMode="tel" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Direccion</Label>
              <Input id="address" name="address" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
          </div>
          <FieldError>{state.error}</FieldError>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar cliente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
