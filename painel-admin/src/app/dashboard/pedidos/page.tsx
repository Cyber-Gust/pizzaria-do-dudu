'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react';

// Tipagens
type ExtraItem = { id: string; name: string; price: number };
type OrderItem = { item_name: string; quantity: number; price_per_item: number; selected_extras?: ExtraItem[] };
type Order = {
  id: number;
  customer_name: string;
  customer_phone: string | null;
  status: string;
  final_price: number;
  order_type: string;
  payment_method: string;
  address: string | null;
  created_at: string;
  order_items: OrderItem[];
  observations: string | null;
};
type Motoboy = { id: string; name: string; };
export type Pizza = { id: string; name: string; price: number; item_type: 'pizza' };
type Drink = { id: string; name: string; price: number; item_type: 'drink' };
type Product = Pizza | Drink;
type Extra = { id: string; price: number; ingredients: { name: string } };
type DeliveryFee = { id: string; neighborhood_name: string; fee_amount: number; };

type NewOrderItem = {
  item_id: string | null; // Permite nulo para meio a meio
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
  observations: '',
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [motoboyModal, setMotoboyModal] = useState<{ isOpen: boolean, order: Order | null }>({ isOpen: false, order: null });
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState(initialNewOrderState);

  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const [isHalfAndHalfModalOpen, setIsHalfAndHalfModalOpen] = useState(false);
  const [firstHalfPizzaId, setFirstHalfPizzaId] = useState<string>('');
  const [secondHalfPizzaId, setSecondHalfPizzaId] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pizzaria-do-dudu.onrender.com';
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
      const itemsHtml = (order.order_items || []).map(item => {
          const itemTotal = (item.quantity * item.price_per_item).toFixed(2);
          let extrasHtml = '';
          if (item.selected_extras && item.selected_extras.length > 0) {
              extrasHtml = `<div class="extras-list">${item.selected_extras.map(extra => `<div>+ ${extra.name}</div>`).join('')}</div>`;
          }
          return `
              <tr>
                  <td class="item-qty">${item.quantity}x</td>
                  <td class="item-name">
                      ${item.item_name}
                      ${extrasHtml}
                  </td>
                  <td class="item-price">R$${itemTotal}</td>
              </tr>`;
      }).join('');

      return `
          <html>
          <head>
              <title>Pedido #${order.id}</title>
              <style>
                  @page { size: 58mm auto; margin: 3mm; }
                  body { font-family: 'Consolas', 'Menlo', 'Courier New', monospace; font-size: 11px; color: #000; width: 52mm; }
                  .receipt-header { text-align: center; margin-bottom: 8px; }
                  .receipt-header h1 { font-size: 18px; font-weight: bold; margin: 0; }
                  .order-id { text-align: center; font-size: 20px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 4px 0; margin-bottom: 8px; }
                  .section { margin-top: 10px; }
                  .section-title { font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 5px; }
                  .info-table, .items-table { width: 100%; border-collapse: collapse; }
                  .info-table td { padding: 1.5px 0; }
                  .info-table td:last-child { text-align: right; }
                  .items-table .item-qty { text-align: left; vertical-align: top; width: 15%; }
                  .items-table .item-name { padding: 0 4px; }
                  .items-table .item-price { text-align: right; vertical-align: top; width: 30%; }
                  .items-table .extras-list { font-size: 10px; color: #333; padding-left: 4px; }
                  .observations-box { margin-top: 10px; padding: 6px; border: 1px solid #000; background-color: #f0f0f0; }
                  .observations-box .section-title { border: none; margin-bottom: 4px; }
                  .observations-box p { font-size: 12px; font-weight: bold; margin: 0; white-space: pre-wrap; }
                  .total-line { margin-top: 10px; padding-top: 5px; border-top: 1px dashed #000; display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; }
                  .footer { margin-top: 15px; text-align: center; font-size: 10px; }
              </style>
          </head>
          <body>
              <div class="receipt-header"><h1>FORNERIA 360</h1></div>
              <div class="order-id">PEDIDO #${order.id}</div>
              <div class="section">
                  <table class="info-table">
                      <tr><td>Data:</td><td>${new Date(order.created_at).toLocaleString('pt-BR')}</td></tr>
                      <tr><td>Cliente:</td><td>${order.customer_name || 'N/A'}</td></tr>
                      <tr><td>Telefone:</td><td>${order.customer_phone || 'N/A'}</td></tr>
                      <tr><td>Tipo:</td><td><strong>${order.order_type.toUpperCase()}</strong></td></tr>
                      <tr><td>Pagamento:</td><td><strong>${order.payment_method.toUpperCase()}</strong></td></tr>
                  </table>
              </div>
              <div class="section">
                  <div class="section-title">Itens do Pedido</div>
                  <table class="items-table"><tbody>${itemsHtml}</tbody></table>
              </div>
              ${(order.order_type === 'delivery' && order.address) ? `<div class="section"><div class="section-title">Endereço de Entrega</div><p style="font-size: 12px; font-weight: bold;">${order.address}</p></div>` : ''}
              ${(order.observations && order.observations.trim() !== '') ? `<div class="observations-box"><div class="section-title">!!! OBSERVAÇÕES !!!</div><p>${order.observations}</p></div>` : ''}
              <div class="total-line"><span>Total:</span><span>R$ ${order.final_price.toFixed(2).replace('.', ',')}</span></div>
              <div class="footer">Obrigado pela preferência!</div>
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
  }, [formatOrderForPrinting]);

  useEffect(() => {
    const handleRealtimeChange = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as Order;
        supabase.from('order_items').select('*').eq('order_id', newOrder.id)
          .then(({ data: items }) => {
            const completeOrder = { ...newOrder, order_items: items as OrderItem[] };
            setOrders((current) => [completeOrder, ...current.filter(o => o.id !== completeOrder.id)]);
          });
      }
      if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new as Order;
        if (updatedOrder.status === 'Finalizado' || updatedOrder.status === 'Cancelado') {
          setOrders(current => current.filter(o => o.id !== updatedOrder.id));
        } else {
          setOrders(current => current.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
        }
      }
    };

    const channel = supabase
      .channel('realtime-orders-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, handleRealtimeChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const updateOrderStatus = async (orderId: number, newStatus: string, motoboyId: string | null = null) => {
    try {
      const body = motoboyId ? { newStatus, motoboyId } : { newStatus };
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`Falha ao atualizar o status do pedido #${orderId}`);
      }
    } catch (err) {
      console.error("Falha ao atualizar status:", err);
      fetchData();
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    await updateOrderStatus(order.id, 'Em Preparo');
    handlePrint(order);
  };
  
  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm(`Tem a certeza que quer cancelar o Pedido #${orderId}?`)) {
      await updateOrderStatus(orderId, 'Cancelado');
    }
  };

  const handleUpdateStatus = (order: Order, newStatus: string) => {
    if (newStatus === 'Saiu para Entrega' && order.order_type === 'delivery') {
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
  
  const handleAddExtraToItem = (itemIndex: number, extraId: string) => {
    const extra = extras.find(e => e.id === extraId);
    if (!extra) return;
    const updatedItems = [...newOrderData.items];
    const currentExtras = updatedItems[itemIndex].extras || [];
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
        body: JSON.stringify(newOrderData)
      });
      if (!response.ok) throw new Error('Falha ao criar o pedido.');
      setIsNewOrderModalOpen(false);
      setNewOrderData(initialNewOrderState);
      fetchData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Erro ao criar pedido: ${err.message}`);
      }
    }
  };

  const handleOpenHalfAndHalfModal = () => setIsHalfAndHalfModalOpen(true);
  
  const handleCloseHalfAndHalfModal = () => {
    setIsHalfAndHalfModalOpen(false);
    setFirstHalfPizzaId('');
    setSecondHalfPizzaId('');
  };

  const handleAddHalfAndHalfItem = () => {
    if (!firstHalfPizzaId || !secondHalfPizzaId) {
      alert('Por favor, selecione as duas metades da pizza.');
      return;
    }
    const firstHalf = products.find(p => p.id === firstHalfPizzaId) as Pizza;
    const secondHalf = products.find(p => p.id === secondHalfPizzaId) as Pizza;
    if (!firstHalf || !secondHalf) {
      alert('Erro ao encontrar as pizzas selecionadas.');
      return;
    }
    const averagePrice = (firstHalf.price + secondHalf.price) / 2;
    const itemName = `Meio a Meio: ${firstHalf.name} / ${secondHalf.name}`;
    const newItem: NewOrderItem = {
      item_id: null,
      item_name: itemName,
      quantity: 1,
      price_per_item: averagePrice,
      item_type: 'pizza',
      extras: [],
    };
    setNewOrderData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    handleCloseHalfAndHalfModal();
  };
  
  const pizzaOptions = useMemo(() => products.filter((p): p is Pizza => p.item_type === 'pizza'), [products]);

  if (loading) return <p>A carregar pedidos...</p>;
  if (error) return <p className="text-red-500 bg-red-100 p-4 rounded-lg">Erro: {error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pedidos Ativos</h1>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsNewOrderModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold">
            Gerar Novo Pedido
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-5 rounded-lg shadow-md transition-all duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pedido #{order.id}</h2>
                <div className="text-sm text-gray-500 mt-1">
                  <p>{order.customer_name || 'Cliente'}</p>
                  {order.customer_phone && (
                    <a href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      <Phone size={12} />
                      {order.customer_phone}
                    </a>
                  )}
                  {/* --- 2. CORREÇÃO APLICADA AQUI --- */}
                  {/* Mostra o endereço se for um pedido de entrega */}
                  {order.order_type === 'delivery' && order.address && (
                    <div className="flex items-start gap-1.5 text-gray-700 pt-1">
                      <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                      <p className="font-medium">{order.address.split('(Taxa:')[0].trim()}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 text-sm font-semibold text-white bg-blue-500 rounded-full">{order.status}</span>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleTimeString('pt-BR')}</p>
              </div>
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

            {expandedOrderId === order.id && (
              <div className="mt-4 pt-4 border-t border-dashed">
                <h4 className="font-semibold text-gray-700 mb-2">Itens do Pedido:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {order.order_items.map((item, index) => (
                    <li key={index}>
                      {item.quantity}x {item.item_name}
                      {item.selected_extras && item.selected_extras.length > 0 && (
                        <span className="text-xs text-gray-500 ml-2">
                          (+ {item.selected_extras.map(e => e.name).join(', ')})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {order.observations && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-700">Observações:</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{order.observations}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2 items-center">
              {order.status === 'Aguardando Confirmação' ? (
                <>
                  <button 
                    onClick={() => handleAcceptOrder(order)} 
                    className="flex-grow px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-bold text-sm"
                  >
                    Aceitar Pedido
                  </button>
                  <button 
                    onClick={() => handleCancelOrder(order.id)} 
                    className="flex-grow px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm"
                  >
                    Recusar
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleUpdateStatus(order, 'Em Preparo')} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm">Em Preparo</button>
                  {order.order_type === 'delivery' ? (
                    <button onClick={() => handleUpdateStatus(order, 'Saiu para Entrega')} className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">Saiu para Entrega</button>
                  ) : (
                    <button onClick={() => handleUpdateStatus(order, 'Pronto para Retirada')} className="px-3 py-1 bg-teal-500 text-white rounded hover:bg-teal-600 text-sm">Pronto para Retirada</button>
                  )}
                  <button onClick={() => handleUpdateStatus(order, 'Finalizado')} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">Finalizar</button>
                </>
              )}

              <button onClick={() => handlePrint(order)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm">Reimprimir</button>
              <button onClick={() => handleCancelOrder(order.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Cancelar</button>

              <button
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                className="ml-auto p-1 text-gray-500 hover:bg-gray-100 rounded-full"
              >
                {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
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
              <input type="text" placeholder="Nome do Cliente" value={newOrderData.customer_name} onChange={e => setNewOrderData({ ...newOrderData, customer_name: e.target.value })} className="w-full p-2 border rounded" />
              <input type="text" placeholder="Telefone/WhatsApp" value={newOrderData.customer_phone} onChange={e => setNewOrderData({ ...newOrderData, customer_phone: e.target.value })} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="text-sm font-medium">Tipo de Pedido</label>
              <div className="flex gap-4 mt-1"><label><input type="radio" name="order_type" value="pickup" checked={newOrderData.order_type === 'pickup'} onChange={e => setNewOrderData({ ...newOrderData, order_type: e.target.value })} /> Retirada</label><label><input type="radio" name="order_type" value="delivery" checked={newOrderData.order_type === 'delivery'} onChange={e => setNewOrderData({ ...newOrderData, order_type: e.target.value })} /> Entrega</label></div>
            </div>
            {newOrderData.order_type === 'delivery' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Endereço de Entrega" value={newOrderData.address} onChange={e => setNewOrderData({ ...newOrderData, address: e.target.value })} className="w-full p-2 border rounded" />
                <select
                  value={newOrderData.delivery_fee}
                  onChange={e => setNewOrderData({ ...newOrderData, delivery_fee: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded"
                >
                  <option value={0}>Selecione a taxa...</option>
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
                onChange={e => setNewOrderData({ ...newOrderData, observations: e.target.value })}
                className="w-full p-2 border rounded mt-1 h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Itens do Pedido</label>
              <div className="flex gap-2 mt-1">
                <select onChange={e => handleNewOrderItemAdd(e.target.value)} value="" className="flex-grow p-2 border rounded">
                  <option value="" disabled>Adicionar item completo...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                </select>
                <button type="button" onClick={handleOpenHalfAndHalfModal} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold text-sm">
                  Meio a Meio
                </button>
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
                          <div key={extra.id} className="flex justify-between items-center text-xs text-gray-600">
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
                  onChange={e => setNewOrderData({ ...newOrderData, discount_amount: parseFloat(e.target.value) || 0 })}
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

      {isHalfAndHalfModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4">
            <h3 className="text-xl font-bold">Montar Pizza Meio a Meio</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primeira Metade</label>
              <select value={firstHalfPizzaId} onChange={e => setFirstHalfPizzaId(e.target.value)} className="w-full p-2 border rounded">
                <option value="" disabled>Selecione o primeiro sabor...</option>
                {pizzaOptions.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Segunda Metade</label>
              <select value={secondHalfPizzaId} onChange={e => setSecondHalfPizzaId(e.target.value)} className="w-full p-2 border rounded">
                <option value="" disabled>Selecione o segundo sabor...</option>
                {pizzaOptions.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
              </select>
            </div>

            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={handleCloseHalfAndHalfModal} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                Cancelar
              </button>
              <button type="button" onClick={handleAddHalfAndHalfItem} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Adicionar Pizza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
