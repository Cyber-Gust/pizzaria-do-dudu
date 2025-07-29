'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// 1. CORREÇÃO: Importar diretamente da biblioteca do Supabase
import { createClient } from '@supabase/supabase-js';
import type { PizzeriaStatus } from '@/lib/api';

export interface StatusContextType {
  isLoading: boolean;
  status: PizzeriaStatus | null;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PizzeriaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. CORREÇÃO: Inicializar o cliente Supabase aqui
  // Certifique-se de que as suas variáveis de ambiente .env.local estão corretas
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Esta função agora busca o status diretamente do Supabase, em vez da nossa API.
    const fetchInitialStatus = async () => {
      setIsLoading(true);
      try {
        // A chamada vai diretamente à tabela 'pizzeria_status'
        const { data, error } = await supabase
          .from('pizzeria_status')
          .select('*')
          .eq('id', 1) // Supondo que o status tenha sempre o id 1
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setStatus(data);
          console.log("Status inicial da loja carregado diretamente do Supabase:", data);
        }
      } catch (error) {
        console.error('Falha ao buscar o status inicial da pizzaria no Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialStatus();

    // A lógica do Realtime continua a mesma, pois já falava diretamente com o Supabase.
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
          setIsLoading(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // 3. CORREÇÃO: Adicionar supabase ao array de dependências
  }, [supabase]);

  const value = { isLoading, status };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
}

export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
