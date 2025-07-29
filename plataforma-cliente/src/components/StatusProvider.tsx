'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PizzeriaStatus } from '@/lib/api';

// 1. A tipagem do contexto agora inclui um estado de carregamento
export interface StatusContextType {
  isLoading: boolean;
  status: PizzeriaStatus | null;
}

// O contexto agora irá fornecer um objeto com o status e o estado de carregamento
const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PizzeriaStatus | null>(null);
  // 2. Adicionamos um estado para controlar o carregamento inicial
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchInitialStatus = async () => {
      setIsLoading(true); // Garante que estamos em modo de carregamento
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
      } finally {
        // 3. Quando a busca termina (com sucesso ou erro), paramos o carregamento
        setIsLoading(false);
      }
    };

    fetchInitialStatus();

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
          setIsLoading(false); // Uma atualização em tempo real também significa que não estamos mais a carregar
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 4. Fornecemos tanto o status quanto o estado de carregamento para os componentes-filho
  const value = { isLoading, status };

  return (
    <StatusContext.Provider value={value}>
      {children}
    </StatusContext.Provider>
  );
}

// O hook agora retorna o objeto completo
export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
