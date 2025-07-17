'use client';

import { useState, useEffect } from 'react';
import { Pizza, Extra, getExtras } from '@/lib/api';
import { useCartStore, SelectedExtra } from '@/store/cartStore';
import { X, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface Props {
  pizza: Pizza;
  isOpen: boolean;
  onClose: () => void;
}

const PizzaCustomizationModal = ({ pizza, isOpen, onClose }: Props) => {
  const [availableExtras, setAvailableExtras] = useState<Extra[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    if (isOpen) {
      getExtras().then(setAvailableExtras);
    }
  }, [isOpen]);

  const handleExtraToggle = (extra: Extra) => {
    setSelectedExtras((prev) => {
      const isSelected = prev.some((se) => se.id === extra.id);
      const simpleExtra = { id: extra.id, name: extra.ingredients.name, price: extra.price };
      
      if (isSelected) {
        return prev.filter((se) => se.id !== extra.id);
      } else {
        return [...prev, simpleExtra];
      }
    });
  };

  const calculateTotalPrice = () => {
    const extrasPrice = selectedExtras.reduce((acc, extra) => acc + extra.price, 0);
    return pizza.price + extrasPrice;
  };

  const handleAddToCart = () => {
    addItem(pizza, selectedExtras);
    toast.success(`${pizza.name} adicionado ao carrinho!`);
    onClose();
    setSelectedExtras([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col relative">
        {/* --- CORREÇÃO AQUI --- */}
        {/* Botão "X" para fechar o modal, agora estilizado */}
        <button 
          onClick={onClose} 
          className="absolute -top-3 -right-3 bg-brand-red text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform z-20"
          aria-label="Fechar modal"
        >
          <X size={24} />
        </button>

        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-center">{pizza.name}</h2>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <Image src={pizza.image_url!} alt={pizza.name} width={500} height={250} className="rounded-md object-cover w-full h-48 mb-4" />
          <p className="text-gray-600 mb-6">{pizza.description}</p>
          
          <h3 className="font-bold text-lg mb-3">Adicionais</h3>
          <div className="space-y-2">
            {availableExtras.map((extra) => (
              <label key={extra.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md cursor-pointer">
                <div>
                  <span className="font-medium">{extra.ingredients.name}</span>
                  <span className="text-green-600 font-semibold ml-2">
                    + {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extra.price)}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedExtras.some((se) => se.id === extra.id)}
                  onChange={() => handleExtraToggle(extra)}
                  className="h-5 w-5 rounded text-brand-red focus:ring-brand-red"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 border-t mt-auto bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold">Total do Item:</span>
            <span className="text-2xl font-bold text-brand-red">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTotalPrice())}
            </span>
          </div>
          <button onClick={handleAddToCart} className="w-full bg-brand-red text-white font-bold py-3 rounded-md hover:bg-brand-red-dark transition-colors flex items-center justify-center gap-2">
            <PlusCircle size={20} />
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
};

export default PizzaCustomizationModal;
