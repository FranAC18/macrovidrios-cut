import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MacroVidrios Cut",
    template: "%s · MacroVidrios Cut",
  },
  description: "Gestion de pedidos, inventario, cuadre, produccion y trazabilidad para vidrierias.",
  manifest: "/manifest.webmanifest",
  applicationName: "MacroVidrios Cut",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MacroVidrios Cut",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e376c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="font-sans">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
