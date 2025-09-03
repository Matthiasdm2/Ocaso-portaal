import "./globals.css";

import type { Metadata } from "next";

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "OCASO — Slim tweedehands kopen en verkopen",
  description: "Marktplaats met AI-zoek en prijscontrole",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
