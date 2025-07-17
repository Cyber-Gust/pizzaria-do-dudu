// src/app/dashboard/estoque/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

// Tipagens para os dados
type Ingredient = {
  id: string;
  name: string;
  stock_quantity: number;
  unit: string;
  is_available: boolean;
};

type Drink = {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_available: boolean;
};

// Componente para o Toggle Switch
const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${
      checked ? 'bg-green-500' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);


export default function EstoquePage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ingredient' | 'drink' | null>(null);
  // [CORRIGIDO] Usado um tipo de união mais específico em vez de 'any'
  const [currentItem, setCurrentItem] = useState<Partial<Ingredient & Drink> | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ingredientsRes, drinksRes] = await Promise.all([
        fetch(`${API_URL}/api/ingredients`),
        fetch(`${API_URL}/api/drinks`),
      ]);
      if (!ingredientsRes.ok || !drinksRes.ok) throw new Error('Falha ao carregar dados do estoque.');
      
      const ingredientsData = await ingredientsRes.json();
      const drinksData = await drinksRes.json();
      
      setIngredients(ingredientsData);
      setDrinks(drinksData);
    } catch (err: unknown) { // [CORRIGIDO] Usado 'unknown' em vez de 'any' para segurança de tipo
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (type: 'ingredient' | 'drink', item: Ingredient | Drink | null = null) => {
    setModalType(type);
    setCurrentItem(item ? { ...item } : { is_available: true });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setModalType(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentItem) return;
    const url = `${API_URL}/api/${modalType}s${currentItem.id ? `/${currentItem.id}` : ''}`;
    const method = currentItem.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentItem),
      });
      if (!response.ok) throw new Error(`Falha ao salvar ${modalType}.`);
      
      fetchData();
      handleCloseModal();
    } catch (err: unknown) { // [CORRIGIDO]
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };
  
  // Função para alterar a disponibilidade
  const handleToggleAvailability = async (type: 'ingredient' | 'drink', item: Ingredient | Drink) => {
    const updatedItem = { ...item, is_available: !item.is_available };
    const url = `${API_URL}/api/${type}s/${item.id}`;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
      if (!response.ok) throw new Error(`Falha ao atualizar disponibilidade.`);
      
      fetchData();
    } catch (err: unknown) { // [CORRIGIDO]
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };

  // Função para apagar um item permanentemente
  const handleDelete = async (type: 'ingredient' | 'drink', id: string) => {
    if (!window.confirm(`Tem a certeza que quer apagar este ${type} permanentemente? Esta ação não pode ser desfeita.`)) return;

    try {
      const response = await fetch(`${API_URL}/api/${type}s/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Falha ao apagar ${type}.`);
      }
      
      fetchData();
    } catch (err: unknown) { // [CORRIGIDO]
      if (err instanceof Error) {
        alert(err.message);
      }
    }
  };


  if (loading) return <p>A carregar estoque...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestão de Estoque</h1>

      {/* Secção de Ingredientes */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Ingredientes</h2>
          <button onClick={() => handleOpenModal('ingredient')} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Adicionar Ingrediente</button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponível</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidade</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {ingredients.map(item => (
                <tr key={item.id} className={!item.is_available ? 'bg-gray-100 text-gray-400' : ''}>
                    <td className="px-6 py-4"><ToggleSwitch checked={item.is_available} onChange={() => handleToggleAvailability('ingredient', item)} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.stock_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenModal('ingredient', item)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                      <button onClick={() => handleDelete('ingredient', item.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Secção de Bebidas */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Bebidas</h2>
          <button onClick={() => handleOpenModal('drink')} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Adicionar Bebida</button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponível</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {drinks.map(item => (
                <tr key={item.id} className={!item.is_available ? 'bg-gray-100 text-gray-400' : ''}>
                    <td className="px-6 py-4"><ToggleSwitch checked={item.is_available} onChange={() => handleToggleAvailability('drink', item)} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">R$ {item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.stock_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenModal('drink', item)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                      <button onClick={() => handleDelete('drink', item.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Modal para Adicionar/Editar */}
      {isModalOpen && currentItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {currentItem.id ? 'Editar' : 'Adicionar'} {modalType === 'ingredient' ? 'Ingrediente' : 'Bebida'}
            </h3>
            <form onSubmit={handleSave}>
              <div className="space-y-4">
                <input type="text" placeholder="Nome" value={currentItem.name || ''} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} className="w-full p-2 border rounded" required />
                {modalType === 'drink' && <input type="number" placeholder="Preço" step="0.01" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded" required />}
                <input type="number" placeholder="Quantidade em Estoque" value={currentItem.stock_quantity || ''} onChange={e => setCurrentItem({...currentItem, stock_quantity: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded" required />
                {modalType === 'ingredient' && <input type="text" placeholder="Unidade (ex: g, kg, un)" value={currentItem.unit || ''} onChange={e => setCurrentItem({...currentItem, unit: e.target.value})} className="w-full p-2 border rounded" required />}
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
