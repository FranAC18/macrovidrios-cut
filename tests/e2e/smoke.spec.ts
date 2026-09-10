import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("login demo y navegacion principal", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "MacroVidrios Cut" })).toBeVisible();
  await login(page);
  await expect(page.getByText("Pedidos pendientes")).toBeVisible();
});

test("protege rutas sin sesion", async ({ page }) => {
  await page.goto("/pedidos");
  await expect(page).toHaveURL(/\/login/);
});

test("abre el asistente de cuadre", async ({ page }) => {
  await login(page);
  await page.goto("/cuadres/nuevo");
  await expect(page.getByText("Selecciona pedidos y piezas")).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuar/ })).toBeVisible();
});

test("cuadra un trabajo de corte de punta a punta", async ({ page }) => {
  await login(page);
  await page.goto("/cuadres/nuevo");

  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await expect(page.getByRole("heading", { name: "Fuente de material" })).toBeVisible();

  await page.getByRole("button", { name: /Planchas \+ retazos/ }).click();
  await page.getByRole("button", { name: /Continuar/ }).click();
  await expect(page.getByRole("heading", { name: "Confirmar cuadre" })).toBeVisible();

  await page.getByRole("button", { name: /Cuadrar vidrio/ }).click();
  await expect(page).toHaveURL(/\/cuadres\/[0-9a-f-]+/);
  await expect(page.getByText("Aprovechamiento")).toBeVisible();
  await expect(page.getByText("Secuencia de corte")).toBeVisible();
});
