'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff } from 'lucide-react';
<<<<<<< HEAD
=======
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a

// Tipagens
type ExtraItem = { id: string; name: string; price: number };

type OrderItem = {
  item_name: string;
  quantity: number;
  price_per_item: number;
  selected_extras?: ExtraItem[];
};

type Order = {
  id: number;
  customer_name: string;
  status: string;
  final_price: number;
  order_type: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
<<<<<<< HEAD
  observations: string | null; // Adicionado para observações
=======
  observations: string | null;
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
};

type Motoboy = { id: string; name: string; };
type Product = { id: string; name: string; price: number; item_type: 'pizza' | 'drink' };
type Extra = { id: string; price: number; ingredients: { name: string } };
type DeliveryFee = { id: string; neighborhood_name: string; fee_amount: number; };

type NewOrderItem = {
    item_id: string;
    item_name: string;
    quantity: number;
    price_per_item: number;
    item_type: 'pizza' | 'drink';
    extras: ExtraItem[];
};

const initialNewOrderState = {
  customer_name: '',
  customer_phone: '',
  address: '',
  order_type: 'pickup',
  payment_method: 'cash',
  items: [] as NewOrderItem[],
  discount_amount: 0,
  delivery_fee: 0,
<<<<<<< HEAD
  observations: '', // Adicionado
=======
  observations: '',
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const [motoboyModal, setMotoboyModal] = useState<{ isOpen: boolean, order: Order | null }>({ isOpen: false, order: null });
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState(initialNewOrderState);

<<<<<<< HEAD
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pizzaria-do-dudu.onrender.com';
=======
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, motoboysRes, pizzasRes, drinksRes, extrasRes, feesRes] = await Promise.all([
        fetch(`${API_URL}/api/orders`),
        fetch(`${API_URL}/api/motoboys`),
        fetch(`${API_URL}/api/pizzas`),
        fetch(`${API_URL}/api/drinks`),
        fetch(`${API_URL}/api/extras`),
        fetch(`${API_URL}/api/delivery-fees`),
      ]);
      if (!ordersRes.ok || !motoboysRes.ok || !pizzasRes.ok || !drinksRes.ok || !extrasRes.ok || !feesRes.ok) throw new Error('Falha ao carregar dados.');
      
      setOrders(await ordersRes.json());
      setMotoboys(await motoboysRes.json());
      const pizzasData = (await pizzasRes.json()).map((p: Product) => ({ ...p, item_type: 'pizza' as const }));
      const drinksData = (await drinksRes.json()).map((d: Product) => ({ ...d, item_type: 'drink' as const }));
      setProducts([...pizzasData, ...drinksData]);
      setExtras(await extrasRes.json());
      setDeliveryFees(await feesRes.json());

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatOrderForPrinting = (order: Order): string => {
    let itemsHtml = '';
    (order.order_items || []).forEach(item => {
        const itemTotal = (item.quantity * item.price_per_item).toFixed(2);
        itemsHtml += `
            <tr>
                <td style="text-align: left; vertical-align: top;">${item.quantity}x</td>
                <td style="padding-left: 5px;">
                    ${item.item_name}
        `;
        if (item.selected_extras && item.selected_extras.length > 0) {
            itemsHtml += `<div style="font-size: 10px; color: #333;">`;
            item.selected_extras.forEach(extra => {
                itemsHtml += `<div>+ ${extra.name}</div>`;
            });
            itemsHtml += `</div>`;
        }
        itemsHtml += `
                </td>
                <td style="text-align: right; vertical-align: top;">R$${itemTotal}</td>
            </tr>
        `;
    });

<<<<<<< HEAD
=======
    // Adiciona a secção de observações apenas se existirem
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
    let observationsHtml = '';
    if (order.observations && order.observations.trim() !== '') {
        observationsHtml = `
            <div style="border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px;">
                <div style="font-weight: bold;">Observações:</div>
                <div>${order.observations}</div>
            </div>
        `;
    }

    return `
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            @page { size: 58mm auto; margin: 3mm; }
            body { font-family: 'Courier New', monospace; font-size: 10px; color: #000; width: 52mm; }
<<<<<<< HEAD
            .header h1 { font-size: 16px; margin: 0; text-align: center; }
=======
            .header, .total-section { text-align: center; }
            .header h1 { font-size: 16px; margin: 0; }
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
            .info-table, .items-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 1px 0; }
            .items-table { margin-top: 10px; }
            .items-table th { border-bottom: 1px dashed #000; text-align: left; padding-bottom: 3px; }
            .items-table td { padding: 3px 0; }
            .total { font-size: 14px; font-weight: bold; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
<<<<<<< HEAD
          <div class="header"><h1>FORNERIA 360</h1></div>
=======
          <div class="header">
            <h1>FORNERIA 360</h1>
          </div>
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
          <table class="info-table">
            <tr><td>Pedido:</td><td style="text-align: right;">#${order.id}</td></tr>
            <tr><td>Data:</td><td style="text-align: right;">${new Date(order.created_at).toLocaleString('pt-BR')}</td></tr>
            <tr><td>Cliente:</td><td style="text-align: right;">${order.customer_name || 'N/A'}</td></tr>
            <tr><td>Tipo:</td><td style="text-align: right; font-weight: bold;">${order.order_type.toUpperCase()}</td></tr>
            <tr><td>Pagamento:</td><td style="text-align: right; font-weight: bold;">${order.payment_method.toUpperCase()}</td></tr>
          </table>
          <table class="items-table">
            <thead>
              <tr>
<<<<<<< HEAD
                <th style="width: 10%;">Qtd</th><th style="width: 60%;">Item</th><th style="width: 30%; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          ${observationsHtml}
          <div class="total"><span>Total:</span><span>R$ ${order.final_price.toFixed(2)}</span></div>
=======
                <th style="width: 10%;">Qtd</th>
                <th style="width: 60%;">Item</th>
                <th style="width: 30%; text-align: right;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          ${observationsHtml}
          <div class="total">
            <span>Total:</span>
            <span>R$ ${order.final_price.toFixed(2)}</span>
          </div>
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
        </body>
      </html>
    `;
  };

  const handlePrint = useCallback((order: Order) => {
    const receiptHtml = formatOrderForPrinting(order);
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    } else {
        alert('Por favor, permita pop-ups para imprimir o pedido.');
    }
  }, []);
