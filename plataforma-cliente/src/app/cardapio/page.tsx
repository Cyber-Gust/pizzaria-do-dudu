// plataforma-cliente/src/app/cardapio/page.tsx
'use client';

import { useState, useEffect } from 'react';
// 1. Importar tudo o que precisamos, incluindo Sobremesas
import { Pizza, Drink, Dessert, getPizzas, getDrinks, getDesserts } from '@/lib/api';
import { useCartStore } from '@/store/cartStore'; // Importar a store do carrinho
import PizzaCard from '@/components/PizzaCard';
import DrinkCard from '@/components/DrinkCard';
import HalfPizzaModal from '@/components/HalfPizzaModal';
import Image from 'next/image';
import { toast } from 'react-hot-toast'; // Para dar feedback ao usuário

// 2. Adicionar 'sobremesas' à nossa tipagem de categoria
type Category = 'pizzas' | 'bebidas' | 'sobremesas';

export default function CardapioPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('pizzas');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  // 3. Adicionar estado para as sobremesas
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHalfPizzaModalOpen, setIsHalfPizzaModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 4. Buscar os três tipos de produtos em paralelo
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
          {/* 5. Adicionar o botão/aba para Sobremesas */}
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

            {/* 6. Adicionar a seção para renderizar as sobremesas */}
            {activeCategory === 'sobremesas' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

// 7. Componente DessertCard, pronto para ser usado
const DessertCard = ({ dessert }: { dessert: Dessert }) => {
    const { addItem } = useCartStore();

    const handleAddToCart = () => {
        // Adicionamos a sobremesa ao carrinho. Como sobremesas não têm 'extras', passamos um array vazio.
        addItem(dessert, []);
        toast.success(`${dessert.name} adicionado ao carrinho!`);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <Image src={dessert.image_url} alt={dessert.name} width={400} height={300} className="w-full h-48 object-cover" />
            <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2">{dessert.name}</h3>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{dessert.description}</p>
                <div className="flex justify-between items-center mt-auto">
                    <span className="text-lg font-bold text-brand-red">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dessert.price)}
                    </span>
                    <button 
                        onClick={handleAddToCart}
                        className="bg-green-500 text-white font-bold py-2 px-4 rounded-full hover:bg-green-600 transition-colors"
                    >
                        Adicionar
                    </button>
                </div>
            </div>
        </div>
    );
};
