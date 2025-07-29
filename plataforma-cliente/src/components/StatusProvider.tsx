'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { PizzeriaStatus } from '@/lib/api';

export interface StatusContextType {
  isLoading: boolean;
  status: PizzeriaStatus | null;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

// --- CORREÇÃO APLICADA AQUI ---
// O cliente Supabase é criado FORA do componente.
// Isto garante que ele seja criado apenas UMA VEZ quando o ficheiro é carregado, e não a cada renderização.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<PizzeriaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Já não precisamos de criar o cliente aqui dentro.

  useEffect(() => {
    const fetchInitialStatus = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('pizzeria_status')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) throw error;

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
  // A dependência 'supabase' é removida porque agora é uma constante estável que não muda entre renderizações.
  }, []);

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
