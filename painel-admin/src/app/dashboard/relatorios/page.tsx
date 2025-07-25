// src/app/dashboard/relatorios/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Importando ícones

// --- TIPAGENS ATUALIZADAS ---
// Adicionadas tipagens para os itens e observações do pedido
type ExtraItem = {
    name: string;
};

type OrderItem = {
    item_name: string;
    quantity: number;
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
    observations: string | null; // Adicionado
    order_items: OrderItem[];   // Adicionado
};

// Tipagem para os dados completos do relatório
type ReportData = {
    totalRevenue: number;
    totalOrders: number;
    bestSellers: { name: string; count: number }[];
    orders: Order[];
};

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-blue-500 p-3 rounded-full text-white">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const RevenueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const OrdersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;

export default function RelatoriosPage() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // --- NOVO ESTADO PARA CONTROLAR O CARD EXPANDIDO ---
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchReportData = useCallback(async () => {
        if (!startDate || !endDate) {
            alert("Por favor, selecione as datas de início e fim.");
            return;
        }
        setLoading(true);
        setError(null);
        setReportData(null); // Limpa dados antigos antes de nova busca
        
        const params = new URLSearchParams({ startDate, endDate });
        const query = params.toString();

        try {
            const response = await fetch(`${API_URL}/api/reports?${query}`);
            if (!response.ok) throw new Error('Falha ao carregar os relatórios.');
            const data: ReportData = await response.json();
            setReportData(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Ocorreu um erro desconhecido.");
            }
        } finally {
            setLoading(false);
        }
    }, [API_URL, startDate, endDate]);

    useEffect(() => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);
    
    const handleGenerateReport = (e: React.FormEvent) => {
        e.preventDefault();
        fetchReportData();
    }

    // Função de cor do status (sem alterações)
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Finalizado': return 'bg-gray-500';
            case 'Em Preparo': return 'bg-yellow-500';
            case 'Pronto para Retirada': return 'bg-green-500';
            case 'Saiu para Entrega': return 'bg-purple-500';
            default: return 'bg-blue-500';
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Relatórios de Vendas</h1>

            <form onSubmit={handleGenerateReport} className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-end gap-4">
                {/* Formulário de data (sem alterações) */}
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data de Início</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data de Fim</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'A gerar...' : 'Gerar Relatório'}
                </button>
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            {reportData ? (
                <>
                    {/* Cards de estatísticas e mais vendidos (sem alterações) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <StatCard title="Faturamento (Pedidos Finalizados)" value={`R$ ${reportData.totalRevenue.toFixed(2).replace('.', ',')}`} icon={<RevenueIcon />} />
                        <StatCard title="Total de Pedidos Finalizados" value={reportData.totalOrders} icon={<OrdersIcon />} />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                        {/* ... Código dos mais vendidos ... */}
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Pedidos Finalizados no Período</h2>
                        <div className="max-h-[500px] overflow-y-auto space-y-4 pr-2">
                            {reportData.orders && reportData.orders.filter(o => o.status === 'Finalizado').length > 0 ? (
                                reportData.orders
                                    .filter(order => order.status === 'Finalizado')
                                    .map((order) => (
                                        <div key={order.id} className="border p-4 rounded-lg transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">Pedido #{order.id}</h3>
                                                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString('pt-BR')} - {order.customer_name || 'Cliente'}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-3 py-1 text-sm font-semibold text-white ${getStatusColor(order.status)} rounded-full`}>{order.status}</span>
                                                    {/* --- BOTÃO PARA EXPANDIR/RECOLHER --- */}
                                                    <button onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
                                                        {expandedOrderId === order.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 border-t pt-3 text-sm">
                                                <p><strong>Tipo:</strong> {order.order_type}</p>
                                                <p><strong>Pagamento:</strong> {order.payment_method}</p>
                                                <p className="font-bold">Total: R$ {order.final_price.toFixed(2).replace('.', ',')}</p>
                                            </div>

                                            {/* --- ÁREA EXPANSÍVEL COM OS DETALHES --- */}
                                            {expandedOrderId === order.id && (
                                                <div className="mt-4 pt-4 border-t border-dashed">
                                                    <h4 className="font-semibold text-gray-700 mb-2">Itens do Pedido:</h4>
                                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                                        {order.order_items && order.order_items.map((item, index) => (
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
                                        </div>
                                    ))
                            ) : (
                                <p className="text-gray-500">Nenhum pedido finalizado encontrado neste período.</p>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                !loading && <p className="text-center text-gray-500 mt-8">Selecione um período e clique em &apos;Gerar Relatório&apos; para ver os dados.</p>
            )}
        </div>
    );
}