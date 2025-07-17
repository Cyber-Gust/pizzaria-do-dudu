'use client';

import { useState, useEffect } from 'react';
import { Pizza, Drink, getPizzas, getDrinks } from '@/lib/api';
import PizzaCard from '@/components/PizzaCard';
import DrinkCard from '@/components/DrinkCard';
import HalfPizzaModal from '@/components/HalfPizzaModal'; // Importar o modal de meio a meio
import Image from 'next/image';

type Category = 'pizzas' | 'bebidas';

export default function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('pizzas');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHalfPizzaModalOpen, setIsHalfPizzaModalOpen] = useState(false); // Estado para controlar o modal

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Busca os dados de pizzas e bebidas em paralelo para mais eficiência
      const [pizzasData, drinksData] = await Promise.all([getPizzas(), getDrinks()]);
      setPizzas(pizzasData);
      setDrinks(drinksData);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      {/* O modal de meio a meio é renderizado aqui, mas fica invisível até ser ativado */}
      <HalfPizzaModal isOpen={isHalfPizzaModalOpen} onClose={() => setIsHalfPizzaModalOpen(false)} />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-center mb-8">Nosso Cardápio</h1>

        {/* Abas para filtrar entre Pizzas e Bebidas */}
        <div className="flex justify-center border-b-2 border-gray-200 mb-8">
          <button
            onClick={() => setActiveCategory('pizzas')}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${activeCategory === 'pizzas' ? 'border-b-4 border-brand-red text-brand-red' : 'text-gray-500'}`}
          >
            Pizzas
          </button>
          <button
            onClick={() => setActiveCategory('bebidas')}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${activeCategory === 'bebidas' ? 'border-b-4 border-brand-red text-brand-red' : 'text-gray-500'}`}
          >
            Bebidas
          </button>
        </div>

        {/* Indicador de Carregamento */}
        {isLoading && <p className="text-center">Carregando cardápio...</p>}

        {/* Conteúdo do Cardápio */}
        {!isLoading && (
          <div>
            {/* Seção de Pizzas */}
            {activeCategory === 'pizzas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card Especial para abrir o modal de Meio a Meio */}
                <div 
                  onClick={() => setIsHalfPizzaModalOpen(true)}
                  className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border-2 border-dashed border-brand-red items-center justify-center text-center p-6 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <Image src="/logo-redonda.png" alt="Monte sua Pizza" width={80} height={80} />
                  <h3 className="text-xl font-bold mt-4 text-brand-red">Monte sua Pizza</h3>
                  <p className="text-gray-600">Escolha 2 sabores!</p>
                </div>
                
                {/* Mapeia e exibe os cards de pizza normais */}
                {pizzas.map((pizza) => (
                  <PizzaCard key={pizza.id} pizza={pizza} />
                ))}
              </div>
            )}
            
            {/* Seção de Bebidas */}
            {activeCategory === 'bebidas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {drinks.map((drink) => (
                  <DrinkCard key={drink.id} drink={drink} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
