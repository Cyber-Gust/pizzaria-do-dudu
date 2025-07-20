'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';

// Tipagem para uma transação
type Transaction = {
    id: string;
    description: string;
    type: 'income' | 'expense';
    amount: number;
    transaction_date: string;
    order_id: number | null; // Adicionado para saber se é uma venda
};

// Componente para os cartões de estatísticas
const StatCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <p className="text-sm text-gray-500">{title}</p>
    <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
  </div>
);

export default function FinanceiroPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // [ATUALIZADO] Estados para o modal de transação
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState<Partial<Transaction> | null>(null);

    // Estados para o filtro de data
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchCashFlow = useCallback(async (start: string, end: string) => {
        setLoading(true);
        setError(null);
        const params = new URLSearchParams({ startDate: start, endDate: end });
        try {
            const response = await fetch(`${API_URL}/api/cashflow?${params.toString()}`);
            if (!response.ok) throw new Error('Falha ao carregar dados financeiros.');
            const data: Transaction[] = await response.json();
            setTransactions(data);
        } catch (err: unknown) {
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
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
        fetchCashFlow(firstDay, lastDay);
    }, [fetchCashFlow]);

    const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            alert('Por favor, selecione as datas de início e fim.');
            return;
        }
        fetchCashFlow(startDate, endDate);
    };

    // [ATUALIZADO] Abre o modal para uma nova despesa
    const handleOpenAddModal = () => {
        setCurrentTransaction({ description: '', amount: undefined, type: 'expense' });
        setIsModalOpen(true);
    };

    // [NOVO] Abre o modal para editar uma transação existente
    const handleOpenEditModal = (transaction: Transaction) => {
        setCurrentTransaction({ ...transaction });
        setIsModalOpen(true);
    };

    // [ATUALIZADO] Função para salvar (adicionar ou editar) uma transação
    const handleSaveTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currentTransaction || !currentTransaction.description || !currentTransaction.amount || currentTransaction.amount <= 0) {
            alert('Por favor, preencha a descrição e um valor válido.');
            return;
        }

        const isEditing = !!currentTransaction.id;
        const url = isEditing ? `${API_URL}/api/cashflow/${currentTransaction.id}` : `${API_URL}/api/cashflow`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    description: currentTransaction.description, 
                    amount: currentTransaction.amount,
                    type: currentTransaction.type // Mantém o tipo original
                }),
            });
            setIsModalOpen(false);
            setCurrentTransaction(null);
            fetchCashFlow(startDate, endDate);
        } catch (err: unknown) {
            if (err instanceof Error) {
                alert(err.message);
            }
        }
    };

    // [NOVO] Função para excluir uma transação
    const handleDeleteTransaction = async (transactionId: string) => {
        if (window.confirm('Tem a certeza que quer apagar esta transação?')) {
            try {
                await fetch(`${API_URL}/api/cashflow/${transactionId}`, { method: 'DELETE' });
                fetchCashFlow(startDate, endDate);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    alert(err.message);
                }
            }
        }
    };

    const { totalIncome, totalExpenses, balance } = useMemo(() => {
        const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        return { totalIncome: income, totalExpenses: expenses, balance: income - expenses };
    }, [transactions]);
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Livro Caixa</h1>
                <button onClick={handleOpenAddModal} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">
                    + Adicionar Despesa
                </button>
            </div>

            <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-wrap items-end gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Data de Início</label>
                    <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Data de Fim</label>
                    <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"/>
                </div>
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'A filtrar...' : 'Filtrar Período'}
                </button>
            </form>

            {error && <p className="text-red-500 mb-4">{error}</p>}
            
            {loading ? <p>A carregar dados financeiros...</p> : (
            <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <StatCard title="Entradas no Período" value={formatCurrency(totalIncome)} colorClass="text-green-600" />
                    <StatCard title="Saídas no Período" value={formatCurrency(totalExpenses)} colorClass="text-red-600" />
                    <StatCard title="Balanço do Período" value={formatCurrency(balance)} colorClass={balance >= 0 ? "text-blue-600" : "text-red-600"} />
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Histórico de Transações</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(t.transaction_date).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{t.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t.type === 'income' ? 'Entrada' : 'Saída'}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'expense' && '- '}{formatCurrency(t.amount)}
                                        </td>
                                        {/* [NOVO] Botões de Ação */}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {t.order_id === null ? ( // Só permite editar/excluir se não for uma venda
                                                <>
                                                    <button onClick={() => handleOpenEditModal(t)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                                                    <button onClick={() => handleDeleteTransaction(t.id)} className="text-red-600 hover:text-red-900 ml-4">Excluir</button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">Venda</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {transactions.length === 0 && <p className="text-center text-gray-500 py-8">Nenhuma transação registada neste período.</p>}
                    </div>
                </div>
            </>
            )}

            {isModalOpen && currentTransaction && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
                    <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                            {currentTransaction.id ? 'Editar Transação' : 'Adicionar Nova Despesa'}
                        </h3>
                        <form onSubmit={handleSaveTransaction}>
                            <div className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Descrição" 
                                    value={currentTransaction.description || ''} 
                                    onChange={e => setCurrentTransaction({...currentTransaction, description: e.target.value})} 
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                                <input 
                                    type="number" 
                                    placeholder="Valor (ex: 50.00)" 
                                    step="0.01" 
                                    value={currentTransaction.amount || ''} 
                                    onChange={e => setCurrentTransaction({...currentTransaction, amount: parseFloat(e.target.value)})} 
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            <div className="mt-6 flex justify-end space-x-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
