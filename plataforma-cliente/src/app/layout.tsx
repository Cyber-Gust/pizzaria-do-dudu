// src/app/layout.tsx

import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
// 1. A busca de dados no servidor foi removida daqui
import { StatusProvider } from "@/components/StatusProvider"; // Importar

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Forneria 360",
  description: "Peça online a melhor pizza da cidade!",
};

// 2. A função não precisa mais ser 'async'
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${roboto.className} flex flex-col min-h-screen`}>
        {/* 3. O StatusProvider agora envolve a aplicação sem receber props.
            Ele mesmo buscará o status inicial e ouvirá por atualizações. */}
        <StatusProvider>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </StatusProvider>
      </body>
    </html>
  );
}
