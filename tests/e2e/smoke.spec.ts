import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

// Espera a que el select sea controlado por React (post-hidratacion) antes de continuar.
async function selectStable(page: Page, locator: ReturnType<Page["getByLabel"]>, label: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await locator.selectOption({ label });
    if (await locator.inputValue()) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`No se pudo seleccionar ${label}`);
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

test("crea un pedido y lo cuadra de punta a punta", async ({ page }) => {
  await login(page);

  // Crea un pedido propio para no depender de la cola sembrada (tests repetibles).
  await page.goto("/pedidos/nuevo", { waitUntil: "networkidle" });
  const group = page.locator('[id^="group-"]').first();
  await selectStable(page, group.getByLabel("Color"), "Claro");
  await selectStable(page, group.getByLabel("Espesor"), "6 mm");
  await group.getByLabel(/Ancho/).fill("120");
  await group.getByLabel(/Alto/).fill("80");
  await group.getByLabel(/Cantidad/).fill("2");
  await page.getByRole("button", { name: /Crear pedido/ }).click();
  await expect(page).toHaveURL(/\/pedidos\/[0-9a-f-]+/);
  const orderNumber = (await page.getByRole("heading", { level: 1 }).innerText()).trim();

  // Cuadra ese pedido puntual (identificado por su numero).
  await page.goto("/cuadres/nuevo", { waitUntil: "networkidle" });
  await page.locator("label", { hasText: orderNumber }).first().getByRole("checkbox").check();
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
