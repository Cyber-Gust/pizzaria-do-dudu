'use client';

import { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { InputMask } from '@react-input/mask';
import { X } from 'lucide-react';
import { saveCustomer } from '@/lib/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const login = useUserStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Limpa o número de telefone, removendo todos os caracteres não numéricos
    const sanitizedPhone = phone.replace(/\D/g, '');

    // 2. Valida o número limpo
    if (name && sanitizedPhone.length === 11) {
      // --- [NOVA LÓGICA] ---
      // 3. Remove o nono dígito se for um telemóvel
      const ddd = sanitizedPhone.substring(0, 2);
      const numberPart = sanitizedPhone.substring(2);
      let finalPhone = sanitizedPhone;

      if (numberPart.startsWith('9')) {
        finalPhone = ddd + numberPart.substring(1); // Concatena o DDD com os 8 dígitos restantes
      }
      
      // 4. Guarda e envia o número com 10 dígitos
      login(name, finalPhone);
      await saveCustomer(name, finalPhone);
      
      onClose();
    } else {
      alert('Por favor, preencha todos os campos corretamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl w-11/12 max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center mb-2">Identificação</h2>
        <p className="text-center text-gray-600 mb-6">Faça login apenas uma vez para agilizar seus pedidos.</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Seu Nome</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-red"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Celular (WhatsApp)</label>
            <InputMask
              mask="(__) _____-____"
              replacement={{ _: /\d/ }}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              id="phone"
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-red"
              required
            />
          </div>
          <button type="submit" className="w-full bg-brand-red text-white font-bold py-3 rounded-md hover:bg-brand-red-dark transition-colors">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
