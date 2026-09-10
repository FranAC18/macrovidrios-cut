import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MacroVidrios Cut",
    template: "%s · MacroVidrios Cut",
  },
  description:
    "Gestion de pedidos, inventario, cuadre, produccion y trazabilidad para vidrierias.",
  manifest: "/manifest.webmanifest",
  applicationName: "MacroVidrios Cut",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MacroVidrios Cut",
  },
};

export const viewport: Viewport = {
  themeColor: "#0369a1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
