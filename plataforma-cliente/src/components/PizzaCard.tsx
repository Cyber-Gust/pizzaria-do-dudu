'use client';

import { useState } from 'react';
import { Pizza } from '@/lib/api';
import { useStatus } from '@/components/StatusProvider';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import PizzaCustomizationModal from './PizzaCustomizationModal'; // Importar o modal

const PizzaCard = ({ pizza }: { pizza: Pizza }) => {
  const status = useStatus();
  // Estado para controlar a visibilidade do modal de customização
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Verifica se o botão deve estar ativo
  const canBeAdded = status?.is_open && pizza.is_available;

  // Formata o preço inicial da pizza
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
  }).format(pizza.price);

  return (
    <>
      {/* O modal de customização é renderizado aqui, mas fica invisível até ser ativado */}
      <PizzaCustomizationModal pizza={pizza} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200 relative">
        <Toaster position="bottom-center" />
        
        {/* Overlay que aparece quando a loja está fechada */}
        {!status?.is_open && (
          <div className="absolute inset-0 bg-black bg-opacity-60 z-10 flex items-center justify-center">
            <span className="text-white font-bold text-lg">LOJA FECHADA</span>
          </div>
        )}

        <div className="relative w-full h-56">
          <Image
            src={pizza.image_url || '/images/hero-background.jpg'}
            alt={pizza.name}
            fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="p-4 flex-grow flex flex-col">
          {/* Adicionamos o nome da pizza aqui */}
          <h3 className="text-lg font-bold mb-2">{pizza.name}</h3>
          <p className="text-sm text-gray-600 mb-4 flex-grow">{pizza.description}</p>
          <div className="flex justify-between items-center mt-4">
            <div>
              <span className="text-xs text-gray-500 block">A partir de</span>
              <span className="text-xl font-bold text-brand-red">{formattedPrice}</span>
            </div>
            <button
              // A ação do botão agora é abrir o modal
              onClick={() => setIsModalOpen(true)}
              disabled={!canBeAdded}
              className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Customizar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PizzaCard;
