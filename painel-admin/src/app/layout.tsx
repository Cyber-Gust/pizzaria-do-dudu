// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // A linha mais importante!

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Painel Forneria 360',
  description: 'Painel de controle para a Pizzaria Forneria 360',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}