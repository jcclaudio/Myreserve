import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FIX Turismo — Sistema de Cotação de Hospedagens",
  description:
    "Plataforma profissional de cotação, precificação e gestão financeira da FIX Turismo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50 flex flex-col antialiased`}>
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
      </body>
    </html>
  );
}

