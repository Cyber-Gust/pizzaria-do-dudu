'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';

const Header = () => {
  const { items } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true) }, []);

  const totalItems = isMounted ? items.reduce((acc, item) => acc + item.quantity, 0) : 0;

  // --- ATENÇÃO: COLOQUE SEU LINK DO GOOGLE AQUI ---
  const googleReviewLink = "https://g.page/r/SEU_LINK_AQUI/review";

  const handleReviewClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isAuthenticated) {
      // Impede a navegação se o usuário não estiver logado
      e.preventDefault();
      toast.error("Você precisa estar logado para deixar uma avaliação.");
    }
    // Se estiver logado, o link funcionará normalmente.
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* O Toaster é necessário para as notificações de erro */}
      <Toaster position="top-center" />
      <header className="bg-white shadow-md sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMenuOpen(true)} className="md:hidden">
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Logo Pizzaria do Dudo" width={140} height={33} priority />
            </Link>
          </div>
          <Link href="/carrinho" className="relative flex items-center hover:text-brand-red transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-brand-yellow text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>

        {isMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)}>
            <div className="absolute top-0 left-0 h-full w-4/5 max-w-sm bg-white p-6" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4">
                <X className="h-6 w-6" />
              </button>
              <nav className="mt-12 flex flex-col space-y-6">
                <Link href="/cardapio" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold">Cardápio</Link>
                <Link href="/carrinho" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold">Meu Carrinho</Link>
                {/* O botão agora é um link que abre em uma nova aba */}
                <a 
                  href={googleReviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleReviewClick}
                  className="text-lg font-semibold text-left text-blue-600"
                >
                  Deixar Avaliação
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