<<<<<<< HEAD

  const enableSound = () => {
    audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        setSoundEnabled(true);
        alert('As notificações sonoras foram ativadas!');
    }).catch(e => {
        console.error("Erro ao tentar ativar o áudio:", e);
        alert('O seu navegador bloqueou a ativação automática do som.');
    });
  };
=======
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a

  const enableSound = () => {
    audioRef.current?.play().then(() => {
        audioRef.current?.pause();
        setSoundEnabled(true);
        alert('As notificações sonoras foram ativadas!');
    }).catch(e => {
        console.error("Erro ao tentar ativar o áudio:", e);
        alert('O seu navegador bloqueou a ativação automática do som.');
    });
  };

  // --- CÓDIGO ATUALIZADO E CORRIGIDO ---
  useEffect(() => {
<<<<<<< HEAD
    const handleRealtimeChange = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as Order;
        supabase.from('order_items').select('*').eq('order_id', newOrder.id)
          .then(({ data: items }) => {
              const completeOrder = { ...newOrder, order_items: items as OrderItem[] };
              setOrders((current) => [completeOrder, ...current.filter(o => o.id !== completeOrder.id)]);
              if (soundEnabled) {
                audioRef.current?.play().catch(e => console.error("Erro ao tocar áudio:", e));
              }
          });
      }
      if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new as Order;
=======
    const handleRealtimeChange = async (payload: RealtimePostgresChangesPayload<Order>) => {
      // Lógica para INSERIR um novo pedido
      if (payload.eventType === 'INSERT') {
        try {
          const newOrder = payload.new;

          const { data: items, error } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', newOrder.id)
            .returns<OrderItem[]>(); // Tipagem explícita do retorno

          if (error) {
            console.error('Falha ao buscar itens do pedido:', error);
            return;
          }

          const completeOrder: Order = { ...newOrder, order_items: items || [] };

          setOrders((current) => [completeOrder, ...current.filter(o => o.id !== completeOrder.id)]);

          if (soundEnabled) {
            audioRef.current?.play().catch(e => console.error('Erro ao tocar áudio:', e));
          }

        } catch (e) {
          console.error('Erro inesperado no evento de INSERT:', e);
        }
      }

      // Lógica para ATUALIZAR um pedido existente
      if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new;

>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
        if (updatedOrder.status === 'Finalizado' || updatedOrder.status === 'Cancelado') {
          setOrders(current => current.filter(o => o.id !== updatedOrder.id));
        } else {
<<<<<<< HEAD
            setOrders(current => current.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
=======
          // Atualiza o pedido com todos os novos dados, garantindo a sincronia
          setOrders(current =>
            current.map(order =>
              order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
            )
          );
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a
        }
      }
    };

    const channel = supabase
      .channel('realtime-orders-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        handleRealtimeChange
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
<<<<<<< HEAD
  }, [supabase, soundEnabled]);
