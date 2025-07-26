'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu } from 'lucide-react';
import bgImage from './background_dashboard.png';

// 1. Importe o SoundProvider e o SoundToggleButton que criamos
import { SoundProvider, SoundToggleButton } from '@/components/SoundProvider';

// Componente do rodapé (sem alterações)
const Footer = () => (
    <footer className="w-full bg-white p-4 text-center text-sm text-gray-500 border-t">
        <p>Desenvolvido com ❤️ por <a href="https://www.bitbloomai.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">BitBloom AI</a> & <a href="#" className="font-semibold text-blue-600 hover:underline">Copy Central</a></p>
    </footer>
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        // 2. Envolva todo o conteúdo do layout com o SoundProvider
        <SoundProvider>
            <div 
                className="flex h-screen bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${bgImage.src})` }}
            >
                {isSidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* 3. Modificamos o cabeçalho para ser visível em todas as telas e conter o botão de som */}
                    <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
                        {/* Botão de Menu para mobile */}
                        <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-gray-600 md:hidden">
                            <Menu size={28} />
                        </button>
                        {/* Título que aparece em todas as telas */}
                        <h1 className="text-lg font-bold text-gray-800">Painel Forneria 360</h1>
                        
                        {/* 4. Adicione o botão de controle de som aqui */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 hidden sm:inline">Notificações:</span>
                            <SoundToggleButton />
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-8 overflow-y-auto bg-white/90 backdrop-blur-sm"> 
                        {children}
                    </main>
                    
                    <Footer />
                </div>
            </div>
        </SoundProvider>
    );
}
