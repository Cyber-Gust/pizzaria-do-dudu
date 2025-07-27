// src/lib/api.ts

import axios from 'axios';

/**
 * Configuração do cliente Axios.
 * Ele usa a URL base definida no seu arquivo .env.local para todas as requisições.
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// ===================================================================
// --- INTERFACES (TIPOS): A "FORMA" DOS NOSSOS DADOS ---
// ===================================================================

export interface Extra {
  id: string;
  price: number;
  is_available: boolean;
  ingredients: {
    id: string;
    name: string;
  }
}

export interface Dessert {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  item_type: 'dessert';
}

export interface OperatingHour {
  day_of_week: number;
  day_name: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
}

export interface DeliveryFee {
  id: string;
  neighborhood_name: string;
  fee_amount: number;
}

export interface PizzeriaStatus {
  is_open: boolean;
  pickup_time_min: number;
  pickup_time_max: number;
  delivery_time_min: number;
  delivery_time_max: number;
}

export interface Pizza {
  id: string;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
  image_url: string;
}

export interface Drink {
  id: string;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
  image_url: string;
}

// CORREÇÃO: Interface unificada para itens do pedido
export interface OrderItemPayload {
  item_id: string | null; // Nulo para itens customizados como meio a meio
  // CORREÇÃO: Adicionado 'dessert' como um tipo de item válido
  item_type: 'pizza' | 'drink' | 'dessert';
  item_name: string;
  quantity: number;
  price_per_item: number;
  extras?: { id: string; name: string; price: number }[]; // Adicionais são opcionais
}

// Interface para os dados completos do pedido a ser enviado
export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  address: string;
  payment_method: string;
  observations?: string;
  order_type: 'delivery' | 'pickup';
  items: OrderItemPayload[];
  discount_amount?: number;
  delivery_fee?: number;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: number;
  is_active: boolean;
}

// ===================================================================
// --- FUNÇÕES DA API: AS AÇÕES QUE NOSSO FRONTEND PODE FAZER ---
// ===================================================================

export const getPizzeriaStatus = async (): Promise<PizzeriaStatus | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status`, {
      next: {
        revalidate: 60,
      },
    });
    if (!response.ok) {
      throw new Error('Falha ao buscar o status da pizzaria');
    }
    return response.json();
  } catch (error) {
    console.error("Erro ao buscar status da pizzaria:", error);
    return null;
  }
};

export const getPizzas = async (): Promise<Pizza[]> => {
  try {
    const response = await apiClient.get('/pizzas');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pizzas:", error);
    return [];
  }
};

export const getDrinks = async (): Promise<Drink[]> => {
  try {
    const response = await apiClient.get('/drinks');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar bebidas:", error);
    return [];
  }
};

// CORREÇÃO: Adicionada a função para buscar sobremesas
export const getDesserts = async (): Promise<Dessert[]> => {
  try {
    const response = await apiClient.get('/desserts');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar sobremesas:", error);
    return [];
  }
};

export const createOrder = async (orderData: OrderPayload) => {
  try {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar o pedido:", error);
    throw error;
  }
};

export const getExtras = async (): Promise<Extra[]> => {
  try {
    const response = await apiClient.get('/extras');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar adicionais:", error);
    return [];
  }
};

export const getDeliveryFees = async (): Promise<DeliveryFee[]> => {
  try {
    const response = await apiClient.get('/delivery-fees');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar taxas de entrega:", error);
    return [];
  }
};

export const validateCoupon = async (code: string): Promise<Coupon> => {
  const response = await apiClient.get(`/coupons/validate/${code}`);
  return response.data;
};

export const getOperatingHours = async (): Promise<OperatingHour[]> => {
  try {
    const response = await apiClient.get('/operating-hours');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar horário de funcionamento:", error);
    return [];
  }
};

export const saveCustomer = async (name: string, phone: string) => {
  try {
    await apiClient.post('/customers', { name, phone });
    console.log("Cliente salvo com sucesso no banco de dados.");
  } catch (error) {
    console.error("Erro ao salvar dados do cliente:", error);
  }
};
