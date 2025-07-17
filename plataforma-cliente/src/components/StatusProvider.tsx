// src/components/StatusProvider.tsx
'use client';

import { PizzeriaStatus } from '@/lib/api';
import { createContext, useContext, ReactNode } from 'react';

// Criamos o Contexto com um valor padrão
const StatusContext = createContext<PizzeriaStatus | null>(null);

// O Provedor que irá "envelopar" nossa aplicação
export const StatusProvider = ({
  children,
  status,
}: {
  children: ReactNode;
  status: PizzeriaStatus | null;
}) => {
  return (
    <StatusContext.Provider value={status}>{children}</StatusContext.Provider>
  );
};

// Um "Hook" customizado para facilitar o uso do contexto nos componentes
export const useStatus = () => {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatus must be used within a StatusProvider');
  }
  return context;
};
