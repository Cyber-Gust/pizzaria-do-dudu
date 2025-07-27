'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { toast, Toaster } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';

export default function CartPage() {
  const { items, increaseQuantity, decreaseQuantity, removeItem } = useCartStore();
  const { isAuthenticated } = useUserStore();
  const router = useRouter();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const subtotal = items.reduce((acc, item) => {
    const extrasTotal = item.extras.reduce((extraAcc, extra) => extraAcc + extra.price, 0);
    const itemTotal = (item.product.price + extrasTotal) * item.quantity;
    return acc + itemTotal;
  }, 0);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
      return;
    }
    router.push('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto text-center px-4 py-16">
        <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
        <p className="text-gray-600 mb-8">
          Adicione algumas delícias para começar!
        </p>
        <Link href="/cardapio" className="bg-brand-red text-white font-bold py-3 px-6 rounded-md hover:bg-brand-red-dark">
          Ver Cardápio
        </Link>
      </div>
    );
  }
  return (
    <>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => {
            setIsLoginModalOpen(false);
            // Após fechar o modal, verificamos se o utilizador está agora autenticado.
            // A store (Zustand) atualiza o estado 'isAuthenticated' globalmente após o login.
            // Usamos um pequeno timeout para dar tempo à store para atualizar antes de verificar.
            setTimeout(() => {
                if (useUserStore.getState().isAuthenticated) {
                    router.push('/checkout');
                }
            }, 100);
        }} 
      />

    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-center" />
      <h1 className="text-2xl font-bold mb-6">Seu Carrinho</h1>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex items-start bg-white p-3 rounded-lg shadow-sm">
            <Image 
              src={item.product.image_url || 'https://placehold.co/80x80/EAB308/FFFFFF?text=Item'} 
              alt={item.product.name} 
              width={80} 
              height={80} 
              className="rounded-md object-cover" 
            />
            
            <div className="ml-4 flex-grow">
              <p className="font-bold">{item.product.name}</p>
              {item.extras.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.extras.map(extra => `+ ${extra.name}`).join(', ')}
                </div>
              )}
              <p className="text-sm text-brand-red font-semibold mt-1">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => decreaseQuantity(item.cartItemId)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                <Minus size={16} />
              </button>
              <span className="font-bold w-6 text-center">{item.quantity}</span>
              <button onClick={() => increaseQuantity(item.cartItemId)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300">
                <Plus size={16} />
              </button>
            </div>
            <button onClick={() => removeItem(item.cartItemId)} className="ml-4 text-gray-500 hover:text-red-500">
                <Trash2 size={20}/>
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>Taxa de Entrega</span>
          <span>A calcular no checkout</span>
        </div>
        <div className="flex justify-between font-bold text-xl border-t pt-4">
          <span>Total (parcial)</span>
          <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
        </div>
        <button 
          onClick={handleCheckout}
          className="w-full mt-6 bg-green-500 text-white font-bold py-3 rounded-md hover:bg-green-600"
        >
          Ir para o Checkout
        </button>
      </div>
    </div>
    </>   
  );
}
