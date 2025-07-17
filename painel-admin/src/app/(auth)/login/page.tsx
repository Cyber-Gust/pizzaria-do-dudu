// src/app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import logoForneria from './logo-forneria.png';

// Componente de ícone para o campo de e-mail (ou usuário)
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Componente de ícone para o campo de senha
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);


export default function LoginPage() {
  // Estados para controlar os campos do formulário, carregamento e erros
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  // Função para lidar com o login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Previne o recarregamento da página
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('E-mail ou senha inválidos. Tente novamente.');
      setLoading(false);
    } else {
      // Redireciona para a página principal do painel após o login
      router.push('/');
      router.refresh(); // Garante que o estado da sessão seja atualizado no servidor
    }
  };

  // Função para lidar com o cadastro (sign up)
  const handleSignUp = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Você pode adicionar dados extras aqui se precisar
        // data: { first_name: 'Dudu' }
      }
    });

    if (error) {
        // Tratamento de erros comuns de cadastro
        if (error.message.includes("User already registered")) {
            setError("Este e-mail já está cadastrado. Tente fazer login.");
        } else if (error.message.includes("Password should be at least 6 characters")) {
            setError("A senha deve ter pelo menos 6 caracteres.");
        } else {
            setError("Ocorreu um erro ao criar a conta. Tente novamente.");
        }
        setLoading(false);
    } else {
        setError("Conta criada! Verifique seu e-mail para confirmar a conta antes de fazer login.");
        setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200 font-sans">
      <div className="relative w-full max-w-sm px-8 pt-16 pb-10 bg-white rounded-3xl shadow-lg">
        
        {/* Div do logo */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex items-center justify-center w-28 h-28 bg-red-600 rounded-full shadow-lg">
            {/* [CORRIGIDO] O 'src' agora usa a variável importada */}
            <Image
                src={logoForneria} 
                alt="Logo da Forneria 360"
                width={80} 
                height={80}
                className="rounded-full object-cover" 
                priority 
            />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">E-mail</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                placeholder="E-mail"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <UserIcon />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="sr-only">Senha</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 text-gray-700 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                placeholder="Senha"
                disabled={loading}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <LockIcon />
              </div>
            </div>
          </div>
          
          {/* Exibe a mensagem de erro, se houver */}
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300 disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
                Não tem uma conta?{' '}
                <button onClick={handleSignUp} disabled={loading} className="font-medium text-red-600 hover:text-red-500 disabled:text-red-400">
                    Cadastre-se
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}
