// src/app/dashboard/configuracoes/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

// Tipagens
type Motoboy = { id: string; name: string; whatsapp_number: string; is_active: boolean; };
type Extra = { id: string; price: number; is_available: boolean; ingredients: { id: string; name: string } };
type DeliveryFee = { id: string; neighborhood_name: string; fee_amount: number; };
type Coupon = { id: string; code: string; discount_type: 'fixed' | 'percentage'; discount_value: number; is_active: boolean; };
type OperatingHour = {
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};
type Ingredient = { id: string; name: string; };

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

export default function ConfiguracoesPage() {
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isMotoboyModalOpen, setIsMotoboyModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  
  const [currentMotoboy, setCurrentMotoboy] = useState<Partial<Motoboy> | null>(null);
  const [currentExtra, setCurrentExtra] = useState<Partial<Extra> & { ingredient_id?: string } | null>(null);
  const [currentFee, setCurrentFee] = useState<Partial<DeliveryFee> | null>(null);
  const [currentCoupon, setCurrentCoupon] = useState<Partial<Coupon> | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all([
        fetch(`${API_URL}/api/motoboys`),
        fetch(`${API_URL}/api/extras`),
        fetch(`${API_URL}/api/ingredients`),
        fetch(`${API_URL}/api/delivery-fees`),
        fetch(`${API_URL}/api/coupons`),
        fetch(`${API_URL}/api/operating-hours`),
      ]);

      for (const res of responses) {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Falha ao carregar dados.' }));
          throw new Error(errorData.error || 'Um erro ocorreu ao buscar os dados.');
        }
      }

      const [motoboysData, extrasData, ingredientsData, feesData, couponsData, hoursData] = await Promise.all(
        responses.map(res => res.json())
      );

      setMotoboys(motoboysData || []);
      setExtras(extrasData || []);
      setAvailableIngredients(ingredientsData || []);
      setDeliveryFees(feesData || []);
      setCoupons(couponsData || []);
      setOperatingHours(hoursData || []);

    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Funções para gerir os modais
  const handleOpenMotoboyModal = (item: Motoboy | null = null) => {
    setCurrentMotoboy(item ? { ...item } : { name: '', whatsapp_number: '', is_active: true });
    setIsMotoboyModalOpen(true);
  };
  const handleOpenExtraModal = (item: Extra | null = null) => {
    setCurrentExtra(item ? { ...item, price: item?.price || 0, ingredient_id: item?.ingredients?.id } : { price: 0, is_available: true });
    setIsExtraModalOpen(true);
  };
  const handleOpenFeeModal = (item: DeliveryFee | null = null) => {
    setCurrentFee(item ? { ...item } : { neighborhood_name: '', fee_amount: 0 });
    setIsFeeModalOpen(true);
  };
  const handleOpenCouponModal = (item: Coupon | null = null) => {
    setCurrentCoupon(item ? { ...item } : { code: '', discount_type: 'fixed', discount_value: 0, is_active: true });
    setIsCouponModalOpen(true);
  };

  // Funções de Salvar
  const handleSaveMotoboy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMotoboy) return;
    const url = `${API_URL}/api/motoboys${currentMotoboy.id ? `/${currentMotoboy.id}` : ''}`;
    const method = currentMotoboy.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentMotoboy) });
    fetchData();
    setIsMotoboyModalOpen(false);
  };
  const handleSaveExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentExtra) return;
    const { id, price, ingredient_id } = currentExtra;
    const ingredient = availableIngredients.find(i => i.id === ingredient_id);
    if (!ingredient) {
        alert("Por favor, selecione um ingrediente válido.");
        return;
    }
    const payload = { name: ingredient.name, price, ingredient_id };
    const url = `${API_URL}/api/extras${id ? `/${id}` : ''}`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    fetchData();
    setIsExtraModalOpen(false);
  };
  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFee) return;
    const url = `${API_URL}/api/delivery-fees${currentFee.id ? `/${currentFee.id}` : ''}`;
    const method = currentFee.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentFee) });
    fetchData();
    setIsFeeModalOpen(false);
  };
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCoupon) return;
    const url = `${API_URL}/api/coupons${currentCoupon.id ? `/${currentCoupon.id}` : ''}`;
    const method = currentCoupon.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(currentCoupon) });
    fetchData();
    setIsCouponModalOpen(false);
  };
  const handleSaveAllHours = async () => {
      setLoading(true);
      try {
          await Promise.all(operatingHours.map(day => 
              fetch(`${API_URL}/api/operating-hours/${day.day_of_week}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      is_open: day.is_open,
                      open_time: day.open_time,
                      close_time: day.close_time,
                  })
              })
          ));
          alert('Horários de funcionamento salvos com sucesso!');
      } catch (error) {
          alert('Erro ao salvar os horários.');
      } finally {
          setLoading(false);
      }
  };

  // Funções de Apagar
  const handleDeleteExtra = async (id: string) => {
      if(window.confirm("Tem a certeza que quer apagar este adicional?")) {
          await fetch(`${API_URL}/api/extras/${id}`, { method: 'DELETE' });
          fetchData();
      }
  };
  const handleDeleteMotoboy = async (id: string) => {
    if(window.confirm("Tem a certeza que quer apagar este motoboy?")) {
        await fetch(`${API_URL}/api/motoboys/${id}`, { method: 'DELETE' });
        fetchData();
    }
  };
  const handleDeleteFee = async (id: string) => {
    if(window.confirm("Tem a certeza que quer apagar esta taxa de entrega?")) {
        await fetch(`${API_URL}/api/delivery-fees/${id}`, { method: 'DELETE' });
        fetchData();
    }
  };
  const handleDeleteCoupon = async (id: string) => {
    if(window.confirm("Tem a certeza que quer apagar este cupão?")) {
        await fetch(`${API_URL}/api/coupons/${id}`, { method: 'DELETE' });
        fetchData();
    }
  };

  // Funções de Ativar/Desativar
  const handleToggleExtra = async (extra: Extra) => {
    const updatedExtra = { ...extra, is_available: !extra.is_available };
    await fetch(`${API_URL}/api/extras/${extra.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedExtra) });
    fetchData();
  };
  const handleToggleMotoboy = async (motoboy: Motoboy) => {
    const updatedMotoboy = { ...motoboy, is_active: !motoboy.is_active };
    await fetch(`${API_URL}/api/motoboys/${motoboy.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedMotoboy) });
    fetchData();
  };
  const handleToggleCoupon = async (coupon: Coupon) => {
    const updatedCoupon = { ...coupon, is_active: !coupon.is_active };
    await fetch(`${API_URL}/api/coupons/${coupon.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedCoupon) });
    fetchData();
  };
  const handleHourChange = (dayIndex: number, field: keyof OperatingHour, value: any) => {
      const updatedHours = [...operatingHours];
      updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
      setOperatingHours(updatedHours);
  };

  if (loading) return <p>A carregar configurações...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-4 rounded-lg">Erro: {error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configurações</h1>
      
      {/* Secção de Horário de Funcionamento */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Horário de Funcionamento</h2>
          <button onClick={handleSaveAllHours} disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'A salvar...' : 'Salvar Horários'}
          </button>
        </div>
        <div className="space-y-4">
          {operatingHours && operatingHours.map((day, index) => (
            <div key={day.day_of_week} className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4 p-2 border-b">
              <span className="font-semibold col-span-1">{day.day_name}</span>
              <div className="col-span-1 flex items-center space-x-2">
                <ToggleSwitch 
                  checked={day.is_open} 
                  onChange={() => handleHourChange(index, 'is_open', !day.is_open)} 
                />
                <span>{day.is_open ? 'Aberto' : 'Fechado'}</span>
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input 
                  type="time" 
                  value={day.open_time || ''}
                  onChange={e => handleHourChange(index, 'open_time', e.target.value)}
                  disabled={!day.is_open}
                  className="p-1 border rounded w-full disabled:bg-gray-100"
                />
                <span>até</span>
                <input 
                  type="time" 
                  value={day.close_time || ''}
                  onChange={e => handleHourChange(index, 'close_time', e.target.value)}
                  disabled={!day.is_open}
                  className="p-1 border rounded w-full disabled:bg-gray-100"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Secção de Gestão de Motoboys */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Gestão de Motoboys</h2>
          <button onClick={() => handleOpenMotoboyModal()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">+ Adicionar Motoboy</button>
        </div>
        <div className="max-h-[25vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº WhatsApp</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {motoboys.map(motoboy => (
                <tr key={motoboy.id} className={!motoboy.is_active ? 'bg-gray-100 text-gray-400' : ''}>
                  <td className="px-6 py-4"><ToggleSwitch checked={motoboy.is_active} onChange={() => handleToggleMotoboy(motoboy)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">{motoboy.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{motoboy.whatsapp_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenMotoboyModal(motoboy)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteMotoboy(motoboy.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secção de Gestão de Adicionais */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Gestão de Adicionais</h2>
          <button onClick={() => handleOpenExtraModal()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">+ Adicionar Adicional</button>
        </div>
        <div className="max-h-[25vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponível</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome (Ingrediente)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Adicional</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {extras.map(extra => (
                <tr key={extra.id} className={!extra.is_available ? 'bg-gray-100 text-gray-400' : ''}>
                  <td className="px-6 py-4"><ToggleSwitch checked={extra.is_available} onChange={() => handleToggleExtra(extra)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap">{extra.ingredients?.name || 'Ingrediente apagado'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">R$ {(extra.price || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenExtraModal(extra)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteExtra(extra.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secção de Gestão de Taxas de Entrega */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Taxas de Entrega por Bairro</h2>
          <button onClick={() => handleOpenFeeModal()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">+ Adicionar Taxa</button>
        </div>
        <div className="max-h-[25vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bairro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveryFees.map(fee => (
                <tr key={fee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{fee.neighborhood_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">R$ {(fee.fee_amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenFeeModal(fee)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteFee(fee.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* [NOVO] Secção de Gestão de Cupões de Desconto */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Cupões de Desconto</h2>
          <button onClick={() => handleOpenCouponModal()} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">+ Adicionar Cupão</button>
        </div>
        <div className="max-h-[40vh] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ativo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desconto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map(coupon => (
                <tr key={coupon.id} className={!coupon.is_active ? 'bg-gray-100 text-gray-400' : ''}>
                  <td className="px-6 py-4"><ToggleSwitch checked={coupon.is_active} onChange={() => handleToggleCoupon(coupon)} /></td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-blue-600">{coupon.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coupon.discount_type === 'fixed' ? `R$ ${coupon.discount_value.toFixed(2)}` : `${coupon.discount_value}%`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenCouponModal(coupon)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteCoupon(coupon.id)} className="text-red-600 hover:text-red-900">Apagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais (Motoboy, Extra, Taxa) */}
      {isMotoboyModalOpen && currentMotoboy && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <form onSubmit={handleSaveMotoboy} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-medium">{currentMotoboy.id ? 'Editar' : 'Adicionar'} Motoboy</h3>
            <input type="text" placeholder="Nome" value={currentMotoboy.name || ''} onChange={e => setCurrentMotoboy({...currentMotoboy, name: e.target.value})} className="w-full p-2 border rounded" required />
            <input type="text" placeholder="Nº WhatsApp (ex: 55119...)" value={currentMotoboy.whatsapp_number || ''} onChange={e => setCurrentMotoboy({...currentMotoboy, whatsapp_number: e.target.value})} className="w-full p-2 border rounded" required />
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setIsMotoboyModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {isExtraModalOpen && currentExtra && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <form onSubmit={handleSaveExtra} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-medium">{currentExtra.id ? 'Editar' : 'Adicionar'} Adicional</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ingrediente Base</label>
              <select 
                value={currentExtra.ingredient_id || ''}
                onChange={e => setCurrentExtra({...currentExtra, ingredient_id: e.target.value})}
                className="w-full p-2 border rounded mt-1"
                required
                disabled={!!currentExtra.id}
              >
                <option value="">Selecione um ingrediente</option>
                {availableIngredients.map(ing => (
                  <option key={ing.id} value={ing.id}>{ing.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preço do Adicional</label>
              <input type="number" placeholder="Preço" step="0.01" value={currentExtra.price || ''} onChange={e => setCurrentExtra({...currentExtra, price: parseFloat(e.target.value)})} className="w-full p-2 border rounded mt-1" required />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setIsExtraModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </form>
        </div>
      )}
      
      {isFeeModalOpen && currentFee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <form onSubmit={handleSaveFee} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-medium">{currentFee.id ? 'Editar' : 'Adicionar'} Taxa de Entrega</h3>
            <input type="text" placeholder="Nome do Bairro" value={currentFee.neighborhood_name || ''} onChange={e => setCurrentFee({...currentFee, neighborhood_name: e.target.value})} className="w-full p-2 border rounded" required />
            <input type="number" placeholder="Valor da Taxa" step="0.01" value={currentFee.fee_amount || 0} onChange={e => setCurrentFee({...currentFee, fee_amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded" required />
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setIsFeeModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
            </div>
          </form>
        </div>
      )}

      
    </div>
  );
}
