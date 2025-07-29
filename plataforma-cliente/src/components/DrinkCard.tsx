'use client';

import { Drink } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useStatus } from '@/components/StatusProvider';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';

interface DrinkCardProps {
  drink: Drink;
}

const DrinkCard = ({ drink }: DrinkCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const { isLoading, status } = useStatus();

  const isStoreClosed = !isLoading && status && !status.is_open;
  const canBeAdded = !isLoading && status?.is_open && drink.is_available;

  const handleAddToCart = () => {
    if (!canBeAdded) return;
    addItem(drink, []);
    toast.success(`${drink.name} adicionado ao carrinho!`);
  };

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(drink.price);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200 relative">
      <Toaster position="bottom-center" />
      {isStoreClosed && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-10 flex items-center justify-center">
          <span className="text-white font-bold text-lg">LOJA FECHADA</span>
        </div>
      )}
      <div className="relative w-full h-56">
        <Image
          src={drink.image_url || '/images/default-drink.png'}
          alt={drink.name}
          fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-2 flex-grow">{drink.name}</h3>
        <div className="flex justify-between items-center mt-4">
          <span className="text-xl font-bold text-brand-red">{formattedPrice}</span>
          <button
            onClick={handleAddToCart}
            disabled={!canBeAdded}
            className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Aguarde...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrinkCard;