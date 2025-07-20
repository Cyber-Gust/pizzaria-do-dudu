'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

// Tipagens
type ExtraItem = { id: string; name: string; price: number };
type OrderItem = { item_name: string; quantity: number; price_per_item: number; selected_extras?: ExtraItem[] };
type Order = {
  id: number;
  customer_name: string;
  status: string;
  final_price: number;
  order_type: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
};
type Motoboy = { id: string; name: string; };
type Product = { id: string; name: string; price: number; item_type: 'pizza' | 'drink' };
type Extra = { id: string; price: number; ingredients: { name: string } };
type DeliveryFee = { id: string; neighborhood_name: string; fee_amount: number; }; // Nova tipagem

// Tipagem para os itens dentro do novo pedido
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
  discount_amount: 0, // Novo campo
  delivery_fee: 0,    // Novo campo
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<DeliveryFee[]>([]); // Novo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [motoboyModal, setMotoboyModal] = useState<{ isOpen: boolean, order: Order | null }>({ isOpen: false, order: null });
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderData, setNewOrderData] = useState(initialNewOrderState);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [printerCharacteristic, setPrinterCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | null>(null);

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
        fetch(`${API_URL}/api/delivery-fees`), // Buscar taxas
      ]);
      if (!ordersRes.ok || !motoboysRes.ok || !pizzasRes.ok || !drinksRes.ok || !extrasRes.ok || !feesRes.ok) throw new Error('Falha ao carregar dados.');
      
      setOrders(await ordersRes.json());
      setMotoboys(await motoboysRes.json());
      const pizzasData = (await pizzasRes.json()).map((p: Product) => ({ ...p, item_type: 'pizza' as const }));
      const drinksData = (await drinksRes.json()).map((d: Product) => ({ ...d, item_type: 'drink' as const }));
      setProducts([...pizzasData, ...drinksData]);
      setExtras(await extrasRes.json());
      setDeliveryFees(await feesRes.json()); // Salvar taxas no estado

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
    // Usamos HTML e CSS inline para criar um recibo bem formatado
    const styles = {
        page: `width: 80mm; font-family: 'Courier New', monospace; font-size: 12px; color: #000;`,
        header: `text-align: center;`,
        title: `font-size: 16px; font-weight: bold; margin: 0;`,
        info: `border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 10px 0;`,
        infoLine: `display: flex; justify-content: space-between;`,
        itemsHeader: `font-weight: bold; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 5px;`,
        item: `display: flex;`,
        itemName: `flex-grow: 1;`,
        itemPrice: `text-align: right;`,
        extras: `font-size: 10px; color: #555; padding-left: 15px;`,
        total: `font-size: 18px; font-weight: bold; text-align: right; border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px;`
    };

    let itemsHtml = '';
    (order.order_items || []).forEach(item => {
        const itemTotal = (item.quantity * item.price_per_item).toFixed(2);
        itemsHtml += `
            <div style="${styles.item}">
                <div style="${styles.itemName}">${item.quantity}x ${item.item_name}</div>
                <div style="${styles.itemPrice}">R$ ${itemTotal}</div>
            </div>
        `;
        if (item.selected_extras && item.selected_extras.length > 0) {
            item.selected_extras.forEach(extra => {
                itemsHtml += `<div style="${styles.extras}">+ ${extra.name}</div>`;
            });
        }
    });

    return `
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div style="${styles.page}">
            <div style="${styles.header}">
              <p style="${styles.title}">FORNERIA 360</p>
            </div>
            <div style="${styles.info}">
              <div style="${styles.infoLine}"><span>Pedido:</span><span>#${order.id}</span></div>
              <div style="${styles.infoLine}"><span>Data:</span><span>${new Date(order.created_at).toLocaleString('pt-BR')}</span></div>
              <div style="${styles.infoLine}"><span>Cliente:</span><span>${order.customer_name || 'N/A'}</span></div>
              <div style="${styles.infoLine}"><span>Tipo:</span><span style="font-weight: bold;">${order.order_type.toUpperCase()}</span></div>
              <div style="${styles.infoLine}"><span>Pagamento:</span><span style="font-weight: bold;">${order.payment_method.toUpperCase()}</span></div>
            </div>
            <div style="${styles.itemsHeader}">Itens</div>
            ${itemsHtml}
            <div style="${styles.total}">
              <span>Total:</span>
              <span>R$ ${order.final_price.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const printOrder = useCallback(async (order: Order) => {
    if (!isConnected || !printerCharacteristic) {
        console.log('Impressora não conectada. O pedido não será impresso.');
        return;
    }
    try {
        const receiptText = formatOrderForPrinting(order);
        const encoder = new TextEncoder();
        const data = encoder.encode(receiptText);
        await printerCharacteristic.writeValue(data);
        console.log(`Pedido #${order.id} enviado para a impressora.`);
    } catch (err) {
        console.error('Erro ao imprimir:', err);
        alert('Erro ao enviar pedido para a impressora. Tente reconectar.');
        setIsConnected(false);
    }
  }, [isConnected, printerCharacteristic, formatOrderForPrinting]);

  useEffect(() => {
    const handleRealtimeChange = (payload: any) => {
      // Para novos pedidos, adicionamos à lista e imprimimos
      if (payload.eventType === 'INSERT') {
        const newOrder = payload.new as Order;
        // É importante buscar os itens do pedido, pois eles podem não vir no payload inicial
        supabase.from('order_items').select('*').eq('order_id', newOrder.id)
          .then(({ data: items }) => {
              const completeOrder = { ...newOrder, order_items: items as OrderItem[] };
              setOrders((current) => [completeOrder, ...current.filter(o => o.id !== completeOrder.id)]);
              audioRef.current?.play().catch(e => console.error("Erro ao tocar áudio:", e));
              printOrder(completeOrder); // A sua função de impressão Bluetooth é chamada aqui
          });
      }
      // Para atualizações, verificamos o novo status
      if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new as Order;
        // Se o pedido foi finalizado ou cancelado, removemo-lo da lista
        if (updatedOrder.status === 'Finalizado' || updatedOrder.status === 'Cancelado') {
            setOrders(current => current.filter(o => o.id !== updatedOrder.id));
        } else {
            // Caso contrário, apenas atualizamos o status na tela
            setOrders(current => current.map(o => o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o));
        }
      }
    };

    const channel = supabase
      .channel('realtime-orders-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' }, // Ouve todos os eventos (*), não apenas INSERT
        handleRealtimeChange
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, printOrder]);

  const handleConnectPrinter = async () => {
    setIsConnecting(true);
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      const characteristic = await service?.getCharacteristic('00001101-0000-1000-8000-00805f9b34fb');
      if (characteristic) {
        setPrinterCharacteristic(characteristic);
        setIsConnected(true);
      }
    } catch (err) {
      console.error("Falha ao conectar à impressora:", err);
      alert('Não foi possível conectar à impressora.');
    } finally {
      setIsConnecting(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string, motoboyId: string | null = null) => {
    if (newStatus === 'Finalizado' || newStatus === 'Cancelado') {
      setOrders(current => current.filter(o => o.id !== orderId));
    } else {
      setOrders(current => current.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
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
    setMotoboyModal({ isOpen: false, order: null });
    updateOrderStatus(motoboyModal.order.id, 'Saiu para Entrega', motoboyId);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm(`Tem a certeza que quer cancelar o Pedido #${orderId}? Esta ação não pode ser desfeita.`)) {
        try {
            const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao cancelar o pedido.');
            setOrders(current => current.filter(o => o.id !== orderId));
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
            <button onClick={handleConnectPrinter} disabled={isConnecting || isConnected} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
                {isConnecting ? 'A conectar...' : (isConnected ? 'Conectada' : 'Conectar Impressora')}
            </button>
        </div>
      </div>
      
      <audio ref={audioRef} src="https://cdn.freesound.org/previews/253/253887_3900301-lq.mp3" preload="auto"></audio>
      
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
            {/* --- [ATUALIZADO] Detalhes do Pedido --- */}
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
                <button onClick={() => printOrder(order)} className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm">Reimprimir</button>
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
                    <input type="text" placeholder="Nome do Cliente" value={newOrderData.customer_name} onChange={e => setNewOrderData({...newOrderData, customer_name: e.target.value})} className="w-full p-2 border rounded" />
                    <input type="text" placeholder="Telefone/WhatsApp" value={newOrderData.customer_phone} onChange={e => setNewOrderData({...newOrderData, customer_phone: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="text-sm font-medium">Tipo de Pedido</label>
                    <div className="flex gap-4 mt-1"><label><input type="radio" name="order_type" value="pickup" checked={newOrderData.order_type === 'pickup'} onChange={e => setNewOrderData({...newOrderData, order_type: e.target.value})} /> Retirada</label><label><input type="radio" name="order_type" value="delivery" checked={newOrderData.order_type === 'delivery'} onChange={e => setNewOrderData({...newOrderData, order_type: e.target.value})} /> Entrega</label></div>
                </div>
                {newOrderData.order_type === 'delivery' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" placeholder="Endereço de Entrega" value={newOrderData.address} onChange={e => setNewOrderData({...newOrderData, address: e.target.value})} className="w-full p-2 border rounded" />
                        <select 
                            value={newOrderData.delivery_fee} 
                            onChange={e => setNewOrderData({...newOrderData, delivery_fee: parseFloat(e.target.value)})}
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
