// plataforma-cliente/src/app/cardapio/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Pizza, Drink, Dessert, getPizzas, getDrinks, getDesserts } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useStatus } from '@/components/StatusProvider';
import PizzaCard from '@/components/PizzaCard';
import DrinkCard from '@/components/DrinkCard';
import HalfPizzaModal from '@/components/HalfPizzaModal';
import Image from 'next/image';
import { toast, Toaster } from 'react-hot-toast';

type Category = 'pizzas' | 'bebidas' | 'sobremesas';

export default function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('pizzas');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHalfPizzaModalOpen, setIsHalfPizzaModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pizzasData, drinksData, dessertsData] = await Promise.all([
          getPizzas(), 
          getDrinks(),
          getDesserts()
        ]);
        setPizzas(pizzasData);
        setDrinks(drinksData);
        setDesserts(dessertsData);
      } catch (error) {
        console.error("Erro ao carregar o cardápio:", error);
        toast.error("Não foi possível carregar o cardápio. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <Toaster position="bottom-center" />
      <HalfPizzaModal isOpen={isHalfPizzaModalOpen} onClose={() => setIsHalfPizzaModalOpen(false)} />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-black text-center mb-8">Nosso Cardápio</h1>

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
          <button
            onClick={() => setActiveCategory('sobremesas')}
            className={`px-6 py-3 font-semibold text-lg transition-colors ${activeCategory === 'sobremesas' ? 'border-b-4 border-brand-red text-brand-red' : 'text-gray-500'}`}
          >
            Sobremesas
          </button>
        </div>

        {isLoading && <p className="text-center text-lg font-semibold">Carregando cardápio...</p>}

        {!isLoading && (
          <div>
            {activeCategory === 'pizzas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  onClick={() => setIsHalfPizzaModalOpen(true)}
                  className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border-2 border-dashed border-brand-red items-center justify-center text-center p-6 cursor-pointer hover:bg-red-50 transition-colors"
                >
                  <Image src="/logo-redonda.png" alt="Monte sua Pizza" width={80} height={80} />
                  <h3 className="text-xl font-bold mt-4 text-brand-red">Monte sua Pizza</h3>
                  <p className="text-gray-600">Escolha 2 sabores!</p>
                </div>
                
                {pizzas.map((pizza) => (
                  <PizzaCard key={pizza.id} pizza={pizza} />
                ))}
              </div>
            )}
            
            {activeCategory === 'bebidas' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {drinks.map((drink) => (
                  <DrinkCard key={drink.id} drink={drink} />
                ))}
              </div>
            )}

            {activeCategory === 'sobremesas' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {desserts.map((dessert) => (
                        <DessertCard key={dessert.id} dessert={dessert} />
                    ))}
                </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Componente DessertCard com a lógica de status corrigida
const DessertCard = ({ dessert }: { dessert: Dessert }) => {
    const addItem = useCartStore((state) => state.addItem);
    const { isLoading, status } = useStatus();

    const isStoreClosed = !isLoading && status && !status.is_open;
    const canBeAdded = !isLoading && status?.is_open && dessert.is_available;

    const handleAddToCart = () => {
        if (!canBeAdded) return;
        addItem(dessert, []);
        toast.success(`${dessert.name} adicionado ao carrinho!`);
    };

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
    }).format(dessert.price);

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col border border-gray-200 relative">
            {isStoreClosed && (
                <div className="absolute inset-0 bg-black bg-opacity-60 z-10 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">LOJA FECHADA</span>
                </div>
            )}

            <div className="relative w-full h-56">
                <Image
                    src={dessert.image_url || '/images/default-dessert.png'}
                    alt={dessert.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                />
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <h3 className="text-lg font-bold mb-2 flex-grow">{dessert.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{dessert.description}</p>
                <div className="flex justify-between items-center mt-auto">
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
