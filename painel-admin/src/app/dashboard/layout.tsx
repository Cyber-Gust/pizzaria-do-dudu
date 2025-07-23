// src/app/dashboard/layout.tsx
'use client'; // [NOVO] Precisa de ser um Client Component para usar estado

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Menu } from 'lucide-react'; // [NOVO] Ícone do menu sanduíche

// Importa a imagem diretamente.
import bgImage from './background_dashboard.png';

// Componente do rodapé
const Footer = () => (
    <footer className="w-full bg-white p-4 text-center text-sm text-gray-500 border-t">
        <p>Desenvolvido com ❤️ por <a href="https://www.bitbloomai.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">BitBloom AI</a> & <a href="#" className="font-semibold text-blue-600 hover:underline">Copy Central</a></p>
    </footer>
);

// [MODIFICADO] O layout agora é um Client Component
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // [NOVO] Estado para controlar a visibilidade da sidebar no mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      {/* [NOVO] Sobreposição escura para o fundo quando o menu está aberto no mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* [NOVO] Cabeçalho que só aparece no mobile e contém o botão de menu */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
          <h1 className="text-lg font-bold text-gray-800">Painel Forneria 360</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-gray-600">
            <Menu size={28} />
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/90 backdrop-blur-sm"> 
          {children}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
