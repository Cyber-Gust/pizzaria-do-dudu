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
    (set, get) => ({
      items: [],
      addItem: (product, extras = []) =>
        set((state) => {
          // 1. LÓGICA PARA PIZZAS MEIO A MEIO (MANTIDA)
          // Pizzas meio a meio são sempre adicionadas como um novo item, sem extras.
          if ('type' in product && product.type === 'half-and-half') {
            return {
              items: [
                ...state.items,
                {
                  cartItemId: crypto.randomUUID(), // ID aleatório é suficiente aqui.
                  product,
                  quantity: 1,
                  extras: [], // Extras são ignorados para meio a meio.
                },
              ],
            };
          }
          
          // 2. LÓGICA CORRIGIDA PARA PRODUTOS NORMAIS
          
          // Criamos um ID único e consistente baseado no produto E nos extras selecionados.
          const sortedExtraIds = extras.map(e => e.id).sort().join(',');
          const cartItemId = `${product.id}-${sortedExtraIds}`;

          const existingItem = state.items.find(
            (item) => item.cartItemId === cartItemId
          );

          if (existingItem) {
            // Se um item idêntico (mesma pizza, mesmos extras) já existe, apenas aumentamos a quantidade.
            return {
              items: state.items.map((item) =>
                item.cartItemId === existingItem.cartItemId
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          
          // Se for um item novo, adicionamos com os extras corretos.
          return {
            items: [
              ...state.items,
              {
                cartItemId: cartItemId, // Usamos nosso ID consistente.
                product,
                quantity: 1,
                extras, // Os extras são salvos aqui!
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
      name: 'pizzaria-dudo-cart', // Nome do seu localStorage
    }
  )
);
