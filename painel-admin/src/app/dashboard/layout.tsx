// src/app/dashboard/layout.tsx
import Sidebar from '@/components/Sidebar';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Importa a imagem diretamente.
// Certifique-se que o ficheiro 'background_dashboard.png' está na mesma pasta (src/app/dashboard/).
import bgImage from './background_dashboard.png';

// Componente do rodapé
const Footer = () => (
    // [CORRIGIDO] Removida a classe 'fixed', pois o flexbox já o posiciona no fundo.
    <footer className="w-full bg-white p-4 text-center text-sm text-gray-500 border-t">
        <p>Desenvolvido com ❤️ por <a href="https://www.bitbloomai.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">BitBloom AI</a> & <a href="#" className="font-semibold text-blue-600 hover:underline">Copy Central</a></p>
    </footer>
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Se não houver sessão, redireciona para o login
  if (!session) {
    redirect('/login');
  }

  return (
    <div 
      className="flex h-screen bg-cover bg-center bg-no-repeat" // [CORRIGIDO] Removida a classe 'overflow-y-auto' daqui.
      style={{ backgroundImage: `url(${bgImage.src})` }}
    >
      <Sidebar />
      {/* Container para o conteúdo principal e o rodapé */}
      <div className="flex flex-col flex-1 overflow-hidden"> {/* overflow-hidden aqui previne barras de scroll duplas */}
        
        {/* [CORRIGIDO] A área de conteúdo principal é agora a que tem a barra de rolagem */}
        <main className="flex-1 p-8 overflow-y-auto bg-white/90 backdrop-blur-sm"> 
          {children}
        </main>
        
        {/* O rodapé fica aqui, fora da área de scroll */}
        <Footer />
      </div>
    </div>
  );
}
