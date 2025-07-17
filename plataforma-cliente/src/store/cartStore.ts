import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Pizza, Drink } from '@/lib/api';

// O tipo Product agora pode ser um produto normal ou um objeto customizado
export type Product = Pizza | Drink | { [key: string]: any; type: 'half-and-half' };

export type SelectedExtra = {
  id: string;
  name: string;
  price: number;
};

export type CartItem = {
  cartItemId: string;
  product: Product;
  quantity: number;
  extras: SelectedExtra[];
};

interface CartState {
  items: CartItem[];
  addItem: (product: Product, extras?: SelectedExtra[]) => void;
  removeItem: (cartItemId: string) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create(
  persist<CartState>(
    (set) => ({
      items: [],
      // A função agora é mais flexível para aceitar o objeto customizado
      addItem: (product, extras = []) =>
        set((state) => {
          // Para pizzas meio a meio, sempre adicionamos como um novo item
          if ('type' in product && product.type === 'half-and-half') {
            return {
              items: [
                ...state.items,
                {
                  cartItemId: crypto.randomUUID(),
                  product,
                  quantity: 1,
                  extras: [], // Adicionais não se aplicam a meio a meio neste exemplo
                },
              ],
            };
          }
          
          // Lógica existente para produtos normais
          const existingItem = state.items.find(
            (item) => item.product.id === product.id && item.extras.length === extras.length // Simplificação
          );

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.cartItemId === existingItem.cartItemId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          
          // Adiciona item normal
          return {
            items: [
              ...state.items,
              {
                cartItemId: crypto.randomUUID(),
                product,
                quantity: 1,
                extras,
              },
            ],
          };
        }),
      removeItem: (cartItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.cartItemId !== cartItemId),
        })),
      increaseQuantity: (cartItemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.cartItemId === cartItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),
      decreaseQuantity: (cartItemId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.cartItemId === cartItemId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'pizzaria-dudo-cart',
    }
  )
);
