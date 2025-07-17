// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redireciona permanentemente qualquer tráfego da raiz
  // para a página principal do nosso painel.
  redirect('/dashboard');
}