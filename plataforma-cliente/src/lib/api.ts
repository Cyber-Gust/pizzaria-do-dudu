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
  // O nome do ingrediente virá aninhado
  ingredients: {
    id: string;
    name: string;
  }
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

// Interface para o item que será enviado ao criar um pedido
export interface OrderItemPayload {
  item_id: string;
  item_type: 'pizza' | 'drink';
  item_name: string;
  quantity: number;
  price_per_item: number;
  extras?: { id: string; name: string; price: number }[]; // Adicionais
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

// Interface para o item que será enviado ao criar um pedido
export interface OrderItemPayload {
  item_id: string;
  item_type: 'pizza' | 'drink';
  item_name: string;
  quantity: number;
  price_per_item: number;
}

// Interface para os dados completos do pedido a ser enviado
export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  address: string;
  payment_method: string;
  order_type: 'delivery' | 'pickup';
  items: OrderItemPayload[];
}

// Adicione esta interface e função ao seu arquivo src/lib/api.ts

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

/**
 * Busca o status atual da pizzaria (aberta/fechada, tempos de espera).
 */
export const getPizzeriaStatus = async (): Promise<PizzeriaStatus | null> => {
  try {
    // Usamos a API 'fetch' nativa para aproveitar o cache do Next.js/Vercel
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/status`, {
      next: {
        revalidate: 60, // Diz à Vercel para revalidar (buscar novamente) estes dados a cada 60 segundos
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

/**
 * Busca a lista completa de pizzas do cardápio.
 */
export const getPizzas = async (): Promise<Pizza[]> => {
  try {
    const response = await apiClient.get('/pizzas');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar pizzas:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

/**
 * Busca a lista completa de bebidas do cardápio.
 */
export const getDrinks = async (): Promise<Drink[]> => {
  try {
    const response = await apiClient.get('/drinks');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar bebidas:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};

/**
 * Envia um novo pedido para a API.
 * @param orderData - Os dados do pedido, formatados de acordo com a interface OrderPayload.
 */
export const createOrder = async (orderData: OrderPayload) => {
  try {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar o pedido:", error);
    // Lança o erro para que o componente que chamou a função saiba que falhou
    // e possa exibir uma mensagem para o usuário.
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

/**
 * Busca a lista de taxas de entrega por bairro.
 */
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
  // A função fará uma requisição GET para a nova rota que criamos.
  const response = await apiClient.get(`/coupons/validate/${code}`);
  return response.data;
};

export const getOperatingHours = async (): Promise<OperatingHour[]> => {
  try {
    const response = await apiClient.get('/operating-hours');
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar horário de funcionamento:", error);
    return []; // Retorna um array vazio em caso de erro
  }
};
