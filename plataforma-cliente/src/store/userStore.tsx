import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  name: string;
  phone: string;
  isAuthenticated: boolean;
  login: (name: string, phone: string) => void;
  logout: () => void;
  updateInfo: (name: string, phone: string) => void;
}

export const useUserStore = create(
  persist<UserState>(
    (set) => ({
      name: '',
      phone: '',
      isAuthenticated: false,
      login: (name, phone) => set({ name, phone, isAuthenticated: true }),
      logout: () => set({ name: '', phone: '', isAuthenticated: false }),
      updateInfo: (name, phone) => set({ name, phone }),
    }),
    {
      name: 'pizzaria-dudo-user-auth', // Chave para salvar no localStorage
    }
  )
);
