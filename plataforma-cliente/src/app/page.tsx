import HeroSection from "@/components/HeroSection";
import CategorySelector from "@/components/CategorySelector";
import PizzaCard from "@/components/PizzaCard";
import { getPizzas, getOperatingHours } from "@/lib/api";
import Link from "next/link";

export default async function HomePage() {
  // Busca os dados no servidor antes de renderizar a página
  const allPizzas = await getPizzas();
  const operatingHours = await getOperatingHours();
  
  // Pega as 4 primeiras pizzas para serem os destaques
  const featuredPizzas = allPizzas.slice(0, 4);

  return (
    <>
      {/* Passa os horários de funcionamento como propriedade para a HeroSection */}
      <HeroSection operatingHours={operatingHours} />
      
      {/* Componente para selecionar categorias */}
      <CategorySelector />

      {/* Secção de Pizzas em Destaque */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">Pizzas em Destaque</h2>
          {featuredPizzas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPizzas.map((pizza) => (
                <PizzaCard key={pizza.id} pizza={pizza} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Os nossos destaques aparecerão aqui em breve!</p>
          )}
          <div className="text-center mt-10">
            <Link href="/cardapio" className="bg-brand-red text-white font-bold py-3 px-8 rounded-md hover:bg-brand-red-dark transition-colors">
              Ver Cardápio Completo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
