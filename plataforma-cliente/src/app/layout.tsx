import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPizzeriaStatus } from "@/lib/api"; // Importar
import { StatusProvider } from "@/components/StatusProvider"; // Importar

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Pizzaria do Dudo",
  description: "Peça online a melhor pizza da cidade!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Buscamos o status aqui, no componente de servidor mais alto
  const pizzeriaStatus = await getPizzeriaStatus();

  return (
    <html lang="pt-BR">
      <body className={`${roboto.className} flex flex-col min-h-screen`}>
        <StatusProvider status={pizzeriaStatus}>
          <Header />
          {/* A classe 'flex-grow' faz o conteúdo principal crescer e empurrar o rodapé para baixo */}
          <main className="flex-grow">{children}</main>
          <Footer />
        </StatusProvider>
      </body>
    </html>
  );
}
