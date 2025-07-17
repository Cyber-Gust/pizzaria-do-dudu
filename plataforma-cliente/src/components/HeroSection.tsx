'use client';

import Link from 'next/link';
import { useStatus } from '@/components/StatusProvider';
import { useUserStore } from '@/store/userStore';
import { Star, Clock, XCircle, User, LogIn, Edit, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import InfoModal from './InfoModal';
import { OperatingHour } from '@/lib/api'; // Importar a tipagem

// --- CORREÇÃO AQUI ---
// Definimos que este componente receberá uma propriedade chamada 'operatingHours'
interface HeroSectionProps {
  operatingHours: OperatingHour[];
}

// O componente agora aceita 'operatingHours' como um argumento
const HeroSection = ({ operatingHours }: HeroSectionProps) => {
  const status = useStatus();
  const { isAuthenticated, name } = useUserStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true) }, []);

  return (
    <>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      {/* Passamos os horários recebidos para o InfoModal */}
      <InfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} operatingHours={operatingHours} />
      
      <section
        className="relative h-[70vh] bg-cover bg-center flex flex-col justify-center items-center text-white"
        style={{ backgroundImage: "url('/images/hero-background.jpg')" }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        
        <div className="relative z-10 text-center p-4">
          <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-lg">
            Sabor que une.
          </h1>
          <p className="text-lg md:text-xl mb-8 drop-shadow-md">
            As melhores pizzas, feitas com os melhores ingredientes, direto para você.
          </p>
          <Link
            href="/cardapio"
            className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-3 px-10 rounded-full text-lg transition-transform duration-300 ease-in-out transform hover:scale-105"
          >
            Ver Cardápio
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-40 z-10">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm gap-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-400" fill="currentColor" />
              <span className="font-bold">4.8 de 5</span>
              <span className="text-gray-300">(+200 avaliações)</span>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsInfoModalOpen(true)}
                className="flex items-center gap-2 font-bold px-3 py-1 rounded-full bg-gray-500 hover:bg-gray-600"
                aria-label="Ver informações da pizzaria"
              >
                <Info size={16} />
              </button>

              {status && (
                <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full ${
                  status.is_open ? 'bg-green-500' : 'bg-red-600'
                }`}>
                  {status.is_open ? <Clock size={16} /> : <XCircle size={16} />}
                  <span>{status.is_open ? 'Abertos' : 'Fechados'}</span>
                </div>
              )}

              {isMounted && (
                isAuthenticated ? (
                  <div className="flex items-center gap-2 font-bold px-3 py-1 rounded-full bg-green-500">
                    <User size={16} />
                    <span>Olá, {name.split(' ')[0]}</span>
                    <button onClick={() => setIsLoginModalOpen(true)} className="ml-1 hover:bg-white/20 p-1 rounded-full">
                      <Edit size={14} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 font-bold px-3 py-1 rounded-full bg-blue-500 hover:bg-blue-600"
                  >
                    <LogIn size={16} />
                    <span>Fazer Login</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroSection;
