'use client';

import { useState, useEffect } from 'react';
import { Pizza, getPizzas } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import { X, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HalfPizzaModal = ({ isOpen, onClose }: Props) => {
  const [allPizzas, setAllPizzas] = useState<Pizza[]>([]);
  const [firstHalf, setFirstHalf] = useState<Pizza | null>(null);
  const [secondHalf, setSecondHalf] = useState<Pizza | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (isOpen) {
      getPizzas().then(pizzas => {
        const availablePizzas = pizzas.filter(p => p.is_available);
        setAllPizzas(availablePizzas);
      });
    }
  }, [isOpen]);

  const handleSelectFlavor = (pizza: Pizza, half: 'first' | 'second') => {
    if (half === 'first') {
      setFirstHalf(pizza);
    } else {
      if (firstHalf && firstHalf.id === pizza.id) {
        toast.error("Os sabores não podem ser iguais.");
        return;
      }
      setSecondHalf(pizza);
    }
  };

  const calculatedPrice = firstHalf && secondHalf 
    ? (firstHalf.price + secondHalf.price) / 2 
    : firstHalf?.price || 0;

  const handleAddToCart = () => {
    if (!firstHalf || !secondHalf) {
      toast.error("Por favor, selecione os dois sabores da pizza.");
      return;
    }

    const halfAndHalfProduct = {
      id: `half-${firstHalf.id}-${secondHalf.id}`,
      name: `Meio a Meio: ${firstHalf.name} / ${secondHalf.name}`,
      price: calculatedPrice,
      description: `Uma metade de ${firstHalf.name} e outra de ${secondHalf.name}.`,
      image_url: firstHalf.image_url,
      is_available: true,
      type: 'half-and-half',
      flavor1: firstHalf,
      flavor2: secondHalf,
    };

    addItem(halfAndHalfProduct as any);
    toast.success('Pizza Meio a Meio adicionada!');
    onClose();
    setFirstHalf(null);
    setSecondHalf(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      {/* --- ATUALIZAÇÃO 1: Tamanho do modal reduzido --- */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col relative">
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-brand-red text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-20">
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-center p-4 border-b flex-shrink-0">Monte sua Pizza Meio a Meio</h2>

        {/* --- ATUALIZAÇÃO 2: Layout com rolagem aprimorada --- */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Coluna da Primeira Metade */}
          <div className="flex flex-col w-full md:w-1/2 border-b md:border-b-0 md:border-r overflow-hidden">
            <h3 className="font-semibold text-center p-3 bg-gray-50 flex-shrink-0">1º Sabor</h3>
            <ul className="flex-grow overflow-y-auto p-3 space-y-2">
              {allPizzas.map(pizza => (
                <li 
                  key={pizza.id} 
                  onClick={() => handleSelectFlavor(pizza, 'first')}
                  className={`p-2 rounded-md cursor-pointer flex justify-between items-center transition-colors ${firstHalf?.id === pizza.id ? 'bg-green-100 text-green-800 font-bold' : 'hover:bg-gray-100'}`}
                >
                  <span>{pizza.name}</span>
                  <span className="text-sm">R$ {pizza.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna da Segunda Metade */}
          <div className={`flex flex-col w-full md:w-1/2 overflow-hidden ${!firstHalf ? 'opacity-50' : ''}`}>
            <h3 className="font-semibold text-center p-3 bg-gray-50 flex-shrink-0">2º Sabor</h3>
            <ul className="flex-grow overflow-y-auto p-3 space-y-2">
              {allPizzas.map(pizza => (
                <li 
                  key={pizza.id} 
                  onClick={() => firstHalf && handleSelectFlavor(pizza, 'second')}
                  className={`p-2 rounded-md flex justify-between items-center ${!firstHalf ? 'cursor-not-allowed' : 'cursor-pointer transition-colors'} ${secondHalf?.id === pizza.id ? 'bg-green-100 text-green-800 font-bold' : 'hover:bg-gray-100'}`}
                >
                  <span>{pizza.name}</span>
                  <span className="text-sm">R$ {pizza.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm">
              <p><strong>1ª Metade:</strong> {firstHalf?.name || 'Nenhum'}</p>
              <p><strong>2ª Metade:</strong> {secondHalf?.name || 'Nenhum'}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-semibold block">Preço Final:</span>
              <span className="text-2xl font-bold text-brand-red">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedPrice)}
              </span>
            </div>
          </div>
          <button 
            onClick={handleAddToCart} 
            disabled={!firstHalf || !secondHalf}
            className="w-full bg-brand-red text-white font-bold py-3 rounded-md hover:bg-brand-red-dark transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
          >
            <PlusCircle size={20} />
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default HalfPizzaModal;
