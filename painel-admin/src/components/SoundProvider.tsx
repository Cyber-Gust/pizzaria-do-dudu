'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, BellOff } from 'lucide-react';

// --- Tipagem e Contexto ---
// Define a estrutura dos dados que o nosso contexto de som irá fornecer.
type SoundContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
  isSoundReady: boolean; // Verifica se o usuário já deu permissão para o som.
};

// Cria o contexto com um valor inicial indefinido.
const SoundContext = createContext<SoundContextType | undefined>(undefined);

// --- Componente Provider ---
// Este componente irá "prover" o estado e as funções de som para toda a aplicação aninhada nele.
export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isSoundReady, setIsSoundReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const supabase = createClient();

  // Efeito para carregar a preferência do usuário (som ativado/desativado) do localStorage.
  // Isso faz com que a escolha do usuário persista entre recarregamentos da página.
  useEffect(() => {
    const savedPreference = localStorage.getItem('soundEnabled') === 'true';
    setSoundEnabled(savedPreference);
    if (savedPreference) {
      // Se já estava salvo como ativo, consideramos que a permissão já foi dada antes.
      setIsSoundReady(true);
    }
  }, []);

  // Função para ligar/desligar o som.
  // O primeiro clique nesta função é crucial para obter a permissão do navegador.
  const toggleSound = useCallback(() => {
    // Se ainda não temos permissão (primeiro clique)
    if (!isSoundReady && audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause(); // Toca e pausa imediatamente, apenas para "destravar" o áudio.
        setIsSoundReady(true);
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem('soundEnabled', String(newState));
        alert('Notificações sonoras ativadas!');
      }).catch(error => {
        console.error("Erro ao obter permissão de áudio:", error);
        alert("Seu navegador bloqueou a reprodução automática de som. Por favor, interaja com a página.");
      });
    } else {
      // Se a permissão já foi dada, apenas alterna o estado.
      const newState = !soundEnabled;
      setSoundEnabled(newState);
      localStorage.setItem('soundEnabled', String(newState));
    }
  }, [isSoundReady, soundEnabled]);

  // Efeito que se inscreve no Supabase para ouvir por novos pedidos.
  useEffect(() => {
    const handleNewOrder = (payload: any) => {
      // Verifica se é um novo pedido com o status correto.
      if (payload.eventType === 'INSERT' && payload.new?.status === 'Aguardando Confirmação') {
        // Se o som estiver habilitado e com permissão, toca a notificação.
        if (soundEnabled && isSoundReady) {
          audioRef.current?.play().catch(e => console.error("Erro ao tocar o som da notificação:", e));
        }
      }
    };

    const channel = supabase
      .channel('new-order-sound-notification')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        handleNewOrder
      )
      .subscribe();

    // Limpa a inscrição ao desmontar o componente para evitar vazamentos de memória.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, soundEnabled, isSoundReady]); // As dependências garantem que a lógica se atualize se o estado mudar.

  return (
    <SoundContext.Provider value={{ soundEnabled, toggleSound, isSoundReady }}>
      {/* O elemento de áudio agora é global e invisível. */}
      <audio ref={audioRef} src="/notificacao.mp3" preload="auto" />
      {children}
    </SoundContext.Provider>
  );
}

// --- Hook Customizado ---
// Facilita o uso do contexto em outros componentes.
export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound deve ser usado dentro de um SoundProvider');
  }
  return context;
}

// --- Componente de Botão (Opcional, mas recomendado) ---
// Um botão reutilizável para ligar/desligar o som.
export function SoundToggleButton() {
    const { soundEnabled, toggleSound } = useSound();

    return (
        <button
            onClick={toggleSound}
            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
            title={soundEnabled ? 'Desativar notificações sonoras' : 'Ativar notificações sonoras'}
        >
            {soundEnabled ? <Bell size={20} /> : <BellOff size={20} />}
        </button>
    );
}
