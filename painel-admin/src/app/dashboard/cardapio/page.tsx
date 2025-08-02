// src/app/dashboard/cardapio/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image'; // Importa o componente de Imagem

// Tipagens
type Ingredient = { id: string; name: string; };
type Pizza = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  pizza_ingredients: { ingredient_id: string }[];
};
type Drink = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};
type Dessert = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
};

export default function CardapioPage() {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isPizzaModalOpen, setIsPizzaModalOpen] = useState(false);
  const [isDrinkModalOpen, setIsDrinkModalOpen] = useState(false);
  const [isDessertModalOpen, setIsDessertModalOpen] = useState(false);

  const [currentPizza, setCurrentPizza] = useState<Partial<Pizza> & { selectedIngredients?: string[] }>({});
  const [currentDrink, setCurrentDrink] = useState<Partial<Drink>>({});
  const [currentDessert, setCurrentDessert] = useState<Partial<Dessert>>({});

  const [uploading, setUploading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pizzaria-do-dudu.onrender.com';
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pizzasRes, drinksRes, ingredientsRes, dessertsRes] = await Promise.all([
        fetch(`${API_URL}/api/pizzas`),
        fetch(`${API_URL}/api/drinks`),
        fetch(`${API_URL}/api/ingredients`),
        fetch(`${API_URL}/api/desserts`),
      ]);
      if (!pizzasRes.ok || !drinksRes.ok || !ingredientsRes.ok) {
        throw new Error('Falha ao comunicar com a API para carregar o cardápio.');
      }
      setPizzas(await pizzasRes.json());
      setDrinks(await drinksRes.json());
      setDesserts(await dessertsRes.json());
      setIngredients(await ingredientsRes.json());
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Erro ao buscar dados:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenPizzaModal = (item: Pizza | null = null) => {
    if (item) {
      setCurrentPizza({ ...item, selectedIngredients: item.pizza_ingredients.map(pi => pi.ingredient_id) });
    } else {
      setCurrentPizza({ name: '', description: '', price: 0, image_url: '', is_available: true, selectedIngredients: [] });
    }
    setIsPizzaModalOpen(true);
  };

  const handleOpenDrinkModal = (item: Drink | null = null) => {
    setCurrentDrink(item ? { ...item } : { name: '', description: '', price: 0, image_url: '' });
    setIsDrinkModalOpen(true);
  };

  const handleOpenDessertModal = (item: Dessert | null = null) => {
    setCurrentDessert(item ? { ...item } : { name: '', description: '', price: 0, image_url: '' });
    setIsDessertModalOpen(true);
  };

  const handlePhotoUpload = async (file: File, type: 'pizza' | 'drink' | 'dessert') => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('produtos').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
      if (type === 'pizza') {
        setCurrentPizza(prev => ({ ...prev, image_url: data.publicUrl }));
      } else if (type === 'drink') {
        setCurrentDrink(prev => ({ ...prev, image_url: data.publicUrl }));
      } else { // --- 5. LÓGICA DE UPLOAD PARA SOBREMESA ---
        setCurrentDessert(prev => ({ ...prev, image_url: data.publicUrl }));
      }
    } catch (err: unknown) { // [CORRIGIDO]
      console.error(err);
      alert('Erro ao fazer upload da imagem!');
    } finally {
      setUploading(false);
    }
  };

  const handleSavePizza = async (e: React.FormEvent) => {
    e.preventDefault();
    const payloadForApi = {
        name: currentPizza.name,
        description: currentPizza.description,
        price: currentPizza.price,
        image_url: currentPizza.image_url,
        is_available: currentPizza.is_available,
        ingredient_ids: currentPizza.selectedIngredients || []
    };
    const url = `${API_URL}/api/pizzas${currentPizza.id ? `/${currentPizza.id}` : ''}`;
    const method = currentPizza.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadForApi) });
    fetchData();
    setIsPizzaModalOpen(false);
  };

  const handleSaveDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `${API_URL}/api/drinks${currentDrink.id ? `/${currentDrink.id}` : ''}`;
    const method = currentDrink.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentDrink) });
    fetchData();
    setIsDrinkModalOpen(false);
  };

  const handleSaveDessert = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = `${API_URL}/api/desserts${currentDessert.id ? `/${currentDessert.id}` : ''}`;
    const method = currentDessert.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentDessert) });
    fetchData();
    setIsDessertModalOpen(false);
  };
  
  const handleDeletePizza = async (id: string) => {
      if(window.confirm("Tem a certeza que quer apagar esta pizza?")) {
          await fetch(`${API_URL}/api/pizzas/${id}`, { method: 'DELETE' });
          fetchData();
      }
  }
  const handleDeleteDrink = async (id: string) => {
      if(window.confirm("Tem a certeza que quer apagar esta bebida?")) {
          await fetch(`${API_URL}/api/drinks/${id}`, { method: 'DELETE' });
          fetchData();
      }
  }
  const handleDeleteDessert = async (id: string) => {
    if(window.confirm("Tem a certeza que quer apagar esta sobremesa?")) {
        await fetch(`${API_URL}/api/desserts/${id}`, { method: 'DELETE' });
        fetchData();
    }
  }

  if (loading) return <p>A carregar cardápio...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-4 rounded-lg">Erro: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestão de Cardápio</h1>
        <div className="flex space-x-2">
            <button onClick={() => handleOpenPizzaModal()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">+ Adicionar Pizza</button>
            <button onClick={() => handleOpenDrinkModal()} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">+ Adicionar Bebida</button>
            <button onClick={() => handleOpenDessertModal()} className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg hover:bg-yellow-600">+ Adicionar Sobremesa</button>
        </div>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Pizzas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pizzas.map(pizza => (
            // --- INÍCIO DA MUDANÇA ---
            <div key={pizza.id} className="relative">
              {/* Adiciona uma sobreposição e um aviso se a pizza estiver indisponível */}
              {!pizza.is_available && (
                <div className="absolute inset-0 bg-gray-500 bg-opacity-70 z-10 flex items-center justify-center rounded-lg">
                  <span className="text-white font-bold text-lg bg-red-600 px-4 py-1 rounded">INDISPONÍVEL</span>
                </div>
              )}
              {/* O card da pizza em si fica com a opacidade reduzida */}
              <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-opacity ${!pizza.is_available ? 'opacity-60' : ''}`}>
                <Image src={pizza.image_url || 'https://placehold.co/600x400?text=Pizza'} alt={pizza.name} width={600} height={400} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-xl font-bold">{pizza.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 h-10 overflow-hidden">{pizza.description}</p>
                  <p className="text-lg font-semibold text-green-600">R$ {pizza.price.toFixed(2)}</p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button onClick={() => handleOpenPizzaModal(pizza)} className="text-sm text-blue-600">Editar</button>
                    <button onClick={() => handleDeletePizza(pizza.id)} className="text-sm text-red-600">Apagar</button>
                  </div>
                </div>
              </div>
            </div>
            // --- FIM DA MUDANÇA ---
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Bebidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {drinks.map(drink => (
            <div key={drink.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Image src={drink.image_url || 'https://placehold.co/600x600?text=Bebida'} alt={drink.name} width={600} height={600} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-bold">{drink.name}</h3>
                <p className="text-lg font-semibold text-green-600">R$ {drink.price.toFixed(2)}</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => handleOpenDrinkModal(drink)} className="text-sm text-blue-600">Editar</button>
                  <button onClick={() => handleDeleteDrink(drink.id)} className="text-sm text-red-600">Apagar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">Sobremesas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {desserts.map(dessert => (
            <div key={dessert.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Image src={dessert.image_url || 'https://placehold.co/600x600?text=Sobremesa'} alt={dessert.name} width={600} height={600} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-bold">{dessert.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{dessert.description}</p>
                <p className="text-lg font-semibold text-green-600">R$ {dessert.price.toFixed(2)}</p>
                <div className="mt-4 flex justify-end space-x-2">
                  <button onClick={() => handleOpenDessertModal(dessert)} className="text-sm text-blue-600">Editar</button>
                  <button onClick={() => handleDeleteDessert(dessert.id)} className="text-sm text-red-600">Apagar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isPizzaModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
          <form onSubmit={handleSavePizza} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <h2 className="text-2xl font-bold mb-4">{currentPizza.id ? 'Editar' : 'Adicionar'} Pizza</h2>
            <input type="text" placeholder="Nome da Pizza" value={currentPizza.name || ''} onChange={e => setCurrentPizza({...currentPizza, name: e.target.value})} className="w-full p-2 border rounded" required />
            <textarea placeholder="Descrição" value={currentPizza.description || ''} onChange={e => setCurrentPizza({...currentPizza, description: e.target.value})} className="w-full p-2 border rounded" required />
            <input type="number" placeholder="Preço" step="0.01" value={currentPizza.price || ''} onChange={e => setCurrentPizza({...currentPizza, price: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required />
            <div>
                <label className="block text-sm font-medium text-gray-700">Foto da Pizza</label>
                <input type="file" accept="image/*" onChange={e => e.target.files && handlePhotoUpload(e.target.files[0], 'pizza')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                {uploading && <p>A carregar foto...</p>}
                {currentPizza.image_url && <Image src={currentPizza.image_url} alt="Preview" width={128} height={128} className="mt-2 w-32 h-32 object-cover rounded" />}
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Ingredientes</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border rounded">
                  {ingredients.map(ing => (
                    <label key={ing.id} className="flex items-center space-x-2">
                      <input type="checkbox" checked={currentPizza.selectedIngredients?.includes(ing.id)} 
                        onChange={e => {
                          const selected = currentPizza.selectedIngredients || [];
                          const newSelected = e.target.checked ? [...selected, ing.id] : selected.filter(id => id !== ing.id);
                          setCurrentPizza({...currentPizza, selectedIngredients: newSelected});
                        }}
                      />
                      <span>{ing.name}</span>
                    </label>
                  ))}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsPizzaModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={uploading}>Salvar Pizza</button>
            </div>
          </form>
        </div>
      )}

      {isDrinkModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <form onSubmit={handleSaveDrink} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold mb-4">{currentDrink.id ? 'Editar' : 'Adicionar'} Bebida</h2>
                <input type="text" placeholder="Nome da Bebida" value={currentDrink.name || ''} onChange={e => setCurrentDrink({...currentDrink, name: e.target.value})} className="w-full p-2 border rounded" required />
                <textarea placeholder="Descrição" value={currentDrink.description || ''} onChange={e => setCurrentDrink({...currentDrink, description: e.target.value})} className="w-full p-2 border rounded" />
                <input type="number" placeholder="Preço" step="0.01" value={currentDrink.price || ''} onChange={e => setCurrentDrink({...currentDrink, price: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Foto da Bebida</label>
                    <input type="file" accept="image/*" onChange={e => e.target.files && handlePhotoUpload(e.target.files[0], 'drink')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    {uploading && <p>A carregar foto...</p>}
                    {currentDrink.image_url && <Image src={currentDrink.image_url} alt="Preview" width={128} height={128} className="mt-2 w-32 h-32 object-cover rounded" />}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => setIsDrinkModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={uploading}>Salvar Bebida</button>
                </div>
            </form>
        </div>
      )}

      {isDessertModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <form onSubmit={handleSaveDessert} className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold mb-4">{currentDessert.id ? 'Editar' : 'Adicionar'} Sobremesa</h2>
                <input type="text" placeholder="Nome da Sobremesa" value={currentDessert.name || ''} onChange={e => setCurrentDessert({...currentDessert, name: e.target.value})} className="w-full p-2 border rounded" required />
                <textarea placeholder="Descrição" value={currentDessert.description || ''} onChange={e => setCurrentDessert({...currentDessert, description: e.target.value})} className="w-full p-2 border rounded" />
                <input type="number" placeholder="Preço" step="0.01" value={currentDessert.price || ''} onChange={e => setCurrentDessert({...currentDessert, price: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required />
                <div>
                    <label className="block text-sm font-medium text-gray-700">Foto da Sobremesa</label>
                    <input type="file" accept="image/*" onChange={e => e.target.files && handlePhotoUpload(e.target.files[0], 'dessert')} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                    {uploading && <p>A carregar foto...</p>}
                    {currentDessert.image_url && <Image src={currentDessert.image_url} alt="Preview" width={128} height={128} className="mt-2 w-32 h-32 object-cover rounded" />}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => setIsDessertModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={uploading}>Salvar Sobremesa</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}
