// src/components/CategorySelector.tsx
import Link from 'next/link';
import { Pizza, CupSoda, IceCream } from 'lucide-react'; // Ícones para as categorias

// CORREÇÃO: Adicionado o href para Sobremesas e ajustado o de Bebidas
const categories = [
  { name: 'Pizzas', href: '/cardapio?categoria=pizzas', icon: Pizza },
  { name: 'Bebidas', href: '/cardapio?categoria=drinks', icon: CupSoda },
  { name: 'Sobremesas', href: '/cardapio?categoria=desserts', icon: IceCream },
];

const CategorySelector = () => {
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-6">Navegue por Categorias</h2>
        {/* Container com rolagem horizontal em telas pequenas */}
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-24 bg-gray-100 rounded-lg shadow-sm hover:bg-brand-yellow transition-colors"
            >
              <category.icon className="h-8 w-8 text-brand-red mb-2" />
              <span className="font-semibold text-gray-800">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySelector;