=======
  }, [supabase, soundEnabled]); // Dependências do useEffect
>>>>>>> 5a8ac0edae89361cacfa187d28b48b396f655b7a


  const updateOrderStatus = async (orderId: number, newStatus: string, motoboyId: string | null = null) => {
    try {
      const body = motoboyId ? { newStatus, motoboyId } : { newStatus };
      await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("Falha ao atualizar status:", err);
      fetchData();
    }
  };
  
  const handleUpdateStatus = (order: Order, newStatus: string) => {
    if (newStatus === 'Saiu para Entrega' && order.order_type && order.order_type.toLowerCase() === 'delivery') {
      setMotoboyModal({ isOpen: true, order: order });
      return;
    }
    updateOrderStatus(order.id, newStatus);
  };

  const handleAssignMotoboy = (motoboyId: string) => {
    if (!motoboyModal.order) return;
    updateOrderStatus(motoboyModal.order.id, 'Saiu para Entrega', motoboyId);
    setMotoboyModal({ isOpen: false, order: null });
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm(`Tem a certeza que quer cancelar o Pedido #${orderId}? Esta ação não pode ser desfeita.`)) {
        try {
            const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao cancelar o pedido.');
            alert('Pedido cancelado com sucesso.');
        } catch (err: any) {
            alert(`Erro ao cancelar pedido: ${err.message}`);
        }
    }
  };

  const handleAddExtraToItem = (itemIndex: number, extraId: string) => {
    const extra = extras.find(e => e.id === extraId);
    if (!extra) return;
    const updatedItems = [...newOrderData.items];
    const currentExtras = updatedItems[itemIndex].extras || [];
    // Supondo que `extra.ingredients.name` é o nome desejado
    updatedItems[itemIndex].extras = [...currentExtras, { id: extra.id, name: extra.ingredients.name, price: extra.price }];
    setNewOrderData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleRemoveExtraFromItem = (itemIndex: number, extraIndex: number) => {
    const updatedItems = [...newOrderData.items];
    updatedItems[itemIndex].extras.splice(extraIndex, 1);
    setNewOrderData(prev => ({ ...prev, items: updatedItems }));
  };
  
  const handleNewOrderItemAdd = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newItem: NewOrderItem = {
        item_id: product.id,
        item_name: product.name,
        quantity: 1,
        price_per_item: product.price,
        item_type: product.item_type,
        extras: [],
    };
    setNewOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleNewOrderItemRemove = (index: number) => {
    setNewOrderData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const newOrderTotal = useMemo(() => {
    const itemsTotal = newOrderData.items.reduce((acc, item) => {
        const extrasTotal = item.extras.reduce((extraAcc, extra) => extraAcc + extra.price, 0);
        return acc + (item.quantity * item.price_per_item) + extrasTotal;
    }, 0);
    const deliveryFee = newOrderData.order_type === 'delivery' ? newOrderData.delivery_fee : 0;
    const discount = newOrderData.discount_amount || 0;
    return (itemsTotal + deliveryFee) - discount;
  }, [newOrderData]);

  const handleSaveNewOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newOrderData, final_price: newOrderTotal }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao criar o pedido.');
        }
        setIsNewOrderModalOpen(false);
        setNewOrderData(initialNewOrderState);
        // Não precisa chamar fetchData() aqui, o realtime já vai atualizar
    } catch (err) {
        if (err instanceof Error) {
            alert(`Erro ao criar pedido: ${err.message}`);
        }
    }
  };

  if (loading) return <p className="p-4 text-center">A carregar pedidos...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-4 rounded-lg">Erro: {error}</p>;

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos Ativos</h1>
        <div className="flex items-center space-x-3">
            <button 
              onClick={enableSound}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
              title={soundEnabled ? 'Notificações sonoras ativadas' : 'Clique para ativar as notificações sonoras'}
            >
              {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
            </button>
            <button onClick={() => setIsNewOrderModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
              Gerar Novo Pedido
            </button>
        </div>
      </div>
      
      <audio ref={audioRef} src="/notificacao.mp3" preload="auto"></audio>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pedido #{order.id}</h2>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleTimeString('pt-BR')} - {order.customer_name || 'Cliente'}</p>
              </div>
              <span className="px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full">{order.status}</span>
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <p><strong>Tipo:</strong> <span className="font-semibold capitalize">{order.order_type || 'Não definido'}</span></p>
                  <p><strong>Pagamento:</strong> <span className={`font-bold capitalize ${order.payment_method === 'pix' ? 'text-cyan-600' : 'text-gray-700'}`}>{order.payment_method}</span></p>
                </div>
                <p className="font-bold text-lg">Total: R$ {order.final_price.toFixed(2).replace('.', ',')}</p>
              </div>
              {order.payment_method === 'pix' && (
                <div className="mt-2 p-2 bg-cyan-50 text-cyan-700 text-sm rounded-md border border-cyan-200">
                  <strong>Atenção:</strong> Pedido via PIX. Verifique o recebimento do comprovativo.
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => updateOrderStatus(order.id, 'Em Preparo')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Em Preparo</button>
                {order.order_type && order.order_type.toLowerCase() === 'delivery' ? (
                  <button onClick={() => handleUpdateStatus(order, 'Saiu para Entrega')} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">Saiu para Entrega</button>
                ) : (
                  <button onClick={() => updateOrderStatus(order.id, 'Pronto para Retirada')} className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm">Pronto para Retirada</button>
                )}
                <button onClick={() => updateOrderStatus(order.id, 'Finalizado')} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Finalizar Pedido</button>
                <button onClick={() => handlePrint(order)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm">Reimprimir</button>
                <button onClick={() => handleCancelOrder(order.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Cancelar</button>
            </div>
          </div>
        ))}
        {orders.length === 0 && !loading && <p className="text-center text-gray-500 mt-8">Nenhum pedido ativo no momento.</p>}
      </div>

      {motoboyModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Selecionar Motoboy</h2>
            <p className="mb-4 text-sm text-gray-600">Para o Pedido #{motoboyModal.order?.id}</p>
            <div className="space-y-2">
              {motoboys.length > 0 ? motoboys.map(motoboy => (
                <button key={motoboy.id} onClick={() => handleAssignMotoboy(motoboy.id)} className="w-full text-left p-3 bg-gray-100 rounded hover:bg-blue-100">{motoboy.name}</button>
              )) : <p className="text-gray-500">Nenhum motoboy ativo encontrado.</p>}
            </div>
            <button onClick={() => setMotoboyModal({ isOpen: false, order: null })} className="mt-6 w-full p-2 bg-gray-200 rounded hover:bg-gray-300">Cancelar</button>
          </div>
        </div>
      )}

      {isNewOrderModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4">
            <form onSubmit={handleSaveNewOrder} className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
                <h2 className="text-2xl font-bold mb-4">Gerar Novo Pedido Manual</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Nome do Cliente" value={newOrderData.customer_name} onChange={e => setNewOrderData({...newOrderData, customer_name: e.target.value})} className="w-full p-2 border rounded" required />
                    <input type="text" placeholder="Telefone/WhatsApp" value={newOrderData.customer_phone} onChange={e => setNewOrderData({...newOrderData, customer_phone: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="text-sm font-medium">Tipo de Pedido</label>
                    <div className="flex gap-4 mt-1"><label className="flex items-center gap-2"><input type="radio" name="order_type" value="pickup" checked={newOrderData.order_type === 'pickup'} onChange={e => setNewOrderData({...newOrderData, order_type: e.target.value})} /> Retirada</label><label className="flex items-center gap-2"><input type="radio" name="order_type" value="delivery" checked={newOrderData.order_type === 'delivery'} onChange={e => setNewOrderData({...newOrderData, order_type: e.target.value})} /> Entrega</label></div>
                </div>
                {newOrderData.order_type === 'delivery' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Endereço de Entrega" value={newOrderData.address} onChange={e => setNewOrderData({...newOrderData, address: e.target.value})} className="w-full p-2 border rounded" required />
                        <select 
                            value={newOrderData.delivery_fee} 
                            onChange={e => setNewOrderData({...newOrderData, delivery_fee: parseFloat(e.target.value)})}
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value={0} disabled>Selecione a taxa...</option>
                            {deliveryFees.map(fee => (
                                <option key={fee.id} value={fee.fee_amount}>
                                    {fee.neighborhood_name} - R$ {fee.fee_amount.toFixed(2)}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
                <div>
                    <label className="text-sm font-medium">Observações</label>
                    <textarea 
                        placeholder="Ex: Pizza sem cebola, troco para R$50, etc."
                        value={newOrderData.observations}
                        onChange={e => setNewOrderData({...newOrderData, observations: e.target.value})}
                        className="w-full p-2 border rounded mt-1 h-20"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Itens do Pedido</label>
                    <div className="flex gap-2 mt-1">
                        <select onChange={e => handleNewOrderItemAdd(e.target.value)} value="" className="flex-grow p-2 border rounded">
                            <option value="" disabled>Selecione um produto para adicionar...</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                        </select>
                    </div>
                </div>
                <div className="border rounded p-2 min-h-[150px] space-y-2">
                    {newOrderData.items.map((item, index) => (
                        <div key={index} className="p-2 border-b">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">{item.quantity}x {item.item_name}</span>
                                <button type="button" onClick={() => handleNewOrderItemRemove(index)} className="text-red-500 font-bold text-xl leading-none">&times;</button>
                            </div>
                            {item.item_type === 'pizza' && (
                                <div className="pl-4 mt-2">
                                    <div className="flex gap-2 items-center">
                                        <select onChange={e => handleAddExtraToItem(index, e.target.value)} value="" className="text-xs p-1 border rounded">
                                            <option value="" disabled>Adicionar extra...</option>
                                            {extras.map(e => <option key={e.id} value={e.id}>{e.ingredients.name} (+ R$ {e.price.toFixed(2)})</option>)}
                                        </select>
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {item.extras.map((extra, extraIndex) => (
                                            <div key={`${extra.id}-${extraIndex}`} className="flex justify-between items-center text-xs text-gray-600">
                                                <span>+ {extra.name}</span>
                                                <button type="button" onClick={() => handleRemoveExtraFromItem(index, extraIndex)} className="text-red-400 hover:text-red-600">remover</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {newOrderData.items.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Nenhum item adicionado.</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <label className="text-sm font-medium">Desconto (R$)</label>
                        <input 
                            type="number" 
                            placeholder="0.00" 
                            step="0.01"
                            value={newOrderData.discount_amount || ''} 
                            onChange={e => setNewOrderData({...newOrderData, discount_amount: parseFloat(e.target.value) || 0})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="text-right font-bold text-xl">Total: R$ {newOrderTotal.toFixed(2)}</div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => { setIsNewOrderModalOpen(false); setNewOrderData(initialNewOrderState); }} className="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Salvar Pedido</button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}