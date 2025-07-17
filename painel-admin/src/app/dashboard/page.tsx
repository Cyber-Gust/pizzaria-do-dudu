// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

type PizzeriaStatus = {
  id: number;
  is_open: boolean;
  pickup_time_minutes: number;
  delivery_time_minutes: number;
  updated_at: string;
};

export default function DashboardHomePage() {
  const [status, setStatus] = useState<PizzeriaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para os campos de input dos tempos
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchPizzeriaStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/status`);
      if (!response.ok) throw new Error('Falha ao carregar status.');
      const data: PizzeriaStatus = await response.json();
      setStatus(data);
      // Popula os campos de input com os valores do banco de dados
      setPickupTime(data.pickup_time_minutes.toString());
      setDeliveryTime(data.delivery_time_minutes.toString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchPizzeriaStatus();
  }, [fetchPizzeriaStatus]);

  const handleToggleStatus = async () => {
    if (!status) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !status.is_open }), // Envia apenas o campo a ser alterado
      });
      if (!response.ok) throw new Error('Falha ao atualizar status.');
      await fetchPizzeriaStatus(); // Recarrega todos os dados
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Nova função para salvar os tempos
  const handleSaveTimes = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pickup_time_minutes: parseInt(pickupTime, 10),
          delivery_time_minutes: parseInt(deliveryTime, 10),
        }),
      });
      if (!response.ok) throw new Error('Falha ao salvar os tempos.');
      await fetchPizzeriaStatus();
      alert('Tempos atualizados com sucesso!'); // Feedback simples para o usuário
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      {/* Card de Controle da Pizzaria */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Controle da Pizzaria</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleStatus}
            disabled={loading || !status}
            className={`px-6 py-3 font-bold text-white rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
              ${status?.is_open ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {loading ? 'Carregando...' : (status?.is_open ? 'FECHAR PIZZARIA' : 'ABRIR PIZZARIA')}
          </button>
          <div className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded-full ${status?.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-700 font-medium">
              {status ? (status.is_open ? 'Pizzaria Aberta' : 'Pizzaria Fechada') : 'Verificando...'}
            </span>
          </div>
        </div>
      </div>

      {/* [NOVO] Card de Configurações de Tempo */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Configurações de Tempo</h2>
        <form onSubmit={handleSaveTimes} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700">
                Tempo de Retirada (minutos)
              </label>
              <input
                type="number"
                id="pickupTime"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700">
                Tempo de Entrega (minutos)
              </label>
              <input
                type="number"
                id="deliveryTime"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm disabled:bg-gray-100"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Salvar Tempos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
