'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// 1. CORREÇÃO: Importar diretamente da biblioteca do Supabase
import { createClient } from '@supabase/supabase-js';
import type { PizzeriaStatus } from '@/lib/api'; // Importa a tipagem que já temos

// Criação do Contexto
const StatusContext = createContext<PizzeriaStatus | null>(null);

// Componente Provedor ATUALIZADO
export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PizzeriaStatus | null>(null);

  // 2. CORREÇÃO: Inicializar o cliente Supabase aqui
  // Certifique-se de que as suas variáveis de ambiente .env.local estão corretas
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Função para buscar o status inicial quando o cliente abre a página
    const fetchInitialStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/status`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        } else {
          console.error('Falha ao buscar o status inicial da pizzaria.');
        }
      } catch (error) {
        console.error('Erro de rede ao buscar status:', error);
      }
    };

    fetchInitialStatus();

    // Lógica do Realtime para ouvir por atualizações
    const channel = supabase
      .channel('realtime-status-pizzeria')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'pizzeria_status' 
        },
        (payload) => {
          console.log('Status da loja atualizado em tempo real!', payload.new);
          setStatus(payload.new as PizzeriaStatus);
        }
      )
      .subscribe();

    // Função de "limpeza" para se desinscrever do canal
    return () => {
      supabase.removeChannel(channel);
    };
  // 3. CORREÇÃO: Adicionar supabase ao array de dependências
  }, [supabase]);

  return (
    <StatusContext.Provider value={status}>
      {children}
    </StatusContext.Provider>
  );
}

// Hook para usar o status em outros componentes
export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
