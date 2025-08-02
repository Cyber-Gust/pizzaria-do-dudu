'use client';

import { useState } from 'react';
import { Pizza } from '@/lib/api'; // Verifique se a tipagem Pizza inclui 'is_available'
import { useStatus } from '@/components/StatusProvider';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import PizzaCustomizationModal from './PizzaCustomizationModal';

const PizzaCard = ({ pizza }: { pizza: Pizza }) => {
    const { isLoading, status } = useStatus();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isStoreClosed = !isLoading && status && !status.is_open;
    // Esta variável agora controla a disponibilidade da loja E do produto individual
    const canBeAdded = !isStoreClosed && pizza.is_available;

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
    }).format(pizza.price);

    return (
        <>
            <PizzaCustomizationModal pizza={pizza} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
            <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200 relative">
                <Toaster position="bottom-center" />
                
                {/* Sobreposição para LOJA FECHADA (maior prioridade) */}
                {isStoreClosed && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 z-20 flex items-center justify-center">
                        <span className="text-white font-bold text-lg tracking-wider">LOJA FECHADA</span>
                    </div>
                )}

                {/* Sobreposição para PIZZA INDISPONÍVEL (só aparece se a loja estiver aberta) */}
                {!isStoreClosed && !pizza.is_available && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center">
                        <span className="text-white font-bold text-lg bg-red-700 px-4 py-2 rounded-md">INDISPONÍVEL</span>
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
                    <h3 className="text-lg font-bold mb-2">{pizza.name}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow">{pizza.description}</p>
                    <div className="flex justify-between items-center mt-4">
                        <div>
                            <span className="text-xs text-gray-500 block">A partir de</span>
                            <span className="text-xl font-bold text-brand-red">{formattedPrice}</span>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            disabled={!canBeAdded} // A desativação já funciona com esta variável
                            className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {canBeAdded ? 'Customizar' : 'Indisponível'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PizzaCard;