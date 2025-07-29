// src/app/layout.tsx

import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// A busca de dados foi removida daqui
import { StatusProvider } from "@/components/StatusProvider"; // Apenas o import do provedor

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Forneria 360",
  description: "Peça online a melhor pizza da cidade!",
};

// A função não precisa mais ser 'async'
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.className} flex flex-col min-h-screen`}>
        {/* O StatusProvider agora controla o seu próprio estado */}
        <StatusProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </StatusProvider>
      </body>
    </html>
  );
}
